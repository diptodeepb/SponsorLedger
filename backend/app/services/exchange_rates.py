"""Live exchange rate service using forex-python with in-memory caching and resilient fallback."""
from __future__ import annotations
import time
import asyncio
import logging
from typing import Any
from forex_python.converter import CurrencyRates, CurrencyCodes, RatesNotAvailableError

logger = logging.getLogger(__name__)

# Fallback rates relative to USD (safety net if upstream network provider is unreachable)
FALLBACK_USD_RATES: dict[str, float] = {
    "USD": 1.0,
    "INR": 86.50,
    "EUR": 0.92,
    "GBP": 0.79,
    "JPY": 153.20,
    "CAD": 1.38,
    "AUD": 1.54,
    "CHF": 0.88,
    "SGD": 1.32,
}

SUPPORTED_CURRENCIES = list(FALLBACK_USD_RATES.keys())

_currency_rates = CurrencyRates()
_currency_codes = CurrencyCodes()

_cached_rates: dict[str, Any] = {
    "base": "USD",
    "rates": FALLBACK_USD_RATES.copy(),
    "last_fetched": 0.0,
    "source": "fallback",
}

CACHE_TTL_SECONDS = 3600  # 1 hour


def get_currency_symbol(code: str) -> str:
    """Return currency symbol via forex-python CurrencyCodes."""
    try:
        sym = _currency_codes.get_symbol(code.upper())
        return sym if sym else code.upper()
    except Exception:
        return code.upper()


def get_currency_name(code: str) -> str:
    """Return currency descriptive name via forex-python CurrencyCodes."""
    try:
        name = _currency_codes.get_currency_name(code.upper())
        return name if name else code.upper()
    except Exception:
        return code.upper()


async def get_exchange_rates() -> dict[str, Any]:
    """
    Fetch live exchange rates using forex-python with in-memory cache and resilient fallback.
    Runs synchronous forex-python requests non-blockingly using asyncio.to_thread.
    """
    global _cached_rates
    now = time.time()

    # Return cached rates if fresh
    if (now - _cached_rates["last_fetched"]) < CACHE_TTL_SECONDS and _cached_rates["source"] == "forex-python":
        return _cached_rates

    try:
        # Fetch rates for base USD from forex-python in worker thread
        live_data = await asyncio.to_thread(_currency_rates.get_rates, "USD")
        if isinstance(live_data, dict):
            filtered_rates: dict[str, float] = {"USD": 1.0}
            for curr in SUPPORTED_CURRENCIES:
                if curr == "USD":
                    continue
                if curr in live_data and isinstance(live_data[curr], (int, float)):
                    filtered_rates[curr] = round(float(live_data[curr]), 4)
                else:
                    filtered_rates[curr] = FALLBACK_USD_RATES[curr]

            _cached_rates = {
                "base": "USD",
                "rates": filtered_rates,
                "last_fetched": now,
                "source": "forex-python",
            }
            logger.info("Updated live currency exchange rates via forex-python")
            return _cached_rates
    except (RatesNotAvailableError, Exception) as exc:
        logger.warning("Could not fetch live exchange rates from forex-python (%s); using fallback rates", exc)

    _cached_rates["last_fetched"] = now
    return _cached_rates


async def convert_currency_amount(amount: float, from_curr: str, to_curr: str) -> dict[str, Any]:
    """
    Convert amount between currencies using forex-python.
    Falls back to cached rates if direct converter raises an exception.
    """
    from_c = from_curr.upper()
    to_c = to_curr.upper()

    if from_c == to_c:
        return {
            "from_currency": from_c,
            "to_currency": to_c,
            "input_amount": amount,
            "converted_amount": round(amount, 2),
            "rate": 1.0,
            "source": "direct",
        }

    try:
        converted = await asyncio.to_thread(_currency_rates.convert, from_c, to_c, amount)
        rate = await asyncio.to_thread(_currency_rates.get_rate, from_c, to_c)
        return {
            "from_currency": from_c,
            "to_currency": to_c,
            "input_amount": amount,
            "converted_amount": round(float(converted), 2),
            "rate": round(float(rate), 4),
            "source": "forex-python",
        }
    except Exception as exc:
        logger.warning("Direct forex-python conversion error (%s), using cached rates", exc)
        rates_data = await get_exchange_rates()
        rates = rates_data.get("rates", {})
        from_rate = rates.get(from_c, 1.0)
        to_rate = rates.get(to_c, 1.0)
        usd_val = amount / from_rate if from_rate > 0 else 0
        fallback_converted = usd_val * to_rate
        return {
            "from_currency": from_c,
            "to_currency": to_c,
            "input_amount": amount,
            "converted_amount": round(fallback_converted, 2),
            "rate": round(to_rate / from_rate, 4) if from_rate > 0 else 0,
            "source": "cached-fallback",
        }
