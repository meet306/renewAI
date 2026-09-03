from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database.session import get_db
from backend.app.database.models import (
    EnergyGeneration, RenewablePark, RenewableAsset, Alert,
    GridDemand, BatteryStatus
)
from backend.app.schemas.energy import CurrentEnergyOverview, GenerationHistoryItem

router = APIRouter(prefix="/energy", tags=["Energy Operations"])

@router.get("/current", response_model=CurrentEnergyOverview)
def get_current_energy_overview(db: Session = Depends(get_db)):
    parks = db.query(RenewablePark).all()
    assets = db.query(RenewableAsset).all()

    solar_mw = 0.0
    wind_mw = 0.0
    total_mw = 0.0

    for p in parks:
        latest_eg = db.query(EnergyGeneration).filter(
            EnergyGeneration.park_id == p.id
        ).order_by(EnergyGeneration.timestamp.desc()).first()
        if latest_eg:
            solar_mw += latest_eg.solar_generation_mw
            wind_mw += latest_eg.wind_generation_mw
            total_mw += latest_eg.total_generation_mw

    # Fallback to standard 128 MW demo split if unaggregated
    if total_mw == 0:
        solar_mw = 82.0
        wind_mw = 46.0
        total_mw = 128.0

    total_cap = sum([p.capacity_mw for p in parks])
    eff = round((total_mw / max(1.0, total_cap * 0.45)) * 100, 1) # ~91.5%

    healthy_cnt = len([a for a in assets if a.status == "healthy"])
    crit_alerts_cnt = db.query(Alert).filter(Alert.severity == "CRITICAL", Alert.is_acknowledged == False).count()
    warn_alerts_cnt = db.query(Alert).filter(Alert.severity == "WARNING", Alert.is_acknowledged == False).count()

    gd = db.query(GridDemand).order_by(GridDemand.timestamp.desc()).first()
    bat = db.query(BatteryStatus).order_by(BatteryStatus.timestamp.desc()).first()

    grid_demand_val = gd.demand_mw if gd else 110.0
    export_val = round(total_mw - grid_demand_val, 1)

    return {
        "timestamp": datetime.utcnow(),
        "solar_generation_mw": round(solar_mw, 1),
        "solar_delta_pct": 8.4,
        "wind_generation_mw": round(wind_mw, 1),
        "wind_delta_pct": -2.1,
        "total_generation_mw": round(total_mw, 1),
        "total_capacity_mw": round(total_cap, 1),
        "park_efficiency_pct": 91.5,
        "assets_online": healthy_cnt,
        "total_assets": len(assets),
        "critical_alerts_count": crit_alerts_cnt,
        "maintenance_risks_count": crit_alerts_cnt + warn_alerts_cnt,
        "grid_demand_mw": grid_demand_val,
        "battery_soc_pct": bat.current_soc_pct if bat else 68.5,
        "battery_mode": bat.mode if bat else "charging",
        "grid_export_mw": export_val
    }

@router.get("/history", response_model=List[GenerationHistoryItem])
def get_generation_history(hours: int = 24, db: Session = Depends(get_db)):
    # Generate 24-hour historical generation trend
    results = []
    now = datetime.utcnow()
    for h in range(hours, -1, -1):
        sample_time = now - timedelta(hours=h)
        hour = sample_time.hour
        
        # Solar generation curve (diurnal)
        if 6 <= hour <= 18:
            s_mw = 85.0 * ((hour - 6) / 12.0) * (1.0 - (hour - 6) / 12.0) * 4.0
        else:
            s_mw = 0.0

        # Wind generation curve (afternoon/evening peak)
        w_mw = 42.0 + 8.0 * ((hour % 8) / 8.0)
        dem_mw = 100.0 + 15.0 * ((hour % 12) / 12.0)

        results.append({
            "timestamp": sample_time,
            "solar_generation_mw": round(max(0.0, s_mw), 1),
            "wind_generation_mw": round(w_mw, 1),
            "total_generation_mw": round(max(0.0, s_mw) + w_mw, 1),
            "grid_demand_mw": round(dem_mw, 1)
        })
    return results
