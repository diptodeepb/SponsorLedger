"""Tests for Gemma AI irregular text to CSV ingestion and preview."""
from unittest.mock import AsyncMock, MagicMock
import pytest
from app.services.gemma_txt_to_csv import (
    is_already_csv,
    convert_irregular_txt_to_csv,
    get_genai_client,
)
from app.services.csv_import import parse_and_validate_csv


def test_is_already_csv():
    assert is_already_csv("date,vendor,category,amount_inr\n2026-10-01,Acme,Swag,100") is True
    assert is_already_csv("DATE, VENDOR, CATEGORY, AMOUNT_INR, notes\n2026-10-01,Acme,Swag,100,hello") is True
    assert is_already_csv("Hey team, here are expenses: 100 rs to Acme") is False
    assert is_already_csv("") is False


@pytest.mark.asyncio
async def test_convert_irregular_txt_empty():
    with pytest.raises(ValueError, match="empty"):
        await convert_irregular_txt_to_csv(b"   \n  ")


@pytest.mark.asyncio
async def test_convert_already_csv_text():
    raw_csv = b"date,vendor,category,amount_inr,receipt_ref,notes\n2026-10-01,TestCo,AV,5000,R-1,Sample"
    csv_str, elapsed_ms, model_id = await convert_irregular_txt_to_csv(raw_csv)
    assert model_id == "direct_csv"
    assert "TestCo" in csv_str
    # Verify it parses cleanly with normal CSV parser
    res = parse_and_validate_csv(csv_str.encode("utf-8"))
    assert len(res["accepted"]) == 1
    assert res["accepted"][0]["vendor"] == "TestCo"


@pytest.mark.asyncio
async def test_convert_irregular_txt_missing_api_key(monkeypatch):
    monkeypatch.setattr("app.services.gemma_txt_to_csv.get_genai_client", lambda: None)
    with pytest.raises(ValueError, match="GEMINI_API_KEY is not configured"):
        await convert_irregular_txt_to_csv(b"Bought 50 lanyards from BadgeCraft for Rs 3500")


@pytest.mark.asyncio
async def test_convert_irregular_txt_mocked(monkeypatch):
    mock_response = MagicMock()
    mock_response.text = (
        '{"rows": [{"date": "2026-10-15", "vendor": "BadgeCraft", "category": "Swag", '
        '"amount_inr": "3500.00", "receipt_ref": "BC-99", "notes": "50 lanyards"}]}'
    )
    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)
    monkeypatch.setattr("app.services.gemma_txt_to_csv.get_genai_client", lambda: mock_client)

    csv_str, elapsed_ms, model_id = await convert_irregular_txt_to_csv(
        b"Bought 50 lanyards from BadgeCraft for Rs 3500"
    )
    assert "BadgeCraft" in csv_str
    assert "3500.00" in csv_str

    res = parse_and_validate_csv(csv_str.encode("utf-8"))
    assert len(res["accepted"]) == 1
    assert res["accepted"][0]["vendor"] == "BadgeCraft"


@pytest.mark.asyncio
async def test_convert_irregular_txt_live_gemma():
    if not get_genai_client():
        pytest.skip("GEMINI_API_KEY is not configured on this environment; skipping live Gemma test.")

    irregular_text = b"""
    Hey organizers, logging 2 purchases from this morning:
    - 2026-10-15: Bought 50 lanyards from BadgeCraft for Rs 3,500. Receipt ref: BC-99. Category is Swag.
    - 2026-10-16: Dominos catering for 12,000 INR. Category Catering. Ref DOM-112. Note: 30 pizzas.
    """
    csv_str, elapsed_ms, model_id = await convert_irregular_txt_to_csv(irregular_text)
    assert model_id != "direct_csv"
    assert elapsed_ms > 0
    assert "date,vendor,category,amount_inr" in csv_str.lower()

    # Run through the standard parse and validate pipeline
    res = parse_and_validate_csv(csv_str.encode("utf-8"))
    assert len(res["accepted"]) == 2
    vendors = [r["vendor"].lower() for r in res["accepted"]]
    assert any("badgecraft" in v for v in vendors)
    assert any("domino" in v for v in vendors)
