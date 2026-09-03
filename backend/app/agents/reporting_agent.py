from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.app.database.models import RenewablePark, RenewableAsset, Alert, EnergyGeneration, GridDemand

class ReportingAgent:
    """
    Synthesizes operational metrics across Kutch and Banaskantha parks
    into concise executive summaries, risk digests, and dispatch reports.
    """
    def __init__(self):
        self.name = "Renewable Energy Dashboard & Reporting Agent"

    def compile_executive_digest(self, db: Session) -> Dict[str, Any]:
        parks = db.query(RenewablePark).all()
        assets = db.query(RenewableAsset).all()
        critical_alerts = db.query(Alert).filter(Alert.severity == "CRITICAL", Alert.is_acknowledged == False).all()
        warning_alerts = db.query(Alert).filter(Alert.severity == "WARNING", Alert.is_acknowledged == False).all()

        total_assets = len(assets)
        healthy_assets = len([a for a in assets if a.status == "healthy"])
        warning_assets = len([a for a in assets if a.status == "warning"])
        critical_assets = len([a for a in assets if a.status == "critical"])

        latest_eg = db.query(EnergyGeneration).order_by(EnergyGeneration.timestamp.desc()).first()
        latest_gd = db.query(GridDemand).order_by(GridDemand.timestamp.desc()).first()

        total_gen = latest_eg.total_generation_mw if latest_eg else 128.0
        grid_dem = latest_gd.demand_mw if latest_gd else 110.0

        return {
            "agent": self.name,
            "timestamp": datetime.utcnow().isoformat(),
            "total_parks": len(parks),
            "total_capacity_mw": sum([p.capacity_mw for p in parks]),
            "current_generation_mw": total_gen,
            "grid_demand_mw": grid_dem,
            "fleet_health": {
                "total": total_assets,
                "healthy": healthy_assets,
                "warning": warning_assets,
                "critical": critical_assets,
                "availability_pct": round((healthy_assets / max(1, total_assets)) * 100, 1)
            },
            "active_alarms": {
                "critical": len(critical_alerts),
                "warning": len(warning_alerts)
            },
            "top_priority_assets": [a.asset_code for a in assets if a.status in ["critical", "warning"]]
        }

reporting_agent = ReportingAgent()
