import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Sparkles,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Cpu,
  Clock,
  Wallet,
  CheckSquare,
  Scale,
  ExternalLink,
} from 'lucide-react';
import { getEvents, getReports, generateReport, exportReport } from '../lib/api';
import { formatDate, formatDateTime } from '../lib/format';
import { useCurrency } from '../context/CurrencyContext';
import { LoadingPage, ErrorMessage, PageHeader, EmptyState } from '../components/UI';

export default function Report() {
  const { formatMoney, currency, currencySymbol } = useCurrency();
  const [event, setEvent] = useState(null);
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [completedItems, setCompletedItems] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
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

  const handleGenerate = async () => {
    if (!event) return;
    setGenerating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const newReport = await generateReport(event.id);
      setCurrentReport(newReport);
      setReports(prev => [newReport, ...prev]);
      setCompletedItems({});
      const statusText = newReport.ai_status === 'ai_generated'
        ? `Closeout report synthesized with Gemma (${newReport.model_id || 'gemma-4-26b-a4b-it'}).`
        : 'Report generated successfully via deterministic audit engine.';
      setSuccessMsg(statusText);
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const toggleChecklist = (idx) => {
    setCompletedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
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

  return (
    <div>
      <PageHeader
        title="Financial Closeout Report"
        subtitle={`Synthesis and formal audit summary for ${event.name}`}
        action={
          <div className="flex items-center gap-3">
            <Link to="/audit" className="btn-secondary">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span>Audit Rules</span>
            </Link>
            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Synthesizing with Gemma…</span>
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

      {successMsg && (
        <div className="alert-success mb-6 flex items-center justify-between animate-fade-in">
          <span>{successMsg}</span>
          <button className="text-emerald-300 font-bold" onClick={() => setSuccessMsg(null)}>×</button>
        </div>
      )}

      {error && (
        <div className="alert-error mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button className="text-rose-300 font-bold" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {!currentReport ? (
        <div className="card p-12 text-center text-slate-400">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-4">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">No Closeout Report Generated Yet</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            Synthesize verified transactions and audit findings into an executive briefing,
            actionable priorities, and closing checklist powered by Gemma 4.
          </p>
          <button
            className="btn-primary"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? 'Synthesizing Report…' : 'Generate First Report'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Report Metadata & Provenance Banner */}
          <div className="card bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-6 border-slate-750">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <span className={`badge ${isAi ? 'badge-ai' : 'badge-fallback'}`}>
                    {isAi ? <Sparkles className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
                    <span>{isAi ? 'Gemma 4 Narrative' : 'Deterministic Fallback'}</span>
                  </span>
                  {currentReport.model_id && (
                    <span className="text-xs text-slate-300 font-mono bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                      {currentReport.model_id}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono">
                    Snapshot: {formatDateTime(currentReport.generated_at)}
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Event Closeout & Reconciliation: {event.name}
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  {isAi
                    ? 'Prose drafted using Google Gemma via Gemini API. All totals, variances, and evidence references are calculated deterministically by Python in exact integer paise.'
                    : 'Generated deterministically by the SponsorLedger audit service without external model dependency.'}
                </p>
              </div>

              {/* Export actions */}
              <div className="flex items-center gap-2 self-start md:self-center">
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
                <a
                  href={exportReport(currentReport.id, 'html')}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="btn-secondary btn-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>HTML</span>
                </a>
                <button
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
            <div className="flex items-center gap-2.5 px-1 text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-slate-400">Saved Snapshots:</span>
              <select
                className="form-input text-xs py-1 px-3 max-w-xs bg-slate-900"
                value={currentReport.id}
                onChange={(e) => {
                  const selected = reports.find(r => r.id === e.target.value);
                  if (selected) {
                    setCurrentReport(selected);
                    setCompletedItems({});
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

          {/* Verified Financial Totals */}
          <div className="card">
            <div className="card-header bg-slate-900/90">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Verified Financial Totals</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Viewing in {currency} ({currencySymbol})
              </span>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget</div>
                  <div className="text-lg font-bold font-mono text-white mt-1">{formatMoney(totals.budget_paise)}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Approved ceiling</div>
                </div>
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Spend</div>
                  <div className="text-lg font-bold font-mono text-white mt-1">{formatMoney(totals.expense_total_paise)}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">From transactions</div>
                </div>
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Budget Variance</div>
                  <div className={`text-lg font-bold font-mono mt-1 ${remainingBudget < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatMoney(remainingBudget)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{remainingBudget < 0 ? 'Deficit' : 'Surplus'}</div>
                </div>
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pledged</div>
                  <div className="text-lg font-bold font-mono text-white mt-1">{formatMoney(totals.sponsor_committed_paise)}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Total commitments</div>
                </div>
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Deposited</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-1">{formatMoney(totals.sponsor_received_paise)}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Verified received</div>
                </div>
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unpaid Balance</div>
                  <div className={`text-lg font-bold font-mono mt-1 ${(totals.unpaid_balance_paise || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {formatMoney(totals.unpaid_balance_paise)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Pending collections</div>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="card">
            <div className="card-header bg-slate-900/90">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Executive Briefing</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {isAi ? 'Model Synthesis' : 'Standard Summary'}
              </span>
            </div>
            <div className="card-body">
              <p className="text-sm text-slate-200 leading-relaxed font-normal">
                {currentReport.executive_summary || 'No summary text available.'}
              </p>
            </div>
          </div>

          {/* Priority Issues & Action Items */}
          <div className="card">
            <div className="card-header bg-slate-900/90">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">
                  Priority Findings & Action Items ({currentReport.priorities?.length || 0})
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Grounded to Audit Finding IDs
              </span>
            </div>
            <div className="card-body">
              {(!currentReport.priorities || currentReport.priorities.length === 0) ? (
                <div className="text-sm text-slate-400 py-4 text-center">
                  ✅ No urgent discrepancies flagged in this report snapshot.
                </div>
              ) : (
                <div className="space-y-4">
                  {currentReport.priorities.map((item, idx) => (
                    <div key={idx} className="p-4.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 transition-colors">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-mono text-xs font-semibold border border-slate-700">
                          Finding #{item.finding_id || idx + 1}
                        </span>
                        <Link to="/audit" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                          <span>Inspect Finding</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="text-sm text-slate-200 mb-2 leading-relaxed">
                        <strong className="text-white font-semibold">Significance: </strong>
                        <span>{item.why_it_matters}</span>
                      </div>
                      <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-3 text-xs text-indigo-200 flex items-start gap-2.5">
                        <strong className="text-indigo-400 font-semibold shrink-0">Recommended Action:</strong>
                        <span className="flex-1">{item.recommended_next_step}</span>
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
              <div className="card-header bg-slate-900/90">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Event Financial Closeout Checklist
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {Object.values(completedItems).filter(Boolean).length} of {currentReport.closing_checklist.length} verified
                </span>
              </div>
              <div className="card-body">
                <div className="divide-y divide-slate-800/70">
                  {currentReport.closing_checklist.map((item, idx) => {
                    const checked = Boolean(completedItems[idx]);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleChecklist(idx)}
                        className={`py-3.5 flex items-start gap-3.5 cursor-pointer select-none transition-colors px-3 rounded-xl ${
                          checked ? 'bg-emerald-950/20 text-slate-500 line-through' : 'hover:bg-slate-800/30 text-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer"
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
            <div className="card bg-slate-900/50 border-slate-800/80">
              <div className="card-header border-slate-800/70">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-300">Audit Scope & Methodological Disclosures</h3>
                </div>
              </div>
              <div className="card-body">
                <ul className="list-disc list-inside space-y-2 text-xs text-slate-400 leading-relaxed">
                  {currentReport.limitations.map((lim, idx) => (
                    <li key={idx}>{lim}</li>
                  ))}
                </ul>
                <div className="mt-5 pt-3.5 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                  <span>SponsorLedger MVP • Evidence-Linked Event Finance</span>
                  <span>Hosted Gemma 4 via Gemini API</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
