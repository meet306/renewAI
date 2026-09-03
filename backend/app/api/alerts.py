from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models import Alert
from backend.app.schemas.maintenance import AlertSchema

router = APIRouter(prefix="/alerts", tags=["Intelligent Alerts"])

@router.get("", response_model=List[AlertSchema])
def list_alerts(
    severity: Optional[str] = Query(None),
    is_acknowledged: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if severity:
        query = query.filter(Alert.severity == severity.upper())
    if is_acknowledged is not None:
        query = query.filter(Alert.is_acknowledged == is_acknowledged)

    alerts = query.order_by(Alert.timestamp.desc()).all()
    results = []
    for al in alerts:
        results.append({
            "id": al.id,
            "asset_id": al.asset_id,
            "asset_code": al.asset.asset_code if al.asset else None,
            "park_id": al.park_id,
            "park_name": al.park.name if al.park else None,
            "timestamp": al.timestamp,
            "severity": al.severity,
            "title": al.title,
            "message": al.message,
            "evidence": al.evidence or {},
            "root_cause": al.root_cause,
            "suggested_action": al.suggested_action,
            "is_acknowledged": al.is_acknowledged,
            "acknowledged_at": al.acknowledged_at
        })
    return results

@router.post("/{alert_id}/acknowledge", response_model=AlertSchema)
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db)):
    al = db.query(Alert).filter(Alert.id == alert_id).first()
    if not al:
        raise HTTPException(status_code=404, detail="Alert not found")

    al.is_acknowledged = True
    al.acknowledged_at = datetime.utcnow()
    db.commit()
    db.refresh(al)

    return {
        "id": al.id,
        "asset_id": al.asset_id,
        "asset_code": al.asset.asset_code if al.asset else None,
        "park_id": al.park_id,
        "park_name": al.park.name if al.park else None,
        "timestamp": al.timestamp,
        "severity": al.severity,
        "title": al.title,
        "message": al.message,
        "evidence": al.evidence or {},
        "root_cause": al.root_cause,
        "suggested_action": al.suggested_action,
        "is_acknowledged": al.is_acknowledged,
        "acknowledged_at": al.acknowledged_at
    }
