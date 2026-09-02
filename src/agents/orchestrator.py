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
    next_agent: str = Field(description="The exact name of the agent to route to: 'diagnostician' or 'prediction'.")
    reasoning: str = Field(description="Reasoning for this routing decision based on the policies and transaction data.")

@fault_tolerant(fallback_status="FAILED", next_agent_on_fail="diagnostician")
def orchestrator_node(state: RevenueGuardState) -> Dict[str, Any]:
    """
    The Orchestrator acts as an LLM Semantic Router.
    It takes the initial webhook event, reads dynamic rules, and decides 
    whether it needs Diagnosis (for failures) or Prediction (for pre-failure signals).
    """
    transaction = state["transaction"]
    
    # We must run this async query synchronously since LangGraph nodes are sync in this setup
    loop = asyncio.get_event_loop()
    policies = loop.run_until_complete(policy_store.get_active_policies("Orchestrator"))
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
    Analyze the incoming transaction webhook and decide which agent should handle it next.
    
    Options:
    - 'diagnostician': For failed or denied payments that need recovery.
    - 'prediction': For 'at_risk' or 'pending' payments that might fail soon.
    
    Transaction Data:
    {transaction.model_dump_json()}
    
    Strict Policies to follow:
    {policy_texts if policy_texts else "No specific routing policies active."}
    
    Output a structured JSON decision.
    """
    
    try:
        decision: RoutingDecision = structured_llm.invoke(prompt)
        next_agent = decision.next_agent
        reasoning = decision.reasoning
    except Exception as e:
        logger.error(f"Orchestrator LLM routing failed: {e}")
        next_agent = "diagnostician"
        reasoning = f"Fallback routing used due to LLM error: {e}"
        
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
