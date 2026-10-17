"""Tests for currency exchange rates and consistency using forex-python."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.exchange_rates import (
    get_exchange_rates,
    convert_currency_amount,
    get_currency_symbol,
    get_currency_name,
    SUPPORTED_CURRENCIES,
)


@pytest.mark.asyncio
async def test_get_exchange_rates_structure():
    data = await get_exchange_rates()
    assert data["base"] == "USD"
    assert "rates" in data
    rates = data["rates"]
    assert rates["USD"] == 1.0
    assert rates["INR"] > 0
    assert rates["EUR"] > 0
    for curr in SUPPORTED_CURRENCIES:
        assert curr in rates
        assert rates[curr] > 0


@pytest.mark.asyncio
async def test_conversion_consistency():
    data = await get_exchange_rates()
    rates = data["rates"]

    # 100 USD in INR, then back to USD
    usd_val = 100.0
    inr_rate = rates["INR"]
    inr_val = usd_val * inr_rate
    roundtrip_usd = inr_val / inr_rate
    assert round(roundtrip_usd, 4) == round(usd_val, 4)

    # 1000 EUR to JPY, then back to EUR
    eur_rate = rates["EUR"]
    jpy_rate = rates["JPY"]
    jpy_val = (1000.0 / eur_rate) * jpy_rate
    roundtrip_eur = (jpy_val / jpy_rate) * eur_rate
    assert round(roundtrip_eur, 4) == 1000.0


@pytest.mark.asyncio
async def test_forex_python_symbols_and_names():
    assert get_currency_symbol("USD") == "$"
    assert get_currency_symbol("INR") == "₹"
    assert get_currency_symbol("EUR") == "€"
    assert "dollar" in get_currency_name("USD").lower()
    assert "rupee" in get_currency_name("INR").lower()


@pytest.mark.asyncio
async def test_forex_python_conversion_helper():
    result = await convert_currency_amount(100.0, "USD", "INR")
    assert result["from_currency"] == "USD"
    assert result["to_currency"] == "INR"
    assert result["input_amount"] == 100.0
    assert result["converted_amount"] > 0
    assert result["rate"] > 0


@pytest.mark.asyncio
async def test_currency_rates_api_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/currency/rates")
        assert resp.status_code == 200
        body = resp.json()
        assert body["base"] == "USD"
        assert body["default"] == "USD"
        assert "INR" in body["supported"]
        assert "EUR" in body["supported"]
        assert body["rates"]["USD"] == 1.0
        assert body["rates"]["INR"] > 0


@pytest.mark.asyncio
async def test_currency_convert_api_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/currency/convert?amount=100&from_curr=USD&to_curr=INR")
        assert resp.status_code == 200
        body = resp.json()
        assert body["from_currency"] == "USD"
        assert body["to_currency"] == "INR"
        assert body["input_amount"] == 100.0
        assert body["converted_amount"] > 0
        assert body["from_symbol"] == "$"
        assert body["to_symbol"] == "₹"
