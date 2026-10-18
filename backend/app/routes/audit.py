"""Audit routes: run audit and manage findings."""
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


def _finding_identity_key(rule_code: str, source_refs: list[dict] | None) -> tuple:
    refs = tuple(sorted(
        (str(r.get("type", "")), str(r.get("id", "")))
        for r in (source_refs or [])
    ))
    return (rule_code, refs)


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

    from app.services.exchange_rates import get_exchange_rates, FALLBACK_USD_RATES
    rates_data = await get_exchange_rates()
    rates = rates_data.get("rates", FALLBACK_USD_RATES)

    raw_findings = run_audit(event, expenses, sponsors, deliverables, rates=rates)

    audit_run_id = uuid.uuid4().hex
    now = datetime.now(timezone.utc)

    findings_col = get_collection("findings")
    existing_docs = await findings_col.find({"event_id": eid}).to_list(10000)

    # Clean up any redundant duplicate open findings already in DB from prior runs
    seen_open_keys = {}
    redundant_ids = []
    for d in existing_docs:
        if d.get("status") == "open":
            k = _finding_identity_key(d["rule_code"], d.get("source_refs", []))
            if k in seen_open_keys:
                redundant_ids.append(d["_id"])
            else:
                seen_open_keys[k] = d

    if redundant_ids:
        await findings_col.delete_many({"_id": {"$in": redundant_ids}})
        existing_docs = [d for d in existing_docs if d["_id"] not in redundant_ids]

    existing_open_map = {
        _finding_identity_key(d["rule_code"], d.get("source_refs", [])): d
        for d in existing_docs
        if d.get("status") == "open"
    }

    resolved_dismissed_keys = {
        _finding_identity_key(d["rule_code"], d.get("source_refs", []))
        for d in existing_docs
        if d.get("status") in ("resolved", "dismissed")
    }

    docs_to_insert = []
    duplicate_titles = []

    for f in raw_findings:
        k = _finding_identity_key(f["rule_code"], f.get("source_refs", []))
        if k in existing_open_map or k in resolved_dismissed_keys:
            duplicate_titles.append(f["title"])
            if k in existing_open_map:
                existing_doc = existing_open_map[k]
                if existing_doc.get("explanation") != f["explanation"]:
                    await findings_col.update_one(
                        {"_id": existing_doc["_id"]},
                        {"$set": {"explanation": f["explanation"], "audit_run_id": audit_run_id}}
                    )
                    existing_doc["explanation"] = f["explanation"]
            continue

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
        docs_to_insert.append(doc)
        existing_open_map[k] = doc

    if docs_to_insert:
        result = await findings_col.insert_many(docs_to_insert)
        for doc, inserted_id in zip(docs_to_insert, result.inserted_ids):
            doc["_id"] = inserted_id

    unique_duplicate_titles = list(dict.fromkeys(duplicate_titles))
    all_current = await findings_col.find({"event_id": eid}).sort("created_at", -1).to_list(5000)

    return {
        "audit_run_id": audit_run_id,
        "findings_created": len(docs_to_insert),
        "duplicates_count": len(duplicate_titles),
        "duplicates_skipped": unique_duplicate_titles,
        "duplicate_message": (
            f"Duplicate findings already identified: {', '.join(unique_duplicate_titles)}"
            if unique_duplicate_titles else None
        ),
        "findings": [_finding_doc_to_out(d) for d in all_current],
    }


@router.get("/api/events/{event_id}/findings", response_model=list[FindingOut])
async def list_findings(event_id: str):
    try:
        eid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    col = get_collection("findings")
    docs = await col.find({"event_id": eid}).sort("created_at", -1).to_list(5000)
    seen = set()
    unique_docs = []
    for d in docs:
        k = (d.get("status"), _finding_identity_key(d["rule_code"], d.get("source_refs", [])))
        if k in seen:
            continue
        seen.add(k)
        unique_docs.append(d)
    return [_finding_doc_to_out(d) for d in unique_docs]


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
