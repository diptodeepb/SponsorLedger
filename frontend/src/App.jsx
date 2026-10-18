import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { CurrencyProvider } from './context/CurrencyContext';
import Layout from './components/Layout';
import { LoadingPage } from './components/UI';

const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Sponsors = lazy(() => import('./pages/Sponsors'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Audit = lazy(() => import('./pages/Audit'));
const Report = lazy(() => import('./pages/Report'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PolicyDoc'));

// Wrap Routes with Sentry React Router v7 routing instrumentation
const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes);

function SentryFallback({ error, resetError }) {
  const isChunkError =
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('dynamically imported');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 dark:text-red-400 font-bold text-xl">
          !
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {isChunkError ? 'Application Update Available' : 'Something went wrong'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {isChunkError
            ? 'A newer version of the application code has been deployed. Please reload the page to continue.'
            : (error?.message || 'An unexpected runtime error was caught and logged.')}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-md"
          >
            Reload Page
          </button>
          <button
            type="button"
            onClick={() => {
              resetError?.();
              window.location.href = '/';
            }}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={SentryFallback}>
      <CurrencyProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingPage message="Loading SponsorLedger…" />}>
            <SentryRoutes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
              <Route path="/sponsors" element={<Layout><Sponsors /></Layout>} />
              <Route path="/expenses" element={<Layout><Expenses /></Layout>} />
              <Route path="/audit" element={<Layout><Audit /></Layout>} />
              <Route path="/report" element={<Layout><Report /></Layout>} />
              <Route path="/tos" element={<Layout><TermsOfService /></Layout>} />
              <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
              <Route path="/terms-of-use" element={<Navigate to="/tos" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </SentryRoutes>
          </Suspense>
        </BrowserRouter>
      </CurrencyProvider>
    </Sentry.ErrorBoundary>
  );
}
