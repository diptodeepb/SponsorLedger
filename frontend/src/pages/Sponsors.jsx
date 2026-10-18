import { useEffect, useState } from 'react';
import {
  Handshake,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
} from 'lucide-react';
import {
  getEvents,
  getSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  getDeliverables,
  createDeliverable,
  updateDeliverable,
} from '../lib/api';
import { formatDate } from '../lib/format';
import { useCurrency } from '../context/CurrencyContext';
import { LoadingPage, ErrorMessage, Modal, PageHeader, EmptyState } from '../components/UI';

// ---- Sponsor Form ----
function SponsorForm({ initial = {}, onSave, onCancel, loading }) {
  const { currency, currencySymbol, convertFromPaise, convertToPaise } = useCurrency();

  const [form, setForm] = useState({
    name: initial.name || '',
    committed_amount: initial.committed_paise != null
      ? convertFromPaise(initial.committed_paise).toString()
      : '',
    received_amount: initial.received_paise != null
      ? convertFromPaise(initial.received_paise).toString()
      : '0',
    contact_label: initial.contact_label || '',
    notes: initial.notes || '',
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name: form.name.trim(),
      committed_paise: convertToPaise(form.committed_amount || '0'),
      received_paise: convertToPaise(form.received_amount || '0'),
      contact_label: form.contact_label.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="form-group">
        <label className="form-label">Sponsor Organization *</label>
        <input
          className="form-input"
          value={form.name}
          onChange={set('name')}
          required
          maxLength={200}
          placeholder="e.g. Stripe, GitHub, Vercel"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="form-label">Pledged / Committed ({currencySymbol}) *</label>
          <input
            className="form-input font-mono"
            type="number"
            min="0"
            step="0.01"
            value={form.committed_amount}
            onChange={set('committed_amount')}
            required
            placeholder="15000"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">Active currency: {currency}</span>
        </div>
        <div className="form-group">
          <label className="form-label">Received / Deposited ({currencySymbol})</label>
          <input
            className="form-input font-mono"
            type="number"
            min="0"
            step="0.01"
            value={form.received_amount}
            onChange={set('received_amount')}
            placeholder="10000"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">Active currency: {currency}</span>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Primary Contact</label>
        <input
          className="form-input"
          value={form.contact_label}
          onChange={set('contact_label')}
          maxLength={200}
          placeholder="e.g. Sarah Connor (sponsor-ops@company.com)"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Agreement Notes</label>
        <textarea
          className="form-input"
          rows={2}
          value={form.notes}
          onChange={set('notes')}
          maxLength={1000}
          placeholder="Key terms, tier benefits, or wire transfer reference"
        />
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : initial.id ? 'Save Changes' : 'Create Sponsor'}
        </button>
      </div>
    </form>
  );
}

