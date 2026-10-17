import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  CreditCard,
  Handshake,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Search,
} from 'lucide-react';
import { getEvents, getFindings } from '../lib/api';
import { formatDate } from '../lib/format';
import { useCurrency } from '../context/CurrencyContext';
import { LoadingPage, ErrorMessage, PageHeader } from '../components/UI';

function StatCard({ label, value, sub, color = 'indigo', icon: Icon }) {
  const iconThemes = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  const textThemes = {
    indigo: 'text-white',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    blue: 'text-blue-400',
  };

  return (
    <div className="stat-card group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${iconThemes[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold font-mono tracking-tight ${textThemes[color]}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { formatMoney, currency, currencySymbol } = useCurrency();
  const [event, setEvent] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const events = await getEvents();
        if (events.length > 0) {
          const ev = events[0];
          setEvent(ev);
          const f = await getFindings(ev.id);
          setFindings(f);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingPage message="Loading dashboard overview…" />;
  if (error) return <ErrorMessage message={error} />;
  if (!event) return (
    <div className="card p-12 text-center text-slate-400">
      <div className="font-semibold text-slate-200">No active events found</div>
      <div className="text-xs text-slate-400 mt-1">Please seed or create an event in the database.</div>
    </div>
  );

  const budget = event.budget_paise || 0;
  const spent = event.expense_total_paise || 0;
  const committed = event.sponsor_committed_paise || 0;
  const received = event.sponsor_received_paise || 0;
  const unpaid = event.unpaid_balance_paise || 0;
  const remaining = event.remaining_budget_paise || 0;
  const openFindings = findings.filter(f => f.status === 'open');
  const highFindings = openFindings.filter(f => f.severity === 'high');

  const utilisation = budget > 0 ? (spent / budget) * 100 : 0;
  const collectionRate = committed > 0 ? Math.round((received / committed) * 100) : 0;

  return (
    <div>
      <PageHeader
        title={event.name}
        subtitle={`Event scheduled: ${formatDate(event.event_date)} • Base: ${event.currency || 'USD'} • Displaying in: ${currency} (${currencySymbol})`}
        action={
          <div className="flex items-center gap-3">
            <Link to="/report" className="btn-secondary">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Closeout Report</span>
            </Link>
            <Link to="/audit" className="btn-primary">
              <Search className="w-4 h-4" />
              <span>Run Audit</span>
            </Link>
          </div>
        }
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          icon={Wallet}
          label="Budget"
          value={formatMoney(budget)}
          color="indigo"
          sub="Total allocation"
        />
        <StatCard
          icon={CreditCard}
          label="Expenses"
          value={formatMoney(spent)}
          sub={`${utilisation.toFixed(0)}% utilised`}
          color={spent > budget ? 'rose' : 'emerald'}
        />
        <StatCard
          icon={Handshake}
          label="Pledged"
          value={formatMoney(committed)}
          color="blue"
          sub="Sponsor commitments"
        />
        <StatCard
          icon={CheckCircle2}
          label="Collected"
          value={formatMoney(received)}
          sub={`${collectionRate}% received`}
          color="emerald"
        />
        <StatCard
          icon={Clock}
          label="Unpaid Balance"
          value={formatMoney(unpaid)}
          color={unpaid > 0 ? 'amber' : 'emerald'}
          sub={unpaid > 0 ? 'Pending collections' : 'Fully collected'}
        />
        <StatCard
          icon={ShieldAlert}
          label="Open Issues"
          value={openFindings.length}
          sub={highFindings.length > 0 ? `${highFindings.length} high priority` : 'Zero high priority'}
          color={openFindings.length > 0 ? (highFindings.length > 0 ? 'rose' : 'amber') : 'emerald'}
        />
      </div>

      {/* Budget Utilisation Meter */}
      <div className="card mb-8">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">Budget Allocation & Spend Rate</h2>
              <p className="text-xs text-slate-400 mt-0.5">Deterministic ledger calculations in exact integer units</p>
            </div>
            <div className="text-right font-mono text-sm">
              <span className="font-bold text-white">{formatMoney(spent)}</span>
              <span className="text-slate-500"> / {formatMoney(budget)}</span>
            </div>
          </div>

          <div className="w-full bg-slate-800/90 rounded-full h-3 overflow-hidden p-0.5 border border-slate-750">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                utilisation > 100
                  ? 'bg-gradient-to-r from-rose-600 to-rose-400'
                  : utilisation > 85
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                  : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
              }`}
              style={{ width: `${Math.min(utilisation, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
            <span>0%</span>
            <span className={remaining < 0 ? 'text-rose-400 font-semibold flex items-center gap-1' : 'text-emerald-400 font-semibold'}>
              {remaining >= 0 ? `${formatMoney(remaining)} remaining balance` : `${formatMoney(-remaining)} budget deficit`}
            </span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Audit Findings Quick Summary */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              Active Audit Findings ({openFindings.length})
            </h2>
          </div>
          <Link to="/audit" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
            <span>Open Audit Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {openFindings.length > 0 ? (
          <div className="divide-y divide-slate-800/60">
            {openFindings.slice(0, 5).map(f => (
              <div key={f.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`badge shrink-0 mt-0.5 ${
                    f.severity === 'high' ? 'badge-high' :
                    f.severity === 'medium' ? 'badge-medium' : 'badge-low'
                  }`}>
                    {f.severity}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-100 truncate">{f.title}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">{f.rule_code}</div>
                  </div>
                </div>
                <Link
                  to="/audit"
                  className="btn-ghost btn-sm shrink-0"
                >
                  Inspect
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-body py-12 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <div className="font-medium text-slate-200 text-sm">All Ledger Rules Clear</div>
            <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No outstanding anomalies or missing receipts detected.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
