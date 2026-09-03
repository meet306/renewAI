import math
import random
from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models import RenewableAsset, SensorReading

router = APIRouter(prefix="/digital-twin", tags=["Digital Twin & Physics Telemetry"])

@router.get("/turbine/{asset_code}")
def get_turbine_digital_twin(asset_code: str, db: Session = Depends(get_db)):
    """
    Returns comprehensive physics-informed digital twin model for a wind turbine.
    Includes drive-train sub-assemblies, oil chemistry, and live FFT vibration spectrum.
    """
    asset = db.query(RenewableAsset).filter(RenewableAsset.asset_code == asset_code.upper()).first()
    if not asset:
        # Fallback to WT-021 if not found
        asset = db.query(RenewableAsset).filter(RenewableAsset.asset_code == "WT-021").first()
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")

    latest_reading = db.query(SensorReading).filter(SensorReading.asset_id == asset.id).order_by(SensorReading.timestamp.desc()).first()

    is_anomalous = (asset.asset_code == "WT-021" or asset.health_score < 80.0)

    # Physical parameters
    rpm = latest_reading.rpm if latest_reading else 14.5
    wind_speed = latest_reading.wind_speed_ms if latest_reading else 8.4
    bearing_temp = latest_reading.component_temp_c if latest_reading else (78.6 if is_anomalous else 60.5)
    vibration_rms = latest_reading.vibration_mms if latest_reading else (5.40 if is_anomalous else 1.82)
    power_kw = latest_reading.power_output_kw if latest_reading else (2100.0 if is_anomalous else 2800.0)

    # Fast Fourier Transform (FFT) Vibration Harmonics Spectrum Simulation
    # Frequencies: 0 to 200 Hz
    # Fault frequencies: BPFO = 84.2 Hz, BPFI = 126.8 Hz
    fft_spectrum = []
    for freq in range(1, 201):
        f = float(freq)
        # Background acoustic noise
        amp = 0.15 + 0.08 * math.sin(f * 0.2) + random.uniform(0.01, 0.06)

        # 1X Rotor frequency peak (~0.24 Hz to 15 Hz)
        if 13 <= freq <= 16:
            amp += 0.85
        # 1X Generator frequency peak (~25 Hz)
        elif 24 <= freq <= 26:
            amp += 1.20
        # 2X Generator frequency peak (~50 Hz)
        elif 49 <= freq <= 51:
            amp += 0.65
        # BPFO (Ball Pass Frequency Outer Race) - 84.2 Hz
        elif 83 <= freq <= 86:
            if is_anomalous:
                # Severe outer race defect spike
                amp += 3.85 * (vibration_rms / 5.40)
            else:
                amp += 0.35
        # BPFI (Ball Pass Frequency Inner Race) - 126.8 Hz
        elif 125 <= freq <= 128:
            if is_anomalous:
                # Modulated inner race harmonic
                amp += 2.45 * (vibration_rms / 5.40)
            else:
                amp += 0.25
        # 2X BPFO harmonic (168 Hz)
        elif 167 <= freq <= 170:
            if is_anomalous:
                amp += 1.65
            else:
                amp += 0.15

        fft_spectrum.append({
            "frequency_hz": freq,
            "amplitude_mms": round(amp, 3),
            "is_fault_peak": bool(is_anomalous and (83 <= freq <= 86 or 125 <= freq <= 128 or 167 <= freq <= 170)),
            "fault_label": "BPFO Peak (84.2 Hz)" if (83 <= freq <= 86 and is_anomalous) else (
                "BPFI Peak (126.8 Hz)" if (125 <= freq <= 128 and is_anomalous) else None
            )
        })

    # Detailed Drive-Train Assemblies
    drivetrain_components = [
        {
            "id": "rotor_assembly",
            "name": "Rotor Hub & Pitch System",
            "status": "Healthy",
            "health_pct": 96.5,
            "metrics": {
                "Rotor Speed": f"{rpm} RPM",
                "Blade Pitch Angle": "4.2°",
                "Tip Speed Ratio (TSR)": "7.8",
                "Aerodynamic Thrust": "184 kN"
            },
            "physics_state": "Optimal lift-to-drag aerodynamic equilibrium."
        },
        {
            "id": "main_bearing",
            "name": "Main Drive Spherical Roller Bearing",
            "status": "Critical" if is_anomalous else "Healthy",
            "health_pct": 32.0 if is_anomalous else 97.0,
            "metrics": {
                "Bearing Temperature": f"{bearing_temp} °C",
                "Vibration Velocity RMS": f"{vibration_rms} mm/s",
                "Raceway Contact Stress": "1840 MPa" if is_anomalous else "1150 MPa",
                "Part Number": "SKF-240/600-CA (OEM)"
            },
            "physics_state": "Severe outer raceway spalling and thermal friction buildup." if is_anomalous else "Normal hydrodynamic lubrication boundary."
        },
        {
            "id": "planetary_gearbox",
            "name": "3-Stage Planetary-Helical Gearbox",
            "status": "Warning" if is_anomalous else "Healthy",
            "health_pct": 74.0 if is_anomalous else 98.0,
            "metrics": {
                "Gear Ratio": "1:105.4",
                "Gear Mesh Frequency": "485 Hz",
                "Mechanical Efficiency": "95.8%" if is_anomalous else "97.8%",
                "Oil Sump Temperature": "68.2 °C" if is_anomalous else "54.0 °C"
            },
            "physics_state": "Elevated mechanical drag transferred from main bearing resistance." if is_anomalous else "Smooth gear meshing."
        },
        {
            "id": "generator",
            "name": "Permanent Magnet Synchronous Generator (PMSG)",
            "status": "Healthy",
            "health_pct": 94.0,
            "metrics": {
                "Electrical Power": f"{power_kw} kW",
                "Stator Temperature": "76.4 °C",
                "Grid Power Factor": "0.99 (Leading)",
                "Efficiency": "96.4%"
            },
            "physics_state": "Magnetic flux density stable; operating under slight curtailment."
        }
    ]

    # Gearbox Oil Chemistry
    oil_chemistry = {
        "lubricant_type": "Mobil SHC Gear 320 Synthetic (ISO VG 320)",
        "oil_viscosity_cst": 298.5 if is_anomalous else 320.0, # degraded viscosity under heat
        "viscosity_status": "Degraded (Thermal Shear)" if is_anomalous else "Nominal",
        "moisture_ppm": 68.0 if is_anomalous else 28.0,
        "particle_count_iso4406": "21/18/14 (High Wear)" if is_anomalous else "16/13/10 (Clean)",
        "dielectric_constant": 2.94 if is_anomalous else 2.65,
        "ferrous_debris_ppm": 48.2 if is_anomalous else 6.1,
        "remaining_oil_life_pct": 42.0 if is_anomalous else 91.0
    }

    return {
        "asset_code": asset.asset_code,
        "asset_type": "wind_turbine",
        "model": "Suzlon S120 / 2.8 MW Hybrid Hub",
        "location": "Kutch Wind Array, Gujarat (23.824° N, 69.845° E)",
        "timestamp": datetime.utcnow().isoformat(),
        "overall_health_score": asset.health_score,
        "status": asset.status,
        "is_anomalous": is_anomalous,
        "drive_train": drivetrain_components,
        "fft_spectrum": fft_spectrum,
        "oil_chemistry": oil_chemistry,
        "primary_defect": {
            "component": "Main Drive Spherical Roller Bearing",
            "defect_type": "Outer Raceway Micro-Spalling & Fatigue Wear",
            "characteristic_frequency": "84.2 Hz (BPFO)",
            "thermal_differential": f"+{round(bearing_temp - 60.0, 1)} °C above baseline",
            "urgency": "Immediate Field Dispatch (48h SLA)" if is_anomalous else "Routine Monitoring"
        }
    }