// ---- Deliverable Form ----
function DeliverableForm({ sponsors, initial = {}, onSave, onCancel, loading }) {
  const [form, setForm] = useState(() => ({
    sponsor_id: initial.sponsor_id || (sponsors[0] ? sponsors[0].id : ''),
    description: initial.description || '',
    due_date: initial.due_date || new Date().toISOString().split('T')[0],
    evidence_url: initial.evidence_url || '',
    status: initial.status || 'pending',
    notes: initial.notes || '',
  }));

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      sponsor_id: form.sponsor_id,
      description: form.description.trim(),
      due_date: form.due_date,
      evidence_url: form.evidence_url.trim() || undefined,
      status: form.status,
      notes: form.notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="form-group">
        <label className="form-label">Sponsor Partner *</label>
        <select className="form-input" value={form.sponsor_id} onChange={set('sponsor_id')} required>
          {sponsors.map(sp => (
            <option key={sp.id} value={sp.id}>{sp.name}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Obligation / Benefit Description *</label>
        <input
          className="form-input"
          value={form.description}
          onChange={set('description')}
          required
          maxLength={300}
          placeholder="e.g. Keynote speaking slot (20 min), Logo on badge lanyard"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="form-label">Due Date *</label>
          <input
            className="form-input"
            type="date"
            value={form.due_date}
            onChange={set('due_date')}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-input" value={form.status} onChange={set('status')}>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="waived">Waived</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Proof / Verification Link</label>
        <input
          className="form-input"
          type="url"
          value={form.evidence_url}
          onChange={set('evidence_url')}
          placeholder="https://drive.google.com/… or https://flickr.com/…"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Internal Notes</label>
        <textarea
          className="form-input"
          rows={2}
          value={form.notes}
          onChange={set('notes')}
          maxLength={500}
          placeholder="Assignee, banner specifications, booth location"
        />
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : initial.id ? 'Save Changes' : 'Create Deliverable'}
        </button>
      </div>
    </form>
  );
}

export default function Sponsors() {
  const { formatMoney } = useCurrency();
  const [event, setEvent] = useState(null);
  const [sponsors, setSponsors] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [sponsorModal, setSponsorModal] = useState(false);
  const [editSponsor, setEditSponsor] = useState(null);
  const [delivModal, setDelivModal] = useState(false);
  const [editDeliv, setEditDeliv] = useState(null);
  const [delModal, setDelModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Accordion open sponsor ID
  const [expandedSponsor, setExpandedSponsor] = useState(null);

  const reload = async () => {
    try {
      const events = await getEvents();
      if (events.length > 0) {
        const ev = events[0];
        setEvent(ev);
        const [spList, dList] = await Promise.all([
          getSponsors(ev.id),
          getDeliverables(ev.id),
        ]);
        setSponsors(spList);
        setDeliverables(dList);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const events = await getEvents();
        if (active && events.length > 0) {
          const ev = events[0];
          setEvent(ev);
          const [spList, dList] = await Promise.all([
            getSponsors(ev.id),
            getDeliverables(ev.id),
          ]);
          setSponsors(spList);
          setDeliverables(dList);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, []);

  const handleSaveSponsor = async (data) => {
    setSaving(true);
    setFormError(null);
    try {
      if (editSponsor && editSponsor.id) {
        await updateSponsor(editSponsor.id, data);
      } else {
        await createSponsor(event.id, data);
      }
      setSponsorModal(false);
      setEditSponsor(null);
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSponsor = async () => {
    if (!delModal) return;
    setSaving(true);
    try {
      await deleteSponsor(delModal);
      setDelModal(null);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDeliverable = async (data) => {
    setSaving(true);
    setFormError(null);
    try {
      if (editDeliv && editDeliv.id) {
        await updateDeliverable(editDeliv.id, data);
      } else {
        await createDeliverable(event.id, data);
      }
      setDelivModal(false);
      setEditDeliv(null);
      await reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingPage message="Loading sponsors & agreements…" />;
  if (error) return <ErrorMessage message={error} />;

  const totalCommitted = sponsors.reduce((s, sp) => s + sp.committed_paise, 0);
  const totalReceived = sponsors.reduce((s, sp) => s + sp.received_paise, 0);
  const totalOutstanding = Math.max(0, totalCommitted - totalReceived);

  return (
    <div>
      <PageHeader
        title="Sponsors & Commitments"
        subtitle={`${sponsors.length} partner(s) • ${formatMoney(totalCommitted)} pledged • ${formatMoney(totalReceived)} collected`}
        action={
          <div className="flex items-center gap-3">
            <button
              className="btn-secondary"
              onClick={() => { setEditDeliv(null); setFormError(null); setDelivModal(true); }}
            >
              <Plus className="w-4 h-4" />
              <span>Deliverable</span>
            </button>
            <button
              className="btn-primary"
              onClick={() => { setEditSponsor(null); setFormError(null); setSponsorModal(true); }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Sponsor</span>
            </button>
          </div>
        }
      />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4.5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Pledged</div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">{formatMoney(totalCommitted)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Handshake className="w-5 h-5" />
          </div>
        </div>
        <div className="card p-4.5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Received</div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{formatMoney(totalReceived)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="card p-4.5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Outstanding Balance</div>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">{formatMoney(totalOutstanding)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {sponsors.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No sponsors recorded yet"
          description="Register event sponsors to reconcile promised funds against bank receipts and deliverables."
          action={
            <button
              className="btn-primary"
              onClick={() => { setEditSponsor(null); setSponsorModal(true); }}
            >
              <Plus className="w-4 h-4" />
              <span>Add First Sponsor</span>
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {sponsors.map(sp => {
            const spDelivs = deliverables.filter(d => d.sponsor_id === sp.id);
            const balance = sp.committed_paise - sp.received_paise;
            const isExpanded = expandedSponsor === sp.id;

            return (
              <div key={sp.id} className="card">
                {/* Sponsor row */}
                <div className="px-6 py-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div
                    className="flex-1 cursor-pointer select-none"
                    onClick={() => setExpandedSponsor(isExpanded ? null : sp.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {sp.name}
                      </span>
                      {balance > 0 && <span className="badge badge-medium">balance due</span>}
                      {balance < 0 && <span className="badge badge-high">overpayment</span>}
                      {balance === 0 && <span className="badge badge-completed">paid in full</span>}
                    </div>
                    {sp.contact_label && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <span>Contact:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{sp.contact_label}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial figures */}
                  <div className="flex items-center gap-6 text-sm font-mono">
                    <div className="text-right">
                      <div className="font-semibold text-slate-900 dark:text-white">{formatMoney(sp.committed_paise)}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-sans uppercase tracking-wider">committed</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400">{formatMoney(sp.received_paise)}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-sans uppercase tracking-wider">received</div>
                    </div>
                    <div className="text-right min-w-[70px]">
                      <div className={`font-semibold ${balance > 0 ? 'text-amber-600 dark:text-amber-400' : balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {balance !== 0 ? formatMoney(Math.abs(balance)) : <span className="text-xs font-sans text-slate-400 dark:text-slate-500">Settled</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-sans uppercase tracking-wider">
                        {balance > 0 ? 'unpaid' : balance < 0 ? 'extra' : 'settled'}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => setExpandedSponsor(isExpanded ? null : sp.id)}
                    >
                      <span>{spDelivs.length} deliverables</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => { setEditSponsor(sp); setFormError(null); setSponsorModal(true); }}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      className="btn-ghost btn-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      onClick={() => setDelModal(sp.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Deliverables expandable accordion */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Deliverables for {sp.name} ({spDelivs.length})
                      </span>
                      <button
                        className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 cursor-pointer"
                        onClick={() => { setEditDeliv({ sponsor_id: sp.id }); setFormError(null); setDelivModal(true); }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Deliverable</span>
                      </button>
                    </div>

                    {spDelivs.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
                        No promised deliverables tracked yet for this sponsor.
                      </div>
                    ) : (
                      <div className="table-wrapper">
                        <table className="table text-xs">
                          <thead>
                            <tr>
                              <th>Obligation / Description</th>
                              <th>Due Date</th>
                              <th>Status</th>
                              <th>Evidence</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {spDelivs.map(d => (
                              <tr key={d.id}>
                                <td className="text-slate-900 dark:text-slate-100 font-medium">{d.description}</td>
                                <td className="text-slate-500 dark:text-slate-400 font-mono">{formatDate(d.due_date)}</td>
                                <td>
                                  <span className={`badge badge-${d.status}`}>{d.status}</span>
                                </td>
                                <td>
                                  {d.evidence_url ? (
                                    <a
                                      href={d.evidence_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-indigo-400 hover:underline flex items-center gap-1"
                                    >
                                      <span>View Proof</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ) : (
                                    <span className="text-slate-500">None attached</span>
                                  )}
                                </td>
                                <td>
                                  <div className="flex items-center gap-2">
                                    {d.status === 'pending' && (
                                      <button
                                        className="text-emerald-400 hover:text-emerald-300 font-medium"
                                        onClick={async () => {
                                          await updateDeliverable(d.id, { status: 'completed' });
                                          reload();
                                        }}
                                      >
                                        ✓ Complete
                                      </button>
                                    )}
                                    <button
                                      className="text-slate-400 hover:text-slate-200"
                                      onClick={() => { setEditDeliv(d); setDelivModal(true); }}
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sponsor Modal */}
      <Modal
        open={sponsorModal}
        onClose={() => { setSponsorModal(false); setEditSponsor(null); setFormError(null); }}
        title={editSponsor ? 'Edit Sponsor Commitment' : 'Add New Sponsor'}
      >
        {formError && <div className="alert-error mb-4">{formError}</div>}
        <SponsorForm
          initial={editSponsor || {}}
          onSave={handleSaveSponsor}
          onCancel={() => { setSponsorModal(false); setEditSponsor(null); }}
          loading={saving}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={Boolean(delModal)} onClose={() => setDelModal(null)} title="Delete Sponsor">
        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          Are you sure you want to remove this sponsor? This action will permanently remove all associated
          commitment data. If deliverables are attached, resolve or remove them first.
        </p>
        <div className="flex gap-3 justify-end">
          <button className="btn-secondary" onClick={() => setDelModal(null)}>Cancel</button>
          <button className="btn-danger" onClick={handleDeleteSponsor} disabled={saving}>
            {saving ? 'Deleting…' : 'Delete Sponsor'}
          </button>
        </div>
      </Modal>

      {/* Deliverable Modal */}
      <Modal
        open={delivModal}
        onClose={() => { setDelivModal(false); setEditDeliv(null); setFormError(null); }}
        title={editDeliv?.id ? 'Edit Deliverable' : 'Track New Deliverable'}
      >
        {formError && <div className="alert-error mb-4">{formError}</div>}
        {sponsors.length > 0 ? (
          <DeliverableForm
            sponsors={sponsors}
            initial={editDeliv || {}}
            onSave={handleSaveDeliverable}
            onCancel={() => { setDelivModal(false); setEditDeliv(null); }}
            loading={saving}
          />
        ) : (
          <p className="text-sm text-slate-400">Please register a sponsor first before adding deliverables.</p>
        )}
      </Modal>
    </div>
  );
}
