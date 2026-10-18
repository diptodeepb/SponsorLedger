"""Deterministic audit rules engine for event finances."""
from __future__ import annotations
from datetime import date, datetime, timezone
from typing import Any

from app.services.exchange_rates import FALLBACK_USD_RATES

CURRENCY_SYMBOLS = {
    "INR": "₹",
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
    "CAD": "CA$",
    "AUD": "A$",
    "JPY": "¥",
    "CHF": "CHF ",
    "SGD": "S$",
}


def _get_sym(currency: str = "USD") -> str:
    return CURRENCY_SYMBOLS.get((currency or "USD").upper(), f"{(currency or 'USD').upper()} ")


def format_money_for_audit(amount_paise: int, currency: str = "USD", rates: dict | None = None) -> str:
    cur = (currency or "USD").upper()
    sym = _get_sym(cur)
    r = rates or FALLBACK_USD_RATES
    inr_val = (amount_paise or 0) / 100.0
    if cur == "INR":
        return f"₹{inr_val:,.2f}"
    inr_rate = r.get("INR", 86.50)
    target_rate = r.get(cur, 1.0)
    val = (inr_val / inr_rate) * target_rate
    return f"{sym}{val:,.2f}"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _normalize(s: str) -> str:
    return s.strip().lower() if s else ""


def _today() -> date:
    return date.today()


# ---------------------------------------------------------------------------
# Core rule functions
# ---------------------------------------------------------------------------
def check_budget_overrun(
    event: dict, expenses: list[dict], rates: dict | None = None
) -> dict | None:
    budget = event.get("budget_paise", 0)
    total = sum(e.get("amount_paise", 0) for e in expenses)
    cur = (event.get("currency") or "USD").upper()
    if total > budget:
        diff = total - budget
        b_str = format_money_for_audit(budget, cur, rates)
        t_str = format_money_for_audit(total, cur, rates)
        d_str = format_money_for_audit(diff, cur, rates)
        return {
            "rule_code": "BUDGET_OVERRUN",
            "severity": "high",
            "title": "Budget exceeded",
            "explanation": (
                f"Recorded expenses total {t_str} against an allocated budget of "
                f"{b_str}. The overrun amount is {d_str}."
            ),
            "source_refs": [{"type": "expense", "id": str(e["_id"])} for e in expenses],
            "suggested_action": "Review expense categories and verify whether all rows are correctly recorded.",
        }
    return None


def check_sponsor_balances(
    sponsors: list[dict], currency: str = "USD", rates: dict | None = None
) -> list[dict]:
    findings = []
    cur = (currency or "USD").upper()
    for s in sponsors:
        committed = s.get("committed_paise", 0)
        received = s.get("received_paise", 0)
        sid = str(s["_id"])
        name = s.get("name", "Unknown")

        if committed > received:
            outstanding = committed - received
            c_str = format_money_for_audit(committed, cur, rates)
            r_str = format_money_for_audit(received, cur, rates)
            o_str = format_money_for_audit(outstanding, cur, rates)
            findings.append({
                "rule_code": "SPONSOR_BALANCE_DUE",
                "severity": "high" if outstanding > 100_000 else "medium",
                "title": f"Outstanding balance for {name}",
                "explanation": (
                    f"Sponsor '{name}' committed {c_str} but only "
                    f"{r_str} has been recorded as received. "
                    f"Outstanding balance: {o_str}."
                ),
                "source_refs": [{"type": "sponsor", "id": sid}],
                "suggested_action": "Confirm payment status with the sponsor and update the received amount.",
            })
        elif received > committed:
            excess = received - committed
            c_str = format_money_for_audit(committed, cur, rates)
            r_str = format_money_for_audit(received, cur, rates)
            e_str = format_money_for_audit(excess, cur, rates)
            findings.append({
                "rule_code": "SPONSOR_OVERPAYMENT",
                "severity": "medium",
                "title": f"Possible overpayment recorded for {name}",
                "explanation": (
                    f"Sponsor '{name}' received {r_str} which exceeds commitment "
                    f"of {c_str} by {e_str}. This may be an extra contribution "
                    f"or a duplicate receipt entry."
                ),
                "source_refs": [{"type": "sponsor", "id": sid}],
                "suggested_action": "Verify the recorded amounts and update the commitment if necessary.",
            })
    return findings


def check_missing_receipts(
    expenses: list[dict], currency: str = "USD", rates: dict | None = None
) -> list[dict]:
    findings = []
    cur = (currency or "USD").upper()
    for e in expenses:
        ref = e.get("receipt_ref") or ""
        if not ref.strip():
            amt_str = format_money_for_audit(e.get("amount_paise", 0), cur, rates)
            findings.append({
                "rule_code": "MISSING_RECEIPT_REF",
                "severity": "low",
                "title": "No receipt reference for expense",
                "explanation": (
                    f"Expense '{e.get('vendor', 'Unknown')}' on {e.get('date', '?')} "
                    f"({amt_str}) does not have an attached receipt reference number."
                ),
                "source_refs": [{"type": "expense", "id": str(e["_id"])}],
                "suggested_action": "Locate and record the receipt reference or note that it is unavailable.",
            })
    return findings


