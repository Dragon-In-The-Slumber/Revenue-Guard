import json
from datetime import datetime
from src.persistence.database import db
from src.models.diagnosis import AuditEntry

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS audit_trail (
    id SERIAL PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    agent TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_txn ON audit_trail(transaction_id);
"""

class AuditStore:
    async def initialize(self):
        """Create the audit_trail table if it doesn't exist."""
        await db.execute(CREATE_TABLE_SQL)

    async def log_entry(self, transaction_id: str, entry: AuditEntry):
        """Insert a single audit entry into PostgreSQL."""
        await db.execute(
            "INSERT INTO audit_trail (transaction_id, agent, action, details, timestamp) VALUES ($1, $2, $3, $4, $5)",
            transaction_id,
            entry.agent,
            entry.action,
            entry.details,
            entry.timestamp
        )

    async def log_batch(self, transaction_id: str, entries: list[AuditEntry]):
        """Insert multiple audit entries for a single transaction."""
        for entry in entries:
            await self.log_entry(transaction_id, entry)

    async def get_trail(self, transaction_id: str) -> list[dict]:
        """Retrieve the full audit trail for a transaction."""
        rows = await db.fetch(
            "SELECT agent, action, details, timestamp FROM audit_trail WHERE transaction_id = $1 ORDER BY timestamp ASC",
            transaction_id
        )
        return [dict(row) for row in rows]

    async def get_recent(self, limit: int = 50) -> list[dict]:
        """Retrieve the most recent audit entries across all transactions."""
        rows = await db.fetch(
            "SELECT transaction_id, agent, action, details, timestamp FROM audit_trail ORDER BY timestamp DESC LIMIT $1",
            limit
        )
        return [dict(row) for row in rows]

audit_store = AuditStore()
