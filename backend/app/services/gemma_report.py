"""Gemma report generation via Gemini API with Pydantic validation and fallback."""
from __future__ import annotations
import json
import logging
from typing import Any

from pydantic import BaseModel, ValidationError

from app.config import settings

logger = logging.getLogger(__name__)


class ReportPriority(BaseModel):
    finding_id: str
    why_it_matters: str
    recommended_next_step: str


class GemmaReportSchema(BaseModel):
    executive_summary: str
    priorities: list[ReportPriority]
    closing_checklist: list[str]
    limitations: list[str]


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


from app.services.exchange_rates import FALLBACK_USD_RATES


def format_currency_amount(amount_paise: int, currency: str = "USD", rates: dict | None = None) -> str:
    cur = currency.upper() if currency else "USD"
    sym = CURRENCY_SYMBOLS.get(cur, f"{cur} ")
    r = rates or FALLBACK_USD_RATES
    inr_val = (amount_paise or 0) / 100.0
    inr_rate = r.get("INR", 86.50)
    target_rate = r.get(cur, 1.0)
    val = (inr_val / inr_rate) * target_rate
    return f"{sym}{val:,.2f}"



SYSTEM_PROMPT = """You are SponsorLedger's financial report writer.
Write a clear, professional executive summary of the event finances.
Express all monetary amounts strictly using the provided formatted currency values (for example: $25,000.00, ₹25,000.00).
Never output internal subunit words like 'paise' or 'cents', and never invent financial numbers.
Use plain, human, accessible business language without robotic filler, em-dashes, or dramatic phrasing.
Do not recalculate or invent financial figures, names, dates, evidence, receipts, payments, or causes.
Do not call a finding fraud, theft, or misconduct.
Distinguish recorded facts from hypotheses and suggestions.
For every priority issue, preserve its finding ID and source references.
If information is missing, clearly state that it is missing.
Return only valid JSON matching the required response schema with fields:
executive_summary (string), priorities (array of objects with finding_id, why_it_matters, recommended_next_step),
closing_checklist (array of strings), limitations (array of strings)."""


def _build_payload(event: dict, totals: dict, findings: list[dict], rates: dict | None = None) -> str:
    """Build the clean structured payload sent to the model."""
    cur = event.get("currency", "USD").upper()
    sym = CURRENCY_SYMBOLS.get(cur, f"{cur} ")
    budget_raw = totals.get("budget_paise", 0)
    spent_raw = totals.get("expense_total_paise", 0)
    committed_raw = totals.get("sponsor_committed_paise", 0)
    received_raw = totals.get("sponsor_received_paise", 0)
    unpaid_raw = totals.get("unpaid_balance_paise", max(committed_raw - received_raw, 0))

    seen_finding_keys = set()
    cleaned_findings = []
    for f in findings:
        key = (f.get("rule_code"), tuple(sorted(str(r.get("id", "")) for r in f.get("source_refs", []))))
        if key in seen_finding_keys:
            continue
        seen_finding_keys.add(key)
        cleaned_findings.append({
            "id": f["id"],
            "rule_code": f["rule_code"],
            "severity": f["severity"],
            "title": f["title"],
            "explanation": f["explanation"],
            "source_refs": [str(r.get("id", "")) for r in f.get("source_refs", [])],
        })

    payload = {
        "event": {
            "name": event.get("name", "Event"),
            "currency": cur,
            "currency_symbol": sym,
        },
        "financial_summary": {
            "currency": cur,
            "budget": format_currency_amount(budget_raw, cur, rates),
            "total_expenses": format_currency_amount(spent_raw, cur, rates),
            "sponsor_committed": format_currency_amount(committed_raw, cur, rates),
            "sponsor_received": format_currency_amount(received_raw, cur, rates),
            "unpaid_sponsor_balance": format_currency_amount(unpaid_raw, cur, rates),
        },
        "findings": cleaned_findings,
    }
    return json.dumps(payload, ensure_ascii=False)


def _fallback_report(event: dict, totals: dict, findings: list[dict], rates: dict | None = None) -> dict:
    """Generate a clean fallback report without AI."""
    high = [f for f in findings if f.get("severity") == "high"]
    medium = [f for f in findings if f.get("severity") == "medium"]
    low = [f for f in findings if f.get("severity") == "low"]

    cur = event.get("currency", "USD").upper()
    budget = totals.get("budget_paise", 0)
    spent = totals.get("expense_total_paise", 0)
    committed = totals.get("sponsor_committed_paise", 0)
    received = totals.get("sponsor_received_paise", 0)

    summary_parts = [
        f"This is an automated closeout summary for '{event.get('name', 'Event')}'. ",
        f"Recorded expenses total {format_currency_amount(spent, cur, rates)} against an allocated budget of {format_currency_amount(budget, cur, rates)}. ",
        f"Sponsorship commitments: {format_currency_amount(committed, cur, rates)} pledged, with {format_currency_amount(received, cur, rates)} received to date. ",
        f"The review identified {len(findings)} item(s) for attention: {len(high)} high, {len(medium)} medium, and {len(low)} low priority.",
    ]

    priorities = []
    for f in (high + medium)[:5]:
        priorities.append({
            "finding_id": f.get("id", "unknown"),
            "why_it_matters": f.get("explanation", ""),
            "recommended_next_step": f.get("suggested_action", "Review this finding."),
        })

    checklist = [
        "Verify all sponsor payment records are up to date.",
        "Confirm all overdue deliverables or mark them as waived.",
        "Resolve or dismiss all open audit findings.",
        "Ensure all expense rows have receipt references.",
        "Archive a copy of this report for future reference.",
    ]

    limitations = [
        "This summary was created from deterministic system records without active AI commentary.",
        "All financial figures reflect recorded ledger transactions and should be checked against bank statements.",
    ]

    return {
        "executive_summary": "".join(summary_parts),
        "priorities": priorities,
        "closing_checklist": checklist,
        "limitations": limitations,
    }


