from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models import (
    RenewableAsset, SensorReading, AssetPrediction, Alert, RenewablePark
)
from backend.app.schemas.asset import (
    RenewableAssetListItem, RenewableAssetDetail, SensorReadingSchema
)

router = APIRouter(prefix="/assets", tags=["Renewable Assets"])

@router.get("", response_model=List[RenewableAssetListItem])
def list_assets(
    park_id: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    asset_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(RenewableAsset)
    if park_id:
        query = query.filter(RenewableAsset.park_id == park_id)
    if status:
        query = query.filter(RenewableAsset.status == status)
    if asset_type:
        query = query.filter(RenewableAsset.asset_type == asset_type)

    assets = query.all()
    results = []

    for a in assets:
        if region and a.park.region != region:
            continue

        latest_r = db.query(SensorReading).filter(
            SensorReading.asset_id == a.id
        ).order_by(SensorReading.timestamp.desc()).first()

        latest_p = db.query(AssetPrediction).filter(
            AssetPrediction.asset_id == a.id
        ).order_by(AssetPrediction.timestamp.desc()).first()

        results.append({
            "id": a.id,
            "park_id": a.park_id,
            "park_name": a.park.name if a.park else None,
            "region": a.park.region if a.park else None,
            "asset_code": a.asset_code,
            "asset_type": a.asset_type,
            "manufacturer": a.manufacturer,
            "capacity_kw": a.capacity_kw,
            "status": a.status,
            "health_score": a.health_score,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "last_updated": a.last_updated,
            "current_power_kw": latest_r.power_output_kw if latest_r else 0.0,
            "expected_power_kw": latest_r.expected_power_kw if latest_r else 0.0,
            "performance_ratio": latest_r.performance_ratio if latest_r else 0.95,
            "failure_probability_pct": latest_p.failure_probability_pct if latest_p else 5.0,
            "risk_level": latest_p.risk_level if latest_p else "Low"
        })

    return results

@router.get("/{asset_id}", response_model=RenewableAssetDetail)
def get_asset_detail(asset_id: str, db: Session = Depends(get_db)):
    # Support finding by UUID or asset_code (e.g. WT-021)
    a = db.query(RenewableAsset).filter(
        (RenewableAsset.id == asset_id) | (RenewableAsset.asset_code == asset_id)
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Asset not found")

    latest_r = db.query(SensorReading).filter(
        SensorReading.asset_id == a.id
    ).order_by(SensorReading.timestamp.desc()).first()

    latest_p = db.query(AssetPrediction).filter(
        AssetPrediction.asset_id == a.id
    ).order_by(AssetPrediction.timestamp.desc()).first()

    history = db.query(SensorReading).filter(
        SensorReading.asset_id == a.id
    ).order_by(SensorReading.timestamp.desc()).limit(24).all()
    history.reverse()

    alerts = db.query(Alert).filter(
        Alert.asset_id == a.id
    ).order_by(Alert.timestamp.desc()).limit(5).all()

    alert_dicts = [
        {
            "id": al.id,
            "severity": al.severity,
            "title": al.title,
            "message": al.message,
            "timestamp": al.timestamp.isoformat(),
            "is_acknowledged": al.is_acknowledged
        }
        for al in alerts
    ]

    return {
        "id": a.id,
        "park_id": a.park_id,
        "park_name": a.park.name if a.park else None,
        "region": a.park.region if a.park else None,
        "asset_code": a.asset_code,
        "asset_type": a.asset_type,
        "manufacturer": a.manufacturer,
        "capacity_kw": a.capacity_kw,
        "commissioning_date": a.commissioning_date,
        "status": a.status,
        "health_score": a.health_score,
        "latitude": a.latitude,
        "longitude": a.longitude,
        "last_updated": a.last_updated,
        "wind_specs": a.wind_specs,
        "solar_specs": a.solar_specs,
        "latest_reading": latest_r,
        "latest_prediction": latest_p,
        "telemetry_history": history,
        "active_alerts": alert_dicts
    }

@router.get("/{asset_id}/telemetry", response_model=List[SensorReadingSchema])
def get_asset_telemetry_history(asset_id: str, limit: int = 48, db: Session = Depends(get_db)):
    a = db.query(RenewableAsset).filter(
        (RenewableAsset.id == asset_id) | (RenewableAsset.asset_code == asset_id)
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Asset not found")

    readings = db.query(SensorReading).filter(
        SensorReading.asset_id == a.id
    ).order_by(SensorReading.timestamp.desc()).limit(limit).all()
    readings.reverse()
    return readings
