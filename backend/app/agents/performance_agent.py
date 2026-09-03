from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.database.models import RenewableAsset, SensorReading, Anomaly
from backend.app.ml.anomaly_detector import anomaly_detector

class AssetPerformanceAgent:
    """
    Evaluates real-time performance ratios (PR), compares expected vs actual power output,
    and identifies underperforming solar and wind assets in Kutch and Banaskantha.
    """
    def __init__(self):
        self.name = "Asset Performance Monitoring Agent"

    def analyze_asset(self, db: Session, asset_code: str) -> Dict[str, Any]:
        asset = db.query(RenewableAsset).filter(RenewableAsset.asset_code == asset_code).first()
        if not asset:
            return {"status": "error", "message": f"Asset {asset_code} not found"}

        latest_reading = db.query(SensorReading).filter(
            SensorReading.asset_id == asset.id
        ).order_by(SensorReading.timestamp.desc()).first()

        if not latest_reading:
            return {"status": "error", "message": f"No telemetry for asset {asset_code}"}

        expected = latest_reading.expected_power_kw
        actual = latest_reading.power_output_kw
        deficit_kw = round(expected - actual, 1)
        pr = latest_reading.performance_ratio

        # Determine anomaly & nominal metrics
        nom_temp = 60.0 if asset.asset_type == "wind_turbine" else 55.0
        nom_vib = 1.8 if asset.asset_type == "wind_turbine" else 0.05
        eval_result = anomaly_detector.evaluate_sensor_reading(
            actual_power_kw=actual,
            expected_power_kw=expected,
            component_temp_c=latest_reading.component_temp_c,
            nominal_temp_c=nom_temp,
            vibration_mms=latest_reading.vibration_mms,
            nominal_vib_mms=nom_vib,
            performance_ratio=pr
        )

        return {
            "agent": self.name,
            "asset_code": asset.asset_code,
            "asset_type": asset.asset_type,
            "status": asset.status,
            "health_score": asset.health_score,
            "power_actual_kw": actual,
            "power_expected_kw": expected,
            "power_deficit_kw": deficit_kw,
            "performance_ratio": pr,
            "performance_status": "Degraded" if deficit_kw > 150.0 or pr < 0.88 else "Nominal",
            "anomaly_score": eval_result["anomaly_score"],
            "detected_anomalies": eval_result["anomalies"],
            "vibration_mms": latest_reading.vibration_mms,
            "component_temp_c": latest_reading.component_temp_c,
            "ambient_temp_c": latest_reading.ambient_temp_c
        }

    def get_underperforming_assets(self, db: Session) -> List[Dict[str, Any]]:
        assets = db.query(RenewableAsset).filter(RenewableAsset.status.in_(["warning", "critical"])).all()
        results = []
        for a in assets:
            res = self.analyze_asset(db, a.asset_code)
            if res.get("status") != "error":
                results.append(res)
        return results

performance_agent = AssetPerformanceAgent()
