<div align="center">
  <img src="frontend/public/favicon.svg" alt="SponsorLedger Logo" width="128" height="128" />
  <h1>SponsorLedger</h1>
  <p>
    <strong>Evidence-Linked Financial Auditing & Automated Sponsorship Accounting for Events.</strong><br />
    Track budgets, reconcile sponsor commitments vs. received funds, audit deliverables, and generate Gemma-synthesized closeout briefings.
  </p>
  <p>
    <a href="https://github.com/diptodeepb/SponsorLedger/actions/workflows/ci.yml"><img src="https://github.com/diptodeepb/SponsorLedger/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL_v3-blue.svg" alt="License: AGPL v3" /></a>
    <a href="https://www.python.org/downloads/"><img src="https://img.shields.io/badge/python-3.12+-blue.svg" alt="Python 3.12+" /></a>
    <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/FastAPI-0.115+-009688.svg" alt="FastAPI" /></a>
    <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61dafb.svg" alt="React 19" /></a>
    <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Vite-8-646cff.svg" alt="Vite 8" /></a>
    <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind-4-38bdf8.svg" alt="Tailwind CSS 4" /></a>
    <a href="https://www.mongodb.com/atlas"><img src="https://img.shields.io/badge/MongoDB-Atlas_Free-green.svg" alt="MongoDB Atlas" /></a>
    <a href="https://ai.google.dev/gemma"><img src="https://img.shields.io/badge/AI-Gemma_via_Gemini-purple.svg" alt="Gemma AI" /></a>
  </p>
</div>

---

## 🧭 Table of Contents

