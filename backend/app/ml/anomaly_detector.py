import numpy as np
from typing import Dict, Any, List
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    """
    Multi-variate anomaly detection engine for solar inverters, wind turbines,
    and substation sensors.
    """
    def __init__(self):
        self.iso_forest = IsolationForest(contamination=0.05, random_state=42)
        self._fit_baseline()

    def _fit_baseline(self):
        np.random.seed(42)
        # Normal feature space: [normalized_power_diff, temp_diff, vibration_rms, pr_deviation]
        normal_data = np.random.normal(0.0, 0.08, (500, 4))
        self.iso_forest.fit(normal_data)

    def evaluate_sensor_reading(
        self,
        actual_power_kw: float,
        expected_power_kw: float,
        component_temp_c: float,
        nominal_temp_c: float,
        vibration_mms: float,
        nominal_vib_mms: float,
        performance_ratio: float
    ) -> Dict[str, Any]:
        """Calculates multi-variate anomaly score (0.0 to 1.0) and identifies metric deviations."""
        expected_power_kw = max(1.0, expected_power_kw)
        p_diff = (expected_power_kw - actual_power_kw) / expected_power_kw
        t_diff = max(0.0, (component_temp_c - nominal_temp_c) / nominal_temp_c)
        v_diff = max(0.0, (vibration_mms - nominal_vib_mms) / nominal_vib_mms)
        pr_diff = max(0.0, 0.95 - performance_ratio)

        vector = np.array([[p_diff, t_diff, v_diff, pr_diff]])
        score_raw = self.iso_forest.score_samples(vector)[0]
        # Normalize score to 0.0 (normal) - 1.0 (highly anomalous)
        anomaly_score = float(np.clip(1.0 - (score_raw + 0.5) / 1.0, 0.01, 0.99))

        anomalies_detected = []
        if p_diff > 0.15:
            anomalies_detected.append({
                "metric": "Power Output Deficit",
                "severity": "critical" if p_diff > 0.25 else "warning",
                "expected": round(expected_power_kw, 1),
                "actual": round(actual_power_kw, 1),
                "deviation_pct": f"-{round(p_diff * 100, 1)}%"
            })
        if component_temp_c > (nominal_temp_c + 12.0):
            anomalies_detected.append({
                "metric": "Component Temperature",
                "severity": "critical" if component_temp_c > (nominal_temp_c + 20.0) else "warning",
                "expected": round(nominal_temp_c, 1),
                "actual": round(component_temp_c, 1),
                "deviation_pct": f"+{round(((component_temp_c - nominal_temp_c)/nominal_temp_c)*100, 1)}%"
            })
        if vibration_mms > (nominal_vib_mms + 1.5):
            anomalies_detected.append({
                "metric": "Vibration Velocity",
                "severity": "critical" if vibration_mms > 4.5 else "warning",
                "expected": round(nominal_vib_mms, 2),
                "actual": round(vibration_mms, 2),
                "deviation_pct": f"+{round(((vibration_mms - nominal_vib_mms)/nominal_vib_mms)*100, 1)}%"
            })

        return {
            "anomaly_score": round(anomaly_score, 3),
            "is_anomalous": anomaly_score > 0.35 or len(anomalies_detected) > 0,
            "anomalies": anomalies_detected
        }

anomaly_detector = AnomalyDetector()
