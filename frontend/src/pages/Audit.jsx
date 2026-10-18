import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  RotateCcw,
  Link as LinkIcon,
  Lightbulb,
  FileSpreadsheet,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { getEvents, getFindings, runAudit, updateFinding, getExpenses, getSponsors, getDeliverables } from '../lib/api';
import { formatDate, formatDateTime, severityBadge, statusBadge } from '../lib/format';
import { useCurrency } from '../context/CurrencyContext';
import { LoadingPage, ErrorMessage, PageHeader, EmptyState, Modal } from '../components/UI';

export default function Audit() {
  const { formatMoney } = useCurrency();
  const [event, setEvent] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditRunning, setAuditRunning] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('open'); // 'all' | 'open' | 'resolved' | 'dismissed'
  const [severityFilter, setSeverityFilter] = useState('all'); // 'all' | 'high' | 'medium' | 'low'
  const [searchTerm, setSearchTerm] = useState('');

  // Evidence Inspection Modal
  const [selectedRef, setSelectedRef] = useState(null);
  const [refDetails, setRefDetails] = useState(null);
  const [refLoading, setRefLoading] = useState(false);

  // Cache of entities for evidence inspection
  const [expensesCache, setExpensesCache] = useState([]);
  const [sponsorsCache, setSponsorsCache] = useState([]);
  const [deliverablesCache, setDeliverablesCache] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const events = await getEvents();
        if (events.length > 0) {
          const ev = events[0];
          setEvent(ev);
          const [fList, expList, spList, delList] = await Promise.all([
            getFindings(ev.id),
            getExpenses(ev.id).catch(() => []),
            getSponsors(ev.id).catch(() => []),
            getDeliverables(ev.id).catch(() => []),
          ]);
          setFindings(fList);
          setExpensesCache(expList);
          setSponsorsCache(spList);
          setDeliverablesCache(delList);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);


  const handleRunAudit = async () => {
    if (!event) return;
    setAuditRunning(true);
    setError(null);
    setActionSuccess(null);
    try {
      const res = await runAudit(event.id);
      const fList = await getFindings(event.id);
      setFindings(fList);
      setActionSuccess(`Audit engine executed! ${res.findings_created} new finding(s) cataloged.`);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setAuditRunning(false);
    }
  };

  const handleStatusChange = async (findingId, newStatus) => {
    try {
      const updated = await updateFinding(findingId, { status: newStatus });
      setFindings(prev => prev.map(f => f.id === findingId ? updated : f));
      setActionSuccess(`Finding status updated to "${newStatus}".`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const inspectEvidence = (ref) => {
    setSelectedRef(ref);
    setRefLoading(true);
    let item = null;

    if (ref.type === 'expense') {
      item = expensesCache.find(e => String(e.id) === String(ref.id) || String(e._id) === String(ref.id));
    } else if (ref.type === 'sponsor') {
      item = sponsorsCache.find(s => String(s.id) === String(ref.id) || String(s._id) === String(ref.id));
    } else if (ref.type === 'deliverable') {
      item = deliverablesCache.find(d => String(d.id) === String(ref.id) || String(d._id) === String(ref.id));
    }

    setRefDetails(item);
    setRefLoading(false);
  };

  if (loading) return <LoadingPage message="Loading audit rules & findings…" />;
  if (error && !findings.length) return <ErrorMessage message={error} />;
  if (!event) return (
    <EmptyState
      icon={ShieldAlert}
      title="No active event found"
      description="Create or seed an event to run deterministic audit checks."
    />
  );

  // Counts
  const totalFindings = findings.length;
  const openFindings = findings.filter(f => f.status === 'open');
  const resolvedFindings = findings.filter(f => f.status === 'resolved');
  const dismissedFindings = findings.filter(f => f.status === 'dismissed');
  const highSeverity = openFindings.filter(f => f.severity === 'high');
  const medSeverity = openFindings.filter(f => f.severity === 'medium');
  const lowSeverity = openFindings.filter(f => f.severity === 'low');

  // Filtered findings
  const filteredFindings = findings.filter(f => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = f.title.toLowerCase().includes(q);
      const matchCode = f.rule_code.toLowerCase().includes(q);
      const matchExp = f.explanation.toLowerCase().includes(q);
      const matchSuggested = (f.suggested_action || '').toLowerCase().includes(q);
      if (!matchTitle && !matchCode && !matchExp && !matchSuggested) return false;
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Audit Engine & Discrepancies"
        subtitle={`Deterministic verification for ${event.name} • ${openFindings.length} open issue(s)`}
        action={
          <div className="flex items-center gap-3">
            <Link to="/report" className="btn-secondary">
              <FileSpreadsheet className="w-4 h-4 text-purple-400" />
              <span>Closeout Report</span>
            </Link>
            <button
              className="btn-primary"
              onClick={handleRunAudit}
              disabled={auditRunning}
            >
              {auditRunning ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Evaluating Rules…</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Run Audit Engine</span>
                </>
              )}
            </button>
          </div>
        }
      />

      {actionSuccess && (
        <div className="alert-success mb-6 flex items-center justify-between animate-fade-in">
          <span>{actionSuccess}</span>
          <button className="text-emerald-300 font-bold" onClick={() => setActionSuccess(null)}>×</button>
        </div>
      )}

      {error && (
        <div className="alert-error mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button className="text-rose-300 font-bold" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="card p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Findings</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{totalFindings}</div>
          <div className="text-xs text-slate-500 mt-0.5">{openFindings.length} unresolved</div>
        </div>
        <div className="card p-4 border-l-4 border-rose-500">
          <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">High Severity</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{highSeverity.length}</div>
          <div className="text-xs text-rose-500/80 mt-0.5">Immediate attention</div>
        </div>
        <div className="card p-4 border-l-4 border-amber-500">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Medium Severity</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{medSeverity.length}</div>
          <div className="text-xs text-amber-500/80 mt-0.5">Review candidate items</div>
        </div>
        <div className="card p-4 border-l-4 border-blue-500">
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Low Severity</div>
          <div className="text-2xl font-bold font-mono text-blue-400 mt-1">{lowSeverity.length}</div>
          <div className="text-xs text-blue-500/80 mt-0.5">Good recordkeeping</div>
        </div>
        <div className="card p-4 border-l-4 border-emerald-500">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Resolved / Dismissed</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{resolvedFindings.length + dismissedFindings.length}</div>
          <div className="text-xs text-emerald-500/80 mt-0.5">{resolvedFindings.length} resolved, {dismissedFindings.length} dismissed</div>
        </div>
      </div>

      {/* Audit Transparency Callout */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-6 flex items-start gap-3.5 text-xs text-slate-400 backdrop-blur-sm">
        <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-200">Audit Safety Guardrail: </span>
          All audit findings are generated deterministically in Python using strict rule evaluation.
          No financial numbers are fabricated or hallucinated by AI. Findings represent verifiable discrepancies
          linking to original source records for human review.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card mb-6">
        <div className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Status buttons */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
            <span className="text-xs font-semibold text-slate-400 mr-1 shrink-0">Status:</span>
            {[
              { id: 'open', label: `Open (${openFindings.length})` },
              { id: 'resolved', label: `Resolved (${resolvedFindings.length})` },
              { id: 'dismissed', label: `Dismissed (${dismissedFindings.length})` },
              { id: 'all', label: `All (${totalFindings})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Severity select */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400 shrink-0">Severity:</span>
              <select
                className="form-input text-xs py-1.5 px-3 bg-slate-900"
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
              >
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Search input */}
            <div className="relative flex-1 md:w-56">
              <input
                type="text"
                placeholder="Search rule or keyword…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="form-input text-xs py-1.5 pl-8 pr-3"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-300">
            {statusFilter === 'open' ? <ShieldCheck className="w-6 h-6 text-emerald-400" /> : <Search className="w-6 h-6 text-slate-400" />}
          </div>
          <div className="font-semibold text-white text-base">
            {statusFilter === 'open' ? 'All Ledger Rules Clear' : 'No matching findings'}
          </div>
          <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {statusFilter === 'open'
              ? 'Every recorded transaction and sponsor commitment complies with deterministic rules.'
              : 'Try broadening your search term or adjusting severity filters.'}
          </div>
          {statusFilter === 'open' && (
            <button className="btn-secondary btn-sm mt-4" onClick={handleRunAudit}>
              Re-run Audit Engine
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredFindings.map(f => (
            <div
              key={f.id}
              className={`card ${
                f.status === 'resolved'
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
                  : f.status === 'dismissed'
                  ? 'bg-slate-900/30 border-slate-800/40 opacity-70'
                  : f.severity === 'high'
                  ? 'border-l-4 border-l-rose-500'
                  : f.severity === 'medium'
                  ? 'border-l-4 border-l-amber-500'
                  : 'border-l-4 border-l-blue-400'
              }`}
            >
              <div className="p-6">
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${severityBadge(f.severity)}`}>
                      {f.severity.toUpperCase()}
                    </span>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 font-semibold border border-slate-700">
                      {f.rule_code}
                    </span>
                    <span className={`badge ${statusBadge(f.status)}`}>
                      {f.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Logged {formatDateTime(f.created_at)}
                    {f.resolved_at && ` • Resolved ${formatDateTime(f.resolved_at)}`}
                  </div>
                </div>

                {/* Title & explanation */}
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">{f.explanation}</p>

                {/* Suggested Action callout */}
                {f.suggested_action && (
                  <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-3.5 text-xs text-indigo-200 mb-4 flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-indigo-300">Suggested Action: </strong>
                      <span>{f.suggested_action}</span>
                    </div>
                  </div>
                )}

                {/* Evidence / Source references */}
                {f.source_refs && f.source_refs.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/70 mb-4">
                    <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Linked Source Records & Evidence:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {f.source_refs.map((ref, idx) => (
                        <button
                          key={idx}
                          onClick={() => inspectEvidence(ref)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 text-xs transition-colors border border-slate-700/80 group"
                          title="Click to inspect underlying database record"
                        >
                          <span className="capitalize font-semibold text-slate-400 group-hover:text-indigo-400">
                            {ref.type}:
                          </span>
                          <span className="font-medium font-mono text-slate-300 truncate max-w-xs">{ref.label || ref.id}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 ml-0.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
                  <div className="text-xs text-slate-500 font-mono">
                    ID: {f.id.slice(0, 14)}…
                  </div>
                  <div className="flex items-center gap-2">
                    {f.status === 'open' ? (
                      <>
                        <button
                          onClick={() => handleStatusChange(f.id, 'dismissed')}
                          className="btn-secondary btn-sm"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Dismiss</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(f.id, 'resolved')}
                          className="btn-teal btn-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Resolved</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(f.id, 'open')}
                        className="btn-secondary btn-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reopen Finding</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Source Record Inspection Modal */}
      <Modal
        open={Boolean(selectedRef)}
        onClose={() => { setSelectedRef(null); setRefDetails(null); }}
        title={`Evidence Inspection: ${selectedRef?.type?.toUpperCase()}`}
      >
        {selectedRef && (
          <div>
            <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 mb-4 text-xs font-mono space-y-1 text-slate-400">
              <div><span className="text-slate-500">Record ID:</span> <span className="text-slate-200">{selectedRef.id}</span></div>
              <div><span className="text-slate-500">Record Type:</span> <span className="text-indigo-400 capitalize">{selectedRef.type}</span></div>
              {selectedRef.label && <div><span className="text-slate-500">Label:</span> <span className="text-slate-200">{selectedRef.label}</span></div>}
            </div>

            {refLoading ? (
              <div className="py-6 text-center text-slate-400 text-xs">Retrieving database record…</div>
            ) : refDetails ? (
              <div className="space-y-3 text-sm">
                {selectedRef.type === 'expense' && (
                  <div className="bg-slate-900 rounded-xl border border-slate-800 divide-y divide-slate-800/70 text-xs">
                    <div className="px-3.5 py-2.5 flex justify-between">
                      <span className="text-slate-400">Vendor / Merchant:</span>
                      <span className="font-semibold text-white">{refDetails.vendor}</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex justify-between">
                      <span className="text-slate-400">Category:</span>
                      <span className="badge badge-low">{refDetails.category}</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex justify-between">
                      <span className="text-slate-400">Amount:</span>
                      <span className="font-mono font-bold text-white">{formatMoney(refDetails.amount_paise)}</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex justify-between">
                      <span className="text-slate-400">Date:</span>
                      <span className="font-mono">{formatDate(refDetails.date)}</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex justify-between">
                      <span className="text-slate-400">Receipt Ref:</span>
                      <span>
                        {refDetails.receipt_ref ? (
                          <code className="bg-slate-800 px-2 py-0.5 rounded font-mono text-indigo-300 border border-slate-700">
                            {refDetails.receipt_ref}
                          </code>
                        ) : (
                          <span className="text-rose-400 font-medium">None Recorded</span>
                        )}
                      </span>
                    </div>
                    {refDetails.notes && (
                      <div className="px-3.5 py-2.5 flex justify-between">
                        <span className="text-slate-400">Internal Notes:</span>
                        <span className="text-slate-300 text-right max-w-xs">{refDetails.notes}</span>
                      </div>
                    )}
                  </div>
                )}

                {selectedRef.type === 'sponsor' && (
                  <div className="bg-slate-900 rounded-xl border border-slate-800 divide-y divide-slate-800/70 text-xs">
                    <div className="px-3.5 py-2.5 flex justify-between">
                      <span className="text-slate-400">Organization:</span>
                      <span className="font-semibold text-white">{refDetails.name}</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex justify-between">
                      <span className="text-slate-400">Committed:</span>
                      <span className="font-mono font-semibold text-white">{formatMoney(refDetails.committed_paise)}</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex justify-between">
                      <span className="text-slate-400">Received:</span>
                      <span className="font-mono font-semibold text-emerald-400">{formatMoney(refDetails.received_paise)}</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex justify-between">
                      <span className="text-slate-400">Outstanding:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {formatMoney(Math.max(0, (refDetails.committed_paise || 0) - (refDetails.received_paise || 0)))}
                      </span>
                    </div>
                    {refDetails.contact_label && (
                      <div className="px-3.5 py-2.5 flex justify-between">
                        <span className="text-slate-400">Primary Contact:</span>
                        <span className="text-slate-200">{refDetails.contact_label}</span>
                      </div>
                    )}
                  </div>
                )}

                {selectedRef.type === 'deliverable' && (
                  <div className="bg-slate-900 rounded-xl border border-slate-800 divide-y divide-slate-800/70 text-xs">
                    <div className="px-3.5 py-2.5 flex justify-between">
                      <span className="text-slate-400">Description:</span>
                      <span className="font-semibold text-white">{refDetails.description || refDetails.title}</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex justify-between">
                      <span className="text-slate-400">Due Date:</span>
                      <span className="font-mono text-slate-300">{formatDate(refDetails.due_date)}</span>
                    </div>
                    <div className="px-3.5 py-2.5 flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className={`badge badge-${refDetails.status}`}>{refDetails.status}</span>
                    </div>
                    {refDetails.evidence_url && (
                      <div className="px-3.5 py-2.5 flex justify-between">
                        <span className="text-slate-400">Proof URL:</span>
                        <a href={refDetails.evidence_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1">
                          <span>Open Evidence</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-800/80 rounded-xl text-xs text-slate-400">
                Detailed record attributes for ID <code>{selectedRef.id}</code> are not available in current cache.
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                className="btn-secondary btn-sm"
                onClick={() => { setSelectedRef(null); setRefDetails(null); }}
              >
                Close Viewer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
