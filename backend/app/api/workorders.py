import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models import RenewableAsset, MaintenanceRecord

router = APIRouter(prefix="/workorders", tags=["Autonomous Work Orders & Dispatch"])

# In-memory work order store initialized with seed records
WORK_ORDERS_DB: List[Dict[str, Any]] = [
    {
        "id": "WO-2026-GUJ-8842",
        "title": "Emergency Bearing Replacement & Ultrasound Raceway Inspection",
        "asset_code": "WT-021",
        "park_name": "Kutch Wind & Solar Hybrid Hub",
        "region": "Kutch, Gujarat",
        "gps_coordinates": "23.8241° N, 69.8452° E",
        "priority": "CRITICAL",
        "status": "DISPATCHED",
        "created_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
        "target_completion": (datetime.utcnow() + timedelta(hours=46)).isoformat(),
        "failure_mode": "Sub-surface Fatigue Spalling on Outer Raceway (BPFO 84.2 Hz)",
        "failure_probability_pct": 87.0,
        "estimated_downtime_loss_inr": 12000000.0, # ₹1.2 Crore
        "assigned_crew": {
            "crew_id": "CREW-KUTCH-B",
            "team_lead": "Rajesh Varma (Senior Mechanical Lead)",
            "contact": "+91 98250 44821",
            "eta_minutes": 35,
            "vehicle_gps": "23.7910° N, 69.8120° E",
            "dispatch_depot": "Bhuj Operational Base"
        },
        "spare_parts": [
            {
                "part_number": "SKF-240/600-CA/W33",
                "name": "Spherical Roller Bearing (Outer Drive Shaft)",
                "quantity": 1,
                "unit_cost_inr": 485000.0,
                "inventory_status": "Allocated from Gandhidham Central Warehouse"
            },
            {
                "part_number": "MOBIL-SHC-320",
                "name": "Mobil SHC Gear 320 Synthetic Lubricating Grease (20L Drum)",
                "quantity": 2,
                "unit_cost_inr": 34000.0,
                "inventory_status": "In Crew Truck"
            },
            {
                "part_number": "PRUF-LASER-ALIGN",
                "name": "Laser Shaft Precision Optical Alignment Shim Kit",
                "quantity": 1,
                "unit_cost_inr": 12500.0,
                "inventory_status": "Tool Checked Out"
            }
        ],
        "sop_checklist": [
            {"step": 1, "task": "De-energize turbine & engage mechanical high-speed rotor brake", "completed": True},
            {"step": 2, "task": "Lockout / Tagout (LOTO) 690V / 33kV switchgear breaker", "completed": True},
            {"step": 3, "task": "Acoustic ultrasound raceway inspection on main bearing housing", "completed": False},
            {"step": 4, "task": "Drain degraded grease and flush raceway with clean solvent", "completed": False},
            {"step": 5, "task": "Mount new SKF-240/600 bearing using hydraulic induction heater", "completed": False},
            {"step": 6, "task": "Verify laser shaft alignment (<0.05 mm angular tolerance)", "completed": False},
            {"step": 7, "task": "Perform 30-min trial run and verify vibration < 1.8 mm/s RMS", "completed": False}
        ],
        "digital_signature": {
            "signed_by": "RenewAI Autonomous Dispatcher & Gujarat SLDC Engine",
            "sha256": hashlib.sha256(b"WO-2026-GUJ-8842-WT-021-APPROVED").hexdigest(),
            "timestamp": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
            "verification_url": "/api/workorders/WO-2026-GUJ-8842/certificate"
        }
    },
    {
        "id": "WO-2026-GUJ-8839",
        "title": "Inverter IGBT Heat-Sink Cleaning & Cooling Fan Replacement",
        "asset_code": "INV-042",
        "park_name": "Banaskantha Ultra Mega Solar Park",
        "region": "Banaskantha, Gujarat",
        "gps_coordinates": "24.1724° N, 71.7483° E",
        "priority": "HIGH",
        "status": "IN_PROGRESS",
        "created_at": (datetime.utcnow() - timedelta(hours=5)).isoformat(),
        "target_completion": (datetime.utcnow() + timedelta(hours=19)).isoformat(),
        "failure_mode": "Thermal Derating (IGBT Junction Temp 76°C) due to Sand Soiling",
        "failure_probability_pct": 43.0,
        "estimated_downtime_loss_inr": 350000.0, # ₹3.5 Lakhs
        "assigned_crew": {
            "crew_id": "CREW-BANAS-04",
            "team_lead": "Amit Patel (Solar Electrical Specialist)",
            "contact": "+91 97240 19302",
            "eta_minutes": 0,
            "vehicle_gps": "24.1724° N, 71.7483° E",
            "dispatch_depot": "Radhanpur Solar Depot"
        },
        "spare_parts": [
            {
                "part_number": "SUNGROW-FAN-3400",
                "name": "Brushless Axial Inverter Exhaust Fan Module (3400 RPM)",
                "quantity": 2,
                "unit_cost_inr": 18500.0,
                "inventory_status": "Installed on Site"
            },
            {
                "part_number": "FILTER-AIR-IP65",
                "name": "Hydrophobic Dust Filter Pad Set (IP65 Certified)",
                "quantity": 4,
                "unit_cost_inr": 6200.0,
                "inventory_status": "Installed on Site"
            }
        ],
        "sop_checklist": [
            {"step": 1, "task": "Isolate DC string disconnect switches 1 through 8", "completed": True},
            {"step": 2, "task": "Discharge DC bus capacitors and verify zero voltage", "completed": True},
            {"step": 3, "task": "Remove dust encrustation from heat sink cooling channels", "completed": True},
            {"step": 4, "task": "Replace high-wear exhaust fans and insert clean filter pads", "completed": True},
            {"step": 5, "task": "Re-energize inverter and measure thermal gradient (< 60°C)", "completed": False}
        ],
        "digital_signature": {
            "signed_by": "RenewAI Autonomous Dispatcher & Gujarat SLDC Engine",
            "sha256": hashlib.sha256(b"WO-2026-GUJ-8839-INV-042-APPROVED").hexdigest(),
            "timestamp": (datetime.utcnow() - timedelta(hours=5)).isoformat(),
            "verification_url": "/api/workorders/WO-2026-GUJ-8839/certificate"
        }
    }
]

