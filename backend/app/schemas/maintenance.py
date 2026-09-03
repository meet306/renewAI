from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class MaintenanceRiskItem(BaseModel):
    asset_id: str
    asset_code: str
    asset_type: str
    region: str
    park_name: str
    risk_level: str  # Critical, High, Medium, Low
    failure_probability_pct: float
    predicted_rul_days: int
    primary_sensor_anomaly: str
    top_contributing_factors: Dict[str, Any]
    recommendation: str
    granite_explanation: Optional[str] = None
    last_maintenance_date: Optional[datetime] = None

class MaintenanceRecordSchema(BaseModel):
    id: str
    asset_id: str
    asset_code: Optional[str] = None
    scheduled_date: datetime
    completed_date: Optional[datetime] = None
    maintenance_type: str
    failure_type: str
    description: str
    priority: str
    status: str
    estimated_cost_inr: float
    technician_notes: Optional[str] = None

    class Config:
        from_attributes = True

class MaintenanceScheduleRequest(BaseModel):
    asset_id: str
    maintenance_type: str
    failure_type: str
    description: str
    priority: str
    scheduled_date: datetime
    estimated_cost_inr: Optional[float] = 50000.0

class AnomalySchema(BaseModel):
    id: str
    asset_id: str
    asset_code: Optional[str] = None
    timestamp: datetime
    anomaly_type: str
    severity: str
    metric_name: str
    expected_value: float
    actual_value: float
    deviation_pct: float
    is_resolved: bool

    class Config:
        from_attributes = True

class AlertSchema(BaseModel):
    id: str
    asset_id: Optional[str] = None
    asset_code: Optional[str] = None
    park_id: Optional[str] = None
    park_name: Optional[str] = None
    timestamp: datetime
    severity: str
    title: str
    message: str
    evidence: Optional[Dict[str, Any]] = None
    root_cause: Optional[str] = None
    suggested_action: Optional[str] = None
    is_acknowledged: bool
    acknowledged_at: Optional[datetime] = None

    class Config:
        from_attributes = True
