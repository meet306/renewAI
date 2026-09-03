from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models import GridDemand, EnergyGeneration, BatteryStatus
from backend.app.schemas.grid import GridStatusSchema, GridOptimizationRecommendation
from backend.app.ml.grid_optimizer import grid_optimizer

router = APIRouter(prefix="/grid", tags=["Grid & BESS Optimization"])

@router.get("/status", response_model=GridStatusSchema)
def get_grid_status(db: Session = Depends(get_db)):
    gd = db.query(GridDemand).order_by(GridDemand.timestamp.desc()).first()
    eg = db.query(EnergyGeneration).order_by(EnergyGeneration.timestamp.desc()).first()
    bat = db.query(BatteryStatus).order_by(BatteryStatus.timestamp.desc()).first()

    gen_val = eg.total_generation_mw if eg else 128.0
    dem_val = gd.demand_mw if gd else 110.0
    soc_val = bat.current_soc_pct if bat else 68.5
    rate_val = bat.charge_discharge_rate_mw if bat else 12.0
    mode_val = bat.mode if bat else "charging"
    freq_val = gd.grid_frequency_hz if gd else 50.02
    exp_val = round(gen_val - dem_val, 1)

    return {
        "timestamp": datetime.utcnow(),
        "region": "Gujarat-SLDC-West",
        "grid_demand_mw": dem_val,
        "renewable_supply_mw": gen_val,
        "grid_frequency_hz": freq_val,
        "grid_import_export_mw": exp_val,
        "grid_constraint_status": gd.grid_constraint_status if gd else "Normal",
        "battery_total_capacity_mwh": bat.total_capacity_mwh if bat else 40.0,
        "battery_current_soc_pct": soc_val,
        "battery_charge_discharge_rate_mw": rate_val,
        "battery_mode": mode_val,
        "forecasted_next_3h_generation_mw": 115.0,
        "curtailment_risk_pct": 2.5
    }

@router.get("/recommendations", response_model=GridOptimizationRecommendation)
def get_grid_optimization_recommendations(db: Session = Depends(get_db)):
    gd = db.query(GridDemand).order_by(GridDemand.timestamp.desc()).first()
    eg = db.query(EnergyGeneration).order_by(EnergyGeneration.timestamp.desc()).first()
    bat = db.query(BatteryStatus).order_by(BatteryStatus.timestamp.desc()).first()

    gen_val = eg.total_generation_mw if eg else 128.0
    dem_val = gd.demand_mw if gd else 110.0
    soc_val = bat.current_soc_pct if bat else 68.5

    rec = grid_optimizer.optimize_dispatch(
        current_generation_mw=gen_val,
        grid_demand_mw=dem_val,
        battery_soc_pct=soc_val
    )
    return rec
