from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.database.models import RenewableAsset, SensorReading, MaintenanceRecord, AssetPrediction
from backend.app.ml.failure_predictor import failure_predictor

class PredictiveMaintenanceAgent:
    """
    Evaluates failure risks, Remaining Useful Life (RUL), and generates maintenance recommendations
    using Random Forest and Gradient Boosting models combined with historical maintenance logs.
    """
    def __init__(self):
        self.name = "Predictive Maintenance Agent"

    def evaluate_asset_health(self, db: Session, asset_code: str) -> Dict[str, Any]:
        asset = db.query(RenewableAsset).filter(RenewableAsset.asset_code == asset_code).first()
        if not asset:
            return {"status": "error", "message": f"Asset {asset_code} not found"}

        latest_reading = db.query(SensorReading).filter(
            SensorReading.asset_id == asset.id
        ).order_by(SensorReading.timestamp.desc()).first()

        if not latest_reading:
            return {"status": "error", "message": f"No telemetry available for {asset_code}"}

        # Run ML model based on asset type
        if asset.asset_type == "wind_turbine":
            prediction = failure_predictor.predict_wind_turbine(
                vibration_mms=latest_reading.vibration_mms,
                bearing_temp_c=latest_reading.component_temp_c,
                rpm=latest_reading.rpm,
                power_actual_kw=latest_reading.power_output_kw,
                power_expected_kw=latest_reading.expected_power_kw,
                ambient_temp_c=latest_reading.ambient_temp_c
            )
        else: # Solar inverter or string
            eff = latest_reading.performance_ratio
            prediction = failure_predictor.predict_solar_inverter(
                component_temp_c=latest_reading.component_temp_c,
                efficiency_ratio=eff,
                irradiance_wm2=latest_reading.irradiance_wm2,
                ambient_temp_c=latest_reading.ambient_temp_c
            )

        # Get historical maintenance records
        hist_records = db.query(MaintenanceRecord).filter(
            MaintenanceRecord.asset_id == asset.id
        ).order_by(MaintenanceRecord.scheduled_date.desc()).limit(3).all()

        maint_summary = [
            {
                "date": r.scheduled_date.strftime("%Y-%m-%d"),
                "type": r.maintenance_type,
                "failure_type": r.failure_type,
                "status": r.status
            }
            for r in hist_records
        ]

        return {
            "agent": self.name,
            "asset_code": asset.asset_code,
            "asset_type": asset.asset_type,
            "failure_probability_pct": prediction["failure_probability_pct"],
            "risk_level": prediction["risk_level"],
            "predicted_rul_days": prediction["predicted_rul_days"],
            "contributing_factors": prediction["contributing_factors"],
            "recommendation": prediction["recommendation_text"],
            "maintenance_history": maint_summary
        }

    def rank_fleet_risks(self, db: Session) -> List[Dict[str, Any]]:
        assets = db.query(RenewableAsset).all()
        risk_list = []
        for a in assets:
            res = self.evaluate_asset_health(db, a.asset_code)
            if res.get("status") != "error":
                risk_list.append(res)
        
        # Sort descending by failure probability
        risk_list.sort(key=lambda x: x["failure_probability_pct"], reverse=True)
        return risk_list

maintenance_agent = PredictiveMaintenanceAgent()
