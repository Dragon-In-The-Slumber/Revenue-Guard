from src.graph.builder import graph
from src.models.transaction import Transaction
from src.persistence.audit_store import audit_store
from src.models.diagnosis import AuditEntry
import asyncio
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

async def execute_graph_async(transaction_data: dict):
    """Core logic running in FastAPI BackgroundTasks."""
    # Reconstruct Pydantic model
    transaction = Transaction(**transaction_data)
    
    # Initialize graph state
    initial_state = {
        "transaction": transaction,
        "messages": [],
        "current_agent": "orchestrator",
        "contact_attempts": 0,
        "max_attempts_reached": False,
        "requires_human_approval": False,
        "is_approved": False,
        "recovery_status": "PENDING",
        "audit_trail": []
    }
    
    try:
        # Execute the workflow asynchronously in the same event loop
        final_state = await graph.ainvoke(initial_state)
        
        audit_trail_dicts = final_state.get("audit_trail", [])
        entries = []
        for entry_data in audit_trail_dicts:
            if isinstance(entry_data, dict):
                entries.append(AuditEntry(**entry_data))
            else:
                entries.append(entry_data)
        
        # Persist the audit trail to PostgreSQL
        await audit_store.log_batch(transaction.transaction_id, entries)
        
        return {
            "transaction_id": transaction.transaction_id,
            "status": "completed",
            "recovery_status": final_state.get("recovery_status"),
            "audit_events_count": len(entries)
        }
    except Exception as e:
        logger.error(f"Error executing recovery pipeline for {transaction.transaction_id}: {e}")
        # Log the failure in audit trail
        error_entry = AuditEntry(
            agent="System",
            action="Pipeline Error",
            details=str(e),
            timestamp=datetime.now().isoformat()
        )
        try:
            await audit_store.log_entry(transaction.transaction_id, error_entry)
        except Exception:
            pass # Suppress further errors if DB is completely down
        raise
