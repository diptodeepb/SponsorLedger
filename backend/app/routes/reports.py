"""Reports routes — generate AI/fallback report and export."""
from __future__ import annotations
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse, HTMLResponse
from app.database import get_collection
from app.schemas import ReportOut
from app.services.gemma_report import generate_report
from app.services.export_report import report_to_markdown, report_to_html

router = APIRouter(tags=["reports"])


def _doc_to_out(doc: dict) -> dict:
    priorities = doc.get("priorities", [])
    # Normalize priorities to ensure they match schema
    normalized_priorities = []
    for p in priorities:
        normalized_priorities.append({
            "finding_id": p.get("finding_id", ""),
            "why_it_matters": p.get("why_it_matters", ""),
            "recommended_next_step": p.get("recommended_next_step", ""),
        })
    return {
        "id": str(doc["_id"]),
        "event_id": str(doc["event_id"]),
        "generated_at": doc.get("generated_at", datetime.now(timezone.utc)),
        "totals_snapshot": doc.get("totals_snapshot", {}),
        "findings_snapshot": doc.get("findings_snapshot", []),
        "executive_summary": doc.get("executive_summary"),
        "priorities": normalized_priorities,
        "closing_checklist": doc.get("closing_checklist", []),
        "limitations": doc.get("limitations", []),
        "model_id": doc.get("model_id"),
        "ai_status": doc.get("ai_status", "fallback"),
    }


@router.post("/api/events/{event_id}/report", response_model=ReportOut, status_code=201)
async def generate_event_report(event_id: str):
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
    findings_col = get_collection("findings")

    expenses = await expenses_col.find({"event_id": eid}).to_list(10000)
    sponsors = await sponsors_col.find({"event_id": eid}).to_list(1000)
    open_findings = await findings_col.find({"event_id": eid, "status": "open"}).to_list(1000)

    expense_total = sum(e.get("amount_paise", 0) for e in expenses)
    committed = sum(s.get("committed_paise", 0) for s in sponsors)
    received = sum(s.get("received_paise", 0) for s in sponsors)
    budget = event.get("budget_paise", 0)

    totals = {
        "budget_paise": budget,
        "expense_total_paise": expense_total,
        "sponsor_committed_paise": committed,
        "sponsor_received_paise": received,
        "unpaid_balance_paise": max(committed - received, 0),
        "remaining_budget_paise": budget - expense_total,
    }

    # Serialize findings for AI call (use string IDs)
    serialized_findings = [
        {
            "id": str(f["_id"]),
            "rule_code": f["rule_code"],
            "severity": f["severity"],
            "title": f["title"],
            "explanation": f["explanation"],
            "source_refs": f.get("source_refs", []),
            "suggested_action": f.get("suggested_action"),
        }
        for f in open_findings
    ]

    report_data, ai_status = await generate_report(event, totals, serialized_findings)

    from app.config import settings
    now = datetime.now(timezone.utc)
    doc = {
        "event_id": eid,
        "generated_at": now,
        "totals_snapshot": totals,
        "findings_snapshot": serialized_findings,
        "executive_summary": report_data.get("executive_summary"),
        "priorities": report_data.get("priorities", []),
        "closing_checklist": report_data.get("closing_checklist", []),
        "limitations": report_data.get("limitations", []),
        "model_id": settings.gemma_model if ai_status == "ai_generated" else None,
        "ai_status": ai_status,
    }

    reports_col = get_collection("audit_reports")
    result = await reports_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_out(doc)


@router.get("/api/events/{event_id}/reports", response_model=list[ReportOut])
async def list_event_reports(event_id: str):
    try:
        eid = ObjectId(event_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    col = get_collection("audit_reports")
    docs = await col.find({"event_id": eid}).sort("generated_at", -1).to_list(50)
    return [_doc_to_out(d) for d in docs]


@router.get("/api/reports/{report_id}", response_model=ReportOut)
async def get_report(report_id: str):
    try:
        rid = ObjectId(report_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid report ID")
    col = get_collection("audit_reports")
    doc = await col.find_one({"_id": rid})
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")
    return _doc_to_out(doc)


@router.get("/api/reports/{report_id}/export")
async def export_report(report_id: str, format: str = "markdown"):
    try:
        rid = ObjectId(report_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid report ID")
    col = get_collection("audit_reports")
    doc = await col.find_one({"_id": rid})
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")

    events_col = get_collection("events")
    event = await events_col.find_one({"_id": doc["event_id"]})
    event_data = event or {"name": "Event"}

    report_data = _doc_to_out(doc)

    if format == "html":
        html = report_to_html(report_data, event_data)
        return HTMLResponse(content=html, headers={
            "Content-Disposition": f"attachment; filename=sponsorledger-report-{report_id}.html"
        })
    else:
        md = report_to_markdown(report_data, event_data)
        return PlainTextResponse(content=md, headers={
            "Content-Disposition": f"attachment; filename=sponsorledger-report-{report_id}.md",
            "Content-Type": "text/markdown; charset=utf-8",
        })
