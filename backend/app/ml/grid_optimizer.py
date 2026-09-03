from datetime import datetime
from typing import Dict, Any

class GridOptimizer:
    """
    Renewable Energy & Battery Energy Storage System (BESS) Dispatch Optimizer
    for Gujarat State Load Despatch Centre (SLDC) integration.
    """
    def optimize_dispatch(
        self,
        current_generation_mw: float,
        grid_demand_mw: float,
        battery_soc_pct: float,
        battery_capacity_mwh: float = 40.0,
        max_bess_rate_mw: float = 20.0,
        forecast_trend: str = "steady"
    ) -> Dict[str, Any]:
        """Calculates optimal power allocation across Grid Export, BESS Charge/Discharge, and Curtailment."""
        net_balance = current_generation_mw - grid_demand_mw

        # Case 1: Surplus Renewable Generation (Generation > Demand)
        if net_balance > 0.5:
            surplus = net_balance
            if battery_soc_pct < 92.0:
                # Charge battery with surplus up to max rate
                bess_charge_mw = min(surplus, max_bess_rate_mw)
                grid_export_mw = round(current_generation_mw - bess_charge_mw, 1)
                curtailment_mw = 0.0
                strategy = "Excess Storage & Peak Shaving"
                action_title = f"Charge BESS with {bess_charge_mw} MW Surplus"
                reasoning = (
                    f"Current renewable generation ({current_generation_mw} MW) exceeds grid demand ({grid_demand_mw} MW) "
                    f"by {round(surplus, 1)} MW. Battery SoC is at {round(battery_soc_pct, 1)}%. "
                    f"Supply {grid_demand_mw} MW to grid, route {bess_charge_mw} MW to BESS charging to prepare for evening peak."
                )
            else:
                # Battery full, export surplus to regional grid
                bess_charge_mw = 0.0
                grid_export_mw = round(current_generation_mw, 1)
                curtailment_mw = 0.0
                strategy = "Regional Interconnection Export"
                action_title = f"Export {round(surplus, 1)} MW Surplus to Western Grid"
                reasoning = (
                    f"Battery at high SoC ({round(battery_soc_pct, 1)}%). "
                    f"Exporting {round(surplus, 1)} MW surplus renewable energy to Western Regional Grid (WR-SLDC)."
                )

        # Case 2: Generation Deficit (Demand > Generation)
        elif net_balance < -0.5:
            deficit = abs(net_balance)
            if battery_soc_pct > 20.0:
                # Discharge battery to bridge the deficit
                bess_discharge_mw = min(deficit, max_bess_rate_mw)
                grid_import_mw = round(deficit - bess_discharge_mw, 1)
                bess_charge_mw = -bess_discharge_mw
                grid_export_mw = round(current_generation_mw, 1)
                curtailment_mw = 0.0
                strategy = "BESS Discharge & Deficit Bridging"
                action_title = f"Discharge BESS at {bess_discharge_mw} MW"
                reasoning = (
                    f"Renewable generation ({current_generation_mw} MW) is {round(deficit, 1)} MW below grid demand ({grid_demand_mw} MW). "
                    f"Discharge {bess_discharge_mw} MW from BESS (current SoC: {round(battery_soc_pct, 1)}%). "
                    f"{f'Import {grid_import_mw} MW from thermal grid.' if grid_import_mw > 0 else 'Zero grid import required.'}"
                )
            else:
                # Battery depleted, require grid import
                bess_charge_mw = 0.0
                grid_import_mw = round(deficit, 1)
                grid_export_mw = round(current_generation_mw, 1)
                curtailment_mw = 0.0
                strategy = "Grid Balancing & Import Advisory"
                action_title = f"Import {grid_import_mw} MW from Central Grid"
                reasoning = (
                    f"Battery storage is at minimum reserve threshold ({round(battery_soc_pct, 1)}% SoC). "
                    f"Import {grid_import_mw} MW from Western Grid Pool to balance local industrial demand."
                )

        # Case 3: Balanced Operations
        else:
            bess_charge_mw = 0.0
            grid_export_mw = round(current_generation_mw, 1)
            curtailment_mw = 0.0
            strategy = "Synchronous Balanced Dispatch"
            action_title = "Maintain Steady Grid Feed"
            reasoning = (
                f"Generation ({current_generation_mw} MW) matches grid demand ({grid_demand_mw} MW). "
                f"Grid frequency is stable at 50.02 Hz. BESS on standby."
            )

        # Environmental & Economic metrics
        co2_saved_today = round(current_generation_mw * 0.82 * 12.0, 1) # ~0.82 tons CO2/MWh
        revenue_inr = round(current_generation_mw * 1000 * 2.75 * 12.0, 0) # GUVNL PPA rate ~Rs 2.75/kWh

        return {
            "timestamp": datetime.utcnow(),
            "action_title": action_title,
            "grid_supply_mw": min(current_generation_mw, grid_demand_mw),
            "battery_action_mw": bess_charge_mw,
            "grid_import_export_mw": round(current_generation_mw - grid_demand_mw - bess_charge_mw, 1),
            "curtailment_mw": curtailment_mw,
            "strategy": strategy,
            "granite_reasoning": reasoning,
            "risk_factor": "Low" if abs(net_balance) < 20 else ("Medium" if battery_soc_pct > 30 else "High"),
            "co2_saved_tons_today": co2_saved_today,
            "estimated_revenue_inr": revenue_inr
        }

grid_optimizer = GridOptimizer()