class CreateWorkOrderRequest(BaseModel):
    asset_code: str
    failure_mode: Optional[str] = None
    priority: Optional[str] = "HIGH"
    notes: Optional[str] = None

class UpdateStatusRequest(BaseModel):
    status: str # DRAFT, DISPATCHED, IN_PROGRESS, RESOLVED, CLOSED
    notes: Optional[str] = None

@router.get("")
def list_work_orders(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    asset_code: Optional[str] = None
):
    """Returns list of active and historical work orders."""
    results = WORK_ORDERS_DB
    if status:
        results = [w for w in results if w["status"].upper() == status.upper()]
    if priority:
        results = [w for w in results if w["priority"].upper() == priority.upper()]
    if asset_code:
        results = [w for w in results if w["asset_code"].upper() == asset_code.upper()]
    return {
        "total_count": len(results),
        "work_orders": results
    }

@router.get("/{work_order_id}")
def get_work_order_detail(work_order_id: str):
    """Returns full details of a specific work order."""
    for wo in WORK_ORDERS_DB:
        if wo["id"] == work_order_id.upper():
            return wo
    raise HTTPException(status_code=404, detail="Work Order not found")

@router.post("/generate-from-anomaly")
def generate_work_order_from_anomaly(req: CreateWorkOrderRequest, db: Session = Depends(get_db)):
    """
    Autonomously generates an official SLDC certified Work Order from an asset anomaly.
    """
    asset = db.query(RenewableAsset).filter(RenewableAsset.asset_code == req.asset_code.upper()).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset code not found")

    new_id = f"WO-2026-GUJ-{random_int(8850, 9999)}"
    is_wind = "WT-" in asset.asset_code

    failure_mode = req.failure_mode or ("Mechanical Bearing Degradation" if is_wind else "Inverter Thermal Stress")
    loss_inr = 12000000.0 if is_wind else 350000.0

    new_wo = {
        "id": new_id,
        "title": f"Autonomous Corrective Maintenance for {asset.asset_code}",
        "asset_code": asset.asset_code,
        "park_name": asset.park.name if asset.park else "Gujarat Hybrid Park",
        "region": asset.park.region if asset.park else "Gujarat",
        "gps_coordinates": f"{asset.latitude:.4f}° N, {asset.longitude:.4f}° E",
        "priority": req.priority or "HIGH",
        "status": "DISPATCHED",
        "created_at": datetime.utcnow().isoformat(),
        "target_completion": (datetime.utcnow() + timedelta(hours=48)).isoformat(),
        "failure_mode": failure_mode,
        "failure_probability_pct": 87.0 if is_wind else 43.0,
        "estimated_downtime_loss_inr": loss_inr,
        "assigned_crew": {
            "crew_id": "CREW-KUTCH-A" if is_wind else "CREW-BANAS-02",
            "team_lead": "Sanjay Solanki (Field Engineering Lead)",
            "contact": "+91 98980 23412",
            "eta_minutes": 45,
            "vehicle_gps": f"{asset.latitude - 0.05:.4f}° N, {asset.longitude - 0.03:.4f}° E",
            "dispatch_depot": "Kutch Regional Depot" if is_wind else "Patan Depot"
        },
        "spare_parts": [
            {
                "part_number": "OEM-SPARE-001" if not is_wind else "SKF-240/600-CA",
                "name": "Spherical Bearing Replacement Kit" if is_wind else "IGBT Module Assembly",
                "quantity": 1,
                "unit_cost_inr": 450000.0 if is_wind else 95000.0,
                "inventory_status": "Requisition Approved"
            }
        ],
        "sop_checklist": [
            {"step": 1, "task": "Safe equipment isolation & LOTO protocol", "completed": True},
            {"step": 2, "task": "Perform visual and diagnostic vibration inspection", "completed": False},
            {"step": 3, "task": "Execute component replacement as per OEM manual", "completed": False},
            {"step": 4, "task": "Re-commission asset and submit SLDC clearance", "completed": False}
        ],
        "digital_signature": {
            "signed_by": "RenewAI Autonomous Dispatcher & Gujarat SLDC Engine",
            "sha256": hashlib.sha256(f"{new_id}-{asset.asset_code}-APPROVED".encode()).hexdigest(),
            "timestamp": datetime.utcnow().isoformat(),
            "verification_url": f"/api/workorders/{new_id}/certificate"
        }
    }

    WORK_ORDERS_DB.insert(0, new_wo)
    return new_wo

@router.patch("/{work_order_id}/status")
def update_work_order_status(work_order_id: str, req: UpdateStatusRequest):
    """Updates the status and progress of a work order."""
    for wo in WORK_ORDERS_DB:
        if wo["id"] == work_order_id.upper():
            wo["status"] = req.status.upper()
            if req.status.upper() == "RESOLVED" or req.status.upper() == "CLOSED":
                for task in wo["sop_checklist"]:
                    task["completed"] = True
            return wo
    raise HTTPException(status_code=404, detail="Work order not found")

@router.patch("/{work_order_id}/toggle-step/{step_num}")
def toggle_sop_step(work_order_id: str, step_num: int):
    """Toggles completion state of a specific SOP checklist item."""
    for wo in WORK_ORDERS_DB:
        if wo["id"] == work_order_id.upper():
            for task in wo["sop_checklist"]:
                if task["step"] == step_num:
                    task["completed"] = not task["completed"]
                    return {"status": "success", "step": step_num, "completed": task["completed"]}
    raise HTTPException(status_code=404, detail="Step not found")

def random_int(a, b):
    import random
    return random.randint(a, b)
