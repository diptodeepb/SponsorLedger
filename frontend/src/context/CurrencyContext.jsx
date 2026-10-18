/* oxlint-disable react/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getCurrencyRates } from '../lib/api';
import { setActiveCurrencyState } from '../lib/format';

const CURRENCY_CONFIG = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', locale: 'en-US', decimals: 2 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', locale: 'en-IN', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', locale: 'de-DE', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', locale: 'en-GB', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', locale: 'ja-JP', decimals: 0 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', locale: 'en-CA', decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', locale: 'en-AU', decimals: 2 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', locale: 'de-CH', decimals: 2 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', locale: 'en-SG', decimals: 2 },
};

const DEFAULT_RATES = {
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

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  // Default to USD per user requirement
  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('sponsorledger_currency') || 'USD';
  });

  const [rates, setRates] = useState(DEFAULT_RATES);
  const [ratesTimestamp, setRatesTimestamp] = useState(null);
  const [loadingRates, setLoadingRates] = useState(true);

  // Sync format.js module state whenever currency or rates change
  useEffect(() => {
    setActiveCurrencyState(currency, rates);
  }, [currency, rates]);

  // Fetch live exchange rates on mount and poll every 15 minutes
  useEffect(() => {
    let isMounted = true;

    async function fetchRates() {
      try {
        const data = await getCurrencyRates();
        if (isMounted && data && data.rates) {
          setRates((prev) => ({
            ...prev,
            ...data.rates,
          }));
          setRatesTimestamp(data.timestamp || new Date().toISOString());
        }
      } catch (err) {
        console.warn('Using default exchange rates cache:', err);
      } finally {
        if (isMounted) setLoadingRates(false);
      }
    }

    fetchRates();
    const interval = setInterval(fetchRates, 15 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const setCurrency = useCallback((newCur) => {
    if (CURRENCY_CONFIG[newCur]) {
      setCurrencyState(newCur);
      localStorage.setItem('sponsorledger_currency', newCur);
    }
  }, []);

  /**
   * Convert canonical integer paise to numeric amount in target currency.
   * 100 paise = 1 INR
   * 1 USD = rates['INR'] INR
   * Target amount = (paise / 100 / rates['INR']) * rates[targetCur]
   */
  const convertFromPaise = useCallback(
    (paise, targetCur = currency) => {
      if (paise == null || isNaN(paise)) return 0;
      const inrRate = rates.INR || DEFAULT_RATES.INR;
      const targetRate = rates[targetCur] || 1.0;
      const inr = paise / 100.0;
      const usd = inr / inrRate;
      const converted = usd * targetRate;
      const decimals = CURRENCY_CONFIG[targetCur]?.decimals ?? 2;
      return Number(converted.toFixed(decimals));
    },
    [rates, currency]
  );

  /**
   * Convert amount entered in source currency to canonical integer paise.
   * usd = amount / rates[sourceCur]
   * inr = usd * rates['INR']
   * paise = Math.round(inr * 100)
   */
  const convertToPaise = useCallback(
    (amount, sourceCur = currency) => {
      if (amount == null || isNaN(amount) || amount === '') return 0;
      const num = parseFloat(amount);
      if (isNaN(num)) return 0;
      const inrRate = rates.INR || DEFAULT_RATES.INR;
      const sourceRate = rates[sourceCur] || 1.0;
      const usd = num / sourceRate;
      const inr = usd * inrRate;
      return Math.round(inr * 100);
    },
    [rates, currency]
  );

  /**
   * Format paise amount into localized currency string according to target currency.
   */
  const formatMoney = useCallback(
    (paise, overrideCur = null) => {
      if (paise == null || isNaN(paise)) {
        const cur = overrideCur || currency;
        const sym = CURRENCY_CONFIG[cur]?.symbol || '$';
        return `${sym}0.00`;
      }
      const targetCur = overrideCur || currency;
      const cfg = CURRENCY_CONFIG[targetCur] || CURRENCY_CONFIG.USD;
      const numericVal = convertFromPaise(paise, targetCur);
      return new Intl.NumberFormat(cfg.locale, {
        style: 'currency',
        currency: targetCur,
        minimumFractionDigits: cfg.decimals,
        maximumFractionDigits: cfg.decimals,
      }).format(numericVal);
    },
    [currency, convertFromPaise]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      currencies: Object.values(CURRENCY_CONFIG),
      currencyConfig: CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD,
      currencySymbol: CURRENCY_CONFIG[currency]?.symbol || '$',
      rates,
      ratesTimestamp,
      loadingRates,
      convertFromPaise,
      convertToPaise,
      formatMoney,
      formatPaise: formatMoney,
    }),
    [
      currency,
      setCurrency,
      rates,
      ratesTimestamp,
      loadingRates,
      convertFromPaise,
      convertToPaise,
      formatMoney,
    ]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
