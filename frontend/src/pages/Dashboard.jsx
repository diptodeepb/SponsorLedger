import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  CreditCard,
  Handshake,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Search,
  PieChart as PieIcon,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { getEvents, getFindings, getExpenses, getSponsors } from '../lib/api';
import { formatDate } from '../lib/format';
import { useCurrency } from '../context/CurrencyContext';
import { LoadingPage, ErrorMessage, PageHeader } from '../components/UI';
import { useIsMobile } from '../lib/useIsMobile';

const SHORT_CHART_LABELS = {
  'Allocated Budget': 'Budget',
  'Actual Spent': 'Spent',
  'Actual Spend': 'Spent',
  'Sponsor Pledged': 'Pledged',
  'Committed Sponsorship': 'Pledged',
  'Sponsor Received': 'Received',
  'Received Sponsorship': 'Received',
};

const PALETTE = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#ec4899', // Pink
  '#3b82f6', // Blue
];

function StatCard({ label, value, sub, color = 'indigo', icon: Icon }) {
  const iconThemes = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
    blue: 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20',
  };

  const textThemes = {
    indigo: 'text-slate-900 dark:text-white',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
    blue: 'text-sky-600 dark:text-sky-400',
  };

  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-snug min-w-0 pt-0.5">
          {label}
        </span>
        {Icon && (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-200 group-hover:scale-105 ${iconThemes[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold font-mono tracking-tight ${textThemes[color]}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

function CustomTooltip({ active, payload, label, formatMoney }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl backdrop-blur-md text-xs">
        {label && <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1.5">{label}</p>}
        {payload.map((entry, index) => (
          <div key={`tip-${index}`} className="flex items-center justify-between gap-3 text-slate-600 dark:text-slate-300 py-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
              <span>{entry.name}:</span>
            </div>
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

export default function Dashboard() {
  const { formatMoney, currency, currencySymbol } = useCurrency();
  const isMobile = useIsMobile(640);
  const [event, setEvent] = useState(null);
  const [findings, setFindings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const events = await getEvents();
        if (events.length > 0) {
          const ev = events[0];
          setEvent(ev);
          const [f, exp, sp] = await Promise.all([
            getFindings(ev.id).catch(() => []),
            getExpenses(ev.id).catch(() => []),
            getSponsors(ev.id).catch(() => []),
          ]);
          setFindings(f);
          setExpenses(exp);
          setSponsors(sp);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Category breakdown for Pie Chart
  const categoryData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    const map = {};
    expenses.forEach((e) => {
      const cat = e.category || 'General';
      map[cat] = (map[cat] || 0) + (e.amount_paise || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  // Cumulative Spending Timeline for Area Chart
  const timelineData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    const sorted = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
    let cum = 0;
    return sorted.map((e) => {
      cum += e.amount_paise || 0;
      return {
        date: formatDate(e.date),
        spent: cum,
        vendor: e.vendor,
      };
    });
  }, [expenses]);

  if (loading) return <LoadingPage message="Loading dashboard overview…" />;
  if (error) return <ErrorMessage message={error} />;
  if (!event) return (
    <div className="card p-12 text-center text-slate-500 dark:text-slate-400">
      <div className="font-semibold text-slate-800 dark:text-slate-200">No active events found</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Please seed or create an event to get started.</div>
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

  // Comparison bar chart data
  const comparisonData = [
    { name: 'Allocated Budget', amount: budget, fill: '#6366f1' },
    { name: 'Actual Spent', amount: spent, fill: spent > budget ? '#f43f5e' : '#10b981' },
    { name: 'Sponsor Pledged', amount: committed, fill: '#3b82f6' },
    { name: 'Sponsor Received', amount: received, fill: '#06b6d4' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={event.name}
        subtitle={`Event scheduled: ${formatDate(event.event_date)} • Base Currency: ${event.currency || 'USD'} • Active View: ${currency} (${currencySymbol})`}
        action={
          <div className="flex items-center gap-3">
            <Link to="/report" className="btn-secondary">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
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
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
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
          sub={`${sponsors.length} sponsors`}
        />
        <StatCard
          icon={CheckCircle2}
          label="Collected"
          value={formatMoney(received)}
          sub={`${collectionRate}% collected`}
          color="emerald"
        />
        <StatCard
          icon={Clock}
          label="Unpaid Balance"
          value={formatMoney(unpaid)}
          color={unpaid > 0 ? 'amber' : 'emerald'}
          sub={unpaid > 0 ? 'Pending collection' : 'Zero balance due'}
        />
        <StatCard
          icon={ShieldAlert}
          label="Open Issues"
          value={openFindings.length}
          sub={highFindings.length > 0 ? `${highFindings.length} high priority` : 'Zero high priority'}
          color={openFindings.length > 0 ? (highFindings.length > 0 ? 'rose' : 'amber') : 'emerald'}
        />
      </div>

      {/* Interactive Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Flow Bar Chart */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Financial Breakdown & Reconciliation
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {currency} Values
            </span>
          </div>
          <div className="card-body">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: isMobile ? 10 : 11 }}
                    stroke="#94a3b8"
                    interval={0}
                    tickFormatter={(val) => (isMobile ? SHORT_CHART_LABELS[val] || val : val)}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                    tickFormatter={(val) => formatMoney(val)}
                    width={75}
                  />
                  <Tooltip cursor={false} content={<CustomTooltip formatMoney={formatMoney} />} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {comparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Expenses by Category Donut Chart */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Expense Categories
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {categoryData.length} active
            </span>
          </div>
          <div className="card-body flex flex-col items-center justify-center">
            {categoryData.length > 0 ? (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cat-${index}`} fill={PALETTE[index % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip formatMoney={formatMoney} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-3 max-h-24 overflow-y-auto">
                  {categoryData.map((cat, idx) => (
                    <div key={cat.name} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} />
                      <span className="truncate max-w-[80px]">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                No categorized expenses recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cumulative Burn Timeline if expenses available */}
      {timelineData.length > 1 && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Cumulative Spend Trajectory
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {expenses.length} transactions recorded
            </span>
          </div>
          <div className="card-body">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: isMobile ? 10 : 11 }}
                    stroke="#94a3b8"
                    interval={isMobile ? 'preserveStartEnd' : 'preserveEnd'}
                    minTickGap={15}
                  />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(val) => formatMoney(val)} width={75} />
                  <Tooltip cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }} content={<CustomTooltip formatMoney={formatMoney} />} />
                  <Area type="monotone" dataKey="spent" name="Cumulative Spend" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#spendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Budget Utilisation Meter */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-wide">
                Budget Allocation & Burn Rate
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time tracking of overall budget capacity
              </p>
            </div>
            <div className="text-right font-mono text-sm">
              <span className="font-bold text-slate-900 dark:text-white">{formatMoney(spent)}</span>
              <span className="text-slate-500 dark:text-slate-400"> / {formatMoney(budget)}</span>
            </div>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-300 dark:border-slate-750">
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

          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono">
            <span>0%</span>
            <span className={remaining < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
              {remaining >= 0 ? `${formatMoney(remaining)} available` : `${formatMoney(-remaining)} over budget`}
            </span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Audit Findings Quick Summary */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Active Audit Findings ({openFindings.length})
            </h2>
          </div>
          <Link to="/audit" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 transition-colors">
            <span>Open Audit Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {openFindings.length > 0 ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-800/60">
            {openFindings.slice(0, 5).map(f => (
              <div key={f.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`badge shrink-0 mt-0.5 ${
                    f.severity === 'high' ? 'badge-high' :
                    f.severity === 'medium' ? 'badge-medium' : 'badge-low'
                  }`}>
                    {f.severity}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{f.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">{f.rule_code}</div>
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
          <div className="card-body py-12 text-center text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mx-auto mb-3" />
            <div className="font-medium text-slate-900 dark:text-slate-200 text-sm">All Ledger Rules Clear</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              No outstanding anomalies or missing receipts detected.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
