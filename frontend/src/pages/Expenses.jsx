import { useEffect, useState, useRef } from 'react';
import {
  Receipt,
  Plus,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Check,
  Sparkles,
  FileText,
  Download,
  Copy,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Zap,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { getEvents, getExpenses, createExpense, importPreview, importConfirm, deleteExpense, deleteAllExpenses, resetSandbox, redirectToDashboard } from '../lib/api';
import { formatDate } from '../lib/format';
import { useCurrency } from '../context/CurrencyContext';
import { LoadingPage, ErrorMessage, Modal, PageHeader, EmptyState } from '../components/UI';

// ---- Single Expense Form ----
function ExpenseForm({ onSave, onCancel, loading }) {
  const { currency, currencySymbol, convertToPaise } = useCurrency();
  const [form, setForm] = useState(() => ({
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    category: '',
    amount: '',
    receipt_ref: '',
    notes: '',
  }));
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      date: form.date,
      vendor: form.vendor.trim(),
      category: form.category.trim(),
      amount_paise: convertToPaise(form.amount || '0'),
      receipt_ref: form.receipt_ref.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="form-label">Transaction Date *</label>
          <input className="form-input" type="date" value={form.date} onChange={set('date')} required />
        </div>
        <div className="form-group">
          <label className="form-label">Amount ({currencySymbol}) *</label>
          <input
            className="form-input font-mono"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={set('amount')}
            required
            placeholder="100.00"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">Active currency: {currency}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="form-label">Vendor / Merchant *</label>
          <input
            className="form-input"
            value={form.vendor}
            onChange={set('vendor')}
            required
            maxLength={200}
            placeholder="Print House Express"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Expense Category *</label>
          <input
            className="form-input"
            value={form.category}
            onChange={set('category')}
            required
            maxLength={100}
            placeholder="Printing, Catering, AV"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="form-label">Receipt / Voucher Ref</label>
          <input
            className="form-input font-mono"
            value={form.receipt_ref}
            onChange={set('receipt_ref')}
            maxLength={200}
            placeholder="RCPT-001 (optional)"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Internal Notes</label>
          <input
            className="form-input"
            value={form.notes}
            onChange={set('notes')}
            maxLength={500}
            placeholder="e.g. Approved by Lead Organiser"
          />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-3 border-t border-slate-800">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Recording…' : 'Record Expense'}
        </button>
      </div>
    </form>
  );
}

// Sample irregular text data for 1-click test
const SAMPLE_IRREGULAR_TEXT = `# Hackathon Operational Expenses & Invoices (Unstructured Log)
1. Print House delivered vinyl banners and stage backdrops on 2026-09-01. Total was 4,500 INR. Category: Printing. Receipt ref: RCPT-001. Note: Main stage banner and direction signs.
2. Campus Catering invoice for 8,200 rupees on 2026-09-02 for volunteer lunch boxes and breakfast snacks. Category: Food. Receipt code: RCPT-002.
3. Logistics pickup by Quick Movers on 2026-09-03: 1,800 INR for shifting hackathon hardware kits from warehouse to campus. Category: Logistics. No receipt reference was provided.
4. AV Solutions supplied 4 wireless microphones and two 1000W stage speakers on 2026-09-10. Bill came out to Rs 7,500. Category: Equipment. Ref: RCPT-003.
5. Stage Decor Co completed floral and stage backdrop lighting on 2026-10-01 for 3,200 INR. Category: Decorations. Invoice ref: RCPT-004.
6. City Transport provided airport shuttle transfer for VIP keynote speaker on 2026-10-05, costing 2100 inr. Category: Transport. Receipt: RCPT-005.
7. Goodies Store delivered 250 printed participant t-shirts and hacker stickers on 2026-10-10. Cost: 5,600 INR. Category: Merchandise. Voucher: RCPT-006.
8. Online Ads paid to Meta & Google for attendee registration campaign on 2026-10-12: 1400.00 rupees. Category: Marketing. (Pending receipt).
9. Security Services provided 4 overnight guards on 2026-10-15: 4800 inr. Category: Security. Reference: RCPT-007.`;

