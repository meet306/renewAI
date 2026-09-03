from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.schemas.energy import GenerationForecastResponse
from backend.app.agents.forecasting_agent import forecasting_agent

router = APIRouter(prefix="/forecast", tags=["Forecasting"])

@router.get("", response_model=GenerationForecastResponse)
def get_24h_generation_forecast(db: Session = Depends(get_db)):
    forecast_data = forecasting_agent.get_forecast(db)
    return {
        "forecast_date": "Tomorrow",
        "total_expected_mwh": forecast_data["total_expected_mwh"],
        "solar_expected_mwh": forecast_data["solar_expected_mwh"],
        "wind_expected_mwh": forecast_data["wind_expected_mwh"],
        "average_confidence_pct": forecast_data["average_confidence_pct"],
        "granite_forecast_insights": forecast_data["insights"],
        "hourly_forecast": forecast_data["hourly_forecast"]
    }
