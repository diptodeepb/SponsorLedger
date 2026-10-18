"""Pydantic request and response models for the SponsorLedger API."""
from __future__ import annotations
from datetime import datetime, date
from typing import Literal, Optional, Any
from pydantic import BaseModel, Field, field_validator, model_validator
from bson import ObjectId


# ---------------------------------------------------------------------------
# Helper: serialize ObjectId to str
# ---------------------------------------------------------------------------
def oid_str(v: Any) -> str:
    return str(v) if isinstance(v, ObjectId) else str(v)


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------
class EventCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    event_date: date
    currency: str = "USD"
    budget_paise: int = Field(..., ge=0)


class EventUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    event_date: Optional[date] = None
    currency: Optional[str] = Field(None, max_length=10)
    budget_paise: Optional[int] = Field(None, ge=0)


class EventSummary(BaseModel):
    id: str
    name: str
    event_date: date
    currency: str
    budget_paise: int
    expense_total_paise: int = 0
    sponsor_committed_paise: int = 0
    sponsor_received_paise: int = 0
    unpaid_balance_paise: int = 0
    remaining_budget_paise: int = 0
    unresolved_findings: int = 0
    demo_flag: bool = False
    created_at: datetime


# ---------------------------------------------------------------------------
# Sponsors
# ---------------------------------------------------------------------------
class SponsorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    committed_paise: int = Field(..., ge=0)
    received_paise: int = Field(0, ge=0)
    contact_label: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = Field(None, max_length=1000)


class SponsorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    committed_paise: Optional[int] = Field(None, ge=0)
    received_paise: Optional[int] = Field(None, ge=0)
    contact_label: Optional[str] = None
    notes: Optional[str] = None


class SponsorOut(BaseModel):
    id: str
    event_id: str
    name: str
    committed_paise: int
    received_paise: int
    contact_label: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    deliverables_count: int = 0


# ---------------------------------------------------------------------------
# Deliverables
# ---------------------------------------------------------------------------
class DeliverableCreate(BaseModel):
    sponsor_id: str
    description: str = Field(..., min_length=1, max_length=500)
    due_date: date
    status: Literal["pending", "completed", "waived"] = "pending"
    evidence_url: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)


class DeliverableUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    due_date: Optional[date] = None
    status: Optional[Literal["pending", "completed", "waived"]] = None
    evidence_url: Optional[str] = None
    notes: Optional[str] = None


class DeliverableOut(BaseModel):
    id: str
    event_id: str
    sponsor_id: str
    sponsor_name: Optional[str] = None
    description: str
    due_date: date
    status: str
    evidence_url: Optional[str] = None
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Expenses
# ---------------------------------------------------------------------------
class ExpenseCreate(BaseModel):
    date: date
    vendor: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=100)
    amount_paise: int = Field(..., gt=0)
    receipt_ref: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = Field(None, max_length=500)


class ExpenseOut(BaseModel):
    id: str
    event_id: str
    date: date
    vendor: str
    category: str
    amount_paise: int
    receipt_ref: Optional[str] = None
    notes: Optional[str] = None
    import_batch_id: Optional[str] = None
    source_row: Optional[int] = None
    created_at: datetime


# ---------------------------------------------------------------------------
# CSV Import
# ---------------------------------------------------------------------------
class CSVRowError(BaseModel):
    row: int
    error: str


class CSVRowWarning(BaseModel):
    row: int
    warning: str
    other_row: Optional[int] = None


class ImportPreviewResponse(BaseModel):
    accepted_count: int
    rejected_count: int
    accepted_rows: list[dict]
    rejected_rows: list[CSVRowError]
    duplicate_warnings: list[CSVRowWarning]
    import_token: str
    converted_csv: Optional[str] = None
    source_type: str = "csv"
    ai_converted: bool = False
    elapsed_ms: Optional[int] = None
    model_id: Optional[str] = None


class ImportConfirmRequest(BaseModel):
    import_token: str


# ---------------------------------------------------------------------------
# Findings
# ---------------------------------------------------------------------------
class SourceRef(BaseModel):
    type: str  # "expense" | "sponsor" | "deliverable"
    id: str


class FindingOut(BaseModel):
    id: str
    event_id: str
    audit_run_id: str
    rule_code: str
    severity: Literal["high", "medium", "low"]
    title: str
    explanation: str
    source_refs: list[SourceRef]
    suggested_action: Optional[str] = None
    status: Literal["open", "resolved", "dismissed"]
    created_at: datetime
    resolved_at: Optional[datetime] = None


class FindingUpdate(BaseModel):
    status: Literal["resolved", "dismissed"]


# ---------------------------------------------------------------------------
# AI Report
# ---------------------------------------------------------------------------
class ReportPriority(BaseModel):
    finding_id: str
    why_it_matters: str
    recommended_next_step: str


class ReportOut(BaseModel):
    id: str
    event_id: str
    generated_at: datetime
    totals_snapshot: dict
    findings_snapshot: list[dict]
    executive_summary: Optional[str] = None
    priorities: list[ReportPriority] = []
    closing_checklist: list[str] = []
    limitations: list[str] = []
    model_id: Optional[str] = None
    ai_status: str  # "ai_generated" | "fallback" | "pending"


# ---------------------------------------------------------------------------
# Misc
# ---------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str
    version: str
    db: str
