"""Events routes — list, detail, update."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from app.database import get_collection
from app.schemas import EventCreate, EventUpdate, EventSummary

router = APIRouter(prefix="/api/events", tags=["events"])


def _doc_to_summary(doc: dict, db_col_map: dict) -> dict:
    """Merge event doc with computed aggregations."""
    eid = doc["_id"]
    return {
        "id": str(eid),
        "name": doc["name"],
        "event_date": doc["event_date"],
        "currency": doc.get("currency", "INR"),
        "budget_paise": doc.get("budget_paise", 0),
        "expense_total_paise": db_col_map.get("expense_total_paise", 0),
        "sponsor_committed_paise": db_col_map.get("sponsor_committed_paise", 0),
        "sponsor_received_paise": db_col_map.get("sponsor_received_paise", 0),
        "unpaid_balance_paise": db_col_map.get("unpaid_balance_paise", 0),
        "remaining_budget_paise": db_col_map.get("remaining_budget_paise", 0),
        "unresolved_findings": db_col_map.get("unresolved_findings", 0),
        "demo_flag": doc.get("demo_flag", False),
        "created_at": doc.get("created_at", datetime.now(timezone.utc)),
    }


async def _compute_summary(event_id: ObjectId) -> dict:
    expenses_col = get_collection("expenses")
    sponsors_col = get_collection("sponsors")
    findings_col = get_collection("findings")

    expense_agg = await expenses_col.aggregate([
        {"$match": {"event_id": event_id}},
        {"$group": {"_id": None, "total": {"$sum": "$amount_paise"}}},
    ]).to_list(1)
    expense_total = expense_agg[0]["total"] if expense_agg else 0

    sponsor_agg = await sponsors_col.aggregate([
        {"$match": {"event_id": event_id}},
        {"$group": {
            "_id": None,
            "committed": {"$sum": "$committed_paise"},
            "received": {"$sum": "$received_paise"},
        }},
    ]).to_list(1)
    committed = sponsor_agg[0]["committed"] if sponsor_agg else 0
    received = sponsor_agg[0]["received"] if sponsor_agg else 0

    unresolved = await findings_col.count_documents({
        "event_id": event_id,
        "status": "open",
    })

    events_col = get_collection("events")
    event = await events_col.find_one({"_id": event_id})
    budget = event.get("budget_paise", 0) if event else 0

    return {
        "expense_total_paise": expense_total,
        "sponsor_committed_paise": committed,
        "sponsor_received_paise": received,
        "unpaid_balance_paise": max(committed - received, 0),
        "remaining_budget_paise": budget - expense_total,
        "unresolved_findings": unresolved,
    }


@router.get("", response_model=list[EventSummary])
async def list_events():
    col = get_collection("events")
    docs = await col.find().to_list(100)
    result = []
    for doc in docs:
        summary = await _compute_summary(doc["_id"])
        result.append(_doc_to_summary(doc, summary))
    return result


@router.get("/{event_id}", response_model=EventSummary)
async def get_event(event_id: str):
    col = get_collection("events")
    try:
        oid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    doc = await col.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Event not found")
    summary = await _compute_summary(oid)
    return _doc_to_summary(doc, summary)


@router.patch("/{event_id}", response_model=EventSummary)
async def update_event(event_id: str, body: EventUpdate):
    col = get_collection("events")
    try:
        oid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "event_date" in update_data:
        update_data["event_date"] = str(update_data["event_date"])
    result = await col.find_one_and_update(
        {"_id": oid},
        {"$set": update_data},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    summary = await _compute_summary(oid)
    return _doc_to_summary(result, summary)
