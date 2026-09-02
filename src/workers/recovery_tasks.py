from celery import shared_task
from src.graph.builder import graph
from src.models.transaction import Transaction

def execute_graph_sync(transaction_data: dict):
    """Core logic decoupled from Celery so it can run in FastAPI BackgroundTasks."""
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
    
    # Execute the workflow
    final_state = graph.invoke(initial_state)
    
    return {
        "transaction_id": transaction.transaction_id,
        "status": "completed",
        "recovery_status": final_state.get("recovery_status"),
        "audit_events_count": len(final_state.get("audit_trail", []))
    }

@shared_task(bind=True, max_retries=3)
def run_recovery_pipeline(self, transaction_data: dict):
    """
    Executes the LangGraph agent workflow for a single transaction.
    This runs asynchronously on a Celery worker.
    """
    try:
        return execute_graph_sync(transaction_data)
    except Exception as e:
        # Graceful failure handling
        self.retry(exc=e, countdown=60) # Retry in 60 seconds

