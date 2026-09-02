import logging
from typing import Dict, Any
from datetime import datetime
from src.graph.state import RevenueGuardState
from src.agents.fault_handler import fault_tolerant

logger = logging.getLogger(__name__)

@fault_tolerant(fallback_status="ESCALATED", next_agent_on_fail="end")
def compliance_node(state: RevenueGuardState) -> Dict[str, Any]:
    """
    The Compliance Agent acts as a gatekeeper. It enforces stopping rules,
    validates that actions don't violate regulations (e.g., max contact attempts, time of day),
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
    
    current_hour = datetime.now().hour
    is_quiet_hours = current_hour >= 21 or current_hour < 8
    
    # 1. Stopping rule: Max attempts reached
    if attempts >= max_attempts:
        is_approved = False
        status = "ESCALATED"
        audit_entry["details"] = f"Max contact attempts ({max_attempts}) reached. Escalating to human."
        
    # 2. Time-of-day rule: No outreach during quiet hours (9 PM - 8 AM)
    elif is_quiet_hours and state.get("selected_action") and state["selected_action"].action_type in ["WHATSAPP_MESSAGE", "SMS", "VOICE_CALL"]:
        is_approved = False
        status = "BLOCKED_BY_COMPLIANCE"
        audit_entry["details"] = f"Action blocked: Outreach is prohibited during quiet hours ({current_hour}:00)."
        
    # 3. High value transaction requires human approval
    elif transaction.payment.amount > 50000:
        is_approved = False
        status = "PENDING_APPROVAL"
        audit_entry["details"] = "High value transaction (> ₹50,000) requires manual review before execution."
        
    else:
        # All good
        audit_entry["details"] = "Action approved. Complies with all stopping and regulatory rules."
        status = state.get("recovery_status", "PENDING")
        
    return {
        "is_approved": is_approved,
        "recovery_status": status,
        "current_agent": next_agent,
        "audit_trail": [audit_entry]
    }
