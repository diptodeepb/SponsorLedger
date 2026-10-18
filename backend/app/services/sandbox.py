"""Sandbox service for guest session isolation, cloning, and resetting."""
from __future__ import annotations
from datetime import datetime, timezone
import logging
from bson import ObjectId

from app.database import get_collection

logger = logging.getLogger(__name__)

# Pristine sample dataset specification
TEMPLATE_EVENT = {
    "name": "Sample Tech Fest 2026",
    "event_date": "2026-11-15",
    "currency": "USD",
    "budget_paise": 25_00_000,   # $25,000 / ₹25,000
    "demo_flag": True,
}

TEMPLATE_SPONSORS = [
    {
        "name": "TechCorp Solutions",
        "committed_paise": 8_00_000,
        "received_paise": 6_00_000,
        "contact_label": "Arun Mehta",
        "notes": "Primary platinum sponsor",
    },
    {
        "name": "DevHub India",
        "committed_paise": 3_00_000,
        "received_paise": 3_00_000,
        "contact_label": "Priya Sharma",
        "notes": "Silver sponsor; branding deliverables agreed",
    },
]

TEMPLATE_DELIVERABLES = [
    {
        "sponsor_idx": 0,
        "description": "Logo on event banner and stage backdrop",
        "due_date": "2026-11-10",
        "status": "completed",
        "notes": "Banners delivered on time",
    },
    {
        "sponsor_idx": 0,
        "description": "Social media mention post-event",
        "due_date": "2026-11-20",
        "status": "pending",
        "notes": None,
    },
    {
        "sponsor_idx": 1,
        "description": "Sponsor booth at venue",
        "due_date": "2026-11-14",
        "status": "completed",
        "notes": "Booth set up successfully",
    },
]

TEMPLATE_EXPENSES = [
    {
        "date": "2026-09-01",
        "vendor": "Print House",
        "category": "Printing",
        "amount_paise": 4_50_000,
        "receipt_ref": "RCPT-001",
        "notes": "Event banners",
    },
    {
        "date": "2026-09-02",
        "vendor": "Campus Catering",
        "category": "Food",
        "amount_paise": 8_20_000,
        "receipt_ref": "RCPT-002",
        "notes": "Volunteer meals",
    },
    {
        "date": "2026-09-03",
        "vendor": "Unknown Vendor",
        "category": "Logistics",
        "amount_paise": 1_80_000,
        "receipt_ref": None,
        "notes": "No receipt reference entered",
    },
    {
        "date": "2026-09-03",
        "vendor": "Print House",
        "category": "Printing",
        "amount_paise": 4_50_000,
        "receipt_ref": "RCPT-001",
        "notes": "Possible duplicate sample row",
    },
    {
        "date": "2026-10-05",
        "vendor": "AV Solutions",
        "category": "Equipment",
        "amount_paise": 7_50_000,
        "receipt_ref": "RCPT-003",
        "notes": "Sound system rental",
    },
]


async def populate_demo_data(event_id: ObjectId, guest_session: str, now: datetime) -> None:
    """Inserts the pristine sample sponsors, deliverables, and expenses for an event."""
    from datetime import date

    # 1. Insert cloned sponsors
    sponsors_col = get_collection("sponsors")
    sponsor_ids: list[ObjectId] = []
    for sp in TEMPLATE_SPONSORS:
        s_res = await sponsors_col.insert_one({
            **sp,
            "event_id": event_id,
            "guest_session": guest_session,
            "created_at": now,
        })
        sponsor_ids.append(s_res.inserted_id)

    # 2. Insert cloned deliverables
    del_col = get_collection("deliverables")
    del_docs = []
    for d in TEMPLATE_DELIVERABLES:
        del_docs.append({
            "event_id": event_id,
            "sponsor_id": sponsor_ids[d["sponsor_idx"]],
            "description": d["description"],
            "due_date": d["due_date"],
            "status": d["status"],
            "evidence_url": None,
            "notes": d.get("notes"),
            "guest_session": guest_session,
        })
    if del_docs:
        await del_col.insert_many(del_docs)

    # 3. Insert cloned expenses
    exp_col = get_collection("expenses")
    exp_docs = []
    for ep in TEMPLATE_EXPENSES:
        raw_date = ep["date"]
        exp_docs.append({
            "event_id": event_id,
            "date": date.fromisoformat(raw_date) if isinstance(raw_date, str) else raw_date,
            "vendor": ep["vendor"],
            "category": ep["category"],
            "amount_paise": ep["amount_paise"],
            "receipt_ref": ep.get("receipt_ref"),
            "notes": ep.get("notes"),
            "guest_session": guest_session,
            "created_at": now,
        })
    if exp_docs:
        await exp_col.insert_many(exp_docs)


