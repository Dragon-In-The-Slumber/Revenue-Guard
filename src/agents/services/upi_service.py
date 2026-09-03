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
def upi_service_node(state: RevenueGuardState) -> Dict[str, Any]:
    """
    Dedicated microservice for UPI payment failures.
    Uses Razorpay Optimizer for NPCI/Switch downtimes,
    and Razorpay Konnect to send UPI Intent links.
    """
    transaction = state["transaction"]
    error_code = transaction.payment.error_code
    bank = transaction.payment.bank
    
    logger.info(f"[UPI Service] Analyzing failure for transaction {transaction.transaction_id}")
    
    try:
        llm = ChatAnthropic(
            model="claude-3-5-sonnet-20240620", 
            api_key=settings.anthropic_api_key,
            temperature=0
        )
        structured_llm = llm.with_structured_output(RootCauseDiagnosis)
        
        prompt = f"""
        You are the Razorpay UPI Service Agent.
        Analyze this UPI payment failure:
        Error Code: {error_code}
        Bank/App: {bank}
        
        Rules for UPI Failures:
        - If the error is a bank downtime, NPCI switch issue, or UPI_APP_TIMEOUT, recommend "OPTIMIZER_RETRY".
        - If the error is customer-side (e.g. INSUFFICIENT_FUNDS, INCORRECT_PIN, INVALID_VPA), recommend "KONNECT_OUTREACH".
        - If it's a high-risk decline (e.g. SUSPECTED_FRAUD), recommend "ESCALATE_TO_HUMAN".
        
        Return a clear reasoning for your choice.
        """
        
        diagnosis = structured_llm.invoke(prompt)
    except Exception as e:
        logger.error(f"[UPI Service] LLM Diagnosis failed: {e}")
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
        audit_details += f"\n\nOptimizer/Turbo UPI execution: {msg}"
        next_agent = "compliance"
        
    elif action_type == "KONNECT_OUTREACH":
        msg_template = "Hi {name}, your UPI payment of INR {amount} failed. Tap here to open your UPI app directly and complete the payment: {payment_url}"
        success, pl_id, msg = konnect_tool.send_whatsapp_recovery_link(transaction.model_dump(), msg_template)
        audit_details += f"\n\nKonnect execution: {msg}"
        next_agent = "compliance"
        
    else:
        next_agent = "compliance"
        
    audit_entry = {
        "agent": "UPI Service",
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
