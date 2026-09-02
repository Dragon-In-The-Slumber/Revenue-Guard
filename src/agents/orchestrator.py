from typing import Dict, Any
from datetime import datetime
from langchain_core.messages import HumanMessage, SystemMessage
from src.graph.state import RevenueGuardState

def orchestrator_node(state: RevenueGuardState) -> Dict[str, Any]:
    """
    The Orchestrator acts as a router/supervisor.
    It takes the initial webhook event and decides whether it needs
    Diagnosis (for failures) or Prediction (for pre-failure signals).
    """
    transaction = state["transaction"]
    
    # Audit log entry
    audit_entry = {
        "agent": "Orchestrator",
        "action": "Ingested Transaction",
        "details": f"Received transaction {transaction.transaction_id} with status {transaction.payment.status}",
        "timestamp": datetime.now().isoformat()
    }
    
    # Simple routing logic based on status
    if transaction.payment.status == "failed":
        next_agent = "diagnostician"
    elif transaction.payment.status == "at_risk":
        next_agent = "prediction"
    else:
        # If it's something else, just assume failure for now
        next_agent = "diagnostician"
        
    return {
        "current_agent": next_agent,
        "audit_trail": [audit_entry]
    }