def check_possible_duplicates(
    expenses: list[dict], currency: str = "USD", rates: dict | None = None
) -> list[dict]:
    findings = []
    seen: list[dict] = []
    cur = (currency or "USD").upper()
    for e in expenses:
        vendor_n = _normalize(e.get("vendor", ""))
        amount = e.get("amount_paise", 0)
        receipt = (e.get("receipt_ref") or "").strip()
        e_date = e.get("date")
        e_id = str(e["_id"])

        for prev in seen:
            prev_id = str(prev["_id"])
            prev_vendor = _normalize(prev.get("vendor", ""))
            prev_amount = prev.get("amount_paise", 0)
            prev_receipt = (prev.get("receipt_ref") or "").strip()
            prev_date = prev.get("date")

            # Same receipt ref (non-empty)
            if receipt and prev_receipt and receipt == prev_receipt:
                findings.append({
                    "rule_code": "POSSIBLE_DUPLICATE",
                    "severity": "medium",
                    "title": "Possible duplicate: same receipt reference",
                    "explanation": (
                        f"Expenses from '{e.get('vendor')}' and '{prev.get('vendor')}' "
                        f"share receipt reference '{receipt}'. Verify whether both are distinct expenses."
                    ),
                    "source_refs": [
                        {"type": "expense", "id": e_id},
                        {"type": "expense", "id": prev_id},
                    ],
                    "suggested_action": "Compare the two expense rows and retain or remove the duplicate.",
                })
                continue

            # Same vendor + amount + date within 1 day
            if vendor_n and vendor_n == prev_vendor and amount == prev_amount:
                try:
                    d1 = e_date if isinstance(e_date, date) else date.fromisoformat(str(e_date))
                    d2 = prev_date if isinstance(prev_date, date) else date.fromisoformat(str(prev_date))
                    if abs((d1 - d2).days) <= 1:
                        amt_str = format_money_for_audit(amount, cur, rates)
                        findings.append({
                            "rule_code": "POSSIBLE_DUPLICATE",
                            "severity": "medium",
                            "title": "Possible duplicate: same vendor, amount, and nearby date",
                            "explanation": (
                                f"Two expenses from '{e.get('vendor')}' for "
                                f"{amt_str} occurred on nearby dates ({d2} and {d1}). "
                                "These may be the same expense entered twice."
                            ),
                            "source_refs": [
                                {"type": "expense", "id": e_id},
                                {"type": "expense", "id": prev_id},
                            ],
                            "suggested_action": "Confirm whether both expenses are valid by comparing receipts.",
                        })
                except (ValueError, TypeError):
                    pass

        seen.append(e)
    return findings


def check_overdue_deliverables(deliverables: list[dict]) -> list[dict]:
    today = _today()
    findings = []
    for d in deliverables:
        status = d.get("status", "pending")
        due_raw = d.get("due_date")
        if status != "pending" or not due_raw:
            continue
        try:
            due = due_raw if isinstance(due_raw, date) else date.fromisoformat(str(due_raw))
        except (ValueError, TypeError):
            continue
        if due < today:
            days_over = (today - due).days
            findings.append({
                "rule_code": "DELIVERABLE_OVERDUE",
                "severity": "medium",
                "title": f"Deliverable overdue by {days_over} day(s)",
                "explanation": (
                    f"Deliverable '{d.get('description', 'Unknown')}' was due on {due} "
                    f"and is still pending ({days_over} day(s) overdue)."
                ),
                "source_refs": [{"type": "deliverable", "id": str(d["_id"])}],
                "suggested_action": "Update the deliverable status or confirm completion with the sponsor.",
            })
    return findings


def check_missing_categories(expenses: list[dict]) -> list[dict]:
    findings = []
    for e in expenses:
        cat = (e.get("category") or "").strip().lower()
        if not cat or cat in ("unknown", "other", ""):
            findings.append({
                "rule_code": "MISSING_CATEGORY",
                "severity": "low",
                "title": "Expense has no category",
                "explanation": (
                    f"Expense '{e.get('vendor', 'Unknown')}' on {e.get('date', '?')} "
                    "has no category or is categorised as Unknown."
                ),
                "source_refs": [{"type": "expense", "id": str(e["_id"])}],
                "suggested_action": "Assign an appropriate expense category.",
            })
    return findings


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------
def run_audit(
    event: dict,
    expenses: list[dict],
    sponsors: list[dict],
    deliverables: list[dict],
    rates: dict | None = None,
) -> list[dict]:
    """Run all deterministic rules and return a flat list of finding dicts."""
    from bson import ObjectId

    # Ensure every record has an _id so source_refs can be built
    def _ensure_id(records: list[dict]) -> list[dict]:
        for r in records:
            if "_id" not in r:
                r["_id"] = ObjectId()
        return records

    expenses = _ensure_id(expenses)
    sponsors = _ensure_id(sponsors)
    deliverables = _ensure_id(deliverables)

    findings: list[dict] = []

    cur = (event.get("currency") or "USD").upper()
    result = check_budget_overrun(event, expenses, rates)
    if result:
        findings.append(result)

    findings.extend(check_sponsor_balances(sponsors, cur, rates))
    findings.extend(check_missing_receipts(expenses, cur, rates))
    findings.extend(check_possible_duplicates(expenses, cur, rates))
    findings.extend(check_overdue_deliverables(deliverables))
    findings.extend(check_missing_categories(expenses))

    return findings
