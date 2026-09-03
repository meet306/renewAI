from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.app.database.models import WeatherData, RenewablePark
from backend.app.ml.generation_forecaster import generation_forecaster

class WeatherForecastingAgent:
    """
    Analyzes weather data from meteorological stations across Kutch and Banaskantha,
    computes solar irradiance and wind velocity distributions, and generates 24-hour generation forecasts.
    """
    def __init__(self):
        self.name = "Generation Forecasting Agent"

    def get_forecast(self, db: Session) -> Dict[str, Any]:
        kutch_weather = db.query(WeatherData).join(RenewablePark).filter(
            RenewablePark.region == "Kutch"
        ).order_by(WeatherData.timestamp.desc()).first()

        banas_weather = db.query(WeatherData).join(RenewablePark).filter(
            RenewablePark.region == "Banaskantha"
        ).order_by(WeatherData.timestamp.desc()).first()

        wind_speed = kutch_weather.wind_speed_ms if kutch_weather else 8.5
        cloud_cover = banas_weather.cloud_cover_pct if banas_weather else 12.0

        forecast_data = generation_forecaster.generate_24h_forecast(
            base_time=datetime.utcnow(),
            kutch_wind_base_speed=wind_speed,
            solar_cloud_cover_pct=cloud_cover
        )

        return {
            "agent": self.name,
            "kutch_wind_speed_ms": round(wind_speed, 1),
            "banaskantha_cloud_cover_pct": round(cloud_cover, 1),
            "banaskantha_irradiance_wm2": round(banas_weather.irradiance_wm2 if banas_weather else 885.0, 1),
            "total_expected_mwh": forecast_data["total_expected_mwh"],
            "solar_expected_mwh": forecast_data["solar_expected_mwh"],
            "wind_expected_mwh": forecast_data["wind_expected_mwh"],
            "average_confidence_pct": forecast_data["average_confidence_pct"],
            "insights": forecast_data["granite_forecast_insights"],
            "hourly_forecast": forecast_data["hourly_forecast"]
        }

forecasting_agent = WeatherForecastingAgent()
