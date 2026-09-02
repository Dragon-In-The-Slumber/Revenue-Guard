from typing import Dict, Any
from datetime import datetime
from src.graph.state import RevenueGuardState
from src.models.diagnosis import RootCauseDiagnosis, RecoveryAction
from langchain_anthropic import ChatAnthropic
from src.config import settings

def diagnostician_node(state: RevenueGuardState) -> Dict[str, Any]:
    """
    The Diagnostician analyzes the failure and identifies the root cause.
    It returns a structured RootCauseDiagnosis and determines whether
    the transaction is recoverable silently or needs outreach.
    """
    transaction = state["transaction"]
    
    # In a real implementation, this would call Claude 3.5 Sonnet:
    # llm = ChatAnthropic(model="claude-3-5-sonnet-20240620", api_key=settings.anthropic_api_key)
    # structured_llm = llm.with_structured_output(RootCauseDiagnosis)
    # result = structured_llm.invoke(f"Analyze this failed transaction: {transaction.model_dump_json()}")
    
    # For buildathon scaffolding, we simulate the LLM's structured reasoning
    
    error_code = transaction.payment.error_code
    is_silent_possible = False
    action_type = "WHATSAPP_MESSAGE"
    
    if "DOWNTIME" in error_code or "TIMEOUT" in error_code:
        cause = "Infrastructure instability (Issuing bank or UPI switch timeout)"
        is_silent_possible = True
        action_type = "SCHEDULED_RETRY"
    elif "INSUFFICIENT" in error_code:
        cause = "Insufficient funds in customer account"
        action_type = "WHATSAPP_MESSAGE"
    elif "RISK" in error_code:
        cause = "High-risk transaction blocked by gateway"
        action_type = "EMAIL"
    else:
        cause = f"Generic failure: {error_code}"
    
    recommended_action = RecoveryAction(
        action_type="SILENT_RETRY" if is_silent_possible else action_type,
        requires_approval=False
    )
    
    diagnosis = RootCauseDiagnosis(
        primary_cause=cause,
        confidence=0.89,
        is_recoverable=True,
        recommended_action=recommended_action,
        reasoning="Analyzed error code and historical bank downtime patterns."
    )
    
    audit_entry = {
        "agent": "Diagnostician",
        "action": "Diagnosed Failure",
        "details": f"Cause: {cause} | Recommended Action: {recommended_action.action_type}",
        "timestamp": datetime.now().isoformat()
    }
    
    next_agent = "silent_recovery" if is_silent_possible else "outreach"
    
    return {
        "diagnosis": diagnosis,
        "selected_action": recommended_action,
        "current_agent": next_agent,
        "audit_trail": [audit_entry]
    }
