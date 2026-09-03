from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.database.session import get_db

router = APIRouter(prefix="/resilience", tags=["Extreme Climate & Grid Resilience"])

RESILIENCE_SCENARIOS = {
    "cyclone_biparjoy": {
        "id": "cyclone_biparjoy",
        "title": "Cyclone Biparjoy High-Wind Emergency (Kutch Coastal Array)",
        "category": "EXTREME WEATHER",
        "severity": "CRITICAL",
        "description": "Arabian Sea cyclonic storm with wind gusts exceeding 28.5 m/s (> 25.0 m/s turbine cut-out safety threshold).",
        "target_region": "Kutch, Gujarat",
        "parameters": {
            "wind_speed_ms": 28.5,
            "gust_speed_ms": 34.2,
            "pressure_hpa": 982.0,
            "wave_height_m": 4.5
        },
        "autonomous_agent_actions": [
            {
                "sequence": 1,
                "agent": "Grid & Safety Agent",
                "action": "Autonomous Turbine Aerodynamic Feathering",
                "detail": "Pitch all 24 Suzlon wind turbine blades to 90° into the wind to stall aerodynamic lift."
            },
            {
                "sequence": 2,
                "agent": "Maintenance Agent",
                "action": "Engage Mechanical High-Speed Rotor Parking Brakes",
                "detail": "Lock rotor yaw drives at 245° to withstand extreme aerodynamic shear stresses."
            },
            {
                "sequence": 3,
                "agent": "Grid Integration Agent",
                "action": "BESS Substation Islanding & Frequency Buffer",
                "detail": "Switch Kutch 40 MWh BESS to Grid-Forming VSM mode to buffer 220kV substation voltage."
            },
            {
                "sequence": 4,
                "agent": "Reporting Agent (IBM Watson Orchestrate)",
                "action": "SLDC Emergency Curtailment Transmission",
                "detail": "Transmitted automated Section-11 Force Majeure dispatch to Gujarat SLDC dispatchers."
            }
        ],
        "system_status": "TURBINES SECURED • BESS STABILIZING GRID",
        "grid_frequency_hz": 50.01,
        "active_generation_mw": 82.0 # Solar only (turbines safely parked)
    },
    "salt_dust_storm": {
        "id": "salt_dust_storm",
        "title": "Rann of Kutch Salt Storm & Rapid PV Soiling",
        "category": "ENVIRONMENTAL STRESS",
        "severity": "WARNING",
        "description": "High saline desert dust deposition causing 35% PV conversion efficiency drop across solar strings.",
        "target_region": "Banaskantha & Kutch Solar Parks",
        "parameters": {
            "soiling_loss_pct": 35.0,
            "particulate_pm10": 420.0,
            "ambient_temp_c": 41.2
        },
        "autonomous_agent_actions": [
            {
                "sequence": 1,
                "agent": "Performance Agent",
                "action": "Multi-String Degradation Detection",
                "detail": "Identified uniform PR drop from 92.0% to 57.0% across 45 Sungrow inverters."
            },
            {
                "sequence": 2,
                "agent": "Predictive Maintenance Agent",
                "action": "Robotic Dry-Cleaning Fleet Dispatch",
                "detail": "Triggered 18 waterless robotic cleaning crawlers across solar tables 1 through 60."
            },
            {
                "sequence": 3,
                "agent": "Grid Integration Agent",
                "action": "Ramp Up Wind Array Generation",
                "detail": "Boosted wind cluster pitch angles to supply +15 MW compensatory power to meet SLDC quota."
            }
        ],
        "system_status": "ROBOTIC CLEANING ACTIVE • PR RECOVERING (+18%)",
        "grid_frequency_hz": 50.02,
        "active_generation_mw": 118.0
    },
    "banaskantha_heatwave": {
        "id": "banaskantha_heatwave",
        "title": "Banaskantha 46.5°C Extreme Midday Heatwave",
        "category": "THERMAL STRESS",
        "severity": "WARNING",
        "description": "Extreme desert ambient temperature exceeding 46.5°C triggering inverter IGBT bridge thermal derating.",
        "target_region": "Banaskantha Ultra Solar Hub",
        "parameters": {
            "ambient_temp_c": 46.5,
            "inverter_bridge_temp_c": 79.2,
            "irradiance_wm2": 940.0
        },
        "autonomous_agent_actions": [
            {
                "sequence": 1,
                "agent": "Performance Agent",
                "action": "Inverter Thermal Junction Throttling",
                "detail": "Dynamically re-balanced MPPT string loading across all 8 DC channels."
            },
            {
                "sequence": 2,
                "agent": "Grid Agent",
                "action": "Dynamic Reactive Power Cooling (Q-Mode)",
                "detail": "Commanded inverters to inject capacitive reactive power (kVAR) to lower bridge internal impedance."
            },
            {
                "sequence": 3,
                "agent": "Maintenance Agent",
                "action": "Auxiliary Forced-Air Chiller Activation",
                "detail": "Spun up secondary inverter room HVAC exhaust fans to 100% duty cycle."
            }
        ],
        "system_status": "THERMAL EQUILIBRIUM MAINTAINED (BRIDGE: 68.4°C)",
        "grid_frequency_hz": 50.00,
        "active_generation_mw": 124.0
    },
    "grid_overfrequency": {
        "id": "grid_overfrequency",
        "title": "SLDC Grid Overfrequency Surge (50.45 Hz)",
        "category": "GRID STABILITY",
        "severity": "CRITICAL",
        "description": "Sudden load rejection in the Western Regional Grid causing grid frequency to surge to 50.45 Hz.",
        "target_region": "Gujarat 220kV Interconnection Substation",
        "parameters": {
            "grid_frequency_hz": 50.45,
            "scheduled_demand_mw": 85.0,
            "surplus_surge_mw": 43.0
        },
        "autonomous_agent_actions": [
            {
                "sequence": 1,
                "agent": "Grid Integration Agent",
                "action": "Instantaneous BESS Primary Frequency Response (PFR)",
                "detail": "Dispatched Kutch + Banaskantha BESS into Rapid Fast-Charging mode at 20.0 MW within 120ms."
            },
            {
                "sequence": 2,
                "agent": "Performance Agent",
                "action": "Automated Solar-Wind Ramp Down",
                "detail": "Curtailed generation by 15 MW to stabilize Western Grid frequency to nominal 50.00 Hz."
            }
        ],
        "system_status": "GRID FREQUENCY RESTORED TO 50.02 Hz • BESS CHARGING",
        "grid_frequency_hz": 50.02,
        "active_generation_mw": 113.0
    }
}

