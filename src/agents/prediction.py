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

class PredictiveScore(BaseModel):
    risk_score: int = Field(description="Risk score from 0 to 100 representing the probability of future payment failure.")
    primary_risk_factor: str = Field(description="The primary reason this transaction is at risk.")
    recommended_action: str = Field(description="The recommended preemptive action (e.g., 'WHATSAPP_NUDGE', 'SILENT_ROUTING').")
    reasoning: str = Field(description="Detailed reasoning for the score and recommendation.")

@fault_tolerant(fallback_status="FAILED", next_agent_on_fail="outreach")
def prediction_node(state: RevenueGuardState) -> Dict[str, Any]:
    """
    The Prediction Agent handles "at_risk" transactions before they fully fail.
    It uses an LLM to analyze the context and suggest a preemptive action.
    """
    transaction = state["transaction"]
    
    # Fetch policies for Prediction agent
    loop = asyncio.get_event_loop()
    policies = loop.run_until_complete(policy_store.get_active_policies("Prediction"))
    policy_texts = "\n".join([f"- {p['policy_text']}" for p in policies])
    
    llm = ChatAnthropic(
        model="claude-3-5-sonnet-20240620", 
        api_key=settings.anthropic_api_key,
        temperature=0.2,
        max_retries=3,
        timeout=20
    )
    
    structured_llm = llm.with_structured_output(PredictiveScore)
    
    prompt = f"""
    You are the Predictive AI Agent for Razorpay RevenueGuard.
    Analyze this "at_risk" transaction and generate a risk profile.
    
    Transaction Data:
    {transaction.model_dump_json()}
    
    Policies to follow:
    {policy_texts if policy_texts else "No specific prediction policies active."}
    
    Provide a risk score (0-100) and a recommended proactive action.
    """
    
    try:
        prediction: PredictiveScore = structured_llm.invoke(prompt)
        score = prediction.risk_score
        action = prediction.recommended_action
        reasoning = prediction.reasoning
    except Exception as e:
        logger.error(f"Prediction LLM failed: {e}")
        score = 80
        action = "WHATSAPP_NUDGE"
        reasoning = "Fallback prediction triggered due to LLM timeout."
    
    audit_entry = {
        "agent": "Prediction",
        "action": "Risk Analysis",
        "details": f"Risk Score: {score}/100 | Recommended: {action}\nReasoning: {reasoning}",
        "timestamp": datetime.now().isoformat()
    }
    
    # Route based on the recommended action
    next_agent = "silent_recovery" if "SILENT" in action else "outreach"
    
    return {
        "current_agent": next_agent,
        "audit_trail": [audit_entry]
    }
