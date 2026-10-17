"""Audit routes — run audit and manage findings."""
from __future__ import annotations
import uuid
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from app.database import get_collection
from app.schemas import FindingOut, FindingUpdate
from app.services.audit_rules import run_audit

router = APIRouter(tags=["audit"])


def _finding_doc_to_out(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "event_id": str(doc["event_id"]),
        "audit_run_id": str(doc.get("audit_run_id", "")),
        "rule_code": doc["rule_code"],
        "severity": doc["severity"],
        "title": doc["title"],
        "explanation": doc["explanation"],
        "source_refs": doc.get("source_refs", []),
        "suggested_action": doc.get("suggested_action"),
        "status": doc.get("status", "open"),
        "created_at": doc.get("created_at", datetime.now(timezone.utc)),
        "resolved_at": doc.get("resolved_at"),
    }


@router.post("/api/events/{event_id}/audit", status_code=201)
async def run_event_audit(event_id: str):
    try:
        eid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")

    events_col = get_collection("events")
    event = await events_col.find_one({"_id": eid})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    expenses_col = get_collection("expenses")
    sponsors_col = get_collection("sponsors")
    deliverables_col = get_collection("deliverables")

    expenses = await expenses_col.find({"event_id": eid}).to_list(10000)
    sponsors = await sponsors_col.find({"event_id": eid}).to_list(1000)
    deliverables = await deliverables_col.find({"event_id": eid}).to_list(1000)

    raw_findings = run_audit(event, expenses, sponsors, deliverables)

    audit_run_id = uuid.uuid4().hex
    now = datetime.now(timezone.utc)

    findings_col = get_collection("findings")
    # Insert new findings; keep existing resolved/dismissed findings untouched
    docs = []
    for f in raw_findings:
        doc = {
            "event_id": eid,
            "audit_run_id": audit_run_id,
            "rule_code": f["rule_code"],
            "severity": f["severity"],
            "title": f["title"],
            "explanation": f["explanation"],
            "source_refs": f.get("source_refs", []),
            "suggested_action": f.get("suggested_action"),
            "status": "open",
            "created_at": now,
        }
        docs.append(doc)

    if docs:
        result = await findings_col.insert_many(docs)
        for doc, inserted_id in zip(docs, result.inserted_ids):
            doc["_id"] = inserted_id

    return {
        "audit_run_id": audit_run_id,
        "findings_created": len(docs),
        "findings": [_finding_doc_to_out(d) for d in docs],
    }


@router.get("/api/events/{event_id}/findings", response_model=list[FindingOut])
async def list_findings(event_id: str):
    try:
        eid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    col = get_collection("findings")
    docs = await col.find({"event_id": eid}).sort("created_at", -1).to_list(5000)
    return [_finding_doc_to_out(d) for d in docs]


@router.patch("/api/findings/{finding_id}", response_model=FindingOut)
async def update_finding(finding_id: str, body: FindingUpdate):
    try:
        fid = ObjectId(finding_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid finding ID")
    col = get_collection("findings")
    update = {"status": body.status}
    if body.status in ("resolved", "dismissed"):
        update["resolved_at"] = datetime.now(timezone.utc)
    result = await col.find_one_and_update(
        {"_id": fid},
        {"$set": update},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Finding not found")
    return _finding_doc_to_out(result)
