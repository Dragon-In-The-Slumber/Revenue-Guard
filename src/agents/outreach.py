from typing import Dict, Any
from datetime import datetime
from src.graph.state import RevenueGuardState

def outreach_node(state: RevenueGuardState) -> Dict[str, Any]:
    """
    The Outreach Agent crafts personalized messages (WhatsApp/Email/SMS) 
    to recover the revenue when silent recovery isn't possible.
    """
    transaction = state["transaction"]
    diagnosis = state.get("diagnosis")
    action = state.get("selected_action")
    
    # If the LLM didn't pick an outreach channel, default to WhatsApp
    channel = action.channel if (action and action.channel) else "WHATSAPP"
    
    # In a real app, Claude would write this contextually (e.g., in Hinglish)
    message_draft = f"Hi {transaction.customer.name}, your payment of Rs {transaction.payment.amount} for {transaction.merchant.name} failed due to {diagnosis.primary_cause if diagnosis else 'an issue'}. Please tap here to securely complete your payment."
    
    audit_entry = {
        "agent": "Outreach",
        "action": f"Drafted {channel} Message",
        "details": f"Message: '{message_draft}'",
        "timestamp": datetime.now().isoformat()
    }
    
    # Increment contact attempts
    attempts = state.get("contact_attempts", 0) + 1
    
    # Send it to compliance to verify stopping rules before "sending"
    return {
        "contact_attempts": attempts,
        "current_agent": "compliance",
        "audit_trail": [audit_entry]
    }
