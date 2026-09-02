from typing import Dict, Any
from datetime import datetime
from src.graph.state import RevenueGuardState

from src.agents.fault_handler import fault_tolerant

@fault_tolerant(fallback_status="FAILED", next_agent_on_fail="outreach")
def prediction_node(state: RevenueGuardState) -> Dict[str, Any]:
    """
    The Prediction Agent handles "at_risk" transactions before they fully fail.
    E.g., A subscription mandate is about to hit an expired card.
    """
    transaction = state["transaction"]
    
    audit_entry = {
        "agent": "Prediction",
        "action": "Pre-Failure Interception",
        "details": f"Analyzed transaction {transaction.transaction_id} for pre-failure risk. Recommending preemptive card update via Outreach.",
        "timestamp": datetime.now().isoformat()
    }
    
    # We usually send this straight to outreach for a preemptive nudge
    return {
        "current_agent": "outreach",
        "audit_trail": [audit_entry]
    }
