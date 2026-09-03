from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models import RenewablePark, RenewableAsset, EnergyGeneration
from backend.app.schemas.asset import RenewableParkSchema

router = APIRouter(prefix="/parks", tags=["Renewable Parks"])

@router.get("", response_model=List[RenewableParkSchema])
def list_parks(db: Session = Depends(get_db)):
    parks = db.query(RenewablePark).all()
    results = []
    for p in parks:
        assets = p.assets
        h_cnt = len([a for a in assets if a.status == "healthy"])
        w_cnt = len([a for a in assets if a.status == "warning"])
        c_cnt = len([a for a in assets if a.status == "critical"])

        latest_eg = db.query(EnergyGeneration).filter(
            EnergyGeneration.park_id == p.id
        ).order_by(EnergyGeneration.timestamp.desc()).first()

        results.append({
            "id": p.id,
            "name": p.name,
            "region": p.region,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "capacity_mw": p.capacity_mw,
            "park_type": p.park_type,
            "status": p.status,
            "commissioning_year": p.commissioning_year,
            "operator_company": p.operator_company,
            "current_generation_mw": latest_eg.total_generation_mw if latest_eg else 0.0,
            "solar_mw": latest_eg.solar_generation_mw if latest_eg else 0.0,
            "wind_mw": latest_eg.wind_generation_mw if latest_eg else 0.0,
            "efficiency_pct": latest_eg.efficiency_pct if latest_eg else 92.0,
            "healthy_assets_count": h_cnt,
            "warning_assets_count": w_cnt,
            "critical_assets_count": c_cnt
        })
    return results

@router.get("/{park_id}", response_model=RenewableParkSchema)
def get_park_detail(park_id: str, db: Session = Depends(get_db)):
    p = db.query(RenewablePark).filter(RenewablePark.id == park_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Park not found")

    assets = p.assets
    h_cnt = len([a for a in assets if a.status == "healthy"])
    w_cnt = len([a for a in assets if a.status == "warning"])
    c_cnt = len([a for a in assets if a.status == "critical"])

    latest_eg = db.query(EnergyGeneration).filter(
        EnergyGeneration.park_id == p.id
    ).order_by(EnergyGeneration.timestamp.desc()).first()

    return {
        "id": p.id,
        "name": p.name,
        "region": p.region,
        "latitude": p.latitude,
        "longitude": p.longitude,
        "capacity_mw": p.capacity_mw,
        "park_type": p.park_type,
        "status": p.status,
        "commissioning_year": p.commissioning_year,
        "operator_company": p.operator_company,
        "current_generation_mw": latest_eg.total_generation_mw if latest_eg else 0.0,
        "solar_mw": latest_eg.solar_generation_mw if latest_eg else 0.0,
        "wind_mw": latest_eg.wind_generation_mw if latest_eg else 0.0,
        "efficiency_pct": latest_eg.efficiency_pct if latest_eg else 92.0,
        "healthy_assets_count": h_cnt,
        "warning_assets_count": w_cnt,
        "critical_assets_count": c_cnt
    }