// ---- Batch Import (CSV & Gemma AI Irregular .txt) ----
function CSVImport({ eventId, onImported }) {
  const { formatMoney } = useCurrency();
  const fileRef = useRef();
  const [step, setStep] = useState('idle'); // idle | previewing | preview | confirming | done
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileMeta, setFileMeta] = useState({ name: '', isTxt: false, size: 0 });
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showCsvViewer, setShowCsvViewer] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);

  const processFile = async (file) => {
    if (!file) return;
    const isTxt = file.name.toLowerCase().endsWith('.txt');
    setFileMeta({ name: file.name, isTxt, size: file.size });

    // Calculate accurate estimated processing time
    const estSec = isTxt
      ? Math.max(3.2, Math.min(9.5, 3.2 + Math.ceil(file.size / 450) * 0.7))
      : 0.6;
    setEstimatedTime(estSec);
    setElapsedTime(0);
    setError(null);
    setStep('previewing');

    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
    }, 80);

    try {
      const data = await importPreview(eventId, file);
      clearInterval(timer);
      setElapsedTime((Date.now() - startTime) / 1000);
      setPreview(data);
      setStep('preview');
    } catch (err) {
      clearInterval(timer);
      setError(err.message || 'File ingestion failed');
      setStep('idle');
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleQuickSample = () => {
    const blob = new Blob([SAMPLE_IRREGULAR_TEXT], { type: 'text/plain' });
    const sampleFile = new File([blob], 'sample_irregular_expenses.txt', { type: 'text/plain' });
    processFile(sampleFile);
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setStep('confirming');
    try {
      await importConfirm(eventId, preview.import_token);
      setStep('done');
      onImported();
    } catch (err) {
      setError(err.message);
      setStep('preview');
    }
  };

  const handleCopyCsv = () => {
    if (!preview?.converted_csv) return;
    navigator.clipboard.writeText(preview.converted_csv);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2500);
  };

  const handleDownloadCsv = () => {
    if (!preview?.converted_csv) return;
    const blob = new Blob([preview.converted_csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synthesized_expenses_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setStep('idle');
    setPreview(null);
    setError(null);
    setShowCsvViewer(false);
    setCopiedCsv(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  // Dynamic status text during ingestion
  const getPhaseMessage = () => {
    if (!fileMeta.isTxt) return 'Parsing CSV and validating integer amount rules…';
    if (elapsedTime < 1.2) return 'Phase 1/3: Ingesting unstructured text content…';
    if (elapsedTime < 4.2) return 'Phase 2/3: Gemma AI reading dates, vendors, amounts & categories…';
    return 'Phase 3/3: Running schema contract validation & duplicate checks…';
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Batch Expense Ingestion</h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Gemma AI Irregular .txt Supported
          </span>
        </div>
        {step !== 'idle' && step !== 'done' && (
          <button className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" onClick={reset}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-6">
        {error && <div className="alert-error mb-4">{error}</div>}

        {step === 'idle' && (
          <div>
            <div className="flex items-start justify-between gap-4 mb-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Upload a structured bank/ledger <strong className="text-slate-700 dark:text-slate-200">CSV</strong> or drop an irregular, unstructured <strong className="text-indigo-600 dark:text-indigo-400">.txt</strong> notes file. Gemma AI will synthesize dates, vendors, categories, and amounts into verified ledger entries.
              </p>
              <button
                type="button"
                onClick={handleQuickSample}
                className="shrink-0 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Try Sample Irregular .txt</span>
              </button>
            </div>

            <label
              className="cursor-pointer block"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 group ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
                    : 'border-slate-300 dark:border-slate-750 hover:border-indigo-500/60 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                </div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white">
                  Click to select CSV / TXT or drop file here
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Supports standard <code className="text-slate-500 dark:text-slate-400 font-mono">.csv</code> or irregular text notes in <code className="text-slate-500 dark:text-slate-400 font-mono">.txt</code> (UTF-8, up to 1 MB)
                </div>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileInput} />
            </label>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span>Sample CSV: <code className="text-slate-600 dark:text-slate-300">sample-data/expenses.csv</code></span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span>Sample TXT: <code className="text-slate-600 dark:text-slate-300">sample-data/irregular_expenses.txt</code></span>
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Duplicate detection active</span>
            </div>
          </div>
        )}

        {step === 'previewing' && (
          <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full" />
              {fileMeta.isTxt && (
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 absolute inset-0 m-auto" />
              )}
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {fileMeta.isTxt ? 'Gemma AI Processing Irregular Text' : 'Validating CSV File'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {getPhaseMessage()}
              </div>
            </div>

            {/* Accurate estimated time & progress bar */}
            <div className="w-full max-w-md space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                <span>Elapsed: {elapsedTime.toFixed(1)}s</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                  Estimated time: ~{estimatedTime.toFixed(1)}s
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-150 ease-out"
                  style={{
                    width: `${Math.min(95, (elapsedTime / estimatedTime) * 92)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="space-y-4 animate-fade-in">
            {/* Gemma AI Banner if converted from irregular text */}
            {preview.ai_converted && (
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>
                    Successfully synthesized irregular text via <strong>Gemma AI ({preview.model_id || 'gemma-4-26b-a4b-it'})</strong> in{' '}
                    <strong className="font-mono text-indigo-600 dark:text-indigo-300">{((preview.elapsed_ms || 0) / 1000).toFixed(1)}s</strong>.
                  </span>
                </div>
                {preview.converted_csv && (
                  <button
                    type="button"
                    onClick={() => setShowCsvViewer(!showCsvViewer)}
                    className="shrink-0 flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{showCsvViewer ? 'Hide CSV' : 'View Synthesized CSV'}</span>
                    {showCsvViewer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>
            )}

            {/* Synthesized CSV Inspection Drawer */}
            {showCsvViewer && preview.converted_csv && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-900/90 text-slate-200 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-sans font-semibold">
                    Gemma Synthesized CSV Stream ({preview.accepted_count} rows)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCsv}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedCsv ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCsv ? 'Copied!' : 'Copy CSV'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCsv}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <pre className="overflow-x-auto max-h-40 p-2 text-[11px] leading-relaxed text-emerald-400">
                  {preview.converted_csv}
                </pre>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3.5 text-center">
                <div className="text-2xl font-bold font-mono text-emerald-400">{preview.accepted_count}</div>
                <div className="text-xs text-emerald-300 font-medium">Valid entries</div>
              </div>
              <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-3.5 text-center">
                <div className="text-2xl font-bold font-mono text-rose-400">{preview.rejected_count}</div>
                <div className="text-xs text-rose-300 font-medium">Rejected rows</div>
              </div>
              <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3.5 text-center">
                <div className="text-2xl font-bold font-mono text-amber-400">{preview.duplicate_warnings.length}</div>
                <div className="text-xs text-amber-300 font-medium">Duplicate alerts</div>
              </div>
            </div>

            {preview.rejected_rows.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Validation Errors</span>
                </div>
                <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl divide-y divide-rose-900/30 max-h-32 overflow-y-auto">
                  {preview.rejected_rows.map((r, i) => (
                    <div key={i} className="px-3.5 py-2 text-xs text-rose-300">
                      <strong className="font-mono">Row {r.row}:</strong> {r.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {preview.duplicate_warnings.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Candidate Duplicates</span>
                </div>
                <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl divide-y divide-amber-900/30 max-h-32 overflow-y-auto">
                  {preview.duplicate_warnings.map((w, i) => (
                    <div key={i} className="px-3.5 py-2 text-xs text-amber-300">
                      <strong className="font-mono">Row {w.row}:</strong> {w.warning} {w.other_row}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {preview.accepted_count > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Ingestion Records Preview ({preview.accepted_count} records)</span>
                  <span className="text-[11px] text-slate-500 font-normal">Scroll to verify all rows</span>
                </div>
                <div className="table-wrapper max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="table text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900 shadow-xs">
                      <tr>
                        <th>Date</th>
                        <th>Vendor</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Receipt Ref</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.accepted_rows.map((r, i) => (
                        <tr key={i}>
                          <td className="font-mono text-slate-500 dark:text-slate-400">{r.date}</td>
                          <td className="font-medium text-slate-800 dark:text-slate-200">{r.vendor}</td>
                          <td>
                            <span className="badge badge-low">{r.category}</span>
                          </td>
                          <td className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatMoney(r.amount_paise)}</td>
                          <td className="font-mono text-slate-500 dark:text-slate-400">
                            {r.receipt_ref || <span className="text-slate-400 dark:text-slate-600">None</span>}
                          </td>
                          <td className="text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                            {r.notes || <span className="text-slate-400 dark:text-slate-600">None</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button className="btn-secondary" onClick={reset}>Cancel</button>
              <button
                className="btn-primary"
                onClick={handleConfirm}
                disabled={preview.accepted_count === 0}
              >
                <Check className="w-4 h-4" />
                <span>Confirm Import ({preview.accepted_count} rows)</span>
              </button>
            </div>
          </div>
        )}

        {step === 'confirming' && (
          <div className="flex items-center justify-center gap-3 py-8 text-slate-400 text-sm">
            <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
            <span>Persisting verified batch to ledger…</span>
          </div>
        )}

        {step === 'done' && (
          <div className="alert-success flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Import completed and verified against database ledger.</span>
            </div>
            <button className="text-xs text-emerald-300 hover:underline font-semibold cursor-pointer" onClick={reset}>
              Upload another file
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function Expenses() {
  const { formatMoney, currencySymbol } = useCurrency();
  const [eventId, setEventId] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const events = await getEvents();
        if (events.length > 0) {
          const eid = events[0].id;
          setEventId(eid);
          setExpenses(await getExpenses(eid));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const reload = async () => {
    if (!eventId) return;
    setExpenses(await getExpenses(eventId));
  };

  const handleSave = async (body) => {
    setSaving(true);
    setFormError(null);
    try {
      await createExpense(eventId, body);
      await reload();
      setAddModal(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id);
      await reload();
    } catch (err) {
      alert('Failed to delete expense: ' + (err.message || 'Error'));
    }
  };

  const handleClearAllExpenses = async () => {
    if (!window.confirm('Clear all expense transactions in your sandbox? This lets you test fresh imports from a clean slate.')) return;
    try {
      await deleteAllExpenses(eventId);
      await reload();
    } catch (err) {
      alert('Failed to clear expenses: ' + (err.message || 'Error'));
    }
  };

  if (loading) return <LoadingPage message="Loading expense transactions…" />;
  if (error) return <ErrorMessage message={error} />;

  const total = expenses.reduce((s, e) => s + e.amount_paise, 0);
  const missingReceipt = expenses.filter(e => !e.receipt_ref).length;

  return (
    <div>
      <PageHeader
        title="Expense Ledger"
        subtitle={`${expenses.length} transaction(s) recorded • Total spend: ${formatMoney(total)}${missingReceipt > 0 ? ` • ${missingReceipt} missing receipt ref(s)` : ''}`}
        action={
          <button
            className="btn-primary"
            onClick={() => { setFormError(null); setAddModal(true); }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        }
      />

      {/* CSV Import Module */}
      {eventId && (
        <div className="mb-8">
          <CSVImport eventId={eventId} onImported={reload} />
        </div>
      )}

      {/* Expense Table */}
      {expenses.length === 0 ? (
        <div className="card p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mx-auto text-indigo-500">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Clean Ledger Slate
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              No transactions recorded in this sandbox yet. You can upload your own bank CSV statement or irregular TXT notes, or restore the sample demo dataset anytime.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                await resetSandbox();
                redirectToDashboard();
              }}
              className="btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
              <span>Load Sample Demo Data</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                All Transactions ({expenses.length})
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Total: <span className="font-semibold text-slate-900 dark:text-slate-200">{formatMoney(total)}</span>
              </span>
              <button
                type="button"
                onClick={handleClearAllExpenses}
                className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
                title="Wipe transactions to start clean"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          </div>
          <div className="table-wrapper max-h-[500px] overflow-y-auto">
            <table className="table">
              <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-xs shadow-xs">
                <tr>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Amount ({currencySymbol})</th>
                  <th>Receipt Reference</th>
                  <th>Internal Notes</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td className="text-slate-500 dark:text-slate-400 font-mono text-xs">{formatDate(e.date)}</td>
                    <td className="font-semibold text-slate-900 dark:text-white">{e.vendor}</td>
                    <td>
                      <span className="badge badge-low">{e.category}</span>
                    </td>
                    <td className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatMoney(e.amount_paise)}</td>
                    <td>
                      {e.receipt_ref ? (
                        <code className="text-xs bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-mono border border-slate-200 dark:border-slate-750">
                          {e.receipt_ref}
                        </code>
                      ) : (
                        <span className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Missing Ref</span>
                        </span>
                      )}
                    </td>
                    <td className="text-slate-500 dark:text-slate-400 text-xs max-w-xs truncate">{e.notes || <span className="text-slate-400 dark:text-slate-600 italic">None</span>}</td>
                    <td className="w-8 text-right pr-4">
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(e.id)}
                        className="text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 transition-colors p-1 rounded cursor-pointer"
                        title="Delete this transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Record New Expense">
        {formError && <div className="alert-error mb-4">{formError}</div>}
        <ExpenseForm onSave={handleSave} onCancel={() => setAddModal(false)} loading={saving} />
      </Modal>
    </div>
  );
}
