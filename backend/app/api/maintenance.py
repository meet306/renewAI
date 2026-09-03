from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models import (
    RenewableAsset, MaintenanceRecord, Anomaly, AssetPrediction, SensorReading
)
from backend.app.schemas.maintenance import (
    MaintenanceRiskItem, MaintenanceRecordSchema, MaintenanceScheduleRequest, AnomalySchema
)
from backend.app.agents.maintenance_agent import maintenance_agent

router = APIRouter(prefix="/maintenance", tags=["Predictive Maintenance"])

@router.get("/risks", response_model=List[MaintenanceRiskItem])
def get_fleet_maintenance_risks(db: Session = Depends(get_db)):
    assets = db.query(RenewableAsset).all()
    results = []

    for a in assets:
        pred = db.query(AssetPrediction).filter(
            AssetPrediction.asset_id == a.id
        ).order_by(AssetPrediction.timestamp.desc()).first()

        last_maint = db.query(MaintenanceRecord).filter(
            MaintenanceRecord.asset_id == a.id
        ).order_by(MaintenanceRecord.scheduled_date.desc()).first()

        latest_r = db.query(SensorReading).filter(
            SensorReading.asset_id == a.id
        ).order_by(SensorReading.timestamp.desc()).first()

        if pred:
            prob = pred.failure_probability_pct
            risk = pred.risk_level
            rul = pred.predicted_rul_days
            factors = pred.contributing_factors or {}
            rec = pred.recommendation_text
        else:
            prob = 8.0
            risk = "Low"
            rul = 60
            factors = {}
            rec = "Operating within normal limits."

        primary_anomaly = "None detected"
        if latest_r:
            if latest_r.vibration_mms > 3.0:
                primary_anomaly = f"Elevated Vibration ({latest_r.vibration_mms} mm/s)"
            elif latest_r.component_temp_c > 75.0:
                primary_anomaly = f"High Temperature ({latest_r.component_temp_c}°C)"
            elif latest_r.performance_ratio < 0.85:
                primary_anomaly = f"Low Efficiency ({round(latest_r.performance_ratio * 100, 1)}%)"

        results.append({
            "asset_id": a.id,
            "asset_code": a.asset_code,
            "asset_type": a.asset_type,
            "region": a.park.region if a.park else "Kutch",
            "park_name": a.park.name if a.park else "Renewable Park",
            "risk_level": risk,
            "failure_probability_pct": prob,
            "predicted_rul_days": rul,
            "primary_sensor_anomaly": primary_anomaly,
            "top_contributing_factors": factors,
            "recommendation": rec,
            "last_maintenance_date": last_maint.scheduled_date if last_maint else None
        })

    # Sort by failure probability descending
    results.sort(key=lambda x: x["failure_probability_pct"], reverse=True)
    return results

@router.get("/records", response_model=List[MaintenanceRecordSchema])
def get_maintenance_records(db: Session = Depends(get_db)):
    records = db.query(MaintenanceRecord).order_by(MaintenanceRecord.scheduled_date.desc()).all()
    results = []
    for r in records:
        results.append({
            "id": r.id,
            "asset_id": r.asset_id,
            "asset_code": r.asset.asset_code if r.asset else None,
            "scheduled_date": r.scheduled_date,
            "completed_date": r.completed_date,
            "maintenance_type": r.maintenance_type,
            "failure_type": r.failure_type,
            "description": r.description,
            "priority": r.priority,
            "status": r.status,
            "estimated_cost_inr": r.estimated_cost_inr,
            "technician_notes": r.technician_notes
        })
    return results

@router.post("/schedule", response_model=MaintenanceRecordSchema)
def schedule_maintenance(req: MaintenanceScheduleRequest, db: Session = Depends(get_db)):
    asset = db.query(RenewableAsset).filter(
        (RenewableAsset.id == req.asset_id) | (RenewableAsset.asset_code == req.asset_id)
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    record = MaintenanceRecord(
        asset_id=asset.id,
        scheduled_date=req.scheduled_date,
        maintenance_type=req.maintenance_type,
        failure_type=req.failure_type,
        description=req.description,
        priority=req.priority,
        status="scheduled",
        estimated_cost_inr=req.estimated_cost_inr or 50000.0,
        technician_notes="Generated via RenewAI Predictive Maintenance Hub"
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "asset_id": record.asset_id,
        "asset_code": asset.asset_code,
        "scheduled_date": record.scheduled_date,
        "completed_date": record.completed_date,
        "maintenance_type": record.maintenance_type,
        "failure_type": record.failure_type,
        "description": record.description,
        "priority": record.priority,
        "status": record.status,
        "estimated_cost_inr": record.estimated_cost_inr,
        "technician_notes": record.technician_notes
    }

@router.get("/anomalies", response_model=List[AnomalySchema])
def get_anomalies(db: Session = Depends(get_db)):
    # Pull anomalies based on asset status or explicit table records
    anomalies = db.query(Anomaly).filter(Anomaly.is_resolved == False).all()
    results = []
    for an in anomalies:
        results.append({
            "id": an.id,
            "asset_id": an.asset_id,
            "asset_code": an.asset.asset_code if an.asset else None,
            "timestamp": an.timestamp,
            "anomaly_type": an.anomaly_type,
            "severity": an.severity,
            "metric_name": an.metric_name,
            "expected_value": an.expected_value,
            "actual_value": an.actual_value,
            "deviation_pct": an.deviation_pct,
            "is_resolved": an.is_resolved
        })
    return results
