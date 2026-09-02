import logging
from typing import Dict, Any
from datetime import datetime
from src.graph.state import RevenueGuardState
from langchain_anthropic import ChatAnthropic
from src.config import settings
from src.agents.fault_handler import fault_tolerant

logger = logging.getLogger(__name__)

@fault_tolerant(fallback_status="FAILED", next_agent_on_fail="compliance")
def outreach_node(state: RevenueGuardState) -> Dict[str, Any]:
    """
    The Outreach Agent crafts personalized messages (WhatsApp/Email/SMS) 
    to recover the revenue when silent recovery isn't possible.
    """
    transaction = state["transaction"]
    diagnosis = state.get("diagnosis")
    action = state.get("selected_action")
    
    # If the LLM didn't pick an outreach channel, default based on customer type
    if action and action.channel:
        channel = action.channel
    else:
        channel = "EMAIL" if transaction.customer.type == "B2B" else "WHATSAPP"
        
    message_draft = None
    
    try:
        llm = ChatAnthropic(
            model="claude-3-5-sonnet-20240620", 
            api_key=settings.anthropic_api_key,
            temperature=0.7,
            max_retries=1,
            timeout=20
        )
        
        prompt = f"""
        Draft a short, polite {channel} message to a customer whose payment failed.
        
        Customer Name: {transaction.customer.name}
        Amount: ₹{transaction.payment.amount}
        Merchant: {transaction.merchant.name}
        Failure Reason: {diagnosis.primary_cause if diagnosis else 'Unknown issue'}
        
        Requirements:
        - Keep it under 2 sentences.
        - Be empathetic and clear.
        - Include a call to action to "tap the secure link below to retry".
        - Do not include any actual links, just the text.
        """
        
        response = llm.invoke(prompt)
        message_draft = response.content.strip()
    except Exception as e:
        logger.warning(f"LLM Message drafting failed for {transaction.transaction_id}: {e}. Falling back to template.")
        
    if not message_draft:
        message_draft = f"Hi {transaction.customer.name}, your payment of ₹{transaction.payment.amount} for {transaction.merchant.name} failed due to {diagnosis.primary_cause if diagnosis else 'an issue'}. Please tap the secure link below to retry."
    
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
