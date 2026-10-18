const CURRENCY_FORMAT_CONFIG = {
  USD: { code: 'USD', symbol: '$', locale: 'en-US', decimals: 2 },
  INR: { code: 'INR', symbol: '₹', locale: 'en-IN', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', locale: 'ja-JP', decimals: 0 },
  CAD: { code: 'CAD', symbol: 'C$', locale: 'en-CA', decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', locale: 'en-AU', decimals: 2 },
  CHF: { code: 'CHF', symbol: 'CHF', locale: 'de-CH', decimals: 2 },
  SGD: { code: 'SGD', symbol: 'S$', locale: 'en-SG', decimals: 2 },
};

let _activeCurrency = typeof window !== 'undefined'
  ? (localStorage.getItem('sponsorledger_currency') || 'USD')
  : 'USD';

let _activeRates = {
  USD: 1.0,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 155.0,
  CAD: 1.36,
  AUD: 1.52,
  CHF: 0.91,
  SGD: 1.35,
};

/** Synchronize active currency & rates from CurrencyContext */
export function setActiveCurrencyState(cur, rates) {
  if (cur && CURRENCY_FORMAT_CONFIG[cur]) _activeCurrency = cur;
  if (rates) _activeRates = { ..._activeRates, ...rates };
}

/** Get active currency code */
export function getActiveCurrency() {
  return _activeCurrency;
}

/** Convert paise to target currency numeric value */
export function convertPaiseToCurrency(paise, targetCur = _activeCurrency, rates = _activeRates) {
  if (paise == null || isNaN(paise)) return 0;
  const inrRate = rates?.INR || 83.5;
  const targetRate = rates?.[targetCur] || 1.0;
  const inr = paise / 100.0;
  const usd = inr / inrRate;
  const converted = usd * targetRate;
  const decimals = CURRENCY_FORMAT_CONFIG[targetCur]?.decimals ?? 2;
  return Number(converted.toFixed(decimals));
}

/** Format canonical paise according to given or active currency */
export function formatMoney(paise, overrideCur = null, rates = _activeRates) {
  const cur = overrideCur || _activeCurrency;
  const cfg = CURRENCY_FORMAT_CONFIG[cur] || CURRENCY_FORMAT_CONFIG.USD;
  if (paise == null || isNaN(paise)) {
    return `${cfg.symbol}0.00`;
  }
  const numericVal = convertPaiseToCurrency(paise, cur, rates);
  return new Intl.NumberFormat(cfg.locale, {
    style: 'currency',
    currency: cur,
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  }).format(numericVal);
}

/** Format raw numeric value directly into localized currency string */
export function formatCurrency(amount, cur = _activeCurrency) {
  const cfg = CURRENCY_FORMAT_CONFIG[cur] || CURRENCY_FORMAT_CONFIG.USD;
  const num = typeof amount === 'number' ? amount : (parseFloat(amount) || 0);
  return new Intl.NumberFormat(cfg.locale, {
    style: 'currency',
    currency: cur,
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  }).format(num);
}

/**
 * Format integer paise into currency string.
 * Defaults to the globally active currency (USD by default).
 * Maintained as an alias for formatMoney for backward compatibility.
 */
export function formatINR(paise, overrideCur = null) {
  return formatMoney(paise, overrideCur);
}

/** Format date string or Date object as readable date. */
export function formatDate(d) {
  if (!d) return 'N/A';
  const dt = typeof d === 'string' ? new Date(d + (d.includes('T') ? '' : 'T00:00:00')) : d;
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dt);
}

/** Format ISO datetime string as readable date+time. */
export function formatDateTime(d) {
  if (!d) return 'N/A';
  const dt = new Date(d);
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dt);
}

/** Clamp number to 0 minimum (avoid showing negative budgets). */
export function clampZero(n) {
  return Math.max(0, n || 0);
}

/** Convert severity to CSS color class. */
export function severityBadge(severity) {
  if (severity === 'high') return 'badge-high';
  if (severity === 'medium') return 'badge-medium';
  return 'badge-low';
}

/** Convert status to CSS class. */
export function statusBadge(status) {
  return status ? `badge-${status}` : 'badge-open';
}

/** Truncate a string with ellipsis. */
export function truncate(str, maxLen = 60) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/**
 * Adapt any accidental sub-unit / paise or static currency mentions in narrative text into active currency.
 */
export function adaptCurrencyInText(text, targetCur = _activeCurrency, rates = _activeRates) {
  if (!text) return text;
  const cur = targetCur || _activeCurrency || 'USD';
  const r = rates || _activeRates;
  const inrRate = r['INR'] || 86.50;
  const targetRate = r[cur] || 1.0;

  // 1. Convert any paise mentions (e.g. "2,500,000 paise")
  let adapted = text.replace(/([\d,]+)\s*paise/gi, (_match, numStr) => {
    const rawVal = parseFloat(numStr.replace(/,/g, ''));
    if (!isNaN(rawVal)) {
      return formatMoney(rawVal, cur, r);
    }
    return _match;
  }).replace(/\bpaise\b/gi, 'units');

  // 2. Convert any Rupee / INR mentions (e.g. ₹25,000.00, ₹26,500, INR 11,000) to target currency
  adapted = adapted.replace(/(?:₹|INR\s*|Rs\.?\s*)([\d,]+(?:\.\d{1,2})?)/gi, (_match, numStr) => {
    const inrVal = parseFloat(numStr.replace(/,/g, ''));
    if (!isNaN(inrVal)) {
      if (cur === 'INR') {
        return `₹${inrVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      // Convert inrVal to target currency using exchange rates
      const targetVal = (inrVal / inrRate) * targetRate;
      return formatCurrency(targetVal, cur);
    }
    return _match;
  });

  // 3. Convert any USD mentions ($263.26, USD 263.26) if active view is not USD
  if (cur !== 'USD') {
    adapted = adapted.replace(/(?:\$|USD\s*)([\d,]+(?:\.\d{1,2})?)/gi, (_match, numStr) => {
      const usdVal = parseFloat(numStr.replace(/,/g, ''));
      if (!isNaN(usdVal)) {
        const targetVal = usdVal * targetRate;
        return formatCurrency(targetVal, cur);
      }
      return _match;
    });
  }

  return adapted;
}

// Alias for backwards compatibility
export const adaptPaiseInText = adaptCurrencyInText;