@router.get("/inverter/{asset_code}")
def get_inverter_digital_twin(asset_code: str, db: Session = Depends(get_db)):
    """
    Returns physics-informed digital twin for a solar inverter & MPPT string arrays.
    """
    asset = db.query(RenewableAsset).filter(RenewableAsset.asset_code == asset_code.upper()).first()
    if not asset:
        asset = db.query(RenewableAsset).filter(RenewableAsset.asset_code == "INV-042").first()
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")

    is_derated = (asset.asset_code == "INV-042" or asset.health_score < 85.0)

    bridge_temp = 74.5 if is_derated else 58.2
    efficiency_pct = 88.4 if is_derated else 98.2

    # 8-Channel MPPT String Monitoring
    mppt_strings = []
    for i in range(1, 9):
        v = 695.0 + random.uniform(-10, 10)
        i_curr = (7.8 if is_derated and i in [3, 4] else 9.4) + random.uniform(-0.2, 0.2)
        kw = round((v * i_curr) / 1000.0, 2)
        mppt_strings.append({
            "string_id": f"String-{i:02d}",
            "voltage_v": round(v, 1),
            "current_a": round(i_curr, 2),
            "power_kw": kw,
            "status": "Degraded (Soiling/Hotspot)" if (is_derated and i in [3, 4]) else "Optimal",
            "mppt_efficiency_pct": 89.2 if (is_derated and i in [3, 4]) else 99.1
        })

    # I-V Curve simulation points
    iv_curve = []
    v_oc = 780.0
    i_sc = 10.2
    for step in range(0, 101, 5):
        v = (step / 100.0) * v_oc
        # Exponential diode curve
        i_val = i_sc * (1.0 - math.exp((v - v_oc) / 45.0))
        i_val = max(0.0, min(i_sc, i_val))
        p_val = (v * i_val) / 1000.0
        iv_curve.append({
            "voltage_v": round(v, 1),
            "current_a": round(i_val, 2),
            "power_kw": round(p_val, 2)
        })

    return {
        "asset_code": asset.asset_code,
        "asset_type": "solar_inverter",
        "model": "Sungrow SG3125HV Central Inverter (3.125 MVA)",
        "location": "Banaskantha Ultra Solar Park, Gujarat",
        "timestamp": datetime.utcnow().isoformat(),
        "bridge_temperature_c": bridge_temp,
        "ambient_temperature_c": 38.5,
        "efficiency_pct": efficiency_pct,
        "derating_status": "Active Thermal Derating (7.2% Efficiency Loss)" if is_derated else "Nominal",
        "cooling_fan_rpm": 3400 if is_derated else 2400,
        "filter_soiling_index_pct": 78.0 if is_derated else 15.0,
        "mppt_strings": mppt_strings,
        "iv_curve": iv_curve,
        "igbt_junctions": [
            {"phase": "U-Phase Bridge", "temp_c": round(bridge_temp - 0.8, 1), "status": "Warning" if is_derated else "Normal"},
            {"phase": "V-Phase Bridge", "temp_c": round(bridge_temp + 1.2, 1), "status": "Critical" if is_derated else "Normal"},
            {"phase": "W-Phase Bridge", "temp_c": round(bridge_temp - 0.4, 1), "status": "Warning" if is_derated else "Normal"}
        ]
    }
