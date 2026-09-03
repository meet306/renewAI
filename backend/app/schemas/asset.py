from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class WindTurbineSpec(BaseModel):
    rotor_diameter_m: float
    hub_height_m: float
    rated_wind_speed_ms: float
    cut_in_speed_ms: float
    cut_out_speed_ms: float
    gearbox_type: str

    class Config:
        from_attributes = True

class SolarAssetSpec(BaseModel):
    panel_technology: str
    tilt_angle_deg: float
    azimuth_deg: float
    inverter_rating_kva: float
    tracker_type: str

    class Config:
        from_attributes = True

class SensorReadingSchema(BaseModel):
    id: str
    asset_id: str
    timestamp: datetime
    power_output_kw: float
    expected_power_kw: float
    voltage_v: float
    current_a: float
    ambient_temp_c: float
    component_temp_c: float
    vibration_mms: float
    rpm: float
    irradiance_wm2: float
    wind_speed_ms: float
    wind_direction_deg: float
    performance_ratio: float
    anomaly_score: float

    class Config:
        from_attributes = True

class AssetPredictionSchema(BaseModel):
    id: str
    asset_id: str
    timestamp: datetime
    failure_probability_pct: float
    risk_level: str
    predicted_rul_days: int
    contributing_factors: Dict[str, Any]
    recommendation_text: str

    class Config:
        from_attributes = True

class RenewableAssetListItem(BaseModel):
    id: str
    park_id: str
    park_name: Optional[str] = None
    region: Optional[str] = None
    asset_code: str
    asset_type: str
    manufacturer: str
    capacity_kw: float
    status: str
    health_score: float
    latitude: float
    longitude: float
    last_updated: datetime
    current_power_kw: Optional[float] = 0.0
    expected_power_kw: Optional[float] = 0.0
    performance_ratio: Optional[float] = 0.95
    failure_probability_pct: Optional[float] = 5.0
    risk_level: Optional[str] = "Low"

    class Config:
        from_attributes = True

class RenewableAssetDetail(BaseModel):
    id: str
    park_id: str
    park_name: Optional[str] = None
    region: Optional[str] = None
    asset_code: str
    asset_type: str
    manufacturer: str
    capacity_kw: float
    commissioning_date: datetime
    status: str
    health_score: float
    latitude: float
    longitude: float
    last_updated: datetime
    wind_specs: Optional[WindTurbineSpec] = None
    solar_specs: Optional[SolarAssetSpec] = None
    latest_reading: Optional[SensorReadingSchema] = None
    latest_prediction: Optional[AssetPredictionSchema] = None
    telemetry_history: Optional[List[SensorReadingSchema]] = []
    active_alerts: Optional[List[Dict[str, Any]]] = []

    class Config:
        from_attributes = True

class RenewableParkSchema(BaseModel):
    id: str
    name: str
    region: str
    latitude: float
    longitude: float
    capacity_mw: float
    park_type: str
    status: str
    commissioning_year: int
    operator_company: str
    current_generation_mw: Optional[float] = 0.0
    solar_mw: Optional[float] = 0.0
    wind_mw: Optional[float] = 0.0
    efficiency_pct: Optional[float] = 92.0
    healthy_assets_count: Optional[int] = 0
    warning_assets_count: Optional[int] = 0
    critical_assets_count: Optional[int] = 0

    class Config:
        from_attributes = True
