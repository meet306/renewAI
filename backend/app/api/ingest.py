import io
import csv
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models import RenewableAsset, SensorReading, EnergyGeneration, Anomaly, Alert
from backend.app.ml.failure_predictor import failure_predictor
from backend.app.agents.orchestrator import orchestrator
from backend.app.core.websocket_manager import websocket_manager

router = APIRouter(prefix="/ingest", tags=["Real Data Ingestion & SCADA Gateway"])

class ManualTelemetryPayload(BaseModel):
    asset_code: str
    power_kw: float
    expected_power_kw: Optional[float] = None
    vibration_mms: Optional[float] = 1.8
    component_temp_c: Optional[float] = 60.0
    ambient_temp_c: Optional[float] = 32.0
    rpm: Optional[float] = 14.5
    wind_speed_ms: Optional[float] = 8.5
    irradiance_wm2: Optional[float] = 850.0
    voltage_v: Optional[float] = 690.0
    current_a: Optional[float] = 2400.0

@router.post("/telemetry")
async def ingest_single_reading(payload: ManualTelemetryPayload, db: Session = Depends(get_db)):
    """
    Ingests real live sensor telemetry for any asset and executes real ML & AI analysis.
    """
    asset = db.query(RenewableAsset).filter(RenewableAsset.asset_code == payload.asset_code.upper()).first()
    if not asset:
        # Create asset if it doesn't exist
        is_wind = payload.asset_code.upper().startswith("WT-")
        asset = RenewableAsset(
            asset_code=payload.asset_code.upper(),
            park_id=db.query(RenewableAsset).first().park_id,
            asset_type="wind_turbine" if is_wind else "solar_inverter",
            manufacturer="Real Sensor SCADA Feed",
            capacity_kw=3000.0 if is_wind else 3125.0,
            status="healthy",
            health_score=95.0,
            latitude=23.5,
            longitude=70.5
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)

    exp_kw = payload.expected_power_kw or payload.power_kw
    power_deficit = max(0.0, exp_kw - payload.power_kw)
    pr = round(min(1.0, payload.power_kw / (exp_kw + 0.001)), 3)

    # 1. Run Real Machine Learning Failure Predictor
    is_wind = asset.asset_type == "wind_turbine" or payload.asset_code.upper().startswith("WT-")
    if is_wind:
        ml_res = failure_predictor.predict_wind_turbine(
            vibration_mms=payload.vibration_mms or 1.8,
            bearing_temp_c=payload.component_temp_c or 60.0,
            rpm=payload.rpm or 14.5,
            power_actual_kw=payload.power_kw,
            power_expected_kw=exp_kw,
            ambient_temp_c=payload.ambient_temp_c or 32.0
        )
    else:
        ml_res = failure_predictor.predict_solar_inverter(
            igbt_temp_c=payload.component_temp_c or 60.0,
            power_actual_kw=payload.power_kw,
            power_expected_kw=exp_kw,
            irradiance_wm2=payload.irradiance_wm2 or 850.0,
            ambient_temp_c=payload.ambient_temp_c or 32.0,
            voltage_v=payload.voltage_v or 800.0
        )
    failure_prob = ml_res.get("failure_probability_pct", 5.0)
    risk_lvl = ml_res.get("risk_level", "Low")
    rul_days = ml_res.get("predicted_rul_days", 45)

    # Update asset status
    if risk_lvl == "Critical":
        asset.status = "critical"
        asset.health_score = round(100.0 - failure_prob, 1)
    elif risk_lvl == "High":
        asset.status = "warning"
        asset.health_score = round(100.0 - failure_prob, 1)
    else:
        asset.status = "healthy"
        asset.health_score = 98.0

    # 2. Record reading in DB
    reading = SensorReading(
        asset_id=asset.id,
        timestamp=datetime.utcnow(),
        power_output_kw=payload.power_kw,
        expected_power_kw=exp_kw,
        voltage_v=payload.voltage_v,
        current_a=payload.current_a,
        ambient_temp_c=payload.ambient_temp_c,
        component_temp_c=payload.component_temp_c,
        vibration_mms=payload.vibration_mms,
        rpm=payload.rpm,
        irradiance_wm2=payload.irradiance_wm2,
        wind_speed_ms=payload.wind_speed_ms,
        performance_ratio=pr,
        anomaly_score=round(failure_prob / 100.0, 3)
    )
    db.add(reading)
    db.commit()

    # 3. Trigger Real-time AI Reasoning with IBM Watson Orchestrate & Granite
    ai_query = (
        f"Real sensor reading ingested for {payload.asset_code}: "
        f"Power={payload.power_kw}kW, Vibration={payload.vibration_mms}mm/s, "
        f"Component Temp={payload.component_temp_c}°C, Failure Risk={failure_prob}%. "
        f"Explain root cause and recommend operational action."
    )
    ai_analysis = await orchestrator.process_query(db, ai_query, engine_mode="orchestrate")

    # 4. Broadcast live update over WebSocket
    try:
        await websocket_manager.broadcast({
            "event_type": "REAL_TELEMETRY_INGESTED",
            "asset_code": payload.asset_code,
            "power_kw": payload.power_kw,
            "vibration_mms": payload.vibration_mms,
            "component_temp_c": payload.component_temp_c,
            "failure_probability_pct": failure_prob,
            "risk_level": risk_lvl
        })
    except Exception:
        pass

    return {
        "status": "SUCCESS_INGESTED",
        "timestamp": datetime.utcnow().isoformat(),
        "asset_code": payload.asset_code,
        "ml_inference": {
            "failure_probability_pct": failure_prob,
            "risk_level": risk_lvl,
            "predicted_rul_days": rul_days,
            "anomaly_detected": failure_prob > 35.0
        },
        "ai_orchestrator_decision": ai_analysis.get("answer"),
        "engine_used": ai_analysis.get("engine_used")
    }

