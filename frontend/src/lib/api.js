/**
 * API base URL from environment or localhost fallback.
 * VITE_API_URL must be the deployed Render API origin (no trailing slash).
 */
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    let data;
    try { data = await res.json(); } catch { data = null; }
    const message =
      data?.detail ||
      (typeof data === 'string' ? data : `Request failed: ${res.status}`);
    throw new ApiError(message, res.status, data);
  }

  // 204 No Content
  if (res.status === 204) return null;

  return res.json();
}

// ---- Events ----
export const getEvents = () => request('/api/events');
export const getEvent = (id) => request(`/api/events/${id}`);
export const updateEvent = (id, body) =>
  request(`/api/events/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

// ---- Sponsors ----
export const getSponsors = (eventId) => request(`/api/events/${eventId}/sponsors`);
export const createSponsor = (eventId, body) =>
  request(`/api/events/${eventId}/sponsors`, { method: 'POST', body: JSON.stringify(body) });
export const updateSponsor = (sponsorId, body) =>
  request(`/api/sponsors/${sponsorId}`, { method: 'PATCH', body: JSON.stringify(body) });
export const deleteSponsor = (sponsorId) =>
  request(`/api/sponsors/${sponsorId}`, { method: 'DELETE' });

// ---- Deliverables ----
export const getDeliverables = (eventId) => request(`/api/events/${eventId}/deliverables`);
export const createDeliverable = (eventId, body) =>
  request(`/api/events/${eventId}/deliverables`, { method: 'POST', body: JSON.stringify(body) });
export const updateDeliverable = (deliverableId, body) =>
  request(`/api/deliverables/${deliverableId}`, { method: 'PATCH', body: JSON.stringify(body) });

// ---- Expenses ----
export const getExpenses = (eventId) => request(`/api/events/${eventId}/expenses`);
export const createExpense = (eventId, body) =>
  request(`/api/events/${eventId}/expenses`, { method: 'POST', body: JSON.stringify(body) });

export const importPreview = (eventId, file) => {
  const form = new FormData();
  form.append('file', file);
  return fetch(`${BASE}/api/events/${eventId}/expenses/import/preview`, {
    method: 'POST',
    body: form,
  }).then(async (res) => {
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new ApiError(data?.detail || 'Preview failed', res.status, data);
    }
    return res.json();
  });
};

export const importConfirm = (eventId, importToken) =>
  request(`/api/events/${eventId}/expenses/import/confirm`, {
    method: 'POST',
    body: JSON.stringify({ import_token: importToken }),
  });

// ---- Audit ----
export const runAudit = (eventId) =>
  request(`/api/events/${eventId}/audit`, { method: 'POST' });
export const getFindings = (eventId) => request(`/api/events/${eventId}/findings`);
export const updateFinding = (findingId, body) =>
  request(`/api/findings/${findingId}`, { method: 'PATCH', body: JSON.stringify(body) });

// ---- Reports ----
export const getReports = (eventId) => request(`/api/events/${eventId}/reports`);
export const generateReport = (eventId) =>
  request(`/api/events/${eventId}/report`, { method: 'POST' });
export const getReport = (reportId) => request(`/api/reports/${reportId}`);
export const exportReport = (reportId, format = 'markdown') =>
  `${BASE}/api/reports/${reportId}/export?format=${format}`;

// ---- Health & Currency ----
export const getHealth = () => request('/health');
export const getCurrencyRates = () => request('/api/currency/rates');
