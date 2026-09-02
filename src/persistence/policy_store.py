from src.persistence.database import db

CREATE_POLICY_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS agent_policies (
    id SERIAL PRIMARY KEY,
    agent_name TEXT NOT NULL,
    policy_text TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

class PolicyStore:
    async def initialize(self):
        """Create the agent_policies table if it doesn't exist."""
        await db.execute(CREATE_POLICY_TABLE_SQL)
        
        # Insert some default policies if the table is empty
        count = await db.fetch_val("SELECT COUNT(*) FROM agent_policies")
        if count == 0:
            await self.add_policy("Compliance", "Do not send WhatsApp messages if the transaction is over ₹50,000.")
            await self.add_policy("Compliance", "No outreach allowed during quiet hours (9 PM to 8 AM local time).")
            await self.add_policy("Compliance", "Stop all actions and escalate to a human if there have been 3 or more contact attempts.")
            await self.add_policy("Orchestrator", "If the transaction is marked 'failed', route to diagnostician. If 'at_risk', route to prediction.")

    async def add_policy(self, agent_name: str, policy_text: str):
        """Add a new policy."""
        await db.execute(
            "INSERT INTO agent_policies (agent_name, policy_text) VALUES ($1, $2)",
            agent_name,
            policy_text
        )

    async def get_active_policies(self, agent_name: str = None) -> list[dict]:
        """Get active policies, optionally filtered by agent."""
        if agent_name:
            rows = await db.fetch(
                "SELECT id, agent_name, policy_text FROM agent_policies WHERE is_active = TRUE AND agent_name = $1 ORDER BY id ASC",
                agent_name
            )
        else:
            rows = await db.fetch(
                "SELECT id, agent_name, policy_text FROM agent_policies WHERE is_active = TRUE ORDER BY id ASC"
            )
        return [dict(row) for row in rows]
        
    async def delete_policy(self, policy_id: int):
        """Delete a policy (or mark inactive)."""
        await db.execute("DELETE FROM agent_policies WHERE id = $1", policy_id)

policy_store = PolicyStore()