def sanitize_ai_text(text: str, currency: str = "USD") -> str:
    """Ensure any accidental sub-unit / paise or rupee mentions are cleanly converted to display currency."""
    if not text:
        return text
    import re
    cur = currency.upper() if currency else "USD"
    sym = CURRENCY_SYMBOLS.get(cur, f"{cur} ")
    inr_rate = FALLBACK_USD_RATES.get("INR", 86.50)
    target_rate = FALLBACK_USD_RATES.get(cur, 1.0)

    def _rep_paise(match):
        raw_num = match.group(1).replace(",", "")
        try:
            inr_val = float(raw_num) / 100.0
            val = (inr_val / inr_rate) * target_rate
            return f"{sym}{val:,.2f}"
        except Exception:
            return match.group(0)

    # Convert "2,500,000 paise" or "2500000 paise"
    res = re.sub(r'([\d,]+)\s*(?:paise|paise\b)', _rep_paise, text, flags=re.IGNORECASE)

    # Convert any "₹25,000.00" or "INR 25,000" if target currency is not INR
    if cur != "INR":
        def _rep_inr(match):
            raw_num = match.group(1).replace(",", "")
            try:
                inr_val = float(raw_num)
                val = (inr_val / inr_rate) * target_rate
                return f"{sym}{val:,.2f}"
            except Exception:
                return match.group(0)

        res = re.sub(r'(?:₹|INR\s*|Rs\.?\s*)([\d,]+(?:\.\d{1,2})?)', _rep_inr, res, flags=re.IGNORECASE)

    # Clean any leftover bare mentions
    unit_word = "cents" if cur in ("USD", "EUR", "CAD", "AUD") else "sub-units"
    res = re.sub(r'\bpaise\b', unit_word, res, flags=re.IGNORECASE)
    return res


async def generate_report(
    event: dict,
    totals: dict,
    findings: list[dict],
) -> tuple[dict, str]:
    """
    Returns (report_data_dict, ai_status) where ai_status is 'ai_generated' or 'fallback'.
    Optimized for low latency with minimal thinking mode and async execution.
    """
    cur = event.get("currency", "USD").upper()
    from app.services.exchange_rates import get_exchange_rates
    rates_data = await get_exchange_rates()
    rates = rates_data.get("rates", FALLBACK_USD_RATES)

    if not settings.gemini_api_key:
        logger.warning("GEMINI_API_KEY not set; using fallback report")
        return _fallback_report(event, totals, findings, rates), "fallback"

    try:
        from app.services.gemma_txt_to_csv import get_genai_client
        client = get_genai_client()
        if not client:
            return _fallback_report(event, totals, findings, rates), "fallback"

        from google.genai import types

        payload = _build_payload(event, totals, findings, rates)

        response = await client.aio.models.generate_content(
            model=settings.gemma_model,
            contents=f"{SYSTEM_PROMPT}\n\nFinancial Dataset:\n{payload}",
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(
                    thinking_level=types.ThinkingLevel.MINIMAL,
                    include_thoughts=False,
                ),
                response_mime_type="application/json",
                max_output_tokens=2048,
                temperature=0.1,
            ),
        )

        raw = ""
        if response.candidates and response.candidates[0].content:
            for p in response.candidates[0].content.parts or []:
                if not getattr(p, "thought", False) and p.text:
                    raw = p.text
                    break
        if not raw:
            raw = response.text or ""

        # Strip markdown code fences if present
        text = raw.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1]) if len(lines) > 2 else text
        if text.startswith("json"):
            text = text[4:].strip()

        data = json.loads(text)
        if isinstance(data, list) and len(data) > 0:
            data = data[0]

        validated = GemmaReportSchema(**data)
        out = validated.model_dump()
        
        # Sanitize any accidental subunit mentions in AI output
        if out.get("executive_summary"):
            out["executive_summary"] = sanitize_ai_text(out["executive_summary"], cur)
        for p in out.get("priorities", []):
            if p.get("why_it_matters"):
                p["why_it_matters"] = sanitize_ai_text(p["why_it_matters"], cur)
            if p.get("recommended_next_step"):
                p["recommended_next_step"] = sanitize_ai_text(p["recommended_next_step"], cur)
        return out, "ai_generated"

    except Exception as exc:
        logger.error("Gemma report generation failed: %s", exc)
        return _fallback_report(event, totals, findings, rates), "fallback"

