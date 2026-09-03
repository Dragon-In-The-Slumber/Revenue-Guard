import logging
from typing import Dict, Any
from datetime import datetime
from src.graph.state import RevenueGuardState
from src.models.diagnosis import RootCauseDiagnosis, RecoveryAction
from langchain_anthropic import ChatAnthropic
from src.config import settings
from src.tools.optimizer import optimizer_tool
from src.tools.konnect import konnect_tool
from src.agents.fault_handler import fault_tolerant

logger = logging.getLogger(__name__)

@fault_tolerant()
def netbanking_service_node(state: RevenueGuardState) -> Dict[str, Any]:
    """
    Dedicated microservice for Netbanking payment failures.
    Uses Razorpay Optimizer for aggregator downtimes,
    and Razorpay Konnect for customer outreach.
    """
    transaction = state["transaction"]
    error_code = transaction.payment.error_code
    bank = transaction.payment.bank
    
    logger.info(f"[Netbanking Service] Analyzing failure for transaction {transaction.transaction_id}")
    
    try:
        llm = ChatAnthropic(
            model="claude-3-5-sonnet-20240620", 
            api_key=settings.anthropic_api_key,
            temperature=0
        )
        structured_llm = llm.with_structured_output(RootCauseDiagnosis)
        
        prompt = f"""
        You are the Razorpay Netbanking Service Agent.
        Analyze this Netbanking payment failure:
        Error Code: {error_code}
        Bank: {bank}
        
        Rules for Netbanking Failures:
        - If the error is an aggregator downtime or NETBANKING_TIMEOUT, recommend "OPTIMIZER_RETRY".
        - If the error is customer-side (e.g. INSUFFICIENT_FUNDS, INCORRECT_CREDENTIALS), recommend "KONNECT_OUTREACH".
        - If the bank itself is facing a massive outage, recommend "KONNECT_OUTREACH" to suggest an alternative payment method (like UPI or Card).
        
        Return a clear reasoning for your choice.
        """
        
        diagnosis = structured_llm.invoke(prompt)
    except Exception as e:
        logger.error(f"[Netbanking Service] LLM Diagnosis failed: {e}")
        action = "OPTIMIZER_RETRY" if "TIMEOUT" in error_code else "KONNECT_OUTREACH"
        diagnosis = RootCauseDiagnosis(
            primary_cause=error_code,
            confidence=0.8,
            is_recoverable=True,
            recommended_action=RecoveryAction(action_type=action),
            reasoning=f"Fallback logic applied due to LLM failure. Action: {action}"
        )

    action_type = diagnosis.recommended_action.action_type
    audit_details = f"Cause: {diagnosis.primary_cause} | Action: {action_type}\nReasoning: {diagnosis.reasoning}"
    
    if action_type == "OPTIMIZER_RETRY":
        success, new_gateway, msg = optimizer_tool.route_payment(transaction.model_dump(), failed_gateway=bank)
        audit_details += f"\n\nOptimizer execution: {msg}"
        next_agent = "compliance"
        
    elif action_type == "KONNECT_OUTREACH":
        msg_template = "Hi {name}, your Netbanking payment of INR {amount} failed. Try completing the payment via UPI or Card here: {payment_url}"
        success, pl_id, msg = konnect_tool.send_whatsapp_recovery_link(transaction.model_dump(), msg_template)
        audit_details += f"\n\nKonnect execution: {msg}"
        next_agent = "compliance"
        
    else:
        next_agent = "compliance"
        
    audit_entry = {
        "agent": "Netbanking Service",
        "action": f"Executed {action_type}",
        "details": audit_details,
        "timestamp": datetime.now().isoformat()
    }
    
    return {
        "diagnosis": diagnosis,
        "selected_action": diagnosis.recommended_action,
        "current_agent": next_agent,
        "audit_trail": [audit_entry]
    }
