from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.services.simulation_engine import simulation_engine
from backend.app.core.websocket_manager import websocket_manager

router = APIRouter(prefix="/simulation", tags=["Scenario Simulator"])

@router.get("/scenarios")
def list_simulation_scenarios():
    return simulation_engine.get_scenarios()

@router.post("/trigger")
async def trigger_scenario(
    payload: Dict[str, str] = Body(..., example={"scenario_code": "WT_BEARING_DEGRADATION"}),
    db: Session = Depends(get_db)
):
    code = payload.get("scenario_code")
    if not code:
        raise HTTPException(status_code=400, detail="scenario_code is required")

    result = simulation_engine.trigger_scenario(db, code)

    # Broadcast event via WebSocket to all connected dashboard clients
    await websocket_manager.broadcast({
        "event_type": "SIMULATION_TRIGGERED",
        "scenario_code": code,
        "details": result
    })

    return result

@router.post("/reset")
async def reset_simulation(db: Session = Depends(get_db)):
    result = simulation_engine.trigger_scenario(db, "BASELINE_NORMAL")
    await websocket_manager.broadcast({
        "event_type": "SIMULATION_RESET",
        "scenario_code": "BASELINE_NORMAL",
        "details": result
    })
    return result
