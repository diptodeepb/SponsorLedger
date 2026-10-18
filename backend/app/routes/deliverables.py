"""Deliverables routes: list, create, update."""
from __future__ import annotations
from bson import ObjectId
from fastapi import APIRouter, HTTPException
from app.database import get_collection
from app.schemas import DeliverableCreate, DeliverableUpdate, DeliverableOut

router = APIRouter(tags=["deliverables"])


def _doc_to_out(doc: dict, sponsor_name: str | None = None) -> dict:
    return {
        "id": str(doc["_id"]),
        "event_id": str(doc["event_id"]),
        "sponsor_id": str(doc["sponsor_id"]),
        "sponsor_name": sponsor_name,
        "description": doc["description"],
        "due_date": doc["due_date"],
        "status": doc.get("status", "pending"),
        "evidence_url": doc.get("evidence_url"),
        "notes": doc.get("notes"),
    }


@router.get("/api/events/{event_id}/deliverables", response_model=list[DeliverableOut])
async def list_deliverables(event_id: str):
    try:
        eid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    col = get_collection("deliverables")
    sponsors_col = get_collection("sponsors")
    docs = await col.find({"event_id": eid}).to_list(1000)
    result = []
    for doc in docs:
        sponsor = await sponsors_col.find_one({"_id": doc["sponsor_id"]})
        result.append(_doc_to_out(doc, sponsor["name"] if sponsor else None))
    return result


@router.post("/api/events/{event_id}/deliverables", response_model=DeliverableOut, status_code=201)
async def create_deliverable(event_id: str, body: DeliverableCreate):
    try:
        eid = ObjectId(event_id)
        sid = ObjectId(body.sponsor_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    events_col = get_collection("events")
    if not await events_col.find_one({"_id": eid}):
        raise HTTPException(status_code=404, detail="Event not found")
    sponsors_col = get_collection("sponsors")
    sponsor = await sponsors_col.find_one({"_id": sid, "event_id": eid})
    if not sponsor:
        raise HTTPException(status_code=404, detail="Sponsor not found in this event")
    col = get_collection("deliverables")
    doc = {
        "event_id": eid,
        "sponsor_id": sid,
        "description": body.description,
        "due_date": str(body.due_date),
        "status": body.status,
        "evidence_url": body.evidence_url,
        "notes": body.notes,
    }
    result = await col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc, sponsor["name"])


@router.patch("/api/deliverables/{deliverable_id}", response_model=DeliverableOut)
async def update_deliverable(deliverable_id: str, body: DeliverableUpdate):
    try:
        did = ObjectId(deliverable_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid deliverable ID")
    col = get_collection("deliverables")
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "due_date" in update_data:
        update_data["due_date"] = str(update_data["due_date"])
    result = await col.find_one_and_update(
        {"_id": did},
        {"$set": update_data},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    sponsors_col = get_collection("sponsors")
    sponsor = await sponsors_col.find_one({"_id": result["sponsor_id"]})
    return _doc_to_out(result, sponsor["name"] if sponsor else None)
