import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_system_status():
    response = client.get("/api/system/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["total_monitored_assets"] > 0

def test_parks_list():
    response = client.get("/api/parks")
    assert response.status_code == 200
    parks = response.json()
    assert len(parks) >= 4
    regions = [p["region"] for p in parks]
    assert "Kutch" in regions
    assert "Banaskantha" in regions

def test_assets_list_and_detail():
    response = client.get("/api/assets")
    assert response.status_code == 200
    assets = response.json()
    assert len(assets) > 10

    # Test WT-021
    wt_021_resp = client.get("/api/assets/WT-021")
    assert wt_021_resp.status_code == 200
    wt_021 = wt_021_resp.json()
    assert wt_021["asset_code"] == "WT-021"
    assert wt_021["asset_type"] == "wind_turbine"
    assert "latest_reading" in wt_021

def test_energy_overview():
    response = client.get("/api/energy/current")
    assert response.status_code == 200
    data = response.json()
    assert data["total_generation_mw"] > 0
    assert data["solar_generation_mw"] > 0
    assert data["wind_generation_mw"] > 0
    assert data["park_efficiency_pct"] > 80

def test_generation_forecast():
    response = client.get("/api/forecast")
    assert response.status_code == 200
    data = response.json()
    assert "hourly_forecast" in data
    assert len(data["hourly_forecast"]) == 24
    assert data["total_expected_mwh"] > 0

def test_predictive_maintenance_risks():
    response = client.get("/api/maintenance/risks")
    assert response.status_code == 200
    risks = response.json()
    assert len(risks) > 0
    assert "failure_probability_pct" in risks[0]
    assert "risk_level" in risks[0]

def test_grid_optimization():
    response = client.get("/api/grid/recommendations")
    assert response.status_code == 200
    rec = response.json()
    assert "action_title" in rec
    assert "granite_reasoning" in rec

def test_ai_command_center_query():
    # Test query about WT-021
    response = client.post("/api/agent/query", json={"query": "Why is WT-021 underperforming and what is the risk?"})
    assert response.status_code == 200
    res = response.json()
    assert "agents_consulted" in res
    assert "tools_executed" in res
    assert "granite_reasoning" in res
    assert len(res["granite_reasoning"]) > 50

def test_simulation_scenario_and_reset():
    # 1. Trigger WT-021 Bearing Degradation
    trig_resp = client.post("/api/simulation/trigger", json={"scenario_code": "WT_BEARING_DEGRADATION"})
    assert trig_resp.status_code == 200
    data = trig_resp.json()
    assert data["status"] == "success"

    # Verify WT-021 is now in critical status with 87% failure probability
    wt_resp = client.get("/api/assets/WT-021")
    assert wt_resp.status_code == 200
    wt_data = wt_resp.json()
    assert wt_data["status"] == "critical"
    assert wt_data["latest_prediction"]["failure_probability_pct"] >= 85.0

    # 2. Reset back to normal
    reset_resp = client.post("/api/simulation/reset")
    assert reset_resp.status_code == 200

    # Verify reset
    wt_reset = client.get("/api/assets/WT-021").json()
    assert wt_reset["status"] == "healthy"
