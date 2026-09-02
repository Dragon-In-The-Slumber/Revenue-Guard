import logging
from typing import Dict, Any
from datetime import datetime
from src.graph.state import RevenueGuardState
from src.agents.fault_handler import fault_tolerant
from src.config import settings
from src.persistence.policy_store import policy_store
import asyncio
from langchain_anthropic import ChatAnthropic
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class ComplianceDecision(BaseModel):
    is_approved: bool = Field(description="True if the action complies with all policies, False if it violates any.")
    status: str = Field(description="The status to set (e.g. 'PENDING_APPROVAL', 'BLOCKED_BY_COMPLIANCE', 'ESCALATED', 'APPROVED').")
    reasoning: str = Field(description="Detailed explanation of which policies were evaluated and why this decision was reached.")

@fault_tolerant(fallback_status="ESCALATED", next_agent_on_fail="end")
def compliance_node(state: RevenueGuardState) -> Dict[str, Any]:
    """
    The Compliance Agent evaluates the planned action against dynamic
    Natural Language Policies from the database using an LLM.
    """
    transaction = state["transaction"]
    attempts = state.get("contact_attempts", 0)
    proposed_action = state.get("selected_action")
    action_type = proposed_action.action_type if proposed_action else "NONE"
    
    # Fetch dynamic policies for Compliance
    loop = asyncio.get_event_loop()
    policies = loop.run_until_complete(policy_store.get_active_policies("Compliance"))
    policy_texts = "\n".join([f"- {p['policy_text']}" for p in policies])
    
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    llm = ChatAnthropic(
        model="claude-3-5-sonnet-20240620", 
        api_key=settings.anthropic_api_key,
        temperature=0,
        max_retries=3,
        timeout=20
    )
    
    structured_llm = llm.with_structured_output(ComplianceDecision)
    
    prompt = f"""
    You are the Compliance Officer AI for Razorpay.
    Your job is to review a proposed recovery action and ensure it strictly adheres to all company policies.
    
    Transaction Details:
    Amount: ₹{transaction.payment.amount}
    Customer Type: {transaction.customer.type}
    
    Action Context:
    Proposed Action: {action_type}
    Contact Attempts so far: {attempts}
    Current Local Time: {current_time}
    
    Strict Policies to follow:
    {policy_texts if policy_texts else "No specific compliance policies active."}
    
    Evaluate the Proposed Action against the Policies. Output a structured decision.
    """
    
    try:
        decision: ComplianceDecision = structured_llm.invoke(prompt)
        is_approved = decision.is_approved
        
        # If it was previously SUCCESS from silent recovery, we shouldn't override to APPROVED, we keep SUCCESS
        current_status = state.get("recovery_status", "PENDING")
        if current_status == "SUCCESS":
            final_status = "SUCCESS"
        else:
            final_status = decision.status if not is_approved else "APPROVED"
            
        details = decision.reasoning
    except Exception as e:
        logger.error(f"Compliance LLM failed: {e}")
        is_approved = False
        final_status = "ESCALATED"
        details = f"Action blocked due to Compliance LLM failure: {e}"
        
    audit_entry = {
        "agent": "Compliance",
        "action": "Policy Validation",
        "details": f"Status: {final_status}\nReasoning: {details}",
        "timestamp": datetime.now().isoformat()
    }
    
    return {
        "is_approved": is_approved,
        "recovery_status": final_status,
        "current_agent": "end",
        "audit_trail": [audit_entry]
    }
