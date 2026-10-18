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
} from 'lucide-react';
import { getEvents, getExpenses, createExpense, importPreview, importConfirm } from '../lib/api';
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

// ---- CSV Import ----
function CSVImport({ eventId, onImported }) {
  const { formatMoney } = useCurrency();
  const fileRef = useRef();
  const [step, setStep] = useState('idle'); // idle | previewing | preview | confirming | done
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStep('previewing');
    setError(null);
    try {
      const data = await importPreview(eventId, file);
      setPreview(data);
      setStep('preview');
    } catch (err) {
      setError(err.message);
      setStep('idle');
    }
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

  const reset = () => {
    setStep('idle');
    setPreview(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="card">
      <div className="card-header bg-slate-900/90">
        <div className="flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Batch Expense Ingestion</h2>
        </div>
        {step !== 'idle' && step !== 'done' && (
          <button className="text-xs text-slate-400 hover:text-slate-200" onClick={reset}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="p-6">
        {error && <div className="alert-error mb-4">{error}</div>}

        {step === 'idle' && (
          <div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Upload a bank statement or spreadsheet CSV. Required headers:{' '}
              <code className="text-xs bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                date, vendor, category, amount_inr, receipt_ref, notes
              </code>
            </p>
            <label className="cursor-pointer block">
              <div className="border-2 border-dashed border-slate-750 hover:border-indigo-500/60 rounded-2xl p-8 text-center bg-slate-950/40 hover:bg-slate-900/50 transition-all duration-200 group">
                <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-400 mx-auto mb-2 transition-colors" />
                <div className="text-sm font-medium text-slate-200 group-hover:text-white">
                  Click to select CSV or drop file here
                </div>
                <div className="text-xs text-slate-500 mt-1">UTF-8 encoded, up to 2,000 transactions</div>
              </div>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </label>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Try with repo sample: <code className="text-slate-400">sample-data/expenses.csv</code></span>
              <span>Deterministic duplicate checking active</span>
            </div>
          </div>
        )}

        {step === 'previewing' && (
          <div className="flex items-center justify-center gap-3 py-8 text-slate-400 text-sm">
            <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
            <span>Parsing CSV & validating integer amounts…</span>
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="space-y-4">
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
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Sample Ingestion Preview (first 5 records)
                </div>
                <div className="table-wrapper">
                  <table className="table text-xs">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Vendor</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Receipt Ref</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.accepted_rows.slice(0, 5).map((r, i) => (
                        <tr key={i}>
                          <td className="font-mono text-slate-400">{r.date}</td>
                          <td className="font-medium text-slate-200">{r.vendor}</td>
                          <td>
                            <span className="badge badge-low">{r.category}</span>
                          </td>
                          <td className="font-mono font-semibold text-emerald-400">{formatMoney(r.amount_paise)}</td>
                          <td className="font-mono text-slate-400">
                            {r.receipt_ref || <span className="text-slate-600">—</span>}
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
              <span>Import completed and verified against database.</span>
            </div>
            <button className="text-xs text-emerald-300 hover:underline font-semibold" onClick={reset}>
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
        <EmptyState
          icon={Receipt}
          title="No expenses recorded yet"
          description="Track cash outlays by recording individual payments or uploading a bank CSV statement."
        />
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-200">
                All Transactions ({expenses.length})
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total: <span className="font-semibold text-slate-200">{formatMoney(total)}</span>
            </span>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Amount ({currencySymbol})</th>
                  <th>Receipt Reference</th>
                  <th>Internal Notes</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td className="text-slate-400 font-mono text-xs">{formatDate(e.date)}</td>
                    <td className="font-semibold text-white">{e.vendor}</td>
                    <td>
                      <span className="badge badge-low">{e.category}</span>
                    </td>
                    <td className="font-mono font-bold text-slate-100">{formatMoney(e.amount_paise)}</td>
                    <td>
                      {e.receipt_ref ? (
                        <code className="text-xs bg-slate-800 text-indigo-300 px-2 py-0.5 rounded font-mono border border-slate-750">
                          {e.receipt_ref}
                        </code>
                      ) : (
                        <span className="text-xs font-medium text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Missing Ref</span>
                        </span>
                      )}
                    </td>
                    <td className="text-slate-400 text-xs max-w-xs truncate">{e.notes || '—'}</td>
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
