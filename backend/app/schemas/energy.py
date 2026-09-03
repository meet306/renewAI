from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class CurrentEnergyOverview(BaseModel):
    timestamp: datetime
    solar_generation_mw: float
    solar_delta_pct: float
    wind_generation_mw: float
    wind_delta_pct: float
    total_generation_mw: float
    total_capacity_mw: float
    park_efficiency_pct: float
    assets_online: int
    total_assets: int
    critical_alerts_count: int
    maintenance_risks_count: int
    grid_demand_mw: float
    battery_soc_pct: float
    battery_mode: str
    grid_export_mw: float

class GenerationHistoryItem(BaseModel):
    timestamp: datetime
    solar_generation_mw: float
    wind_generation_mw: float
    total_generation_mw: float
    grid_demand_mw: float

class WeatherCurrent(BaseModel):
    park_name: str
    region: str
    temperature_c: float
    cloud_cover_pct: float
    irradiance_wm2: float
    wind_speed_ms: float
    wind_direction_deg: float
    humidity_pct: float
    weather_condition: str

class ForecastHourlyItem(BaseModel):
    hour: str
    timestamp: datetime
    solar_forecast_mw: float
    wind_forecast_mw: float
    total_forecast_mw: float
    confidence_pct: float
    irradiance_wm2: float
    wind_speed_ms: float
    cloud_cover_pct: float

class GenerationForecastResponse(BaseModel):
    forecast_date: str
    total_expected_mwh: float
    solar_expected_mwh: float
    wind_expected_mwh: float
    average_confidence_pct: float
    granite_forecast_insights: Optional[str] = None
    hourly_forecast: List[ForecastHourlyItem]
