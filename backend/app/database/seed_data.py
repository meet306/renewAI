import math
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.app.database.session import engine, SessionLocal, Base
from backend.app.database.models import (
    User, RenewablePark, RenewableAsset, WindTurbine, SolarAsset,
    SensorReading, WeatherData, EnergyGeneration, GridDemand,
    BatteryStatus, MaintenanceRecord, AssetPrediction, Anomaly, Alert, SimulationEvent
)
from backend.app.core.security import get_password_hash

def calculate_solar_irradiance(dt: datetime, base_ghi: float = 950.0, cloud_cover: float = 10.0) -> float:
    """Calculates realistic solar irradiance based on hour of day in Gujarat (IST)."""
    hour = dt.hour + dt.minute / 60.0
    if hour < 6.0 or hour > 18.5:
        return 0.0
    # Bell curve peak at 12:45 PM
    solar_factor = math.sin((hour - 6.0) / 12.5 * math.pi)
    solar_factor = max(0.0, solar_factor)
    cloud_attenuation = 1.0 - (cloud_cover / 100.0) * 0.75
    return base_ghi * solar_factor * cloud_attenuation

def calculate_wind_speed(dt: datetime, base_speed: float = 8.5) -> float:
    """Simulates realistic coastal Gujarat diurnal wind variations."""
    hour = dt.hour + dt.minute / 60.0
    # Coastal winds pick up in afternoon and evening
    diurnal_variation = math.sin((hour - 14.0) / 24.0 * 2 * math.pi) * 2.2
    noise = random.uniform(-0.6, 0.6)
    return max(0.5, base_speed + diurnal_variation + noise)

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(RenewablePark).first():
            print("Database already contains seed data.")
            return

        print("Seeding database with Gujarat renewable parks and assets...")

        # 1. Users
        users = [
            User(
                username="admin",
                email="admin@renewai.gujarat.in",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                full_name="Rajesh Patel (Lead Operations Engineer)"
            ),
            User(
                username="operator",
                email="operator@renewai.gujarat.in",
                hashed_password=get_password_hash("operator123"),
                role="operator",
                full_name="Priya Sharma (Shift Dispatcher)"
            ),
            User(
                username="viewer",
                email="viewer@renewai.gujarat.in",
                hashed_password=get_password_hash("viewer123"),
                role="viewer",
                full_name="Amit Desai (Grid Compliance Auditor)"
            ),
        ]
        db.add_all(users)
        db.commit()

        # 2. Renewable Parks
        parks = [
            RenewablePark(
                name="Kutch Hybrid Renewable Park",
                region="Kutch",
                latitude=23.2420,
                longitude=69.6660,
                capacity_mw=150.0,
                park_type="Hybrid",
                status="operational",
                commissioning_year=2021,
                operator_company="Gujarat State Electricity Corp (GSECL)"
            ),
            RenewablePark(
                name="Kutch Coastal Wind Farm",
                region="Kutch",
                latitude=23.1850,
                longitude=68.7200,
                capacity_mw=80.0,
                park_type="Wind",
                status="operational",
                commissioning_year=2020,
                operator_company="Suzlon Energy Ltd"
            ),
            RenewablePark(
                name="Banaskantha Ultra Solar Park",
                region="Banaskantha",
                latitude=23.8340,
                longitude=71.6030,
                capacity_mw=100.0,
                park_type="Solar",
                status="operational",
                commissioning_year=2022,
                operator_company="Gujarat Power Corporation Ltd (GPCL)"
            ),
            RenewablePark(
                name="Banaskantha Hybrid Cluster",
                region="Banaskantha",
                latitude=23.9500,
                longitude=71.3500,
                capacity_mw=70.0,
                park_type="Hybrid",
                status="operational",
                commissioning_year=2023,
                operator_company="Adani Green Energy Ltd"
            )
        ]
        db.add_all(parks)
        db.commit()

        kutch_hybrid = parks[0]
        kutch_wind = parks[1]
        banas_solar = parks[2]
        banas_hybrid = parks[3]

        # 3. Renewable Assets
        assets = []
        now = datetime.utcnow()

        # Kutch Hybrid Wind Turbines (WT-001 to WT-015)
        for i in range(1, 16):
            code = f"WT-{i:03d}"
            lat_offset = (i % 4) * 0.008 + random.uniform(-0.002, 0.002)
            lng_offset = (i // 4) * 0.008 + random.uniform(-0.002, 0.002)
            asset = RenewableAsset(
                park_id=kutch_hybrid.id,
                asset_code=code,
                asset_type="wind_turbine",
                manufacturer="Suzlon S120-2.8MW",
                capacity_kw=2800.0,
                commissioning_date=datetime(2021, 6, 15),
                status="healthy",
                health_score=round(random.uniform(92.0, 98.5), 1),
                latitude=kutch_hybrid.latitude + lat_offset,
                longitude=kutch_hybrid.longitude + lng_offset,
                last_updated=now
            )
            assets.append((asset, "wind", 120.0, 140.0, 11.5))

        # Kutch Coastal Wind Turbines (WT-016 to WT-024) including key asset WT-021
        for i in range(16, 25):
            code = f"WT-{i:03d}"
            lat_offset = ((i - 15) % 3) * 0.010 + random.uniform(-0.002, 0.002)
            lng_offset = ((i - 15) // 3) * 0.010 + random.uniform(-0.002, 0.002)
            
            # WT-021 has initial mild signature for demo readiness
            status = "healthy"
            health = round(random.uniform(91.0, 97.0), 1)
            if code == "WT-021":
                health = 88.0
            
            asset = RenewableAsset(
                park_id=kutch_wind.id,
                asset_code=code,
                asset_type="wind_turbine",
                manufacturer="Siemens Gamesa SG 2.6-114",
                capacity_kw=2600.0,
                commissioning_date=datetime(2020, 11, 20),
                status=status,
                health_score=health,
                latitude=kutch_wind.latitude + lat_offset,
                longitude=kutch_wind.longitude + lng_offset,
                last_updated=now
            )
            assets.append((asset, "wind", 114.0, 125.0, 12.0))

        # Banaskantha Solar Inverter Blocks (INV-001 to INV-045) including key asset INV-042
        for i in range(1, 46):
            code = f"INV-{i:03d}"
            lat_offset = (i % 7) * 0.005 + random.uniform(-0.001, 0.001)
            lng_offset = (i // 7) * 0.005 + random.uniform(-0.001, 0.001)

            status = "healthy"
            health = round(random.uniform(93.0, 99.0), 1)
            if code == "INV-042":
                health = 84.5
                status = "warning"

            asset = RenewableAsset(
                park_id=banas_solar.id,
                asset_code=code,
                asset_type="solar_inverter",
                manufacturer="Sungrow SG3125HV-30",
                capacity_kw=3125.0,
                commissioning_date=datetime(2022, 3, 10),
                status=status,
                health_score=health,
                latitude=banas_solar.latitude + lat_offset,
                longitude=banas_solar.longitude + lng_offset,
                last_updated=now
            )
            assets.append((asset, "solar", 23.5, 180.0, 3125.0))

        # Solar Plant Arrays in Kutch Hybrid (SP-001 to SP-010)
        for i in range(1, 11):
            code = f"SP-{i:03d}"
            lat_offset = (i % 3) * 0.007 + 0.03
            lng_offset = (i // 3) * 0.007 + 0.03
            asset = RenewableAsset(
                park_id=kutch_hybrid.id,
                asset_code=code,
                asset_type="solar_string",
                manufacturer="Waaree Bi-390W Dual-Glass",
                capacity_kw=5000.0,
                commissioning_date=datetime(2021, 8, 1),
                status="healthy",
                health_score=round(random.uniform(94.0, 98.0), 1),
                latitude=kutch_hybrid.latitude + lat_offset,
                longitude=kutch_hybrid.longitude + lng_offset,
                last_updated=now
            )
            assets.append((asset, "solar", 24.0, 180.0, 5000.0))

        # Battery Energy Storage Systems (BESS)
        bess1 = RenewableAsset(
            park_id=kutch_hybrid.id,
            asset_code="BESS-01",
            asset_type="bess",
            manufacturer="Tata Power Lithium-LFP 40MWh",
            capacity_kw=10000.0, # 10MW / 40MWh
            commissioning_date=datetime(2022, 1, 10),
            status="healthy",
            health_score=97.0,
            latitude=kutch_hybrid.latitude + 0.015,
            longitude=kutch_hybrid.longitude + 0.015,
            last_updated=now
        )
        assets.append((bess1, "bess", 0, 0, 0))

        bess2 = RenewableAsset(
            park_id=banas_hybrid.id,
            asset_code="BESS-02",
            asset_type="bess",
            manufacturer="Fluence Gridstack 25MWh",
            capacity_kw=6250.0,
            commissioning_date=datetime(2023, 4, 15),
            status="healthy",
            health_score=99.0,
            latitude=banas_hybrid.latitude + 0.012,
            longitude=banas_hybrid.longitude + 0.012,
            last_updated=now
        )
        assets.append((bess2, "bess", 0, 0, 0))

        # Insert assets into DB
        for item in assets:
            asset_obj = item[0]
            db.add(asset_obj)
        db.commit()

        # Add Wind and Solar specs
        for item in assets:
            asset_obj = item[0]
            a_type = item[1]
            if a_type == "wind":
                w_spec = WindTurbine(
                    asset_id=asset_obj.id,
                    rotor_diameter_m=item[2],
                    hub_height_m=item[3],
                    rated_wind_speed_ms=item[4],
                    cut_in_speed_ms=3.0,
                    cut_out_speed_ms=25.0,
                    gearbox_type="Planetary-Helical 3-Stage"
                )
                db.add(w_spec)
            elif a_type == "solar":
                s_spec = SolarAsset(
                    asset_id=asset_obj.id,
                    panel_technology="Monocrystalline Bifacial PERC",
                    tilt_angle_deg=item[2],
                    azimuth_deg=item[3],
                    inverter_rating_kva=item[4],
                    tracker_type="Single-Axis Auto Tracker"
                )
                db.add(s_spec)
        db.commit()

        # 4. Generate Sensor Readings (Time-series history for last 24 hours at 1-hour intervals)
        print("Generating realistic 24-hour historical sensor telemetry...")
        db_assets = db.query(RenewableAsset).all()

        for hours_ago in range(24, -1, -1):
            sample_time = now - timedelta(hours=hours_ago)
            cloud = 12.0 + random.uniform(-4, 4)
            irr = calculate_solar_irradiance(sample_time, cloud_cover=cloud)
            wind_sp = calculate_wind_speed(sample_time)
            amb_temp = 28.0 + math.sin((sample_time.hour - 8.0)/24.0 * 2 * math.pi) * 7.5

            for asset in db_assets:
                if asset.asset_type == "wind_turbine":
                    # Wind power curve
                    if wind_sp < 3.0:
                        p_factor = 0.0
                    elif wind_sp >= 12.0:
                        p_factor = 1.0
                    else:
                        p_factor = ((wind_sp - 3.0) / (12.0 - 3.0)) ** 2.8

                    expected_kw = asset.capacity_kw * p_factor
                    
                    # Special handling for WT-021 baseline
                    if asset.asset_code == "WT-021" and hours_ago == 0:
                        actual_kw = expected_kw * 0.94 # nominal before scenario trigger
                        vib = 1.95
                        comp_temp = 63.5
                        pr = 0.94
                        anomaly = 0.08
                    else:
                        eff = random.uniform(0.94, 0.99)
                        actual_kw = expected_kw * eff
                        vib = random.uniform(1.4, 2.1)
                        comp_temp = 56.0 + (actual_kw / asset.capacity_kw) * 12.0 + random.uniform(-1.5, 1.5)
                        pr = eff
                        anomaly = round(random.uniform(0.02, 0.08), 3)

                    reading = SensorReading(
                        asset_id=asset.id,
                        timestamp=sample_time,
                        power_output_kw=round(actual_kw, 1),
                        expected_power_kw=round(expected_kw, 1),
                        voltage_v=round(690.0 + random.uniform(-8.0, 8.0), 1),
                        current_a=round((actual_kw * 1000) / (1.732 * 690 * 0.98 + 1), 1) if actual_kw > 0 else 0.0,
                        ambient_temp_c=round(amb_temp, 1),
                        component_temp_c=round(comp_temp, 1),
                        vibration_mms=round(vib, 2),
                        rpm=round(14.8 * (wind_sp / 10.0) if wind_sp > 3.0 else 0.0, 1),
                        irradiance_wm2=round(irr, 1),
                        wind_speed_ms=round(wind_sp, 1),
                        wind_direction_deg=round(245.0 + random.uniform(-15, 15), 1),
                        performance_ratio=round(pr, 3),
                        anomaly_score=anomaly
                    )
                    db.add(reading)

                elif asset.asset_type in ["solar_inverter", "solar_string"]:
                    # Solar power curve
                    solar_factor = irr / 1000.0
                    temp_derating = 1.0 - max(0.0, (amb_temp - 25.0) * 0.0035)
                    expected_kw = asset.capacity_kw * solar_factor * temp_derating

                    if asset.asset_code == "INV-042":
                        # Mild inverter degradation signature
                        eff = 0.88 if irr > 100 else 0.95
                        comp_temp = 74.0 + random.uniform(0, 3)
                        anomaly = 0.38
                    else:
                        eff = random.uniform(0.95, 0.99) if irr > 50 else 0.99
                        comp_temp = amb_temp + 15.0 * (irr / 1000.0) + random.uniform(-2, 2)
                        anomaly = round(random.uniform(0.01, 0.06), 3)

                    actual_kw = expected_kw * eff

                    reading = SensorReading(
                        asset_id=asset.id,
                        timestamp=sample_time,
                        power_output_kw=round(actual_kw, 1),
                        expected_power_kw=round(expected_kw, 1),
                        voltage_v=round(800.0 + random.uniform(-12, 12) if irr > 0 else 0.0, 1),
                        current_a=round((actual_kw * 1000) / (800.0 + 1), 1) if actual_kw > 0 else 0.0,
                        ambient_temp_c=round(amb_temp, 1),
                        component_temp_c=round(comp_temp, 1),
                        vibration_mms=0.05,
                        rpm=0.0,
                        irradiance_wm2=round(irr, 1),
                        wind_speed_ms=round(wind_sp, 1),
                        wind_direction_deg=240.0,
                        performance_ratio=round(eff, 3),
                        anomaly_score=anomaly
                    )
                    db.add(reading)

        db.commit()

        # 5. Weather Data for Parks
        print("Seeding weather records...")
        for park in parks:
            w_rec = WeatherData(
                park_id=park.id,
                timestamp=now,
                temperature_c=34.2 if park.region == "Banaskantha" else 31.8,
                cloud_cover_pct=12.0,
                irradiance_wm2=885.0,
                wind_speed_ms=8.6 if park.region == "Kutch" else 5.8,
                wind_direction_deg=242.0,
                humidity_pct=48.0,
                weather_condition="Clear Sunny Sky",
                pressure_hpa=1009.5
            )
            db.add(w_rec)
        db.commit()

        # 6. Current Energy Generation (Target: Solar ~82 MW, Wind ~46 MW, Total ~128 MW, Efficiency ~91.5%)
        print("Seeding energy generation and grid balance...")
        for park in parks:
            if park.name == "Kutch Hybrid Renewable Park":
                eg = EnergyGeneration(
                    park_id=park.id,
                    timestamp=now,
                    solar_generation_mw=34.5,
                    wind_generation_mw=26.2,
                    total_generation_mw=60.7,
                    efficiency_pct=92.4,
                    curtailment_mw=0.0
                )
            elif park.name == "Kutch Coastal Wind Farm":
                eg = EnergyGeneration(
                    park_id=park.id,
                    timestamp=now,
                    solar_generation_mw=0.0,
                    wind_generation_mw=19.8,
                    total_generation_mw=19.8,
                    efficiency_pct=91.0,
                    curtailment_mw=0.0
                )
            elif park.name == "Banaskantha Ultra Solar Park":
                eg = EnergyGeneration(
                    park_id=park.id,
                    timestamp=now,
                    solar_generation_mw=47.5,
                    wind_generation_mw=0.0,
                    total_generation_mw=47.5,
                    efficiency_pct=91.8,
                    curtailment_mw=0.0
                )
            else: # Banaskantha Hybrid Cluster
                eg = EnergyGeneration(
                    park_id=park.id,
                    timestamp=now,
                    solar_generation_mw=0.0, # standby/aux
                    wind_generation_mw=0.0,
                    total_generation_mw=0.0,
                    efficiency_pct=95.0,
                    curtailment_mw=0.0
                )
            db.add(eg)

        # 7. Grid Demand & Battery Status
        gd = GridDemand(
            timestamp=now,
            region="Gujarat-SLDC-West",
            demand_mw=110.0,
            renewable_supply_mw=128.0,
            grid_frequency_hz=50.02,
            grid_import_export_mw=18.0, # 18 MW excess exported or routed to BESS
            grid_constraint_status="Normal"
        )
        db.add(gd)

        bat = BatteryStatus(
            park_id=kutch_hybrid.id,
            timestamp=now,
            total_capacity_mwh=40.0,
            current_soc_pct=68.5,
            charge_discharge_rate_mw=12.0, # Charging with 12 MW excess
            mode="charging",
            temperature_c=25.8
        )
        db.add(bat)
        db.commit()

        # 8. Maintenance Records & Predictions
        print("Seeding predictive maintenance and alerts...")
        wt_021 = db.query(RenewableAsset).filter(RenewableAsset.asset_code == "WT-021").first()
        inv_042 = db.query(RenewableAsset).filter(RenewableAsset.asset_code == "INV-042").first()
        wt_014 = db.query(RenewableAsset).filter(RenewableAsset.asset_code == "WT-014").first()

        if wt_021:
            m_rec = MaintenanceRecord(
                asset_id=wt_021.id,
                scheduled_date=now + timedelta(days=2),
                maintenance_type="Condition-Based",
                failure_type="Main Drive Bearing Wear",
                description="Routine vibration analysis scheduled following elevated vibration harmonics during Q3 audit.",
                priority="High",
                status="scheduled",
                estimated_cost_inr=85000.0,
                technician_notes="Bearing grease replenishment and acoustic ultrasound inspection assigned to Team Kutch-B."
            )
            db.add(m_rec)

            pred = AssetPrediction(
                asset_id=wt_021.id,
                timestamp=now,
                failure_probability_pct=15.0, # baseline healthy, will jump to 87% in scenario simulation
                risk_level="Low",
                predicted_rul_days=45,
                contributing_factors={"vibration_mms": 1.95, "bearing_temp_c": 63.5, "rpm_stability": 98.2},
                recommendation_text="Asset operating within allowable baseline limits. Continue condition monitoring."
            )
            db.add(pred)

        if inv_042:
            pred_inv = AssetPrediction(
                asset_id=inv_042.id,
                timestamp=now,
                failure_probability_pct=43.0,
                risk_level="Medium",
                predicted_rul_days=18,
                contributing_factors={"igbt_temp_c": 74.0, "dc_ac_eff_drop": "-7.2%", "fan_rpm": 2100},
                recommendation_text="Inspect inverter cooling fan intake and clean heat-sink filters to prevent thermal derating."
            )
            db.add(pred_inv)

            alert_inv = Alert(
                asset_id=inv_042.id,
                park_id=banas_solar.id,
                timestamp=now - timedelta(minutes=45),
                severity="WARNING",
                title="INV-042 Inverter Core Temperature Warning",
                message="Inverter core temperature at 74°C under 885 W/m² irradiance. DC-to-AC conversion efficiency 88.2% (expected >97.5%).",
                evidence={"temperature_c": 74.0, "efficiency_pct": 88.2, "loss_kw": 285.0},
                root_cause="Restricted air cooling or dust buildup on inverter heat exchange fins.",
                suggested_action="Schedule maintenance crew to clean filter pads and verify cooling fan duty cycle.",
                is_acknowledged=False
            )
            db.add(alert_inv)

        # Baseline info alert
        alert_info = Alert(
            park_id=kutch_hybrid.id,
            timestamp=now - timedelta(hours=2),
            severity="INFO",
            title="BESS-01 Active Surplus Charging",
            message="Kutch Hybrid BESS charging at 12.0 MW from surplus solar-wind generation. Current SoC 68.5%.",
            evidence={"soc_pct": 68.5, "charge_mw": 12.0, "grid_demand_mw": 110.0},
            root_cause="Optimal grid dispatch: absorbing excess generation during midday solar peak.",
            suggested_action="Maintain battery charging until 85% SoC target is reached.",
            is_acknowledged=True,
            acknowledged_at=now - timedelta(hours=1)
        )
        db.add(alert_info)

        db.commit()
        print("Database initialized and seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
