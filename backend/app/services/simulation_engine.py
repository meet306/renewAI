from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.database.models import (
    RenewableAsset, SensorReading, Alert, AssetPrediction,
    SimulationEvent, EnergyGeneration, GridDemand, BatteryStatus, WeatherData
)
from backend.app.ml.failure_predictor import failure_predictor

class SimulationEngine:
    """
    Real-time interactive scenario simulator for injecting abnormal operating conditions,
    sensor degradation, weather events, and grid demand spikes.
    """
    SCENARIOS = [
        {
            "code": "WT_BEARING_DEGRADATION",
            "name": "WT-021 Bearing Degradation (Demo Step 3)",
            "description": "Simulates elevated vibration (5.4 mm/s) and bearing overheating (78.6°C) in Kutch Wind Turbine WT-021.",
            "target": "WT-021",
            "category": "Wind Mechanical"
        },
        {
            "code": "SOLAR_INVERTER_FAULT",
            "name": "INV-042 IGBT Module Thermal Fault",
            "description": "Simulates inverter core temperature surge to 88°C and 18% efficiency drop in Banaskantha Solar Park.",
            "target": "INV-042",
            "category": "Solar Electrical"
        },
        {
            "code": "CLOUD_COVER_DROP",
            "name": "Sudden Monsoon Cloud Cover Dip",
            "description": "Cloud cover spikes to 85%, dropping solar irradiance from 885 W/m² to 220 W/m².",
            "target": "Kutch & Banaskantha Solar",
            "category": "Meteorological"
        },
        {
            "code": "HIGH_WIND_SURGE",
            "name": "Coastal High Wind Generation Surge",
            "description": "Coastal gale increases wind speed to 14.5 m/s, pushing wind generation to 115 MW.",
            "target": "Kutch Coastal Array",
            "category": "Renewable Surge"
        },
        {
            "code": "GRID_DEMAND_SPIKE",
            "name": "Industrial Peak Demand Spike",
            "description": "Regional grid demand surges from 110 MW to 160 MW, requiring maximum BESS discharge.",
            "target": "Gujarat SLDC Grid",
            "category": "Grid Balance"
        },
        {
            "code": "BASELINE_NORMAL",
            "name": "Reset to Normal Operations",
            "description": "Restores nominal 92-98% efficiency, nominal temperatures, and clears critical alarms.",
            "target": "Fleet-wide",
            "category": "Baseline"
        }
    ]

    def get_scenarios(self) -> List[Dict[str, Any]]:
        return self.SCENARIOS

    def trigger_scenario(self, db: Session, scenario_code: str) -> Dict[str, Any]:
        now = datetime.utcnow()

        if scenario_code == "WT_BEARING_DEGRADATION":
            wt_021 = db.query(RenewableAsset).filter(RenewableAsset.asset_code == "WT-021").first()
            if not wt_021:
                return {"status": "error", "message": "WT-021 not found"}

            wt_021.status = "critical"
            wt_021.health_score = 42.0
            wt_021.last_updated = now

            # Inject abnormal reading
            # Expected 2.8 MW, actual 2.1 MW (-25% deficit)
            mutated_reading = SensorReading(
                asset_id=wt_021.id,
                timestamp=now,
                power_output_kw=2100.0,
                expected_power_kw=2800.0,
                voltage_v=682.0,
                current_a=1820.0,
                ambient_temp_c=33.5,
                component_temp_c=78.6, # +18.6°C elevated bearing temp
                vibration_mms=5.40,    # +200% elevated vibration
                rpm=12.2,
                irradiance_wm2=885.0,
                wind_speed_ms=8.4,
                wind_direction_deg=245.0,
                performance_ratio=0.75,
                anomaly_score=0.91
            )
            db.add(mutated_reading)

            # Generate ML Prediction (87% Critical Failure Risk)
            ml_pred = failure_predictor.predict_wind_turbine(
                vibration_mms=5.40,
                bearing_temp_c=78.6,
                rpm=12.2,
                power_actual_kw=2100.0,
                power_expected_kw=2800.0,
                ambient_temp_c=33.5
            )

            prediction_record = AssetPrediction(
                asset_id=wt_021.id,
                timestamp=now,
                failure_probability_pct=87.0,
                risk_level="Critical",
                predicted_rul_days=4,
                contributing_factors=ml_pred["contributing_factors"],
                recommendation_text="CRITICAL: Severe bearing degradation detected. Dispatch mechanical inspection team within 48h."
            )
            db.add(prediction_record)

            # Generate Critical Alert
            crit_alert = Alert(
                asset_id=wt_021.id,
                park_id=wt_021.park_id,
                timestamp=now,
                severity="CRITICAL",
                title="WT-021 Main Drive Bearing Failure Risk (87%)",
                message="Vibration surged to 5.4 mm/s RMS (+200%) and bearing temperature reached 78.6°C. Power curtailed by 25%.",
                evidence={"vibration_mms": 5.40, "bearing_temp_c": 78.6, "power_deficit_kw": 700.0, "failure_prob_pct": 87.0},
                root_cause="Inner/outer bearing raceway fatigue spalling causing severe friction and thermal runaway.",
                suggested_action="Dispatch maintenance crew within 48 hours for ultrasound inspection and bearing assembly replacement.",
                is_acknowledged=False
            )
            db.add(crit_alert)

            # Record event
            event = SimulationEvent(
                scenario_code=scenario_code,
                scenario_name="WT-021 Bearing Degradation",
                target_asset_code="WT-021",
                parameters={"vibration_mms": 5.4, "temp_c": 78.6, "deficit_kw": 700.0},
                status="active"
            )
            db.add(event)
            db.commit()

            return {
                "status": "success",
                "scenario": "WT-021 Bearing Degradation",
                "target_asset": "WT-021",
                "injected_metrics": {
                    "vibration_mms": 5.40,
                    "bearing_temp_c": 78.6,
                    "power_output_kw": 2100.0,
                    "power_deficit_kw": 700.0,
                    "failure_probability_pct": 87.0,
                    "risk_level": "Critical"
                },
                "alert_created": "WT-021 Main Drive Bearing Failure Risk (87%)"
            }

        elif scenario_code == "SOLAR_INVERTER_FAULT":
            inv_042 = db.query(RenewableAsset).filter(RenewableAsset.asset_code == "INV-042").first()
            if inv_042:
                inv_042.status = "critical"
                inv_042.health_score = 54.0
                inv_042.last_updated = now

                reading = SensorReading(
                    asset_id=inv_042.id,
                    timestamp=now,
                    power_output_kw=2450.0,
                    expected_power_kw=3050.0,
                    voltage_v=740.0,
                    current_a=3310.0,
                    ambient_temp_c=36.0,
                    component_temp_c=88.5,
                    vibration_mms=0.08,
                    rpm=0.0,
                    irradiance_wm2=885.0,
                    wind_speed_ms=6.0,
                    wind_direction_deg=240.0,
                    performance_ratio=0.803,
                    anomaly_score=0.88
                )
                db.add(reading)

                alert = Alert(
                    asset_id=inv_042.id,
                    park_id=inv_042.park_id,
                    timestamp=now,
                    severity="CRITICAL",
                    title="INV-042 IGBT Bridge Overtemperature (88.5°C)",
                    message="Inverter core temperature critical. Power output derated by 600 kW to prevent thermal breakdown.",
                    evidence={"temperature_c": 88.5, "efficiency_drop": "-18.2%", "power_deficit_kw": 600.0},
                    root_cause="Cooling fan failure or complete clogging of airflow filter pads.",
                    suggested_action="Immediate field dispatch to clear filter blockages and replace cooling blower assembly.",
                    is_acknowledged=False
                )
                db.add(alert)
                db.commit()

            return {"status": "success", "scenario": "INV-042 Thermal Fault", "target_asset": "INV-042"}

        elif scenario_code == "BASELINE_NORMAL":
            # Reset assets back to healthy
            assets = db.query(RenewableAsset).all()
            for a in assets:
                a.status = "healthy"
                a.health_score = 96.5
                a.last_updated = now

            # Reset WT-021 reading
            wt_021 = db.query(RenewableAsset).filter(RenewableAsset.asset_code == "WT-021").first()
            if wt_021:
                norm_reading = SensorReading(
                    asset_id=wt_021.id,
                    timestamp=now,
                    power_output_kw=2680.0,
                    expected_power_kw=2800.0,
                    voltage_v=690.0,
                    current_a=2320.0,
                    ambient_temp_c=31.0,
                    component_temp_c=61.2,
                    vibration_mms=1.82,
                    rpm=14.5,
                    irradiance_wm2=885.0,
                    wind_speed_ms=8.4,
                    wind_direction_deg=245.0,
                    performance_ratio=0.957,
                    anomaly_score=0.04
                )
                db.add(norm_reading)

                norm_pred = AssetPrediction(
                    asset_id=wt_021.id,
                    timestamp=now,
                    failure_probability_pct=12.0,
                    risk_level="Low",
                    predicted_rul_days=60,
                    contributing_factors={"vibration_mms": 1.82, "bearing_temp_c": 61.2},
                    recommendation_text="Asset operating normally within standard tolerance bounds."
                )
                db.add(norm_pred)

            # Auto acknowledge critical alerts
            alerts = db.query(Alert).filter(Alert.is_acknowledged == False).all()
            for al in alerts:
                al.is_acknowledged = True
                al.acknowledged_at = now

            db.commit()
            return {"status": "success", "scenario": "Baseline Restored", "target_asset": "Fleet-wide"}

        return {"status": "success", "scenario": scenario_code}

simulation_engine = SimulationEngine()