async def clone_demo_for_session(guest_session: str) -> dict:
    """Clones a fresh copy of the demo dataset isolated to a specific guest session."""
    events_col = get_collection("events")
    now = datetime.now(timezone.utc)

    # Insert cloned event
    event_doc = {
        **TEMPLATE_EVENT,
        "guest_session": guest_session,
        "created_at": now,
    }
    res = await events_col.insert_one(event_doc)
    event_id = res.inserted_id
    event_doc["_id"] = event_id

    # Populate sponsors, deliverables, expenses
    await populate_demo_data(event_id, guest_session, now)

    logger.info("Created isolated guest sandbox for session=%s with event_id=%s", guest_session, event_id)
    return event_doc


async def get_or_create_guest_event(guest_session: str) -> dict:
    """Finds an existing guest sandbox event, or clones a fresh one if none exists."""
    events_col = get_collection("events")
    existing = await events_col.find_one({"guest_session": guest_session})
    if existing:
        return existing
    return await clone_demo_for_session(guest_session)


async def reset_guest_sandbox(guest_session: str) -> dict:
    """Resets the guest sandbox by wiping child records and repopulating pristine demo data, preserving the event_id."""
    events_col = get_collection("events")
    now = datetime.now(timezone.utc)
    event = await events_col.find_one({"guest_session": guest_session})
    if event:
        eid = event["_id"]
        # Wipe existing child records
        await get_collection("expenses").delete_many({"$or": [{"event_id": eid}, {"guest_session": guest_session}]})
        await get_collection("sponsors").delete_many({"$or": [{"event_id": eid}, {"guest_session": guest_session}]})
        await get_collection("deliverables").delete_many({"$or": [{"event_id": eid}, {"guest_session": guest_session}]})
        await get_collection("findings").delete_many({"$or": [{"event_id": eid}, {"guest_session": guest_session}]})
        await get_collection("audit_reports").delete_many({"$or": [{"event_id": eid}, {"guest_session": guest_session}]})

        # Update event attributes back to template
        await events_col.update_one(
            {"_id": eid},
            {"$set": {
                **TEMPLATE_EVENT,
                "created_at": now,
            }},
        )
        # Repopulate child records with this exact same event_id
        await populate_demo_data(eid, guest_session, now)
        event.update(TEMPLATE_EVENT)
        logger.info("Reset guest sandbox preserving event_id=%s for session=%s", eid, guest_session)
        return event

    return await clone_demo_for_session(guest_session)


async def clear_guest_sandbox_data(guest_session: str) -> dict:
    """Wipes all transactions, sponsors, deliverables, findings, and reports in this sandbox,
    giving the user a completely empty ledger to test their own uploads clean."""
    event = await get_or_create_guest_event(guest_session)
    eid = event["_id"]

    await get_collection("expenses").delete_many({"$or": [{"event_id": eid}, {"guest_session": guest_session}]})
    await get_collection("sponsors").delete_many({"$or": [{"event_id": eid}, {"guest_session": guest_session}]})
    await get_collection("deliverables").delete_many({"$or": [{"event_id": eid}, {"guest_session": guest_session}]})
    await get_collection("findings").delete_many({"$or": [{"event_id": eid}, {"guest_session": guest_session}]})
    await get_collection("audit_reports").delete_many({"$or": [{"event_id": eid}, {"guest_session": guest_session}]})

    # Reset budget to 0 so ledger is completely clean
    events_col = get_collection("events")
    await events_col.update_one({"_id": eid}, {"$set": {"budget_paise": 0}})
    event["budget_paise"] = 0

    logger.info("Cleared all records and zeroed budget for guest sandbox session=%s (event_id=%s)", guest_session, eid)
    return event
