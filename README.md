# SponsorLedger — Evidence-Linked AI Financial Auditor for Events

> **An evidence-linked event finance and sponsorship auditor.**
> Reconcile event budgets, sponsor commitments, deliverables, and expenses with pure Python deterministic rules, live multi-currency exchange via `forex-python`, and Gemma narrative closeout reporting.

[![CI](https://github.com/diptodeepb/SponsorLedger/actions/workflows/ci.yml/badge.svg)](https://github.com/diptodeepb/SponsorLedger/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8.svg)](https://tailwindcss.com)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas_Free-green.svg)](https://www.mongodb.com/atlas)
[![Gemma](https://img.shields.io/badge/AI-Gemma_via_Gemini-purple.svg)](https://ai.google.dev/gemma)

---

## 🧭 Table of Contents

- [Why SponsorLedger?](#why-sponsorledger)
- [Core Capabilities](#core-capabilities)
- [Multi-Currency &amp; Live FX Engine](#multi-currency--live-fx-engine)
- [Architecture &amp; Data Flow](#architecture--data-flow)
- [Audit Rules &amp; Financial Guardrails](#audit-rules--financial-guardrails)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [One-Command Unified Runner](#one-command-unified-runner)
  - [Manual Setup](#manual-setup)
- [Interactive Demo Walkthrough](#interactive-demo-walkthrough)
- [Automated Testing](#automated-testing)
- [Deployment Guide](#deployment-guide)
- [License](#license)

---

## 🌟 Why SponsorLedger?

Running a hackathon, student conference, or community summit is exhilarating, but closing the books afterward is often stressful:

- Sponsor commitments live in personal spreadsheets and scattered messaging threads.
- Deliverables (stage mentions, logo placements, booth space) are agreed upon over email and easily forgotten on the day of the event.
- Organizers pay out-of-pocket for last-minute supplies, leaving a paper trail of crumpled paper slips and digital receipts.
- Weeks after the venue empties, organizers struggle to answer: _Did we stay within budget? Did every sponsor transfer their pledged amount? Were all deliverables fulfilled before we close the fiscal year?_

**SponsorLedger** was built from firsthand event organizing experience. It pairs an **audit-first deterministic rule engine** with a **live multi-currency presentation layer** and **Gemma narrative synthesis**, giving organizing teams total financial clarity without spreadsheet chaos.

---

## ⚡ Core Capabilities

- **Deterministic Rule Engine**: Pure Python inspects transactions, unpaid balances, overdue sponsor deliverables, missing receipt numbers, and candidate duplicate expenses without fuzzy guesswork.
- **Exact Integer Base Unit Arithmetic**: All canonical values are stored and calculated in exact integer units (`paise`), completely eliminating IEEE 754 floating-point rounding errors ($0.1 + 0.2 \neq 0.3$).
- **Multi-Currency Swapping**: View and input figures in **USD** (default), **INR**, **EUR**, **GBP**, **JPY**, **CAD**, **AUD**, **CHF**, or **SGD** with live exchange rates powered by `forex-python`.
- **Evidence-Linked Traceability**: Every audit finding links directly to the specific expense, sponsor, or deliverable records that triggered it. Inspect receipts, notes, and contacts directly inside the UI.
- **Narrative Closeout Reporting**: Google Gemma synthesizes verified audit numbers into executive briefings, prioritized remediation steps, and closing checklists. Crucially, the AI is constrained by schema and system prompt to never compute or invent numbers.
- **Deterministic Offline Fallback**: If the AI quota is exhausted or an API key is not configured, the system falls back to a clean deterministic report template with zero downtime.
- **Batch CSV Ingestion**: Upload bank or credit card CSV statements with real-time validation, duplicate detection, and format preview before confirming.

---

## 💱 Multi-Currency & Live FX Engine

SponsorLedger provides first-class currency support across both backend APIs and the frontend UI:

- **Default Currency**: **USD** ($) is the standard base currency for all views, reports, and events.
- **Top Global Currencies Supported**: USD, INR, EUR, GBP, JPY, CAD, AUD, CHF, and SGD.
- **Live Exchange Rates via `forex-python`**:
  - The backend service leverages `forex-python` (`CurrencyRates` and `CurrencyCodes`) wrapped asynchronously via `asyncio.to_thread` to ensure non-blocking I/O.
  - In-memory rate caching (`CACHE_TTL_SECONDS = 3600`) avoids redundant requests, backed by offline fallback rates for maximum reliability.
- **Database Safety & Symmetric Consistency**:
  - Monetary amounts in MongoDB remain stored in canonical integer units. The database schema never suffers floating-point corruption or migration headaches.
  - Conversions between display currencies and stored units are mathematically symmetric and reversible:

    $$
    \text{Target Amount} = \left(\frac{\text{paise}}{100 \times \text{rates}[\text{"INR"}]}\right) \times \text{rates}[\text{Target}]
    $$

    $$
    \text{Stored Base} = \text{round}\left(\frac{\text{Input Amount}}{\text{rates}[\text{Source}]} \times \text{rates}[\text{"INR"}] \times 100\right)
    $$

- **Interactive UI Switcher**: A sleek glassmorphic selector in the sticky top header allows instant switching between currencies with live FX indicators and rate references.

---

## 🏗️ Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│               React 19 + Vite Frontend                 │
│      (Tailwind CSS, Lucide Icons, Currency Context)    │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON (FastAPI)
┌───────────────────────────▼────────────────────────────┐
│                    FastAPI Backend                     │
│  ┌───────────────────┐        ┌─────────────────────┐  │
│  │ Pure Python Audit │        │ Live FX Service     │  │
│  │ (Exact Base Math) │        │ (forex-python)      │  │
│  └─────────┬─────────┘        └──────────┬──────────┘  │
│            │                             │             │
│  ┌─────────▼─────────┐        ┌──────────▼──────────┐  │
│  │ MongoDB Atlas     │        │ Gemma Narrative     │  │
│  │ (Events, Expenses,│        │ (Strict JSON schema,│  │
│  │  Sponsors, Runs)  │        │  no hallucinations) │  │
│  └───────────────────┘        └─────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 🛡️ Audit Rules & Financial Guardrails

SponsorLedger evaluates 7 strict deterministic rules on demand:

| Code                      |  Severity  | Description                                                 | Evidence Traced               |
| :------------------------ | :--------: | :---------------------------------------------------------- | :---------------------------- |
| `BUDGET_OVERRUN`          |    High    | Total expenses exceed approved budget ceiling.              | Aggregated expenses vs budget |
| `SPONSOR_BALANCE_DUE`     | High / Med | Outstanding pledged amount past event date.                 | Sponsor pledge vs received    |
| `DELIVERABLE_OVERDUE`     |    High    | Sponsor benefit/deliverable past due date.                  | Deliverable record & due date |
| `MISSING_RECEIPT_REF`     |    Low     | Expense recorded without voucher/receipt reference.         | Expense row & receipt code    |
| `POSSIBLE_DUPLICATE`      |   Medium   | Matching vendor and amount within nearby transaction dates. | Correlated expense records    |
| `DELIVERABLE_NO_EVIDENCE` |    Low     | Completed deliverable lacking proof URL/documentation.      | Deliverable proof link        |
| `SPONSOR_OVERPAYMENT`     |    Low     | Deposited amount exceeds initial agreement tier.            | Sponsor ledger entry          |

### Architectural Guardrails

1. **AI Does Not Calculate**: Financial sums, variances, and evidence IDs are computed solely in Python. The LLM only receives verified facts.
2. **No Misconduct Accusations**: Findings are framed objectively as discrepancies requiring verification, avoiding legalistic or accusatory claims.
3. **Safe Type Encoders**: A custom BSON `DateCodec` automatically maps Python date representations into standard ISO 8601 strings, preventing database encoding errors.

---

## 🚀 Getting Started

### Prerequisites

- **Python**: Version 3.12+ (or 3.11+)
- **Node.js**: Version 20+ and npm
- **MongoDB**: A free MongoDB Atlas M0 cluster or a local instance (`mongodb://localhost:27017`)
- _(Optional)_: A **Google Gemini API Key** for Gemma narrative report generation

---

### Environment Configuration

Create local environment files from the provided templates:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Configure `backend/.env`:

```ini
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=sponsorledger
GEMINI_API_KEY=your_gemini_api_key_here
GEMMA_MODEL=gemma-4-26b-a4b-it
FRONTEND_ORIGIN=http://localhost:5173
PORT=8000
```

---

### One-Command Unified Runner

The included `start.py` script starts both the FastAPI backend and Vite frontend concurrently with unified, colored logging:

```bash
python3 start.py
```

- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Backend API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

Press `Ctrl+C` to cleanly shut down both servers.

---

### Manual Setup

If you prefer to run the backend and frontend in separate terminals:

#### 1. Backend Service

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run test suite
pytest tests/ -v

# Start development server
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Application

```bash
cd frontend
npm install
npm run dev
```

---

## 📊 Interactive Demo Walkthrough

Try the end-to-end workflow using the pre-seeded demo dataset:

1. **Executive Dashboard (`/`)**:
   - Inspect overall budget allocation, real-time expenditure, and sponsor pledge collection rates.
   - Switch the currency in the header (e.g. from `USD` to `INR` or `EUR`) to see all figures instantly update.
2. **Sponsors & Agreements (`/sponsors`)**:
   - Review partner tiers, pledged vs deposited amounts, and outstanding collection balances.
   - Expand deliverable obligations (booth space, logo placements, keynote slots) and mark evidence links.
3. **Expense Ingestion (`/expenses`)**:
   - Add manual transactions or upload `sample-data/expenses.csv`.
   - Review the real-time preview showing valid records, duplicate candidate warnings, and missing receipt alerts.
4. **Audit Dashboard (`/audit`)**:
   - Run the deterministic audit engine.
   - Click any linked evidence badge (`RCPT-001`, `TechCorp`) to inspect the database record in the slide-over modal.
   - Resolve or dismiss findings with audit trail tracking.
5. **Closeout Report (`/report`)**:
   - Generate an executive briefing synthesized by Gemma.
   - Complete the closing checklist, inspect verified financial totals, and export as Markdown or printable HTML.

---

## 🧪 Automated Testing

The complete test suite covers exact integer math, CSV parsing edge cases, audit rules, and `forex-python` currency conversions:

```bash
cd backend
source .venv/bin/activate
pytest tests/ -v
```

```text
============================== 59 passed in 5.46s ==============================
```

- `tests/test_money.py`: Exact paise parsing and absence of floating-point inaccuracies.
- `tests/test_csv_import.py`: Header normalisation, size limits, negative amounts, and duplicate detection.
- `tests/test_audit_rules.py`: Deterministic evaluation across all 7 audit rules and boundary conditions.
- `tests/test_currencies.py`: `forex-python` rate fetching, conversion round-trips, symbol lookups, and API endpoints.

---

## 🚢 Deployment Guide

### 1. MongoDB Atlas Setup

1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and allow network access (`0.0.0.0/0` for cloud PaaS deployments).
3. Copy your connection string into `MONGODB_URI`.

### 2. Render Web Service (FastAPI Backend)

- **Root Directory**: `backend`
- **Environment**: Python
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `MONGODB_URI`: `<your-connection-string>`
  - `MONGODB_DB`: `sponsorledger`
  - `FRONTEND_ORIGIN`: `https://your-frontend.onrender.com`
  - `GEMINI_API_KEY`: `<your-api-key>`

### 3. Render Static Site (Vite Frontend)

- **Root Directory**: `frontend`
- **Build Command**: `npm ci && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: `https://your-backend.onrender.com`

---

## 📄 License

SponsorLedger is open-source software released under the terms of the **[GNU Affero General Public License v3.0 (GNU AGPLv3)](LICENSE)**.
