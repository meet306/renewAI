from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class GridStatusSchema(BaseModel):
    timestamp: datetime
    region: str
    grid_demand_mw: float
    renewable_supply_mw: float
    grid_frequency_hz: float
    grid_import_export_mw: float
    grid_constraint_status: str
    battery_total_capacity_mwh: float
    battery_current_soc_pct: float
    battery_charge_discharge_rate_mw: float
    battery_mode: str
    forecasted_next_3h_generation_mw: float
    curtailment_risk_pct: float

class GridOptimizationRecommendation(BaseModel):
    timestamp: datetime
    action_title: str
    grid_supply_mw: float
    battery_action_mw: float  # Positive = charge, Negative = discharge
    grid_import_export_mw: float
    curtailment_mw: float
    strategy: str  # Peak Shaving, Frequency Support, Excess Storage, Loss Minimization
    granite_reasoning: str
    risk_factor: str
    co2_saved_tons_today: float
    estimated_revenue_inr: float
