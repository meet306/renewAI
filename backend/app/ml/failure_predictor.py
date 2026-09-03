import numpy as np
from typing import Dict, Any, Tuple
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

class FailurePredictor:
    """
    Physics-informed Machine Learning model for predicting equipment failures,
    bearing degradation in wind turbines, and IGBT module faults in solar inverters.
    """
    def __init__(self):
        self._is_trained = False
        self.wind_rf_model = RandomForestClassifier(n_estimators=50, random_state=42)
        self.solar_gb_model = GradientBoostingClassifier(n_estimators=40, random_state=42)
        self._train_baseline_models()

    def _train_baseline_models(self):
        """Trains models on physics-informed synthetic degradation datasets."""
        # 1. Wind Turbine Synthetic Training Data
        # Features: [vibration_mms, bearing_temp_c, rpm, power_deficit_ratio, ambient_temp_c]
        np.random.seed(42)
        n_samples = 1500

        # Normal samples (Class 0: Healthy)
        vib_norm = np.random.normal(1.8, 0.3, n_samples // 2)
        temp_norm = np.random.normal(58.0, 4.0, n_samples // 2)
        rpm_norm = np.random.normal(14.5, 1.2, n_samples // 2)
        deficit_norm = np.random.normal(0.04, 0.02, n_samples // 2)
        amb_norm = np.random.normal(30.0, 4.0, n_samples // 2)
        X_norm = np.column_stack([vib_norm, temp_norm, rpm_norm, deficit_norm, amb_norm])
        y_norm = np.zeros(n_samples // 2)

        # Degradation & Failure samples (Class 1: Degrading/Critical)
        vib_deg = np.random.uniform(3.5, 7.2, n_samples // 2)
        temp_deg = np.random.uniform(70.0, 92.0, n_samples // 2)
        rpm_deg = np.random.uniform(10.0, 16.0, n_samples // 2)
        deficit_deg = np.random.uniform(0.15, 0.45, n_samples // 2)
        amb_deg = np.random.normal(32.0, 4.0, n_samples // 2)
        X_deg = np.column_stack([vib_deg, temp_deg, rpm_deg, deficit_deg, amb_deg])
        y_deg = np.ones(n_samples // 2)

        X_wind = np.vstack([X_norm, X_deg])
        y_wind = np.concatenate([y_norm, y_deg])
        self.wind_rf_model.fit(X_wind, y_wind)

        # 2. Solar Inverter Synthetic Training Data
        # Features: [igbt_temp_c, efficiency_drop, irradiance_wm2, ambient_temp_c, voltage_deviation]
        temp_inv_norm = np.random.normal(55.0, 5.0, n_samples // 2)
        eff_drop_norm = np.random.normal(0.02, 0.01, n_samples // 2)
        irr_norm = np.random.uniform(300, 1000, n_samples // 2)
        amb_inv_norm = np.random.normal(32.0, 4.0, n_samples // 2)
        v_dev_norm = np.random.normal(0.01, 0.01, n_samples // 2)
        X_sol_norm = np.column_stack([temp_inv_norm, eff_drop_norm, irr_norm, amb_inv_norm, v_dev_norm])
        y_sol_norm = np.zeros(n_samples // 2)

        temp_inv_deg = np.random.uniform(75.0, 95.0, n_samples // 2)
        eff_drop_deg = np.random.uniform(0.08, 0.28, n_samples // 2)
        irr_deg = np.random.uniform(300, 1000, n_samples // 2)
        amb_inv_deg = np.random.normal(36.0, 5.0, n_samples // 2)
        v_dev_deg = np.random.uniform(0.05, 0.18, n_samples // 2)
        X_sol_deg = np.column_stack([temp_inv_deg, eff_drop_deg, irr_deg, amb_inv_deg, v_dev_deg])
        y_sol_deg = np.ones(n_samples // 2)

        X_solar = np.vstack([X_sol_norm, X_sol_deg])
        y_solar = np.concatenate([y_sol_norm, y_sol_deg])
        self.solar_gb_model.fit(X_solar, y_solar)

        self._is_trained = True

    def predict_wind_turbine(
        self,
        vibration_mms: float,
        bearing_temp_c: float,
        rpm: float,
        power_actual_kw: float,
        power_expected_kw: float,
        ambient_temp_c: float = 32.0
    ) -> Dict[str, Any]:
        """Calculates failure probability, RUL, and risk factors for a wind turbine."""
        power_expected_kw = max(1.0, power_expected_kw)
        deficit_ratio = max(0.0, (power_expected_kw - power_actual_kw) / power_expected_kw)

        features = np.array([[vibration_mms, bearing_temp_c, rpm, deficit_ratio, ambient_temp_c]])
        probs = self.wind_rf_model.predict_proba(features)[0]
        failure_prob_pct = float(round(probs[1] * 100.0, 1))

        # Explicit physics-informed risk adjustments
        if vibration_mms > 4.5 or bearing_temp_c > 76.0:
            failure_prob_pct = max(failure_prob_pct, 85.0)

        # Risk Classification
        if failure_prob_pct >= 75.0:
            risk_level = "Critical"
            rul_days = int(max(1, round(5 - (failure_prob_pct - 75.0) * 0.15)))
        elif failure_prob_pct >= 50.0:
            risk_level = "High"
            rul_days = int(max(5, round(15 - (failure_prob_pct - 50.0) * 0.4)))
        elif failure_prob_pct >= 25.0:
            risk_level = "Medium"
            rul_days = int(max(15, round(45 - (failure_prob_pct - 25.0) * 1.2)))
        else:
            risk_level = "Low"
            rul_days = int(max(45, round(90 - failure_prob_pct * 1.5)))

        # Feature Contributions
        contributing_factors = {
            "vibration_mms": round(vibration_mms, 2),
            "bearing_temp_c": round(bearing_temp_c, 1),
            "vibration_delta_pct": f"{'+' if vibration_mms > 1.8 else ''}{round(((vibration_mms - 1.8) / 1.8) * 100, 1)}%",
            "temperature_delta_c": f"{'+' if bearing_temp_c > 60.0 else ''}{round(bearing_temp_c - 60.0, 1)}°C",
            "power_deficit_pct": f"{round(deficit_ratio * 100, 1)}%"
        }

        # Recommendation Generation
        if risk_level == "Critical":
            rec = "CRITICAL: Urgent inspection required within 24-48 hours. Isolate gearbox/bearing assembly to prevent catastrophic mechanical seizure."
        elif risk_level == "High":
            rec = "HIGH RISK: Schedule preventive maintenance within 5 days. Check bearing lubrication, acoustic noise spectra, and balance."
        elif risk_level == "Medium":
            rec = "MEDIUM RISK: Elevated thermal/vibration signature detected. Monitor closely and review next planned maintenance window."
        else:
            rec = "NOMINAL: Asset running smoothly within design parameters. Maintain routine supervisory control."

        return {
            "failure_probability_pct": failure_prob_pct,
            "risk_level": risk_level,
            "predicted_rul_days": rul_days,
            "contributing_factors": contributing_factors,
            "recommendation_text": rec
        }

    def predict_solar_inverter(
        self,
        component_temp_c: float,
        efficiency_ratio: float,
        irradiance_wm2: float,
        ambient_temp_c: float = 34.0,
        voltage_deviation: float = 0.02
    ) -> Dict[str, Any]:
        """Calculates failure probability, RUL, and risk factors for a solar inverter."""
        eff_drop = max(0.0, 0.985 - efficiency_ratio)
        features = np.array([[component_temp_c, eff_drop, irradiance_wm2, ambient_temp_c, voltage_deviation]])
        probs = self.solar_gb_model.predict_proba(features)[0]
        failure_prob_pct = float(round(probs[1] * 100.0, 1))

        if component_temp_c > 82.0 or eff_drop > 0.12:
            failure_prob_pct = max(failure_prob_pct, 72.0)

        if failure_prob_pct >= 70.0:
            risk_level = "Critical"
            rul_days = int(max(2, round(7 - (failure_prob_pct - 70.0) * 0.15)))
        elif failure_prob_pct >= 40.0:
            risk_level = "High"
            rul_days = int(max(7, round(20 - (failure_prob_pct - 40.0) * 0.4)))
        elif failure_prob_pct >= 20.0:
            risk_level = "Medium"
            rul_days = int(max(20, round(60 - (failure_prob_pct - 20.0) * 1.5)))
        else:
            risk_level = "Low"
            rul_days = int(max(60, round(120 - failure_prob_pct * 2.0)))

        contributing_factors = {
            "component_temp_c": round(component_temp_c, 1),
            "efficiency_loss_pct": f"-{round(eff_drop * 100, 1)}%",
            "irradiance_wm2": round(irradiance_wm2, 1),
            "temp_delta_c": f"+{round(component_temp_c - 55.0, 1)}°C" if component_temp_c > 55.0 else "0°C"
        }

        if risk_level == "Critical":
            rec = "CRITICAL: Severe IGBT module overheating. Check blower fans, heat sink fins, and clean intake filters immediately."
        elif risk_level == "High":
            rec = "HIGH RISK: Inverter thermal derating in progress. Dispatch field technician to inspect cooling system within 48 hours."
        elif risk_level == "Medium":
            rec = "MEDIUM RISK: Slight conversion efficiency degradation. Inspect MPPT tracking and check for soiling or filter dust."
        else:
            rec = "NOMINAL: Inverter operating at peak conversion efficiency (>97.5%)."

        return {
            "failure_probability_pct": failure_prob_pct,
            "risk_level": risk_level,
            "predicted_rul_days": rul_days,
            "contributing_factors": contributing_factors,
            "recommendation_text": rec
        }

failure_predictor = FailurePredictor()
