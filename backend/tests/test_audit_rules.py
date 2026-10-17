"""Tests for the deterministic audit rules engine."""
from datetime import date, timedelta
from unittest.mock import MagicMock
from bson import ObjectId

import pytest
from app.services.audit_rules import (
    check_budget_overrun,
    check_missing_receipts,
    check_overdue_deliverables,
    check_possible_duplicates,
    check_sponsor_balances,
    run_audit,
)


def _expense(amount_paise: int, vendor: str = "Vendor", receipt: str = "RCPT-1", date_val: date = date(2026, 9, 1), category: str = "Food") -> dict:
    return {
        "_id": ObjectId(),
        "amount_paise": amount_paise,
        "vendor": vendor,
        "receipt_ref": receipt,
        "date": date_val,
        "category": category,
    }


def _sponsor(committed: int, received: int, name: str = "Sponsor A") -> dict:
    return {
        "_id": ObjectId(),
        "name": name,
        "committed_paise": committed,
        "received_paise": received,
    }


def _deliverable(due_date: date, status: str = "pending", description: str = "Task") -> dict:
    return {
        "_id": ObjectId(),
        "due_date": due_date,
        "status": status,
        "description": description,
    }


def _event(budget: int) -> dict:
    return {"_id": ObjectId(), "budget_paise": budget}


# ---------------------------------------------------------------------------
# Budget overrun
# ---------------------------------------------------------------------------
class TestBudgetOverrun:
    def test_no_overrun(self):
        event = _event(10_000)
        expenses = [_expense(5_000), _expense(4_000)]
        assert check_budget_overrun(event, expenses) is None

    def test_equal_budget(self):
        event = _event(9_000)
        expenses = [_expense(5_000), _expense(4_000)]
        assert check_budget_overrun(event, expenses) is None

    def test_overrun_detected(self):
        event = _event(9_000)
        expenses = [_expense(5_000), _expense(5_000)]
        result = check_budget_overrun(event, expenses)
        assert result is not None
        assert result["rule_code"] == "BUDGET_OVERRUN"
        assert result["severity"] == "high"
        assert len(result["source_refs"]) == 2

    def test_empty_expenses(self):
        event = _event(1_000)
        assert check_budget_overrun(event, []) is None


# ---------------------------------------------------------------------------
# Sponsor balances
# ---------------------------------------------------------------------------
class TestSponsorBalances:
    def test_balance_due_high(self):
        sponsors = [_sponsor(200_000, 0)]
        findings = check_sponsor_balances(sponsors)
        assert len(findings) == 1
        assert findings[0]["rule_code"] == "SPONSOR_BALANCE_DUE"
        assert findings[0]["severity"] == "high"

    def test_balance_due_medium(self):
        sponsors = [_sponsor(50_000, 0)]
        findings = check_sponsor_balances(sponsors)
        assert len(findings) == 1
        assert findings[0]["severity"] == "medium"

    def test_fully_paid(self):
        sponsors = [_sponsor(100_000, 100_000)]
        assert check_sponsor_balances(sponsors) == []

    def test_overpayment(self):
        sponsors = [_sponsor(100_000, 150_000)]
        findings = check_sponsor_balances(sponsors)
        assert len(findings) == 1
        assert findings[0]["rule_code"] == "SPONSOR_OVERPAYMENT"
        assert findings[0]["severity"] == "medium"


# ---------------------------------------------------------------------------
# Missing receipts
# ---------------------------------------------------------------------------
class TestMissingReceipts:
    def test_all_have_receipts(self):
        expenses = [_expense(1000, receipt="RCPT-1"), _expense(2000, receipt="RCPT-2")]
        assert check_missing_receipts(expenses) == []

    def test_missing_detected(self):
        expenses = [_expense(1000, receipt=""), _expense(2000, receipt="RCPT-2")]
        findings = check_missing_receipts(expenses)
        assert len(findings) == 1
        assert findings[0]["rule_code"] == "MISSING_RECEIPT_REF"

    def test_none_receipt(self):
        exp = _expense(1000)
        exp["receipt_ref"] = None
        findings = check_missing_receipts([exp])
        assert len(findings) == 1


# ---------------------------------------------------------------------------
# Duplicate detection
# ---------------------------------------------------------------------------
class TestDuplicates:
    def test_same_receipt_ref(self):
        e1 = _expense(1000, vendor="Shop", receipt="RCPT-X", date_val=date(2026, 9, 1))
        e2 = _expense(1000, vendor="Shop B", receipt="RCPT-X", date_val=date(2026, 9, 5))
        findings = check_possible_duplicates([e1, e2])
        assert any(f["rule_code"] == "POSSIBLE_DUPLICATE" for f in findings)

    def test_same_vendor_amount_nearby_date(self):
        e1 = _expense(5000, vendor="Print House", receipt="RCPT-1", date_val=date(2026, 9, 1))
        e2 = _expense(5000, vendor="Print House", receipt="RCPT-2", date_val=date(2026, 9, 2))
        findings = check_possible_duplicates([e1, e2])
        assert any(f["rule_code"] == "POSSIBLE_DUPLICATE" for f in findings)

    def test_different_amounts_no_duplicate(self):
        e1 = _expense(5000, vendor="Shop", receipt="R1", date_val=date(2026, 9, 1))
        e2 = _expense(6000, vendor="Shop", receipt="R2", date_val=date(2026, 9, 2))
        findings = check_possible_duplicates([e1, e2])
        assert findings == []


# ---------------------------------------------------------------------------
# Overdue deliverables
# ---------------------------------------------------------------------------
class TestOverdueDeliverables:
    def test_overdue_detected(self):
        due = date.today() - timedelta(days=5)
        deliverables = [_deliverable(due_date=due, status="pending")]
        findings = check_overdue_deliverables(deliverables)
        assert len(findings) == 1
        assert findings[0]["rule_code"] == "DELIVERABLE_OVERDUE"

    def test_not_overdue(self):
        due = date.today() + timedelta(days=5)
        deliverables = [_deliverable(due_date=due, status="pending")]
        assert check_overdue_deliverables(deliverables) == []

    def test_completed_not_flagged(self):
        due = date.today() - timedelta(days=5)
        deliverables = [_deliverable(due_date=due, status="completed")]
        assert check_overdue_deliverables(deliverables) == []

    def test_waived_not_flagged(self):
        due = date.today() - timedelta(days=5)
        deliverables = [_deliverable(due_date=due, status="waived")]
        assert check_overdue_deliverables(deliverables) == []


# ---------------------------------------------------------------------------
# Full run_audit
# ---------------------------------------------------------------------------
class TestRunAudit:
    def test_full_run_returns_list(self):
        event = _event(10_000)
        expenses = [_expense(5_000), _expense(3_000, receipt="")]
        sponsors = [_sponsor(8_000, 5_000)]
        deliverables = [_deliverable(date.today() - timedelta(days=1), "pending")]
        findings = run_audit(event, expenses, sponsors, deliverables)
        assert isinstance(findings, list)
        rule_codes = {f["rule_code"] for f in findings}
        assert "MISSING_RECEIPT_REF" in rule_codes
        assert "SPONSOR_BALANCE_DUE" in rule_codes
        assert "DELIVERABLE_OVERDUE" in rule_codes
