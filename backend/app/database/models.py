import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="operator")  # admin, operator, viewer
    full_name = Column(String(100), default="Control Center Engineer")
    created_at = Column(DateTime, default=datetime.utcnow)

    decisions = relationship("AgentDecision", back_populates="user")

class RenewablePark(Base):
    __tablename__ = "renewable_parks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False, index=True)
    region = Column(String(50), nullable=False, index=True)  # Kutch, Banaskantha
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity_mw = Column(Float, nullable=False)
    park_type = Column(String(20), nullable=False)  # Solar, Wind, Hybrid
    status = Column(String(20), default="operational")  # operational, maintenance, curtailed
    commissioning_year = Column(Integer, default=2022)
    operator_company = Column(String(100), default="Gujarat Urja Vikas Nigam Ltd (GUVNL)")

    assets = relationship("RenewableAsset", back_populates="park", cascade="all, delete-orphan")
    weather_records = relationship("WeatherData", back_populates="park", cascade="all, delete-orphan")
    energy_records = relationship("EnergyGeneration", back_populates="park", cascade="all, delete-orphan")
    battery_records = relationship("BatteryStatus", back_populates="park", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="park", cascade="all, delete-orphan")

class RenewableAsset(Base):
    __tablename__ = "renewable_assets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    park_id = Column(String(36), ForeignKey("renewable_parks.id"), nullable=False)
    asset_code = Column(String(50), unique=True, index=True, nullable=False)  # e.g., WT-021, SP-003, INV-042
    asset_type = Column(String(30), nullable=False)  # wind_turbine, solar_inverter, solar_string, bess
    manufacturer = Column(String(100), default="Suzlon Energy / Sungrow")
    capacity_kw = Column(Float, nullable=False)
    commissioning_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="healthy", index=True)  # healthy, warning, critical, maintenance, offline
    health_score = Column(Float, default=98.0)  # 0 to 100
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    last_updated = Column(DateTime, default=datetime.utcnow)

    park = relationship("RenewablePark", back_populates="assets")
    wind_specs = relationship("WindTurbine", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    solar_specs = relationship("SolarAsset", back_populates="asset", uselist=False, cascade="all, delete-orphan")
    sensor_readings = relationship("SensorReading", back_populates="asset", cascade="all, delete-orphan", order_by="desc(SensorReading.timestamp)")
    anomalies = relationship("Anomaly", back_populates="asset", cascade="all, delete-orphan")
    predictions = relationship("AssetPrediction", back_populates="asset", cascade="all, delete-orphan", order_by="desc(AssetPrediction.timestamp)")
    maintenance_records = relationship("MaintenanceRecord", back_populates="asset", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="asset", cascade="all, delete-orphan")

class WindTurbine(Base):
    __tablename__ = "wind_turbines"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("renewable_assets.id"), unique=True, nullable=False)
    rotor_diameter_m = Column(Float, default=120.0)
    hub_height_m = Column(Float, default=140.0)
    rated_wind_speed_ms = Column(Float, default=11.5)
    cut_in_speed_ms = Column(Float, default=3.0)
    cut_out_speed_ms = Column(Float, default=25.0)
    gearbox_type = Column(String(50), default="Planetary-Helical High Ratio")

    asset = relationship("RenewableAsset", back_populates="wind_specs")

