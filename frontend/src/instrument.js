import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Tunnel envelopes through our own backend to avoid 3rd-party tracker flags in Brave Shields
    tunnel: `${API_BASE}/api/tunnel`,
    release: import.meta.env.VITE_SENTRY_RELEASE || 'sponsorledger-frontend@0.1.0',
    debug: false,
    environment: import.meta.env.MODE || 'development',
    integrations: [
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Performance Tracing
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 0.5,
    tracePropagationTargets: [
      'localhost',
      /^\//,
      /^https?:\/\/localhost:8000/,
    ],

    // Session Replay - only capture on errors, no continuous recording pings
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,

    // Structured Logs (available via Sentry.logger)
    enableLogs: true,
  });
}

export default Sentry;
