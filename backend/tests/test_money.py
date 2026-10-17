"""Tests for money helpers — paise conversion correctness."""
import pytest
from decimal import Decimal
from app.services.csv_import import _parse_paise


class TestMoneyHelpers:
    """Verify that monetary parsing produces exact integer paise values."""

    CASES = [
        ("0.01", 1),            # ₹0.01 = 1 paise
        ("1", 100),             # ₹1 = 100 paise
        ("1.00", 100),
        ("1.50", 150),
        ("1234.56", 123456),
        ("9999.99", 999999),
        ("10000", 1000000),
        ("100000.00", 10000000),
    ]

    @pytest.mark.parametrize("raw,expected", CASES)
    def test_exact_paise(self, raw: str, expected: int):
        result = _parse_paise(raw)
        assert result == expected, f"_parse_paise({raw!r}) = {result}, expected {expected}"

    def test_no_floating_point_error(self):
        # 0.1 + 0.2 ≠ 0.3 in IEEE 754 — our paise must be exact
        result = _parse_paise("0.10") + _parse_paise("0.20")
        assert result == _parse_paise("0.30")

    def test_large_value(self):
        # ₹1,00,000 = 10,000,000 paise
        assert _parse_paise("100000") == 10_000_000

    def test_negative_raises(self):
        with pytest.raises(ValueError):
            _parse_paise("-1")

    def test_zero_raises(self):
        with pytest.raises(ValueError):
            _parse_paise("0.00")

    def test_non_numeric_raises(self):
        with pytest.raises(ValueError):
            _parse_paise("one thousand")

    def test_comma_separated(self):
        assert _parse_paise("1,234.56") == 123456