class SolarAsset(Base):
    __tablename__ = "solar_assets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("renewable_assets.id"), unique=True, nullable=False)
    panel_technology = Column(String(50), default="Monocrystalline PERC / Bifacial")
    tilt_angle_deg = Column(Float, default=23.5)
    azimuth_deg = Column(Float, default=180.0)  # True South
    inverter_rating_kva = Column(Float, default=3125.0)
    tracker_type = Column(String(50), default="Single-Axis Horizontal Tracker")

    asset = relationship("RenewableAsset", back_populates="solar_specs")

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("renewable_assets.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    power_output_kw = Column(Float, nullable=False)
    expected_power_kw = Column(Float, nullable=False)
    voltage_v = Column(Float, default=690.0)
    current_a = Column(Float, default=2500.0)
    ambient_temp_c = Column(Float, default=32.0)
    component_temp_c = Column(Float, default=60.0)  # bearing temp or inverter IGBT temp
    vibration_mms = Column(Float, default=1.8)      # mm/s RMS for wind turbine nacelle/bearing
    rpm = Column(Float, default=14.5)               # rotor/generator RPM
    irradiance_wm2 = Column(Float, default=850.0)   # solar irradiance
    wind_speed_ms = Column(Float, default=8.2)      # wind speed
    wind_direction_deg = Column(Float, default=245.0)
    performance_ratio = Column(Float, default=0.92) # 0.0 to 1.0
    anomaly_score = Column(Float, default=0.05)     # 0.0 to 1.0

    asset = relationship("RenewableAsset", back_populates="sensor_readings")

class WeatherData(Base):
    __tablename__ = "weather_data"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    park_id = Column(String(36), ForeignKey("renewable_parks.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    temperature_c = Column(Float, nullable=False)
    cloud_cover_pct = Column(Float, default=15.0)
    irradiance_wm2 = Column(Float, nullable=False)
    wind_speed_ms = Column(Float, nullable=False)
    wind_direction_deg = Column(Float, default=240.0)
    humidity_pct = Column(Float, default=45.0)
    weather_condition = Column(String(50), default="Clear Sky")
    pressure_hpa = Column(Float, default=1008.0)

    park = relationship("RenewablePark", back_populates="weather_records")

class EnergyGeneration(Base):
    __tablename__ = "energy_generation"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    park_id = Column(String(36), ForeignKey("renewable_parks.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    solar_generation_mw = Column(Float, default=0.0)
    wind_generation_mw = Column(Float, default=0.0)
    total_generation_mw = Column(Float, default=0.0)
    efficiency_pct = Column(Float, default=91.5)
    curtailment_mw = Column(Float, default=0.0)

    park = relationship("RenewablePark", back_populates="energy_records")

class GridDemand(Base):
    __tablename__ = "grid_demand"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    region = Column(String(50), default="Gujarat-SLDC-West")
    demand_mw = Column(Float, default=110.0)
    renewable_supply_mw = Column(Float, default=128.0)
    grid_frequency_hz = Column(Float, default=50.02)
    grid_import_export_mw = Column(Float, default=18.0)  # Positive = export, Negative = import
    grid_constraint_status = Column(String(50), default="Normal")  # Normal, Congested, Peak Demand, Frequency Deviation

class BatteryStatus(Base):
    __tablename__ = "battery_status"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    park_id = Column(String(36), ForeignKey("renewable_parks.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    total_capacity_mwh = Column(Float, default=50.0)
    current_soc_pct = Column(Float, default=68.5)
    charge_discharge_rate_mw = Column(Float, default=0.0) # Positive = charge, Negative = discharge
    mode = Column(String(20), default="idle")             # charging, discharging, idle, standby
    temperature_c = Column(Float, default=26.5)

    park = relationship("RenewablePark", back_populates="battery_records")

class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("renewable_assets.id"), index=True, nullable=False)
    scheduled_date = Column(DateTime, default=datetime.utcnow)
    completed_date = Column(DateTime, nullable=True)
    maintenance_type = Column(String(50), default="Condition-Based")  # Preventive, Corrective, Condition-Based
    failure_type = Column(String(100), default="Bearing Wear")
    description = Column(Text, nullable=False)
    priority = Column(String(20), default="High")  # Critical, High, Medium, Low
    status = Column(String(20), default="scheduled")  # scheduled, in_progress, completed, deferred
    estimated_cost_inr = Column(Float, default=75000.0)
    technician_notes = Column(Text, nullable=True)

    asset = relationship("RenewableAsset", back_populates="maintenance_records")

class AssetPrediction(Base):
    __tablename__ = "asset_predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("renewable_assets.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    failure_probability_pct = Column(Float, nullable=False)  # 0.0 to 100.0
    risk_level = Column(String(20), nullable=False)          # Critical, High, Medium, Low
    predicted_rul_days = Column(Integer, default=30)         # Remaining Useful Life in days
    contributing_factors = Column(JSON, default=dict)
    recommendation_text = Column(Text, nullable=False)

    asset = relationship("RenewableAsset", back_populates="predictions")

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("renewable_assets.id"), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    anomaly_type = Column(String(100), nullable=False)
    severity = Column(String(20), default="warning")  # critical, warning, info
    metric_name = Column(String(50), nullable=False)
    expected_value = Column(Float, nullable=False)
    actual_value = Column(Float, nullable=False)
    deviation_pct = Column(Float, nullable=False)
    is_resolved = Column(Boolean, default=False)

    asset = relationship("RenewableAsset", back_populates="anomalies")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset_id = Column(String(36), ForeignKey("renewable_assets.id"), index=True, nullable=True)
    park_id = Column(String(36), ForeignKey("renewable_parks.id"), index=True, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    severity = Column(String(20), default="WARNING")  # CRITICAL, WARNING, NOTICE, INFO
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    evidence = Column(JSON, default=dict)
    root_cause = Column(Text, nullable=True)
    suggested_action = Column(Text, nullable=True)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime, nullable=True)

    asset = relationship("RenewableAsset", back_populates="alerts")
    park = relationship("RenewablePark", back_populates="alerts")

class AgentDecision(Base):
    __tablename__ = "agent_decisions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    query_text = Column(Text, nullable=False)
    intent = Column(String(100), default="general_inquiry")
    agents_consulted = Column(JSON, default=list)
    tools_executed = Column(JSON, default=list)
    context_data = Column(JSON, default=dict)
    granite_reasoning = Column(Text, nullable=True)
    final_response = Column(Text, nullable=False)
    response_time_ms = Column(Float, default=0.0)

    user = relationship("User", back_populates="decisions")

class SimulationEvent(Base):
    __tablename__ = "simulation_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    scenario_code = Column(String(50), nullable=False)
    scenario_name = Column(String(100), nullable=False)
    target_asset_code = Column(String(50), nullable=True)
    parameters = Column(JSON, default=dict)
    status = Column(String(20), default="active")  # active, completed, reset