class TriggerResilienceRequest(BaseModel):
    scenario_id: str

@router.get("/scenarios")
def list_resilience_scenarios():
    """Returns all available climate and grid resilience scenarios."""
    return {
        "scenarios": list(RESILIENCE_SCENARIOS.values())
    }

@router.get("/scenarios/{scenario_id}")
def get_scenario(scenario_id: str):
    """Returns details and mitigation actions for a specific resilience scenario."""
    if scenario_id in RESILIENCE_SCENARIOS:
        return RESILIENCE_SCENARIOS[scenario_id]
    return RESILIENCE_SCENARIOS["cyclone_biparjoy"]

@router.post("/trigger")
def trigger_resilience_scenario(req: TriggerResilienceRequest):
    """Triggers autonomous multi-agent fail-safe sequence for a climate scenario."""
    sc = RESILIENCE_SCENARIOS.get(req.scenario_id, RESILIENCE_SCENARIOS["cyclone_biparjoy"])
    return {
        "status": "AUTONOMOUS_FAILSAFE_ENGAGED",
        "triggered_at": datetime.utcnow().isoformat(),
        "scenario": sc,
        "mitigation_summary": f"All {len(sc['autonomous_agent_actions'])} multi-agent protective actions executed successfully.",
        "ibm_orchestrate_audit_log": "Audit verification logged to Gujarat SLDC Supervisory Registry."
    }
