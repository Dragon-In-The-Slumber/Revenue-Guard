from typing import Dict, Any
from datetime import datetime
from src.graph.state import RevenueGuardState

def compliance_node(state: RevenueGuardState) -> Dict[str, Any]:
    """
    The Compliance Agent acts as a gatekeeper. It enforces stopping rules,
    validates that actions don't violate regulations (e.g., max contact attempts),
    and sets the final recovery status.
    """
    transaction = state["transaction"]
    attempts = state.get("contact_attempts", 0)
    
    max_attempts = 3
    is_approved = True
    status = "PENDING"
    next_agent = "end"
    
    audit_entry = {
        "agent": "Compliance",
        "action": "Compliance Check",
        "details": "",
        "timestamp": datetime.now().isoformat()
    }
    
    # Stopping rule: Max attempts reached
    if attempts >= max_attempts:
        is_approved = False
        status = "ESCALATED"
        audit_entry["details"] = f"Max contact attempts ({max_attempts}) reached. Escalating to human."
    # High value transaction might need human approval
    elif state.get("requires_human_approval", False) and transaction.payment.amount > 50000:
        is_approved = False
        status = "PENDING_APPROVAL"
        audit_entry["details"] = "High value transaction requires manual review before execution."
    else:
        # All good
        audit_entry["details"] = "Action approved. Complies with stopping rules."
        status = state.get("recovery_status", "PENDING")
        
    return {
        "is_approved": is_approved,
        "recovery_status": status,
        "current_agent": next_agent,
        "audit_trail": [audit_entry]
    }
