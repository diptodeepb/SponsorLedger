"""MongoDB Atlas connection and collection access."""
from __future__ import annotations
from datetime import date
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, IndexModel
from bson.codec_options import TypeCodec, TypeRegistry
from app.config import settings


class DateCodec(TypeCodec):
    """Automatically convert Python datetime.date to ISO 8601 string for BSON encoding."""
    python_type = date
    bson_type = str

    def transform_python(self, value: date) -> str:
        return value.isoformat()

    def transform_bson(self, value: str) -> str:
        return value


_type_registry = TypeRegistry([DateCodec()])
_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(
            settings.mongodb_uri,
            serverSelectionTimeoutMS=3000,
            type_registry=_type_registry,
        )
    return _client


def get_db():
    return get_client()[settings.mongodb_db]


def get_collection(name: str):
    return get_db()[name]


async def create_indexes():
    db = get_db()
    await db["events"].create_indexes([
        IndexModel(
            [("created_at", ASCENDING)],
            expireAfterSeconds=86400 * 2,  # 48h TTL cleanup for guest sandboxes
            partialFilterExpression={"guest_session": {"$exists": True, "$type": "string"}},
        ),
        IndexModel([("guest_session", ASCENDING)]),
    ])
    await db["sponsors"].create_indexes([
        IndexModel([("event_id", ASCENDING)]),
    ])
    await db["deliverables"].create_indexes([
        IndexModel([("event_id", ASCENDING)]),
        IndexModel([("sponsor_id", ASCENDING)]),
    ])
    await db["expenses"].create_indexes([
        IndexModel([("event_id", ASCENDING)]),
        IndexModel([("import_batch_id", ASCENDING)]),
    ])
    await db["findings"].create_indexes([
        IndexModel([("event_id", ASCENDING)]),
        IndexModel([("audit_run_id", ASCENDING)]),
    ])
    await db["audit_reports"].create_indexes([
        IndexModel([("event_id", ASCENDING)]),
    ])