@router.post("/csv")
async def ingest_csv_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Parses and ingests an entire custom CSV telemetry file (SCADA log, Kaggle dataset, etc.).
    """
    contents = await file.read()
    decoded = contents.decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(decoded))
    
    rows_processed = 0
    anomalies_flagged = 0

    first_asset = "CUSTOM-01"
    for row in reader:
        # Flexible column name matching
        code = row.get("asset_code") or row.get("Asset") or row.get("Turbine") or row.get("device_id") or "WT-021"
        first_asset = code
        p_kw = float(row.get("power_kw") or row.get("Power") or row.get("ActivePower") or row.get("kw") or 2400.0)
        vib = float(row.get("vibration_mms") or row.get("Vibration") or row.get("vib") or 1.8)
        temp = float(row.get("component_temp_c") or row.get("Temperature") or row.get("BearingTemp") or row.get("temp") or 60.0)
        
        # Save sample reading
        asset = db.query(RenewableAsset).filter(RenewableAsset.asset_code == code.upper()).first()
        if asset:
            reading = SensorReading(
                asset_id=asset.id,
                timestamp=datetime.utcnow(),
                power_output_kw=p_kw,
                expected_power_kw=p_kw,
                vibration_mms=vib,
                component_temp_c=temp,
                anomaly_score=0.85 if (vib > 4.5 or temp > 75) else 0.05
            )
            db.add(reading)
            rows_processed += 1
            if vib > 4.5 or temp > 75:
                anomalies_flagged += 1

    db.commit()

    return {
        "status": "CSV_INGESTION_COMPLETED",
        "file_name": file.filename,
        "rows_ingested": rows_processed,
        "anomalies_flagged": anomalies_flagged,
        "message": f"Successfully ingested {rows_processed} real sensor data records from {file.filename}."
    }

@router.get("/scada-template")
def get_scada_csv_template():
    """Returns the recommended CSV format for SCADA uploads."""
    return {
        "columns": [
            "timestamp", "asset_code", "power_kw", "expected_power_kw", 
            "vibration_mms", "component_temp_c", "ambient_temp_c", 
            "wind_speed_ms", "irradiance_wm2", "voltage_v", "current_a"
        ],
        "example_row": {
            "timestamp": "2026-09-02T12:00:00Z",
            "asset_code": "WT-021",
            "power_kw": 2100.0,
            "expected_power_kw": 2800.0,
            "vibration_mms": 5.4,
            "component_temp_c": 78.6,
            "ambient_temp_c": 34.0,
            "wind_speed_ms": 8.4,
            "irradiance_wm2": 0.0,
            "voltage_v": 690.0,
            "current_a": 2450.0
        }
    }
