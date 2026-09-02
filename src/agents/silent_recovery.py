from typing import Dict, Any
from datetime import datetime
from src.graph.state import RevenueGuardState
from src.tools.bank_analyzer import bank_analyzer
from src.tools.razorpay_api import razorpay_client
from src.agents.fault_handler import fault_tolerant

logger = logging.getLogger(__name__)

@fault_tolerant(fallback_status="FAILED", next_agent_on_fail="compliance")
def silent_recovery_node(state: RevenueGuardState) -> Dict[str, Any]:
    """
    The Silent Recovery Agent attempts to fix the payment failure without 
    notifying the customer (e.g., smart retry, routing to a different gateway).
    """
    transaction = state["transaction"]
    diagnosis = state.get("diagnosis")
    action_type = diagnosis.recommended_action.action_type if diagnosis and diagnosis.recommended_action else "NONE"
    
    success = False
    details = "Silent recovery not attempted."
    
    try:
        if action_type == "SCHEDULED_RETRY":
            # Use BankAnalyzer to get optimal retry time
            retry_time = bank_analyzer.get_optimal_retry_time(transaction.payment.bank)
            details = f"Scheduled smart retry for {retry_time} based on historical downtime patterns."
            success = True
            
        elif action_type == "SILENT_RETRY":
            # Use Razorpay API tool to switch gateway
            response = razorpay_client.switch_gateway(transaction.transaction_id, "alternate_gateway")
            if response.get("status") == "success":
                success = True
                details = f"Successfully switched gateway to {response.get('switched_to')} and completed silent retry."
            else:
                details = f"Silent retry failed: {response.get('error', 'Unknown error')}"
                
    except Exception as e:
        logger.warning(f"Silent recovery failed for {transaction.transaction_id}: {e}")
        details = f"Error during silent recovery execution: {e}"
        
    audit_entry = {
        "agent": "Silent Recovery",
        "action": "Attempt Silent Fix",
        "details": details,
        "timestamp": datetime.now().isoformat()
    }
    
    status = "SUCCESS" if success else "FAILED"
    
    return {
        "recovery_status": status,
        "current_agent": "compliance",
        "audit_trail": [audit_entry]
    }
