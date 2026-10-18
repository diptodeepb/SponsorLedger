import { useState, useRef, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { ChevronDown, Check, Coins } from 'lucide-react';

export default function CurrencySwitcher({ _compact = false }) {
  const {
    currency,
    setCurrency,
    currencies,
    currencyConfig,
    rates,
  } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-300 dark:border-slate-750 text-slate-800 dark:text-slate-200 transition-all text-xs font-medium shadow-xs hover:shadow-sm group focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer"
        title="Change Display Currency"
        aria-label="Change Display Currency"
      >
        <span className="text-sm select-none" aria-hidden="true">
          {currencyConfig.flag}
        </span>
        <div className="flex items-center gap-1">
          <span className="font-mono font-semibold text-slate-900 dark:text-white tracking-wide">
            {currency}
          </span>
          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            ({currencyConfig.symbol})
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/80 z-50 overflow-hidden ring-1 ring-black/5 dark:ring-white/10 animate-scale-up backdrop-blur-xl">
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Coins className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Display Currency</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live FX</span>
            </div>
          </div>

          {/* Currency list */}
          <div className="p-1.5 max-h-72 overflow-y-auto space-y-0.5 custom-scrollbar">
            {currencies.map((c) => {
              const isSelected = c.code === currency;
              const rateAgainstUSD = rates[c.code] || 1.0;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setCurrency(c.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors group cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-600/15 text-indigo-900 dark:text-white font-medium border border-indigo-200 dark:border-indigo-500/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-950 dark:hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base select-none">{c.flag}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{c.code}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {c.symbol}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                        {c.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {c.code === 'USD'
                        ? 'Base'
                        : `1$ = ${rateAgainstUSD >= 10 ? rateAgainstUSD.toFixed(1) : rateAgainstUSD.toFixed(2)}`}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Real-time conversion</span>
            <span className="text-slate-400 dark:text-slate-500 font-mono">1 USD = {(rates.INR || 83.5).toFixed(2)} INR</span>
          </div>
        </div>
      )}
    </div>
  );
}
