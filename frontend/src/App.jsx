import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { CurrencyProvider } from './context/CurrencyContext';
import Layout from './components/Layout';
import { LoadingPage } from './components/UI';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Sponsors = lazy(() => import('./pages/Sponsors'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Audit = lazy(() => import('./pages/Audit'));
const Report = lazy(() => import('./pages/Report'));

// Wrap Routes with Sentry React Router v7 routing instrumentation
const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes);

function SentryFallback({ error, resetError }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 dark:text-red-400 font-bold text-xl">
          !
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {error?.message || 'An unexpected runtime error was caught and logged.'}
        </p>
        <button
          type="button"
          onClick={() => {
            resetError?.();
            window.location.href = '/';
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={SentryFallback}>
      <CurrencyProvider>
        <BrowserRouter>
          <Layout>
            <Suspense fallback={<LoadingPage message="Loading page…" />}>
              <SentryRoutes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/sponsors" element={<Sponsors />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/audit" element={<Audit />} />
                <Route path="/report" element={<Report />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </SentryRoutes>
            </Suspense>
          </Layout>
        </BrowserRouter>
      </CurrencyProvider>
    </Sentry.ErrorBoundary>
  );
}
