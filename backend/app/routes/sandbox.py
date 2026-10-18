"""Sandbox endpoints for guest session management (reset, clear, status)."""
from __future__ import annotations
from fastapi import APIRouter, Header, HTTPException

from app.services.sandbox import (
    get_or_create_guest_event,
    reset_guest_sandbox,
    clear_guest_sandbox_data,
)
from app.routes.events import _compute_summary, _doc_to_summary

router = APIRouter(prefix="/api/sandbox", tags=["sandbox"])


@router.get("/status")
async def get_sandbox_status(
    guest_session: str | None = Header(None, alias="X-Guest-Session"),
):
    if not guest_session:
        return {"guest_session": None, "is_sandbox": False}
    event = await get_or_create_guest_event(guest_session)
    summary = await _compute_summary(event["_id"])
    return {
        "guest_session": guest_session,
        "is_sandbox": True,
        "event": _doc_to_summary(event, summary),
    }


@router.post("/reset")
async def reset_sandbox(
    guest_session: str | None = Header(None, alias="X-Guest-Session"),
):
    if not guest_session:
        raise HTTPException(status_code=400, detail="X-Guest-Session header required")
    event = await reset_guest_sandbox(guest_session)
    summary = await _compute_summary(event["_id"])
    return {
        "status": "reset",
        "message": "Sandbox reset to pristine demo dataset",
        "event": _doc_to_summary(event, summary),
    }


@router.post("/clear")
async def clear_sandbox(
    guest_session: str | None = Header(None, alias="X-Guest-Session"),
):
    if not guest_session:
        raise HTTPException(status_code=400, detail="X-Guest-Session header required")
    event = await clear_guest_sandbox_data(guest_session)
    summary = await _compute_summary(event["_id"])
    return {
        "status": "cleared",
        "message": "All transactions and sponsors cleared. Ready for fresh imports.",
        "event": _doc_to_summary(event, summary),
    }
