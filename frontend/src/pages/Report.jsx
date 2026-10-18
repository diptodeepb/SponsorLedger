import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Printer,
  Sparkles,
  CheckSquare,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Cpu,
  Wallet,
  ArrowRight,
  Scale,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { getEvents, getReports, generateReport, exportReport, resetSandbox, redirectToDashboard } from '../lib/api';
import { formatDateTime, adaptPaiseInText } from '../lib/format';
import { useCurrency } from '../context/CurrencyContext';
import { LoadingPage, ErrorMessage, PageHeader, EmptyState } from '../components/UI';
import { useIsMobile } from '../lib/useIsMobile';

const SHORT_CHART_LABELS = {
  'Allocated Budget': 'Budget',
  'Actual Spent': 'Spent',
  'Actual Spend': 'Spent',
  'Committed Sponsorship': 'Pledged',
  'Sponsor Pledged': 'Pledged',
  'Received Sponsorship': 'Received',
  'Sponsor Received': 'Received',
};

function CustomTooltip({ active, payload, label, formatMoney }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs">
        {label && <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">{label}</p>}
        {payload.map((entry, index) => (
          <div key={`tip-${index}`} className="flex items-center justify-between gap-3 text-slate-600 dark:text-slate-300 py-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span>{entry.name}:</span>
            </span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">
              {formatMoney(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function Report() {
  const { formatMoney, currency, currencySymbol, rates } = useCurrency();
  const isMobile = useIsMobile(640);
  const [event, setEvent] = useState(null);
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genElapsed, setGenElapsed] = useState(0);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [checklistStore, setChecklistStore] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      const map = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('sponsorledger_checklist_')) {
          const reportId = k.replace('sponsorledger_checklist_', '');
          map[reportId] = JSON.parse(localStorage.getItem(k) || '{}');
        }
      }
      return map;
    } catch {
      return {};
    }
  });

  const completedItems = (currentReport?.id && checklistStore[currentReport.id]) || {};

  useEffect(() => {
    async function loadData() {
      try {
        const events = await getEvents();
        if (events.length > 0) {
          const ev = events[0];
          setEvent(ev);
          const reportList = await getReports(ev.id).catch(() => []);
          setReports(reportList);
          if (reportList.length > 0) {
            setCurrentReport(reportList[0]);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const isCleanLedger =
    (!event?.budget_paise || event.budget_paise === 0) &&
    (!event?.expense_total_paise || event.expense_total_paise === 0) &&
    (!event?.sponsor_committed_paise || event.sponsor_committed_paise === 0);

  const handleGenerate = async () => {
    if (!event) return;
    if (isCleanLedger) {
      setError("Cannot generate closeout report on an empty ledger. Please import expenses or load sample data first.");
      return;
    }
    setGenerating(true);
    setError(null);
    setSuccessMsg(null);
    setGenElapsed(0);
    const startTime = Date.now();
    const timer = setInterval(() => {
      setGenElapsed((Date.now() - startTime) / 1000);
    }, 80);

    try {
      const newReport = await generateReport(event.id);
      clearInterval(timer);
      const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
      setCurrentReport(newReport);
      setReports(prev => [newReport, ...prev]);
      const statusText = newReport.ai_status === 'ai_generated'
        ? `Closeout report synthesized with Gemma (${newReport.model_id || 'gemma-4-26b-a4b-it'}) in ${totalSec}s.`
        : `Report generated successfully from verified ledger records in ${totalSec}s.`;
      setSuccessMsg(statusText);
      setTimeout(() => setSuccessMsg(null), 8000);
    } catch (err) {
      clearInterval(timer);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const toggleChecklist = (idx) => {
    if (!currentReport?.id) return;
    const rId = currentReport.id;
    const current = checklistStore[rId] || {};
    const next = { ...current, [idx]: !current[idx] };
    setChecklistStore(prev => ({ ...prev, [rId]: next }));
    try {
      localStorage.setItem(`sponsorledger_checklist_${rId}`, JSON.stringify(next));
    } catch (e) {
      console.error('Failed to save checklist state to localStorage:', e);
    }
  };

  if (loading) return <LoadingPage message="Loading closeout reports…" />;
  if (error && !currentReport) return <ErrorMessage message={error} />;
  if (!event) return (
    <EmptyState
      icon={FileSpreadsheet}
      title="No active event found"
      description="Create or seed an event to view or generate financial closeout reports."
    />
  );

  const totals = currentReport?.totals_snapshot || {};
  const isAi = currentReport?.ai_status === 'ai_generated';
  const remainingBudget = totals.remaining_budget_paise != null
    ? totals.remaining_budget_paise
    : (totals.budget_paise || 0) - (totals.expense_total_paise || 0);

  const chartData = [
    { name: 'Allocated Budget', amount: totals.budget_paise || 0, fill: '#6366f1' },
    { name: 'Total Spend', amount: totals.expense_total_paise || 0, fill: (totals.expense_total_paise || 0) > (totals.budget_paise || 0) ? '#f43f5e' : '#10b981' },
    { name: 'Sponsor Pledged', amount: totals.sponsor_committed_paise || 0, fill: '#3b82f6' },
    { name: 'Sponsor Received', amount: totals.sponsor_received_paise || 0, fill: '#06b6d4' },
  ];

  let displaySummary = 'No summary text available.';
  if (currentReport?.executive_summary) {
    displaySummary = adaptPaiseInText(currentReport.executive_summary, currency, rates);
    const ts = currentReport.totals_snapshot;
    if (ts) {
      const budgetStr = formatMoney(ts.budget_paise);
      const spentStr = formatMoney(ts.expense_total_paise);
      const committedStr = formatMoney(ts.sponsor_committed_paise);
      const receivedStr = formatMoney(ts.sponsor_received_paise);
      const unpaidStr = formatMoney(ts.unpaid_balance_paise);

      // Use function replacers to prevent dollar-sign collisions ($1, $2, etc.)
      displaySummary = displaySummary
        .replace(
          /(total expenses(?: were| of)? )(\S+)( against a budget of )(\S+)/i,
          (_m, p1, _p2, p3) => `${p1}${spentStr}${p3}${budgetStr}`
        )
        .replace(
          /(Recorded expenses total )(\S+)( against an allocated budget of )(\S+)/i,
          (_m, p1, _p2, p3) => `${p1}${spentStr}${p3}${budgetStr}`
        )
        .replace(
          /(recorded budget is )(\S+)(,? and the total expenses are )(\S+)/i,
          (_m, p1, _p2, p3) => `${p1}${budgetStr}${p3}${spentStr}`
        )
        .replace(
          /(Sponsor commitments (?:totaled|are documented at) )(\S+)(,? with )(\S+)( received)/i,
          (_m, p1, _p2, p3, _p4, p5) => `${p1}${committedStr}${p3}${receivedStr}${p5}`
        )
        .replace(
          /(Sponsorship commitments:? )(\S+)( pledged,? with )(\S+)( received)/i,
          (_m, p1, _p2, p3, _p4, p5) => `${p1}${committedStr}${p3}${receivedStr}${p5}`
        )
        .replace(
          /(unpaid sponsor balance of )(\S+)/i,
          (_m, p1) => `${p1}${unpaidStr}`
        );
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Financial Closeout Report"
        subtitle={`Synthesis and formal audit summary for ${event.name}`}
        action={
          <div className="flex items-center gap-3">
            <Link to="/audit" className="btn-secondary">
              <ShieldCheck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Audit Rules</span>
            </Link>
            <button
              type="button"
              className="btn-primary"
              onClick={handleGenerate}
              disabled={generating || isCleanLedger}
              title={isCleanLedger ? 'Report generation denied on empty ledger' : 'Generate Closeout Report'}
            >
              {generating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Synthesizing ({genElapsed.toFixed(1)}s / ~5.0s)…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </div>
        }
      />

      {generating && (
        <div className="card p-4 border-indigo-500/40 bg-indigo-500/5 dark:bg-indigo-950/20 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between text-xs font-medium text-indigo-700 dark:text-indigo-300">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
              <span>Gemma AI synthesizing verified ledger records, audit findings, and budget variances…</span>
            </span>
            <span className="font-mono text-indigo-600 dark:text-indigo-300 shrink-0">
              Estimated: ~5.0s (Elapsed: {genElapsed.toFixed(1)}s)
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-150 ease-out"
              style={{ width: `${Math.min(95, (genElapsed / 5.0) * 92)}%` }}
            />
          </div>
        </div>
      )}

      {successMsg && (
        <div className="alert-success flex items-center justify-between animate-fade-in">
          <span>{successMsg}</span>
          <button type="button" className="text-emerald-700 dark:text-emerald-300 font-bold" onClick={() => setSuccessMsg(null)}>×</button>
        </div>
      )}

      {error && (
        <div className="alert-error flex items-center justify-between">
          <span>{error}</span>
          <button type="button" className="text-rose-700 dark:text-rose-300 font-bold" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {!currentReport ? (
        isCleanLedger ? (
          <div className="card p-8 sm:p-12 text-center text-slate-500 dark:text-slate-400 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Ledger is Empty</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Your sandbox ledger is currently clean (0 transactions, 0 sponsors, {formatMoney(0)} budget). Closeout report generation is denied on empty ledgers.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link to="/expenses" className="btn-primary btn-sm">
                Import Expenses
              </Link>
              <button
                type="button"
                className="btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer"
                onClick={async () => {
                  await resetSandbox();
                  redirectToDashboard();
                }}
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                <span>Load Sample Demo Data</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-8 sm:p-12 text-center text-slate-500 dark:text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Closeout Report Generated Yet</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              Synthesize verified transactions and audit findings into an executive briefing,
              actionable priorities, and closing checklist.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? 'Synthesizing Report…' : 'Generate First Report'}
            </button>
          </div>
        )
      ) : (
        <div className="space-y-6">
          {/* Report Metadata & Provenance Banner */}
          <div className="card bg-gradient-to-br from-white via-indigo-50/30 to-white dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 p-6 border-slate-200 dark:border-slate-750">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <span className={`badge ${isAi ? 'badge-ai' : 'badge-fallback'}`}>
                    {isAi ? <Sparkles className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
                    <span>{isAi ? 'Gemma Executive Review' : 'System Fallback'}</span>
                  </span>
                  {currentReport.model_id && (
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                      {currentReport.model_id}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Snapshot: {formatDateTime(currentReport.generated_at)}
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Event Closeout & Reconciliation: {event.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  {isAi
                    ? 'Executive summary synthesized by Gemma. Financial totals, budget variances, and reference links are calculated directly from verified database records.'
                    : 'Generated directly from current ledger records without external AI dependency.'}
                </p>
              </div>

              {/* Export actions */}
              <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
                <a
                  href={exportReport(currentReport.id, 'markdown')}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="btn-secondary btn-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Markdown</span>
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-primary btn-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>

          {/* Historical Report Selector */}
          {reports.length > 1 && (
            <div className="flex items-center gap-2.5 px-1 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Saved Snapshots:</span>
              <select
                className="form-input text-xs py-1 px-3 max-w-xs bg-white dark:bg-slate-900"
                value={currentReport?.id || ''}
                onChange={(e) => {
                  const selected = reports.find(r => r.id === e.target.value);
                  if (selected) {
                    setCurrentReport(selected);
                  }
                }}
              >
                {reports.map((r, idx) => (
                  <option key={r.id} value={r.id}>
                    {idx === 0 ? 'Current: ' : 'Archive: '}{formatDateTime(r.generated_at)} ({r.ai_status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Verified Financial Totals & Chart */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Verified Financial Totals</h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Viewing in {currency} ({currencySymbol})
              </span>
            </div>
            <div className="card-body space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Budget</div>
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">{formatMoney(totals.budget_paise)}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Approved ceiling</div>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Spend</div>
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">{formatMoney(totals.expense_total_paise)}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">From transactions</div>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Variance</div>
                  <div className={`text-lg font-bold font-mono mt-1 ${remainingBudget < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {formatMoney(remainingBudget)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{remainingBudget < 0 ? 'Budget deficit' : 'Budget surplus'}</div>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pledged</div>
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">{formatMoney(totals.sponsor_committed_paise)}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Sponsor pledges</div>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deposited</div>
                  <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{formatMoney(totals.sponsor_received_paise)}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Verified received</div>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unpaid Balance</div>
                  <div className={`text-lg font-bold font-mono mt-1 ${(totals.unpaid_balance_paise || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {formatMoney(totals.unpaid_balance_paise)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Pending collection</div>
                </div>
              </div>

              {/* Chart Comparison */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Balance Comparison
                  </span>
                </div>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: isMobile ? 10 : 11 }}
                        stroke="#94a3b8"
                        interval={0}
                        tickFormatter={(val) => (isMobile ? SHORT_CHART_LABELS[val] || val : val)}
                      />
                      <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(val) => formatMoney(val)} width={75} />
                      <Tooltip cursor={false} content={<CustomTooltip formatMoney={formatMoney} />} />
                      <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`rc-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Executive Summary</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {isAi ? 'Model Synthesis' : 'Standard Summary'}
              </span>
            </div>
            <div className="card-body">
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal whitespace-pre-line">
                {displaySummary}
              </p>
            </div>
          </div>

          {/* Priority Issues & Action Items */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Priority Action Items ({currentReport.priorities?.length || 0})
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Linked to Audit Finding Records
              </span>
            </div>
            <div className="card-body">
              {(!currentReport.priorities || currentReport.priorities.length === 0) ? (
                <div className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                  All audit checks are clear with zero high priority issues flagged.
                </div>
              ) : (
                <div className="space-y-4">
                  {currentReport.priorities.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:bg-slate-100/70 dark:hover:bg-slate-950 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-semibold border border-slate-300 dark:border-slate-700">
                          Finding #{item.finding_id || idx + 1}
                        </span>
                        <Link to="/audit" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 font-medium">
                          <span>Inspect Finding</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-200 mb-2 leading-relaxed">
                        <strong className="text-slate-900 dark:text-white font-semibold">Significance: </strong>
                        <span>{adaptPaiseInText(item.why_it_matters, currency, rates)}</span>
                      </div>
                      <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-xl p-3 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                        <strong className="text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">Recommended Action:</strong>
                        <span className="flex-1">{adaptPaiseInText(item.recommended_next_step, currency, rates)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Closing Checklist */}
          {currentReport.closing_checklist && currentReport.closing_checklist.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Event Financial Closeout Checklist
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {Object.values(completedItems).filter(Boolean).length} of {currentReport.closing_checklist.length} verified
                </span>
              </div>
              <div className="card-body">
                <div className="divide-y divide-slate-200 dark:divide-slate-800/70">
                  {currentReport.closing_checklist.map((item, idx) => {
                    const checked = Boolean(completedItems[idx]);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleChecklist(idx)}
                        className={`py-3.5 flex items-start gap-3.5 cursor-pointer select-none transition-colors px-3 rounded-xl ${
                          checked ? 'bg-emerald-50 dark:bg-emerald-950/20 text-slate-400 line-through' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer"
                        />
                        <span className="text-sm font-medium flex-1 leading-relaxed">{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Limitations and Disclosures */}
          {currentReport.limitations && currentReport.limitations.length > 0 && (
            <div className="card bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80">
              <div className="card-header border-slate-200 dark:border-slate-800/70">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Audit Scope & Methodological Disclosures</h3>
                </div>
              </div>
              <div className="card-body">
                <ul className="list-disc list-inside space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {currentReport.limitations.map((lim, idx) => (
                    <li key={idx}>{lim}</li>
                  ))}
                </ul>
                <div className="mt-5 pt-3.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                  <span>SponsorLedger Financial Closeout</span>
                  <span>Verified Ledger Records</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
