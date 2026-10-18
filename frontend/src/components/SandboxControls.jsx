import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, RotateCcw, Trash2, ChevronDown, AlertCircle, RefreshCw } from 'lucide-react';
import { resetSandbox, clearSandbox, resetLocalGuestSession, redirectToDashboard } from '../lib/api';

export default function SandboxControls() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'reset' | 'clear' | 'session' | null
  const [statusMsg, setStatusMsg] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
        setConfirmAction(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = async () => {
    setLoading(true);
    setStatusMsg('Restoring demo dataset…');
    try {
      await resetSandbox();
      redirectToDashboard();
    } catch (err) {
      setLoading(false);
      setStatusMsg('Failed to reset: ' + (err.message || 'Error'));
    }
  };

  const handleClear = async () => {
    setLoading(true);
    setStatusMsg('Wiping sandbox data…');
    try {
      await clearSandbox();
      redirectToDashboard();
    } catch (err) {
      setLoading(false);
      setStatusMsg('Failed to clear: ' + (err.message || 'Error'));
    }
  };

  const handleNewSession = () => {
    setLoading(true);
    setStatusMsg('Creating new session…');
    resetLocalGuestSession();
    redirectToDashboard();
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button - Clean, no online pulsing dot */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-indigo-200/80 dark:border-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/40 transition-colors shadow-2xs cursor-pointer"
        title="Customize isolated sandbox dataset"
      >
        <span className="font-semibold tracking-wide">Sandbox</span>
        <ChevronDown className={`w-3 h-3 text-indigo-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu - Positioned to the left */}
      {open && (
        <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95 text-slate-700 dark:text-slate-300">
          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Isolated Guest Mode</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Your changes are saved in an isolated sandbox clone and never affect other visitors.
            </p>
          </div>

          {statusMsg && (
            <div className="px-3 py-1.5 mx-2 my-1 text-[11px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded font-medium flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          <div className="p-1 space-y-0.5 text-xs">
            {confirmAction === 'reset' ? (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-lg space-y-2">
                <div className="flex items-start gap-1.5 text-amber-800 dark:text-amber-200 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <span>Restore demo sponsors &amp; expenses? Any custom inputs will be replaced.</span>
                </div>
                <div className="flex items-center gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    disabled={loading}
                    className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:!text-white hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={loading}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium cursor-pointer text-xs flex items-center gap-1"
                  >
                    {loading && <RefreshCw className="w-3 h-3 animate-spin" />}
                    <span>Confirm Reset</span>
                  </button>
                </div>
              </div>
            ) : confirmAction === 'clear' ? (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-lg space-y-2">
                <div className="flex items-start gap-1.5 text-rose-800 dark:text-rose-200 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>Wipe all sandbox records and budget for a clean import canvas?</span>
                </div>
                <div className="flex items-center gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    disabled={loading}
                    className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:!text-white hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={loading}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium cursor-pointer text-xs flex items-center gap-1"
                  >
                    {loading && <RefreshCw className="w-3 h-3 animate-spin" />}
                    <span>Confirm Clear</span>
                  </button>
                </div>
              </div>
            ) : confirmAction === 'session' ? (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-lg space-y-2">
                <div className="flex items-start gap-1.5 text-emerald-800 dark:text-emerald-200 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                  <span>Start a brand-new guest session with fresh isolated data?</span>
                </div>
                <div className="flex items-center gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    disabled={loading}
                    className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:!text-white hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleNewSession}
                    disabled={loading}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium cursor-pointer text-xs flex items-center gap-1"
                  >
                    {loading && <RefreshCw className="w-3 h-3 animate-spin" />}
                    <span>Confirm Session</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setConfirmAction('reset')}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-800 dark:text-slate-200">Reset to Demo Data</span>
                    <span className="text-[11px] text-slate-400">Restore baseline sponsors &amp; expenses</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmAction('clear')}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <div className="flex flex-col">
                    <span className="font-medium text-rose-600 dark:text-rose-400">Clear All Sandbox Data</span>
                    <span className="text-[11px] text-slate-400">Zero budget and start 100% clean</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmAction('session')}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-2.5 cursor-pointer transition-colors border-t border-slate-100 dark:border-slate-800/60 mt-1"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-700 dark:text-slate-300">New Guest Session</span>
                    <span className="text-[11px] text-slate-400">Rotate to a new anonymous token</span>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
