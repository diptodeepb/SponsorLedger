"""Tests for the CSV import service."""
import pytest
from app.services.csv_import import parse_and_validate_csv, _parse_paise, _parse_date
from datetime import date


VALID_CSV = b"""date,vendor,category,amount_inr,receipt_ref,notes
2026-09-01,Print House,Printing,4500,RCPT-001,Event banners
2026-09-02,Campus Catering,Food,8200,RCPT-002,Volunteer meals
2026-09-03,Unknown Vendor,Logistics,1800,,No receipt
"""

DUPLICATE_CSV = b"""date,vendor,category,amount_inr,receipt_ref,notes
2026-09-01,Print House,Printing,4500,RCPT-001,First
2026-09-01,Print House,Printing,4500,RCPT-001,Duplicate
"""

MISSING_COLUMN_CSV = b"""date,vendor,amount_inr
2026-09-01,Vendor,1000
"""

BAD_DATE_CSV = b"""date,vendor,category,amount_inr,receipt_ref,notes
not-a-date,Print House,Printing,4500,RCPT-001,
"""

NEGATIVE_AMOUNT_CSV = b"""date,vendor,category,amount_inr,receipt_ref,notes
2026-09-01,Print House,Printing,-1000,RCPT-001,
"""

ZERO_AMOUNT_CSV = b"""date,vendor,category,amount_inr,receipt_ref,notes
2026-09-01,Print House,Printing,0,RCPT-001,
"""


class TestParsePaise:
    def test_integer(self):
        assert _parse_paise("1000") == 100_000

    def test_decimal_two_places(self):
        assert _parse_paise("1234.56") == 123_456

    def test_decimal_one_place(self):
        assert _parse_paise("100.5") == 10_050

    def test_with_commas(self):
        assert _parse_paise("1,000") == 100_000

    def test_invalid_text(self):
        with pytest.raises(ValueError):
            _parse_paise("abc")

    def test_negative(self):
        with pytest.raises(ValueError):
            _parse_paise("-100")

    def test_zero(self):
        with pytest.raises(ValueError):
            _parse_paise("0")


class TestParseDate:
    def test_valid(self):
        assert _parse_date("2026-09-01") == date(2026, 9, 1)

    def test_invalid_format(self):
        with pytest.raises(ValueError):
            _parse_date("01/09/2026")

    def test_invalid_text(self):
        with pytest.raises(ValueError):
            _parse_date("not-a-date")


class TestParseAndValidateCsv:
    def test_valid_csv(self):
        result = parse_and_validate_csv(VALID_CSV)
        assert result["accepted"] is not None
        assert len(result["accepted"]) == 3
        assert len(result["errors"]) == 0

    def test_amount_converted_to_paise(self):
        result = parse_and_validate_csv(VALID_CSV)
        assert result["accepted"][0]["amount_paise"] == 4_50_000
        assert result["accepted"][1]["amount_paise"] == 8_20_000

    def test_duplicate_detected(self):
        result = parse_and_validate_csv(DUPLICATE_CSV)
        assert len(result["duplicate_warnings"]) > 0

    def test_missing_column_raises(self):
        with pytest.raises(ValueError, match="Missing required columns"):
            parse_and_validate_csv(MISSING_COLUMN_CSV)

    def test_bad_date_goes_to_errors(self):
        result = parse_and_validate_csv(BAD_DATE_CSV)
        assert len(result["errors"]) == 1
        assert len(result["accepted"]) == 0

    def test_negative_amount_rejected(self):
        result = parse_and_validate_csv(NEGATIVE_AMOUNT_CSV)
        assert len(result["errors"]) == 1

    def test_zero_amount_rejected(self):
        result = parse_and_validate_csv(ZERO_AMOUNT_CSV)
        assert len(result["errors"]) == 1

    def test_import_token_generated(self):
        result = parse_and_validate_csv(VALID_CSV)
        assert len(result["import_token"]) > 0

    def test_file_too_large(self):
        large = b"a" * (1024 * 1024 + 1)
        with pytest.raises(ValueError, match="1 MB"):
            parse_and_validate_csv(large)

    def test_empty_receipt_ref_allowed(self):
        result = parse_and_validate_csv(VALID_CSV)
        # Third row has no receipt_ref
        assert result["accepted"][2]["receipt_ref"] is None
