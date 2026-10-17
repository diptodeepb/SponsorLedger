"""Currency exchange rate routes using forex-python."""
from __future__ import annotations
from fastapi import APIRouter, Query
from app.services.exchange_rates import (
    get_exchange_rates,
    convert_currency_amount,
    get_currency_symbol,
    get_currency_name,
    SUPPORTED_CURRENCIES,
)

router = APIRouter(prefix="/api/currency", tags=["currency"])


@router.get("/rates")
async def get_rates():
    """Retrieve live exchange rates for top global currencies with USD as default base via forex-python."""
    data = await get_exchange_rates()
    return {
        "base": data.get("base", "USD"),
        "default": "USD",
        "supported": SUPPORTED_CURRENCIES,
        "rates": data.get("rates", {}),
        "source": data.get("source", "forex-python"),
    }


@router.get("/convert")
async def convert_currency(
    amount: float = Query(..., ge=0),
    from_curr: str = Query("USD"),
    to_curr: str = Query("INR"),
):
    """Utility endpoint to calculate consistent currency conversion via forex-python."""
    result = await convert_currency_amount(amount, from_curr, to_curr)
    # Enrich with forex-python symbols
    result["from_symbol"] = get_currency_symbol(from_curr)
    result["to_symbol"] = get_currency_symbol(to_curr)
    result["from_name"] = get_currency_name(from_curr)
    result["to_name"] = get_currency_name(to_curr)
    return result
