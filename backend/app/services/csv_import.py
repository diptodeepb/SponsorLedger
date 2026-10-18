"""CSV import service: parse, validate, preview, and persist expense rows."""
from __future__ import annotations
import csv
import hashlib
import io
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any

REQUIRED_HEADERS = {"date", "vendor", "category", "amount_inr"}
MAX_ROWS = 2000
MAX_BYTES = 1_048_576  # 1 MB


def _parse_paise(raw: str) -> int:
    """Convert '1234.56' or '1234' to integer paise. Raises ValueError on failure."""
    raw = raw.strip().replace(",", "")
    try:
        d = Decimal(raw)
    except InvalidOperation:
        raise ValueError(f"'{raw}' is not a valid amount")
    if d <= 0:
        raise ValueError("Amount must be positive")
    # Round to 2 decimal places and convert to paise
    paise = int((d * 100).to_integral_value())
    return paise


def _parse_date(raw: str) -> date:
    raw = raw.strip()
    try:
        return date.fromisoformat(raw)
    except ValueError:
        raise ValueError(f"'{raw}' is not a valid date (expected YYYY-MM-DD)")


def parse_and_validate_csv(content: bytes) -> dict:
    """
    Parse CSV bytes, validate rows, return a preview dict:
    {
        accepted: list[dict],
        errors: list[{row, error}],
        duplicate_warnings: list[{row, warning, other_row}],
        import_token: str,
    }
    """
    if len(content) > MAX_BYTES:
        raise ValueError("File exceeds 1 MB limit")

    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        raise ValueError("File must be UTF-8 encoded")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise ValueError("CSV has no headers")

    # Normalise header names
    headers = {h.strip().lower() for h in reader.fieldnames}
    missing = REQUIRED_HEADERS - headers
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(sorted(missing))}")

    accepted: list[dict] = []
    errors: list[dict] = []
    duplicate_warnings: list[dict] = []

    # For duplicate detection within this batch
    seen_vendor_amount_date: dict[tuple, int] = {}
    seen_receipt_refs: dict[str, int] = {}

    for row_num, raw_row in enumerate(reader, start=2):  # row 1 = header
        if row_num > MAX_ROWS + 1:
            errors.append({"row": row_num, "error": "Row limit (2000) exceeded; truncated."})
            break

        # Normalise keys
        row = {k.strip().lower(): (v.strip() if v else "") for k, v in raw_row.items()}

        row_errors = []

        # Required fields
        vendor = row.get("vendor", "").strip()
        if not vendor:
            row_errors.append("vendor is required")
        elif len(vendor) > 200:
            row_errors.append("vendor exceeds 200 characters")

        category = row.get("category", "").strip()
        if not category:
            row_errors.append("category is required")

        raw_date = row.get("date", "")
        parsed_date = None
        try:
            parsed_date = _parse_date(raw_date)
        except ValueError as exc:
            row_errors.append(f"date: {exc}")

        raw_amount = row.get("amount_inr", "")
        parsed_paise = None
        try:
            parsed_paise = _parse_paise(raw_amount)
        except ValueError as exc:
            row_errors.append(f"amount_inr: {exc}")

        receipt_ref = row.get("receipt_ref", "").strip()
        notes = row.get("notes", "").strip()

        if row_errors:
            errors.append({"row": row_num, "error": "; ".join(row_errors)})
            continue

        # Duplicate detection within batch
        key = (vendor.strip().lower(), parsed_paise, str(parsed_date))
        if key in seen_vendor_amount_date:
            duplicate_warnings.append({
                "row": row_num,
                "warning": "Same vendor, amount, and date as row",
                "other_row": seen_vendor_amount_date[key],
            })
        else:
            seen_vendor_amount_date[key] = row_num

        if receipt_ref and receipt_ref in seen_receipt_refs:
            duplicate_warnings.append({
                "row": row_num,
                "warning": "Same receipt reference as row",
                "other_row": seen_receipt_refs[receipt_ref],
            })
        elif receipt_ref:
            seen_receipt_refs[receipt_ref] = row_num

        accepted.append({
            "date": str(parsed_date),
            "vendor": vendor,
            "category": category,
            "amount_paise": parsed_paise,
            "receipt_ref": receipt_ref or None,
            "notes": notes or None,
            "source_row": row_num,
        })

    file_hash = hashlib.sha256(content).hexdigest()[:16]
    import_token = f"{file_hash}-{uuid.uuid4().hex[:8]}"

    return {
        "accepted": accepted,
        "errors": errors,
        "duplicate_warnings": duplicate_warnings,
        "import_token": import_token,
    }
