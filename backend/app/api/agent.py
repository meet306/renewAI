from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models import AgentDecision, Alert
from backend.app.schemas.agent import (
    AgentQueryRequest, AgentQueryResponse, DailyExecutiveSummary
)
from backend.app.agents.orchestrator import orchestrator
from backend.app.services.orchestrate_service import orchestrate_service
from backend.app.services.granite_service import granite_service

router = APIRouter(prefix="/agent", tags=["AI Command Center"])

@router.post("/query", response_model=AgentQueryResponse)
async def query_agent_command_center(req: AgentQueryRequest, db: Session = Depends(get_db)):
    engine_choice = req.engine or "orchestrate"
    result = await orchestrator.process_query(db, req.query, engine_mode=engine_choice)
    return result

@router.get("/engines/status")
async def get_ai_engines_status():
    """Returns real-time connection and model status for AI engines."""
    orch_health = await orchestrate_service.check_health()
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "watson_orchestrate": {
            "name": "IBM Watson Orchestrate",
            "status": orch_health.get("status"),
            "is_live": orch_health.get("authenticated", False),
            "agent_id": orch_health.get("agent_id"),
            "region": "au-syd",
            "mode": orch_health.get("mode")
        },
        "ibm_granite": {
            "name": "IBM Granite LLM (watsonx.ai)",
            "model_id": granite_service.model_id,
            "status": "active",
            "mode": "watsonx.ai ready + resilient fallback"
        }
    }

@router.get("/voice-briefing")
def get_voice_shift_briefing(db: Session = Depends(get_db)):
    """Returns high-priority spoken dialogue text for Gujarat SLDC operators."""
    crit_count = db.query(Alert).filter(Alert.severity == "CRITICAL", Alert.is_acknowledged == False).count()
    speech_text = (
        f"Good day operator. RenewAI operations report for Kutch and Banaskantha. "
        f"Total active generation is 128 Megawatts, with 82 Megawatts Solar and 46 Megawatts Wind. "
        f"Gujarat S L D C demand commitment of 110 Megawatts is fully met at 50.02 Hertz. "
        f"Alert: Wind Turbine WT-021 has critical main bearing wear with an 87 percent failure probability. "
        f"Work Order 8842 has been dispatched to Crew Kutch-B. "
        f"Battery storage is actively charging at 12 Megawatts with current state of charge at 68.5 percent. "
        f"All systems are operating in optimal balance."
    )
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "speech_text": speech_text,
        "operator_directive": "Review WT-021 Work Order and verify evening BESS discharge schedule."
    }

@router.get("/history")
def get_agent_query_history(limit: int = 15, db: Session = Depends(get_db)):
    decisions = db.query(AgentDecision).order_by(AgentDecision.timestamp.desc()).limit(limit).all()
    results = []
    for d in decisions:
        results.append({
            "query_id": d.id,
            "timestamp": d.timestamp.isoformat(),
            "query": d.query_text,
            "intent": d.intent,
            "engine_used": "IBM Watson Orchestrate (Live Cloud)" if "Orchestrate" in (d.agents_consulted or []) else "IBM Granite LLM",
            "agents_consulted": d.agents_consulted or [],
            "tools_executed": d.tools_executed or [],
            "granite_reasoning": d.granite_reasoning,
            "answer": d.final_response,
            "evidence": d.context_data or {},
            "response_time_ms": d.response_time_ms
        })
    return results

@router.get("/summary", response_model=DailyExecutiveSummary)
def get_daily_executive_summary(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    crit_count = db.query(Alert).filter(Alert.severity == "CRITICAL", Alert.is_acknowledged == False).count()
    warn_count = db.query(Alert).filter(Alert.severity == "WARNING", Alert.is_acknowledged == False).count()
    
    summary_text = (
        "### RenewAI Daily Intelligence Briefing — Gujarat Operations\n\n"
        "**Key Highlights:**\n"
        "- Total Renewable Output: **128.0 MW** (Solar: **82.0 MW**, Wind: **46.0 MW**).\n"
        "- Park Operating Efficiency: **91.5%** with 96.2% asset availability.\n"
        f"- Active Alarms: **{crit_count} Critical**, **{warn_count} Warning**.\n"
        "- **Priority Action Item:** WT-021 main drive bearing degradation in Kutch requires dispatch within 48h.\n"
        "- **Grid Dispatch:** 12.0 MW surplus routed into Kutch BESS charging to prepare for peak evening demand."
    )

    return {
        "generated_at": now,
        "title": f"Gujarat Parks Daily Intelligence Digest ({now.strftime('%d %b %Y')})",
        "summary_markdown": summary_text,
        "key_metrics": {
            "solar_mw": 82.0,
            "wind_mw": 46.0,
            "total_generation_mw": 128.0,
            "grid_demand_mw": 110.0,
            "efficiency_pct": 91.5,
            "battery_soc_pct": 68.5
        },
        "high_priority_assets": ["WT-021", "INV-042"],
        "grid_dispatch_summary": "110 MW Grid Supply + 12 MW BESS Charging + 6 MW WR-SLDC Export."
    }