- [Why SponsorLedger?](#why-sponsorledger)
- [Core Capabilities](#core-capabilities)
- [Anonymous Cloned Sandbox](#anonymous-cloned-sandbox)
- [Modern Design &amp; UX](#modern-design--ux)
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

Running a hackathon, student conference, or community summit is exciting, but wrapping up finances afterward is often messy:

- Sponsor commitments get lost in private notes and chat messages.
- Deliverables (stage mentions, logo placements, booth space) are agreed upon quickly and forgotten during event operations.
- Organizers pay out-of-pocket for last-minute supplies, leaving scattered receipts.
- Weeks after the event, organizers struggle to confirm: _Did we stay within budget? Did every sponsor transfer their pledged amount? Were all deliverables fulfilled?_

**SponsorLedger** is designed to solve this directly. It combines **clear audit checks** with **live multi-currency conversion**, an **isolated evaluation sandbox**, and **Gemma narrative summaries**, giving organizing teams calm and reliable books.

---

## ⚡ Core Capabilities

- **Anonymous Cloned Sandbox**: Every guest user receives a dedicated, isolated sandbox clone in MongoDB. Multiple concurrent visitors can freely modify, import statements, clear, or reset datasets without cross-user interference.
- **Automated Financial Checks**: Python rules inspect transactions, unpaid sponsor balances, overdue promises, missing receipts, and potential duplicate expenses.
- **Accurate Currency Calculations**: All figures are stored in base integer units to prevent floating-point calculation errors when adding and converting currencies.
- **Multi-Currency Support**: View and input amounts in **USD** (default), **INR**, **EUR**, **GBP**, **JPY**, **CAD**, **AUD**, **CHF**, or **SGD** with live exchange rates.
- **Evidence-Linked Records**: Every audit finding links directly to the specific expense, sponsor, or deliverable item that triggered it.
- **Gemma-Powered TXT &amp; CSV Ingestion**: Upload standard CSV bank statements or messy, unstructured `.txt` notes (e.g. WhatsApp notes, receipt blurbs); Google Gemma intelligently maps them into verified tabular rows.
- **Human-Readable Closeout Reports**: Google Gemma reviews verified numbers to draft executive summaries, recommended next steps, and wrap-up checklists without altering figures.
- **Ledger Slate Guardrails**: Closeout report generation is securely locked on empty ledgers ($0 budget, 0 transactions) to prevent blank or meaningless summaries.
- **Reliable Offline Fallback**: If AI access is unavailable or an API key is not set, a clean structured summary report is generated instantly.

---

## 🧪 Anonymous Cloned Sandbox

To make live evaluation seamless and leak-free:

- **Isolated Sessions via `X-Guest-Session`**: When a visitor arrives, an ephemeral token is created in browser `localStorage` and sent with all API requests.
- **Isolated Clones in MongoDB**: Events, sponsors, deliverables, and expenses are tagged with this session ID. Two people evaluating the site simultaneously will never see or overwrite each other's edits.
- **Three One-Click Sandbox Actions**:
  1. **Reset to Demo Data**: Instantly repopulates pristine baseline sponsors, deliverables, and 5 sample expenses under the same event.
  2. **Clear All Sandbox Data**: Wipes all transactions and sets budget to $0.00, providing a 100% clean canvas to test importing custom statements.
  3. **New Guest Session**: Rotates to a new anonymous session token on demand.
- **Automated 48-Hour TTL Indexing**: MongoDB automatically purges guest sandboxes after 48 hours of inactivity, keeping cloud storage lean and clean.

---

## 🎨 Modern Design & UX

SponsorLedger is built with modern, state-of-the-art UI craftsmanship:

- **PermLens-Style Desktop Sidebar**: Smoothly collapses from full navigation (`w-64`) to a compact icon-only rail (`w-20`) with left active indicator pills, micro-interaction hover scaling, and floating tooltips, persisted via `localStorage`.
- **Sandbox Controller Dropdown**: A sleek, dark-mode-optimized `Sandbox ▾` button in the sticky top navbar with high-contrast confirmation dialogs and zero black-on-hover text glitches.
- **Mobile Responsive Drawer & Navbar**: Responsive drawer navigation with backdrop blur. Extraneous header labels automatically hide on mobile viewports (< 768px) to keep the navigation bar uncluttered.
- **Themed Custom Scrollbars**: Inset pill-shaped scrollbars across CSV preview tables and All Transactions tables that adapt between dark and light modes.
- **Dynamic Sticky Top Navbar**: Floating header with an ambient gradient hairline and subtle indigo luminescence, remaining dynamically accessible across all page scroll positions.
- **View Transitions & Dark Mode**: Seamless circular ripple transition when switching between dark slate and light themes.
- **Responsive Financial Charts**: Recharts visualizations with adaptive tick formatting that prevent text overlapping on small screens while retaining detailed hover tooltips.

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
    \text{Target Amount} = \left(\frac{\text{base\_units}}{100 \times \text{rates}[\text{"INR"}]}\right) \times \text{rates}[\text{Target}]
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
   - Switch the display currency in the header (e.g. from `USD` to `INR` or `EUR`) to see all figures instantly update.
   - Use the **`Sandbox ▾`** controller on the top left to **Reset to Demo Data**, **Clear All Sandbox Data** ($0 budget, clean slate for fresh imports), or start a **New Guest Session** — each cleanly redirects to `/dashboard` auto-reloaded.
2. **Sponsors & Agreements (`/sponsors`)**:
   - Review partner tiers, pledged vs deposited amounts, and outstanding collection balances.
   - Expand deliverable obligations (booth space, logo placements, keynote slots) and mark evidence links.
3. **Expense Ingestion (`/expenses`)**:
   - Add manual transactions or upload standard bank statements (`sample-data/expenses.csv`).
   - Or upload unstructured `.txt` notes (`sample-data/irregular_notes.txt`) to test **Google Gemma AI text-to-CSV ingestion**.
   - Review the real-time preview table with custom scrollbars showing valid records, duplicate candidate warnings, and missing receipt alerts.
4. **Audit Dashboard (`/audit`)**:
   - Run the deterministic audit engine.
   - Click any linked evidence badge (`RCPT-001`, `TechCorp`) to inspect the database record in the slide-over modal.
   - Resolve or dismiss findings with audit trail tracking.
5. **Closeout Report (`/report`)**:
   - Generate an executive briefing synthesized by Gemma.
   - Built-in guardrail: Report generation is safely locked when the ledger is clean/empty ($0 budget, 0 transactions).
   - Complete the closing checklist, inspect verified financial totals, and export clean briefings in Markdown or printable document format.

---

## 🧪 Automated Testing

The complete test suite covers exact integer math, CSV parsing edge cases, audit rules, Gemma text-to-CSV transformation, and `forex-python` currency conversions:

```bash
cd backend
source .venv/bin/activate
pytest tests/ -v
```

```text
============================== 65 passed in 10.04s ==============================
```

- `tests/test_money.py`: Exact monetary parsing and absence of floating-point inaccuracies.
- `tests/test_csv_import.py`: Header normalisation, size limits, negative amounts, and duplicate detection.
- `tests/test_audit_rules.py`: Deterministic evaluation across all 7 audit rules and boundary conditions.
- `tests/test_currencies.py`: `forex-python` rate fetching, conversion round-trips, symbol lookups, and API endpoints.
- `tests/test_gemma_txt_to_csv.py`: Gemma LLM irregular text-to-CSV transformation parsing, schema enforcement, and fallback handling.

---

## 🚢 Deployment Guide

### 1. MongoDB Atlas Setup (Prerequisite)

1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Under **Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere) so Render compute instances can connect.
3. Under **Database Access**, create a database user with read and write privileges.
4. Copy your connection URI (e.g. `mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority`).

---

### Option A: One-Click Render Blueprint (`render.yaml`) (Recommended)

SponsorLedger includes a production [`render.yaml`](render.yaml) blueprint specification that automatically configures both services with correct build commands, start scripts, environment linkages, and SPA routing rewrites:

1. Push your code to your GitHub repository.
2. Log in to [Render](https://dashboard.render.com).
3. Click **New +** in the top right and select **Blueprint**.
4. Connect your `SponsorLedger` repository.
5. Render will automatically parse `render.yaml` and queue both services:
   - `sponsorledger-backend` (FastAPI Web Service in **Singapore**)
   - `sponsorledger` (Vite React Static Site on Render Global CDN yielding `https://sponsorledger.onrender.com`)
6. Supply the required secret environment variables prompted by Render:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `GEMINI_API_KEY`: Your Google AI Studio API key.
   - `SENTRY_DSN`: *(Optional)* Backend Sentry DSN if error telemetry is enabled.
   - `VITE_SENTRY_DSN`: *(Optional)* Frontend Sentry DSN for client error tracking and session replay.
7. Click **Apply**. Render will automatically provision, build, and link both services together!

---

### Option B: Manual Service Configuration on Render

If you prefer to configure the services manually via the Render Web UI:

#### 1. Backend Web Service
- **Name**: `sponsorledger-backend`
- **Region**: `Singapore`
- **Root Directory**: `backend`
- **Environment / Runtime**: `Python`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path**: `/health`
- **Environment Variables**:
  - `PYTHON_VERSION`: `3.12.8`
  - `MONGODB_URI`: `<your-atlas-uri>`
  - `MONGODB_DB`: `sponsorledger`
  - `GEMINI_API_KEY`: `<your-gemini-key>`
  - `GEMMA_MODEL`: `gemma-4-26b-a4b-it`
  - `ENVIRONMENT`: `production`
  - `FRONTEND_ORIGIN`: `https://sponsorledger.onrender.com` (or leave default; automatic regex matches `*.onrender.com`)

#### 2. Frontend Static Site
- **Name**: `sponsorledger` (This reserves `https://sponsorledger.onrender.com`)
- **Region**: `Singapore`
- **Root Directory**: `frontend`
- **Build Command**: `npm ci && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `NODE_VERSION`: `22.12.0`
  - `VITE_API_URL`: `https://sponsorledger-backend.onrender.com` (your backend URL without trailing slash)
  - `VITE_SENTRY_DSN`: *(Optional)* Frontend Sentry DSN for client error tracking and session replay
- **Redirects & Rewrites (CRITICAL PRECAUTION)**:
  - In your Static Site settings, go to **Redirects/Rewrites**.
  - Add Rule: **Type**: `Rewrite`, **Source**: `/*`, **Destination**: `/index.html`.
  - _(Without this rule, direct navigation or hard-refreshing `/dashboard`, `/report`, or `/expenses` will return a 404 Not Found)._

---

## 📬 Contact & Grievance Redressal

For any technical inquiries, feedback, privacy questions, or grievance redressal, you may reach out directly:

- **Maintainer**: Diptodeep Biswas
- **Direct Email**: [diptodeepbofficial@gmail.com](mailto:diptodeepbofficial@gmail.com)
- **GitHub Repository**: [github.com/diptodeepb/SponsorLedger](https://github.com/diptodeepb/SponsorLedger)
- **Issue Tracker**: [github.com/diptodeepb/SponsorLedger/issues](https://github.com/diptodeepb/SponsorLedger/issues)

---

## 📄 License

SponsorLedger is open-source software released under the terms of the **[GNU Affero General Public License v3.0 (GNU AGPLv3)](LICENSE)**.
