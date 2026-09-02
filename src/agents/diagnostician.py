from typing import Dict, Any
from datetime import datetime
from src.graph.state import RevenueGuardState
from src.models.diagnosis import RootCauseDiagnosis, RecoveryAction
from langchain_anthropic import ChatAnthropic
from src.config import settings
from src.tools.bank_analyzer import bank_analyzer
from src.agents.fault_handler import fault_tolerant

logger = logging.getLogger(__name__)

@fault_tolerant()
def diagnostician_node(state: RevenueGuardState) -> Dict[str, Any]:
    """
    The Diagnostician analyzes the failure and identifies the root cause.
    It returns a structured RootCauseDiagnosis and determines whether
    the transaction is recoverable silently or needs outreach.
    """
    transaction = state["transaction"]
    
    # 1. Use the BankAnalyzer tool to gather context
    bank_downtime_info = bank_analyzer.is_bank_downtime(
        bank=transaction.payment.bank, 
        failure_hour=datetime.fromisoformat(transaction.payment.timestamp).hour
    )
    
    diagnosis = None
    
    # 2. Try the LLM for structured reasoning
    try:
        llm = ChatAnthropic(
            model="claude-3-5-sonnet-20240620", 
            api_key=settings.anthropic_api_key,
            temperature=0,
            max_retries=1,
            timeout=30
        )
        structured_llm = llm.with_structured_output(RootCauseDiagnosis)
        
        prompt = f"""
        You are an expert AI payments diagnostician for Razorpay.
        Analyze the following failed transaction and determine the root cause.
        
        Transaction Data: {transaction.model_dump_json()}
        Bank System Status Context: {bank_downtime_info}
        
        Rules:
        - If the bank is in a known downtime or error code indicates timeout, action_type MUST be "SILENT_RETRY" or "SCHEDULED_RETRY".
        - If it's a customer fault (insufficient funds, wrong CVV), action_type MUST be "WHATSAPP_MESSAGE" or "EMAIL".
        - If it's a high risk decline, action_type MUST be "EMAIL" and requires_approval MUST be true.
        - Provide a clear, detailed reasoning explaining why you chose this action based on the error code and bank status.
        """
        
        diagnosis = structured_llm.invoke(prompt)
    except Exception as e:
        logger.warning(f"LLM Diagnosis failed for {transaction.transaction_id}: {e}. Falling back to heuristic.")
        
    # 3. Fallback Heuristic if LLM fails
    if not diagnosis:
        error_code = transaction.payment.error_code
        is_silent_possible = False
        action_type = "WHATSAPP_MESSAGE"
        
        if "DOWNTIME" in error_code or "TIMEOUT" in error_code or bank_downtime_info.get("is_downtime"):
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
            reasoning="Analyzed error code and historical bank downtime patterns using fallback heuristics."
        )
        
    audit_entry = {
        "agent": "Diagnostician",
        "action": "Diagnosed Failure",
        "details": f"Cause: {diagnosis.primary_cause} | Recommended Action: {diagnosis.recommended_action.action_type if diagnosis.recommended_action else 'NONE'}\nReasoning: {diagnosis.reasoning}",
        "timestamp": datetime.now().isoformat()
    }
    
    action_type = diagnosis.recommended_action.action_type if diagnosis.recommended_action else "WHATSAPP_MESSAGE"
    next_agent = "silent_recovery" if action_type in ["SILENT_RETRY", "SCHEDULED_RETRY"] else "outreach"
    
    return {
        "diagnosis": diagnosis,
        "selected_action": diagnosis.recommended_action,
        "current_agent": next_agent,
        "audit_trail": [audit_entry]
    }
