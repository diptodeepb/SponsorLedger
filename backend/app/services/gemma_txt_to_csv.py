"""Gemma AI irregular text to CSV converter service.

Intelligently parses unstructured expense notes, emails, invoices, and logs into
verified CSV format matching SponsorLedger's schema:
date,vendor,category,amount_inr,receipt_ref,notes
"""
from __future__ import annotations
import csv
import io
import json
import logging
import time
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

# Cached GenAI client singleton
_genai_client: Any = None


def get_genai_client():
    global _genai_client
    if _genai_client is None and settings.gemini_api_key:
        try:
            from google import genai
            _genai_client = genai.Client(api_key=settings.gemini_api_key)
        except Exception as exc:
            logger.error("Failed to initialize GenAI client: %s", exc)
            _genai_client = None
    return _genai_client


REQUIRED_CSV_COLUMNS = {"date", "vendor", "category", "amount_inr"}

EXTRACTION_SYSTEM_PROMPT = """You are SponsorLedger's financial data extraction specialist.
Your mission is to read unstructured, irregular text (notes, logs, messages, receipts, or drafts) and extract all valid expense transactions into structured tabular data.

Required fields for each expense item:
- date: Normalized date in ISO format YYYY-MM-DD. Infer informal dates (e.g., '14 Oct 2026', 'yesterday' relative to October 2026, '15/10/2026' -> '2026-10-15'). If the year is not stated, assume 2026.
- vendor: Name of the merchant, company, contractor, or service provider.
- category: Standard event expense category (e.g. Swag, Catering, AV, Venue, Infrastructure, Travel, Operations, Marketing, Prizes, Logistics, Security).
- amount_inr: Numeric amount in INR (convert to a clean positive float or integer, e.g. 14500 or 2350.50). Remove currency symbols (₹, $, Rs), currency words, and commas.
- receipt_ref: Receipt, voucher, invoice, or reference identifier if mentioned (or null if not provided).
- notes: Contextual note, item description, or relevant remark (or null if not provided).

Conditions:
1. Extract ALL expense items mentioned in the text.
2. If text contains multiple expenses, extract each one as a distinct entry.
3. Do not invent expenses or guess unmentioned details.
4. Return strictly a JSON array of objects with keys: date, vendor, category, amount_inr, receipt_ref, notes.
5. If no valid expense transactions are found in the text, return an empty array []."""


def is_already_csv(text: str) -> bool:
    """Check if the provided text already has valid CSV headers."""
    lines = [line.strip() for line in text.strip().splitlines() if line.strip()]
    if not lines:
        return False
    try:
        reader = csv.reader([lines[0]])
        headers = {h.strip().lower() for h in next(reader, [])}
        return REQUIRED_CSV_COLUMNS.issubset(headers)
    except Exception:
        return False


async def convert_irregular_txt_to_csv(content: bytes) -> tuple[str, int, str]:
    """
    Takes raw bytes of a .txt file containing unstructured or irregular expense data.
    Uses Gemma AI to parse the content and convert it into standard CSV text.

    Returns:
        (csv_string, elapsed_ms, model_id)
    """
    t0 = time.perf_counter()

    if len(content) > 1_048_576:  # 1 MB
        raise ValueError("File exceeds 1 MB limit")

    try:
        text = content.decode("utf-8").strip()
    except UnicodeDecodeError:
        raise ValueError("File must be UTF-8 encoded text")

    if not text:
        raise ValueError("The uploaded text file is empty")

    # If it is already formatted as CSV, pass it directly
    if is_already_csv(text):
        elapsed_ms = int((time.perf_counter() - t0) * 1000)
        return text, elapsed_ms, "direct_csv"

    client = get_genai_client()
    if not client:
        raise ValueError(
            "GEMINI_API_KEY is not configured on the server. Gemma AI text extraction requires an active API key."
        )

    import asyncio
    from google.genai import types

    model_id = settings.gemma_model or "gemma-4-26b-a4b-it"

    # Robust cascade: primary model, primary without thinking config, and fallback model
    candidates = [
        (model_id, True),
        (model_id, False),
        ("gemini-2.5-flash", False),
    ]

    response = None
    last_error = None
    used_model = model_id

    for candidate_model, use_thinking in candidates:
        try:
            config_kwargs = {
                "response_mime_type": "application/json",
                "max_output_tokens": 4096,
                "temperature": 0.1,
            }
            if use_thinking:
                try:
                    config_kwargs["thinking_config"] = types.ThinkingConfig(
                        thinking_level=types.ThinkingLevel.MINIMAL,
                        include_thoughts=False,
                    )
                except Exception:
                    pass

            response = await client.aio.models.generate_content(
                model=candidate_model,
                contents=f"{EXTRACTION_SYSTEM_PROMPT}\n\nIrregular Text Content:\n{text}",
                config=types.GenerateContentConfig(**config_kwargs),
            )
            used_model = candidate_model
            break
        except Exception as exc:
            last_error = exc
            logger.warning(
                "AI text extraction attempt failed with model=%s (thinking=%s): %s",
                candidate_model,
                use_thinking,
                exc,
            )
            await asyncio.sleep(0.6)

    if not response:
        logger.error("All AI extraction attempts failed. Last error: %s", last_error)
        raise ValueError(
            "The Google AI service encountered a temporary error. "
            "Please try uploading the file again in a few moments."
        )

    try:
        raw = response.text or ""
        raw = raw.strip()

        # Handle possible markdown backticks
        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(lines[1:-1]) if len(lines) > 2 else raw
        if raw.startswith("json"):
            raw = raw[4:].strip()

        try:
            records = json.loads(raw)
        except json.JSONDecodeError as exc:
            logger.error("Failed to parse JSON response from Gemma: %s (raw text: %s)", exc, raw[:200])
            raise ValueError("Gemma AI could not parse the text into valid structured records. Please ensure all required data (date, vendor, amount) is present.")

        if isinstance(records, dict):
            # In case the model wrapped the list in a key like "expenses" or "items"
            for k in ("expenses", "items", "data", "transactions", "records"):
                if isinstance(records.get(k), list):
                    records = records[k]
                    break
            else:
                records = [records]

        if not isinstance(records, list) or len(records) == 0:
            raise ValueError(
                "No valid expense records could be extracted from this text file. "
                "Ensure the text mentions dates, vendors, categories, and amounts."
            )

        # Convert records to standard CSV
        output = io.StringIO()
        fieldnames = ["date", "vendor", "category", "amount_inr", "receipt_ref", "notes"]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()

        for rec in records:
            if not isinstance(rec, dict):
                continue
            writer.writerow({
                "date": str(rec.get("date") or "").strip(),
                "vendor": str(rec.get("vendor") or "").strip(),
                "category": str(rec.get("category") or "").strip(),
                "amount_inr": rec.get("amount_inr") if rec.get("amount_inr") is not None else "",
                "receipt_ref": str(rec.get("receipt_ref") or "").strip() if rec.get("receipt_ref") else "",
                "notes": str(rec.get("notes") or "").strip() if rec.get("notes") else "",
            })

        csv_str = output.getvalue()
        elapsed_ms = max(int((time.perf_counter() - t0) * 1000), 1)
        return csv_str, elapsed_ms, used_model

    except ValueError:
        raise
    except Exception as exc:
        logger.error("Gemma irregular text conversion error: %s", exc)
        raise ValueError(f"Gemma AI parsing error: {exc}")
