"""SponsorLedger FastAPI application entry point."""
from __future__ import annotations
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_indexes, get_collection
from app.routes import events, sponsors, deliverables, expenses, audit, reports, currencies, sandbox
from app.schemas import HealthResponse

logger = logging.getLogger(__name__)


async def seed_demo_data():
    """Insert one synthetic demo event if none exists."""
    col = get_collection("events")
    if await col.count_documents({}) > 0:
        return

    from datetime import date
    now = datetime.now(timezone.utc)

    result = await col.insert_one({
        "name": "Sample Tech Fest 2026",
        "event_date": "2026-11-15",
        "currency": "USD",
        "budget_paise": 25_00_000,   # ₹25,000
        "demo_flag": True,
        "created_at": now,
    })
    event_id = result.inserted_id

    sponsors_col = get_collection("sponsors")
    sponsor_docs = [
        {
            "event_id": event_id,
            "name": "TechCorp Solutions",
            "committed_paise": 8_00_000,   # ₹8,000
            "received_paise": 6_00_000,    # ₹6,000 (balance due)
            "contact_label": "Arun Mehta",
            "notes": "Primary platinum sponsor",
            "created_at": now,
        },
        {
            "event_id": event_id,
            "name": "DevHub India",
            "committed_paise": 3_00_000,   # ₹3,000
            "received_paise": 3_00_000,    # fully paid
            "contact_label": "Priya Sharma",
            "notes": "Silver sponsor; branding deliverables agreed",
            "created_at": now,
        },
    ]
    s_results = await sponsors_col.insert_many(sponsor_docs)
    s1_id = s_results.inserted_ids[0]
    s2_id = s_results.inserted_ids[1]

    del_col = get_collection("deliverables")
    await del_col.insert_many([
        {
            "event_id": event_id,
            "sponsor_id": s1_id,
            "description": "Logo on event banner and stage backdrop",
            "due_date": "2026-11-10",
            "status": "completed",
            "evidence_url": None,
            "notes": "Banners delivered on time",
        },
        {
            "event_id": event_id,
            "sponsor_id": s1_id,
            "description": "Social media mention post-event",
            "due_date": "2026-11-20",
            "status": "pending",
            "evidence_url": None,
            "notes": None,
        },
        {
            "event_id": event_id,
            "sponsor_id": s2_id,
            "description": "Sponsor booth at venue",
            "due_date": "2026-11-14",
            "status": "completed",
            "evidence_url": None,
            "notes": "Booth set up successfully",
        },
    ])

    exp_col = get_collection("expenses")
    await exp_col.insert_many([
        {
            "event_id": event_id,
            "date": "2026-09-01",
            "vendor": "Print House",
            "category": "Printing",
            "amount_paise": 4_50_000,   # ₹4,500
            "receipt_ref": "RCPT-001",
            "notes": "Event banners",
            "created_at": now,
        },
        {
            "event_id": event_id,
            "date": "2026-09-02",
            "vendor": "Campus Catering",
            "category": "Food",
            "amount_paise": 8_20_000,   # ₹8,200
            "receipt_ref": "RCPT-002",
            "notes": "Volunteer meals",
            "created_at": now,
        },
        {
            "event_id": event_id,
            "date": "2026-09-03",
            "vendor": "Unknown Vendor",
            "category": "Logistics",
            "amount_paise": 1_80_000,   # ₹1,800
            "receipt_ref": None,
            "notes": "No receipt reference entered",
            "created_at": now,
        },
        {
            "event_id": event_id,
            "date": "2026-09-03",
            "vendor": "Print House",
            "category": "Printing",
            "amount_paise": 4_50_000,   # ₹4,500 (possible duplicate)
            "receipt_ref": "RCPT-001",
            "notes": "Possible duplicate sample row",
            "created_at": now,
        },
        {
            "event_id": event_id,
            "date": "2026-10-05",
            "vendor": "AV Solutions",
            "category": "Equipment",
            "amount_paise": 7_50_000,   # ₹7,500
            "receipt_ref": "RCPT-003",
            "notes": "Sound system rental",
            "created_at": now,
        },
    ])

    logger.info("Demo data seeded for event_id=%s", event_id)


# ---------------------------------------------------------------------------
# App lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize indexes and demo data
    try:
        await create_indexes()
        await seed_demo_data()
        logger.info("MongoDB connected and demo data verified.")
    except Exception as exc:
        logger.warning(
            "MongoDB not reachable on startup (%s). "
            "Please check MONGODB_URI in backend/.env (e.g. MongoDB Atlas cluster). "
            "Server is running in degraded mode.",
            exc,
        )

    yield
    # Shutdown (nothing to tear down for now)


# ---------------------------------------------------------------------------
# Sentry Initialization
# ---------------------------------------------------------------------------
# Note: Initialize Sentry before the FastAPI app is created so that
# FastAPI and Starlette auto-instrumentation hooks attach cleanly.
# Continuous profiling is omitted to prevent quota exhaustion.
if settings.sentry_dsn:
    import sentry_sdk
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        data_collection={"user_info": True},
        environment=settings.environment,
        release="sponsorledger-backend@0.1.0",
    )
    logger.info("Sentry initialized for FastAPI backend")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="SponsorLedger API",
    description="Evidence-linked AI financial audit tool for event organisers.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
raw_origins = [o.strip() for o in settings.frontend_origin.split(",") if o.strip()]
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
origins = list(dict.fromkeys(raw_origins + default_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" not in origins else ["*"],
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Routers
app.include_router(events.router)
app.include_router(sponsors.router)
app.include_router(deliverables.router)
app.include_router(expenses.router)
app.include_router(audit.router)
app.include_router(reports.router)
app.include_router(currencies.router)
app.include_router(sandbox.router)


@app.get("/health", response_model=HealthResponse)
async def health():
    db_status = "unknown"
    try:
        from app.database import get_db
        await get_db().command("ping")
        db_status = "ok"
    except Exception:
        db_status = "error"
    return {"status": "ok", "version": "0.1.0", "db": db_status}


@app.post("/api/tunnel")
async def sentry_tunnel(request: Request):
    """
    Sentry official tunnel endpoint: proxies frontend Sentry envelope to Sentry ingest.
    Prevents ad blockers (Brave Shields, uBlock) from blocking Sentry or flagging it as a 3rd-party tracker.
    """
    import json
    import httpx
    from urllib.parse import urlparse
    from fastapi import Response

    try:
        body = await request.body()
        if not body:
            return Response(status_code=200, content="OK")

        first_line = body.split(b"\n")[0]
        header = json.loads(first_line.decode("utf-8"))
        dsn = header.get("dsn")
        if not dsn:
            return Response(status_code=200, content="OK")

        parsed = urlparse(dsn)
        project_id = parsed.path.strip("/")
        
        # Verify the target host belongs to Sentry ingest
        if not parsed.hostname or not (
            parsed.hostname.endswith("sentry.io") or parsed.hostname.endswith("ingest.de.sentry.io")
        ):
            return Response(status_code=403, content="Invalid target host")

        sentry_url = f"https://{parsed.hostname}/api/{project_id}/envelope/"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(sentry_url, content=body)
            return Response(content=resp.content, status_code=resp.status_code)
    except Exception as e:
        logger.warning(f"Sentry tunnel proxy warning: {e}")
        return Response(status_code=200, content="OK")


