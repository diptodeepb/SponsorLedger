import { AlertCircle, X, Loader2 } from 'lucide-react';

export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <Loader2 className={`animate-spin text-indigo-400 ${sizes[size]} ${className}`} />
  );
}

export function LoadingPage({ message = 'Loading ledger data…' }) {
  return (
    <div className="flex flex-col items-center justify-center h-80 gap-3 text-slate-400">
      <Spinner size="lg" />
      <span className="text-sm font-medium text-slate-400 tracking-wide">{message}</span>
    </div>
  );
}

export function ErrorMessage({ message }) {
  return (
    <div className="alert-error flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <strong className="font-semibold text-rose-300">Error: </strong>
        <span>{message || 'An unexpected error occurred. Please try again.'}</span>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state card p-12 border-dashed border-slate-800/90 flex flex-col items-center">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 mb-4 shadow-inner">
          <Icon className="w-6 h-6 text-slate-400" />
        </div>
      )}
      <div className="font-semibold text-slate-200 text-base mb-1.5">{title}</div>
      {description && <div className="text-sm text-slate-400 max-w-sm mb-5 leading-relaxed">{description}</div>}
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden ring-1 ring-white/10 animate-scale-up">
        <div className="px-6 py-4.5 border-b border-slate-800/80 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-slate-300 mb-6 leading-relaxed">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button
          className={danger ? 'btn-danger' : 'btn-primary'}
          onClick={onConfirm}
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-slate-800/70">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
}
