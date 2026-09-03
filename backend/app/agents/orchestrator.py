import time
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.database.models import AgentDecision
from backend.app.services.granite_service import granite_service
from backend.app.services.orchestrate_service import orchestrate_service
from backend.app.agents.performance_agent import performance_agent
from backend.app.agents.maintenance_agent import maintenance_agent
from backend.app.agents.forecasting_agent import forecasting_agent
from backend.app.agents.grid_agent import grid_agent
from backend.app.agents.reporting_agent import reporting_agent

def make_json_serializable(obj: Any) -> Any:
    """Recursively converts datetimes and non-serializable objects to strings."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, uuid.UUID):
        return str(obj)
    if isinstance(obj, dict):
        return {k: make_json_serializable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [make_json_serializable(item) for item in obj]
    return obj

class MasterAgentOrchestrator:
    """
    Central Agentic AI Orchestrator for RenewAI.
    Coordinates specialized tool agents, collates multi-variate evidence,
    and supports Dual-Engine AI Reasoning:
      1. IBM Watson Orchestrate (Live Cloud Agent)
      2. IBM Granite LLM (watsonx.ai)
      3. Hybrid Multi-Agent Ensemble
    """
    def __init__(self):
        self.granite = granite_service
        self.orchestrate = orchestrate_service

    async def process_query(
        self,
        db: Session,
        query: str,
        user_id: str = None,
        engine_mode: str = "orchestrate" # "orchestrate", "granite", "ensemble"
    ) -> Dict[str, Any]:
        start_time = time.time()
        query_id = str(uuid.uuid4())
        q_lower = query.lower()

        agents_consulted = []
        tools_executed = []
        context_data = {}
        recommended_actions = []

        # 1. Intent Classification & Multi-Agent Routing
        # Case A: Specific Asset Inquiry (e.g. WT-021, INV-042, etc.)
        if "wt-" in q_lower or "inv-" in q_lower or "sp-" in q_lower:
            intent = "asset_anomaly_investigation"
            words = query.replace("?", "").replace(",", "").split()
            target_asset = "WT-021"
            for w in words:
                upper = w.upper()
                if upper.startswith("WT-") or upper.startswith("INV-") or upper.startswith("SP-"):
                    target_asset = upper
                    break

            # 1. Call Performance Agent
            agents_consulted.append(performance_agent.name)
            perf_res = performance_agent.analyze_asset(db, target_asset)
            tools_executed.append({
                "tool_name": "analyze_asset_performance",
                "agent_name": performance_agent.name,
                "status": "success" if perf_res.get("status") != "error" else "warning",
                "parameters": {"asset_code": target_asset},
                "result_summary": f"PR: {perf_res.get('performance_ratio')}, Power Deficit: {perf_res.get('power_deficit_kw')} kW"
            })
            context_data["performance"] = perf_res

            # 2. Call Maintenance Agent
            agents_consulted.append(maintenance_agent.name)
            maint_res = maintenance_agent.evaluate_asset_health(db, target_asset)
            tools_executed.append({
                "tool_name": "predict_failure_and_rul",
                "agent_name": maintenance_agent.name,
                "status": "success" if maint_res.get("status") != "error" else "warning",
                "parameters": {"asset_code": target_asset},
                "result_summary": f"Failure Prob: {maint_res.get('failure_probability_pct')}%, Risk: {maint_res.get('risk_level')}, RUL: {maint_res.get('predicted_rul_days')} days"
            })
            context_data["maintenance"] = maint_res

            if maint_res.get("risk_level") in ["Critical", "High"]:
                recommended_actions.append(f"Generate Certified Gujarat SLDC Work Order for {target_asset}")
                recommended_actions.append("Dispatch field engineering crew to site within 48h SLA")
                recommended_actions.append("Limit turbine rotational speed to reduce bearing shear stresses")

        # Case B: Fleet Risk Ranking / "Which asset needs attention?" / Crew Dispatch
        elif "attention" in q_lower or "which asset" in q_lower or "which turbine" in q_lower or "priority" in q_lower or "rank" in q_lower or "crew" in q_lower:
            intent = "fleet_risk_prioritization"
            agents_consulted.append(maintenance_agent.name)
            fleet_risks = maintenance_agent.rank_fleet_risks(db)
            top_risks = fleet_risks[:3]
            tools_executed.append({
                "tool_name": "rank_fleet_risks",
                "agent_name": maintenance_agent.name,
                "status": "success",
                "parameters": {"top_n": 3},
                "result_summary": f"Top risk: {top_risks[0]['asset_code']} ({top_risks[0]['failure_probability_pct']}%)"
            })
            context_data["top_risks"] = top_risks

            agents_consulted.append(performance_agent.name)
            underperf = performance_agent.get_underperforming_assets(db)
            tools_executed.append({
                "tool_name": "get_underperforming_assets",
                "agent_name": performance_agent.name,
                "status": "success",
                "parameters": {},
                "result_summary": f"Identified {len(underperf)} underperforming assets"
            })
            context_data["underperforming_assets"] = underperf

            recommended_actions.append("Prioritize inspection of WT-021 main drive bearing assembly")
            recommended_actions.append("Inspect INV-042 heat sink filters in Banaskantha")

        # Case C: Generation Drop / Weather impact
        elif "generation drop" in q_lower or "why is generation" in q_lower or "generation low" in q_lower or "friction" in q_lower or "weather affecting" in q_lower:
            intent = "generation_variance_analysis"
            agents_consulted.append(performance_agent.name)
            agents_consulted.append(forecasting_agent.name)

            forecast_res = forecasting_agent.get_forecast(db)
            tools_executed.append({
                "tool_name": "get_meteo_and_forecast",
                "agent_name": forecasting_agent.name,
                "status": "success",
                "parameters": {},
                "result_summary": f"Kutch Wind: {forecast_res['kutch_wind_speed_ms']} m/s, Banaskantha GHI: {forecast_res['banaskantha_irradiance_wm2']} W/m²"
            })
            context_data["weather"] = forecast_res
            underperf = performance_agent.get_underperforming_assets(db)
            context_data["asset_losses"] = underperf

            recommended_actions.append("Review local cloud cover satellite imagery")
            recommended_actions.append("Verify inverter cooling loops during midday peak")

        # Case D: Grid Integration / Battery Storage / Revenue / SLDC Feasibility
        elif "grid" in q_lower or "battery" in q_lower or "dispatch" in q_lower or "charge" in q_lower or "revenue" in q_lower or "co2" in q_lower or "tariff" in q_lower or "sldc" in q_lower or "140 mw" in q_lower:
            intent = "grid_dispatch_optimization"
            agents_consulted.append(grid_agent.name)
            grid_res = grid_agent.evaluate_grid_balance(db)
            tools_executed.append({
                "tool_name": "optimize_grid_dispatch",
                "agent_name": grid_agent.name,
                "status": "success",
                "parameters": {},
                "result_summary": f"Balance: {grid_res['net_surplus_deficit_mw']} MW surplus, Strategy: {grid_res['recommendation']['strategy']}"
            })
            context_data["grid_balance"] = grid_res

            recommended_actions.append(grid_res["recommendation"]["action_title"])
            recommended_actions.append("Maintain BESS SoC target for evening peak buffer")

        # Case E: Forecast / Tomorrow's Generation
        elif "forecast" in q_lower or "tomorrow" in q_lower or "weather" in q_lower or "peak generation" in q_lower or "cloud" in q_lower:
            intent = "generation_forecast_inquiry"
            agents_consulted.append(forecasting_agent.name)
            forecast_res = forecasting_agent.get_forecast(db)
            tools_executed.append({
                "tool_name": "generate_24h_forecast",
                "agent_name": forecasting_agent.name,
                "status": "success",
                "parameters": {},
                "result_summary": f"Expected 24h Total: {forecast_res['total_expected_mwh']} MWh"
            })
            context_data["forecast"] = forecast_res
            recommended_actions.append("Commit 24h schedule to Gujarat SLDC day-ahead portal")

        # Case F: General Fleet Overview / Shift Handover Briefing
        else:
            intent = "general_operational_inquiry"
            agents_consulted.append(reporting_agent.name)
            digest = reporting_agent.compile_executive_digest(db)
            tools_executed.append({
                "tool_name": "compile_executive_digest",
                "agent_name": reporting_agent.name,
                "status": "success",
                "parameters": {},
                "result_summary": f"Availability: {digest['fleet_health']['availability_pct']}%, Active Gen: {digest['current_generation_mw']} MW"
            })
            context_data["digest"] = digest
            recommended_actions.append("Review real-time telemetry on Overview Dashboard")

        # Sanitize context data for JSON serializability
        clean_context = make_json_serializable(context_data)
        clean_tools = make_json_serializable(tools_executed)

        system_context = (
            "You are RenewAI, an enterprise renewable energy operations intelligence assistant "
            "monitoring hybrid solar-wind parks in Kutch and Banaskantha, Gujarat. "
            "You provide concise, evidence-based root cause analysis, ML failure probabilities, and clear actions."
        )

        # 2. Dual-Engine Reasoning Execution
        used_engine = "IBM Watson Orchestrate (Live Cloud)"
        if engine_mode == "granite":
            agents_consulted.append("IBM Granite LLM (watsonx.ai)")
            ai_response_text = await self.granite.generate_reasoning(query, system_context)
            used_engine = "IBM Granite LLM (watsonx.ai)"
        elif engine_mode == "ensemble":
            agents_consulted.append("IBM Watson Orchestrate")
            agents_consulted.append("IBM Granite LLM")
            orch_result = await self.orchestrate.generate_reasoning(query, str(clean_context))
            gran_result = await self.granite.generate_reasoning(query, system_context)
            ai_response_text = f"{orch_result.get('response')}\n\n---\n**🔬 Deep Physical Telemetry Reasoning (IBM Granite):**\n{gran_result}"
            used_engine = "Hybrid Ensemble (Watson Orchestrate + Granite)"
        else: # "orchestrate" (Default)
            agents_consulted.append("IBM Watson Orchestrate")
            orch_result = await self.orchestrate.generate_reasoning(query, str(clean_context))
            ai_response_text = orch_result.get("response")
            used_engine = orch_result.get("engine", "IBM Watson Orchestrate (Live Cloud)")

        execution_time_ms = round((time.time() - start_time) * 1000, 1)

        # Record Agent Decision in Database safely
        decision = AgentDecision(
            id=query_id,
            user_id=user_id,
            timestamp=datetime.utcnow(),
            query_text=query,
            intent=intent,
            agents_consulted=agents_consulted,
            tools_executed=clean_tools,
            context_data=clean_context,
            granite_reasoning=ai_response_text,
            final_response=ai_response_text,
            response_time_ms=execution_time_ms
        )
        db.add(decision)
        db.commit()

        return {
            "query_id": query_id,
            "timestamp": datetime.utcnow().isoformat(),
            "query": query,
            "intent": intent,
            "engine_used": used_engine,
            "agents_consulted": agents_consulted,
            "tools_executed": clean_tools,
            "granite_reasoning": ai_response_text,
            "answer": ai_response_text,
            "evidence": clean_context,
            "recommended_actions": recommended_actions,
            "response_time_ms": execution_time_ms
        }

orchestrator = MasterAgentOrchestrator()
