from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models import WeatherData, RenewablePark
from backend.app.schemas.energy import WeatherCurrent

router = APIRouter(prefix="/weather", tags=["Meteorology"])

@router.get("/current", response_model=List[WeatherCurrent])
def get_current_weather(db: Session = Depends(get_db)):
    parks = db.query(RenewablePark).all()
    results = []
    for p in parks:
        latest = db.query(WeatherData).filter(
            WeatherData.park_id == p.id
        ).order_by(WeatherData.timestamp.desc()).first()

        if latest:
            results.append({
                "park_name": p.name,
                "region": p.region,
                "temperature_c": latest.temperature_c,
                "cloud_cover_pct": latest.cloud_cover_pct,
                "irradiance_wm2": latest.irradiance_wm2,
                "wind_speed_ms": latest.wind_speed_ms,
                "wind_direction_deg": latest.wind_direction_deg,
                "humidity_pct": latest.humidity_pct,
                "weather_condition": latest.weather_condition
            })
        else:
            results.append({
                "park_name": p.name,
                "region": p.region,
                "temperature_c": 32.5,
                "cloud_cover_pct": 10.0,
                "irradiance_wm2": 880.0,
                "wind_speed_ms": 8.2,
                "wind_direction_deg": 245.0,
                "humidity_pct": 45.0,
                "weather_condition": "Clear Sky"
            })
    return results
