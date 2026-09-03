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

class RoutingDecision(BaseModel):
    next_agent: str = Field(description="The exact name of the agent to route to: 'card_service', 'upi_service', 'netbanking_service', 'wallet_service', or 'prediction'.")
    reasoning: str = Field(description="Reasoning for this routing decision based on the policies and transaction data.")

@fault_tolerant(fallback_status="FAILED", next_agent_on_fail="card_service")
async def orchestrator_node(state: RevenueGuardState) -> Dict[str, Any]:
    """
    The Orchestrator acts as an LLM Semantic Router.
    It takes the initial webhook event, reads dynamic rules, and decides 
    which microservice should handle the payment failure.
    """
    transaction = state["transaction"]
    payment_method = transaction.payment.method
    
    policies = await policy_store.get_active_policies("Orchestrator")
    policy_texts = "\n".join([f"- {p['policy_text']}" for p in policies])
    
    llm = ChatAnthropic(
        model="claude-3-5-sonnet-20240620", 
        api_key=settings.anthropic_api_key,
        temperature=0,
        max_retries=3,
        timeout=20
    )
    
    structured_llm = llm.with_structured_output(RoutingDecision)
    
    prompt = f"""
    You are the Orchestrator for an autonomous payment recovery system.
    Analyze the incoming transaction webhook and decide which microservice should handle it.
    
    Options:
    - 'card_service': For credit/debit card failures.
    - 'upi_service': For UPI, VPA, Intent failures.
    - 'netbanking_service': For netbanking failures.
    - 'wallet_service': For wallet or pay_later failures.
    - 'prediction': For 'at_risk' or 'pending' payments that might fail soon.
    
    Transaction Data:
    {transaction.model_dump_json()}
    
    Strict Policies to follow:
    {policy_texts if policy_texts else "No specific routing policies active."}
    
    Output a structured JSON decision.
    """
    
    try:
        decision: RoutingDecision = await structured_llm.ainvoke(prompt)
        next_agent = decision.next_agent
        reasoning = decision.reasoning
    except Exception as e:
        logger.error(f"Orchestrator LLM routing failed: {e}")
        # Fallback routing based on method
        if payment_method == "upi":
            next_agent = "upi_service"
        elif payment_method == "netbanking":
            next_agent = "netbanking_service"
        elif payment_method == "wallet":
            next_agent = "wallet_service"
        else:
            next_agent = "card_service"
            
        reasoning = f"Fallback routing used due to LLM error. Routed to {next_agent} based on method {payment_method}"
        
    audit_entry = {
        "agent": "Orchestrator",
        "action": "Semantic Routing",
        "details": f"Routed to {next_agent}\nReasoning: {reasoning}",
        "timestamp": datetime.now().isoformat()
    }
        
    return {
        "current_agent": next_agent,
        "audit_trail": [audit_entry]
    }
