from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.app.database.models import EnergyGeneration, GridDemand, BatteryStatus
from backend.app.ml.grid_optimizer import grid_optimizer

class GridOptimizationAgent:
    """
    Evaluates total renewable generation against Gujarat SLDC grid demand,
    manages battery storage state-of-charge (SoC), and provides simulated dispatch recommendations.
    """
    def __init__(self):
        self.name = "Grid Integration Optimization Agent"

    def evaluate_grid_balance(self, db: Session) -> Dict[str, Any]:
        latest_eg = db.query(EnergyGeneration).order_by(EnergyGeneration.timestamp.desc()).first()
        latest_gd = db.query(GridDemand).order_by(GridDemand.timestamp.desc()).first()
        latest_bat = db.query(BatteryStatus).order_by(BatteryStatus.timestamp.desc()).first()

        gen_mw = latest_eg.total_generation_mw if latest_eg else 128.0
        dem_mw = latest_gd.demand_mw if latest_gd else 110.0
        soc_pct = latest_bat.current_soc_pct if latest_bat else 68.5

        rec = grid_optimizer.optimize_dispatch(
            current_generation_mw=gen_mw,
            grid_demand_mw=dem_mw,
            battery_soc_pct=soc_pct
        )

        return {
            "agent": self.name,
            "current_generation_mw": gen_mw,
            "grid_demand_mw": dem_mw,
            "battery_soc_pct": soc_pct,
            "net_surplus_deficit_mw": round(gen_mw - dem_mw, 1),
            "recommendation": rec
        }

grid_agent = GridOptimizationAgent()
