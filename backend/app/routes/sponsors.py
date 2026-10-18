"""Sponsors routes: CRUD per event."""
from __future__ import annotations
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from app.database import get_collection
from app.schemas import SponsorCreate, SponsorUpdate, SponsorOut

router = APIRouter(tags=["sponsors"])


def _doc_to_out(doc: dict, deliverables_count: int = 0) -> dict:
    return {
        "id": str(doc["_id"]),
        "event_id": str(doc["event_id"]),
        "name": doc["name"],
        "committed_paise": doc.get("committed_paise", 0),
        "received_paise": doc.get("received_paise", 0),
        "contact_label": doc.get("contact_label"),
        "notes": doc.get("notes"),
        "created_at": doc.get("created_at", datetime.now(timezone.utc)),
        "deliverables_count": deliverables_count,
    }


@router.get("/api/events/{event_id}/sponsors", response_model=list[SponsorOut])
async def list_sponsors(event_id: str):
    try:
        eid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    col = get_collection("sponsors")
    del_col = get_collection("deliverables")
    docs = await col.find({"event_id": eid}).sort("created_at", 1).to_list(1000)
    result = []
    for doc in docs:
        count = await del_col.count_documents({"sponsor_id": doc["_id"]})
        result.append(_doc_to_out(doc, count))
    return result


@router.post("/api/events/{event_id}/sponsors", response_model=SponsorOut, status_code=201)
async def create_sponsor(event_id: str, body: SponsorCreate):
    try:
        eid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    # Verify event exists
    events = get_collection("events")
    if not await events.find_one({"_id": eid}):
        raise HTTPException(status_code=404, detail="Event not found")
    col = get_collection("sponsors")
    doc = {
        "event_id": eid,
        "name": body.name,
        "committed_paise": body.committed_paise,
        "received_paise": body.received_paise,
        "contact_label": body.contact_label,
        "notes": body.notes,
        "created_at": datetime.now(timezone.utc),
    }
    result = await col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc)


@router.patch("/api/sponsors/{sponsor_id}", response_model=SponsorOut)
async def update_sponsor(sponsor_id: str, body: SponsorUpdate):
    try:
        sid = ObjectId(sponsor_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid sponsor ID")
    col = get_collection("sponsors")
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await col.find_one_and_update(
        {"_id": sid},
        {"$set": update_data},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Sponsor not found")
    del_col = get_collection("deliverables")
    count = await del_col.count_documents({"sponsor_id": sid})
    return _doc_to_out(result, count)


@router.delete("/api/sponsors/{sponsor_id}", status_code=204)
async def delete_sponsor(sponsor_id: str):
    try:
        sid = ObjectId(sponsor_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid sponsor ID")
    col = get_collection("sponsors")
    del_col = get_collection("deliverables")
    count = await del_col.count_documents({"sponsor_id": sid})
    if count > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Sponsor has {count} deliverable(s). Remove deliverables first or reassign them.",
        )
    result = await col.delete_one({"_id": sid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sponsor not found")
