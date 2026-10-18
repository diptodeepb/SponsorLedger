"""Expenses routes: list, create, CSV import preview and confirm."""
from __future__ import annotations
import uuid
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, File, HTTPException, UploadFile
from app.database import get_collection
from app.schemas import ExpenseCreate, ExpenseOut, ImportPreviewResponse, ImportConfirmRequest
from app.services.csv_import import parse_and_validate_csv

router = APIRouter(tags=["expenses"])

# In-memory token → accepted rows (ephemeral; ok for MVP)
_import_tokens: dict[str, list[dict]] = {}


def _doc_to_out(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "event_id": str(doc["event_id"]),
        "date": doc["date"],
        "vendor": doc["vendor"],
        "category": doc["category"],
        "amount_paise": doc["amount_paise"],
        "receipt_ref": doc.get("receipt_ref"),
        "notes": doc.get("notes"),
        "import_batch_id": doc.get("import_batch_id"),
        "source_row": doc.get("source_row"),
        "created_at": doc.get("created_at", datetime.now(timezone.utc)),
    }


@router.get("/api/events/{event_id}/expenses", response_model=list[ExpenseOut])
async def list_expenses(event_id: str):
    try:
        eid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    col = get_collection("expenses")
    docs = await col.find({"event_id": eid}).sort("date", 1).to_list(5000)
    return [_doc_to_out(d) for d in docs]


@router.post("/api/events/{event_id}/expenses", response_model=ExpenseOut, status_code=201)
async def create_expense(event_id: str, body: ExpenseCreate):
    try:
        eid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    events_col = get_collection("events")
    if not await events_col.find_one({"_id": eid}):
        raise HTTPException(status_code=404, detail="Event not found")
    col = get_collection("expenses")
    now = datetime.now(timezone.utc)
    doc = {
        "event_id": eid,
        "date": str(body.date),
        "vendor": body.vendor,
        "category": body.category,
        "amount_paise": body.amount_paise,
        "receipt_ref": body.receipt_ref,
        "notes": body.notes,
        "created_at": now,
    }
    result = await col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc)


@router.post("/api/events/{event_id}/expenses/import/preview", response_model=ImportPreviewResponse)
async def import_preview(event_id: str, file: UploadFile = File(...)):
    try:
        eid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    events_col = get_collection("events")
    if not await events_col.find_one({"_id": eid}):
        raise HTTPException(status_code=404, detail="Event not found")

    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted")

    content = await file.read()
    try:
        result = parse_and_validate_csv(content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    token = result["import_token"]
    _import_tokens[token] = result["accepted"]

    return {
        "accepted_count": len(result["accepted"]),
        "rejected_count": len(result["errors"]),
        "accepted_rows": result["accepted"],
        "rejected_rows": result["errors"],
        "duplicate_warnings": result["duplicate_warnings"],
        "import_token": token,
    }


@router.post("/api/events/{event_id}/expenses/import/confirm", status_code=201)
async def import_confirm(event_id: str, body: ImportConfirmRequest):
    try:
        eid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")

    rows = _import_tokens.pop(body.import_token, None)
    if rows is None:
        raise HTTPException(status_code=400, detail="Invalid or expired import token")

    batch_id = uuid.uuid4().hex
    col = get_collection("expenses")
    now = datetime.now(timezone.utc)
    docs = []
    for row in rows:
        from datetime import date
        raw_date = row["date"]
        doc = {
            "event_id": eid,
            "date": date.fromisoformat(raw_date) if isinstance(raw_date, str) else raw_date,
            "vendor": row["vendor"],
            "category": row["category"],
            "amount_paise": row["amount_paise"],
            "receipt_ref": row.get("receipt_ref"),
            "notes": row.get("notes"),
            "import_batch_id": batch_id,
            "source_row": row.get("source_row"),
            "created_at": now,
        }
        docs.append(doc)

    if docs:
        await col.insert_many(docs)

    return {"imported": len(docs), "batch_id": batch_id}
