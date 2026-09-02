import functools
import logging
from typing import Callable, Any
from datetime import datetime
from src.graph.state import RevenueGuardState

logger = logging.getLogger(__name__)

def fault_tolerant(fallback_status="FAILED", next_agent_on_fail="compliance"):
    """
    Decorator to wrap LangGraph agent nodes with a fault boundary.
    If the agent crashes, it logs the error to the audit trail,
    sets a fallback recovery status, and routes to a safe next agent (e.g. compliance).
    """
    def decorator(func: Callable[[RevenueGuardState], dict]) -> Callable[[RevenueGuardState], dict]:
        @functools.wraps(func)
        def wrapper(state: RevenueGuardState, *args, **kwargs) -> dict:
            try:
                return func(state, *args, **kwargs)
            except Exception as e:
                agent_name = func.__name__.replace("_node", "").replace("_", " ").title()
                logger.error(f"[{agent_name}] Agent crashed: {e}")
                
                audit_entry = {
                    "agent": agent_name,
                    "action": "Agent Crash / Fault Boundary Triggered",
                    "details": f"Critical failure during execution: {str(e)}. Falling back to safe state.",
                    "timestamp": datetime.now().isoformat()
                }
                
                return {
                    "recovery_status": fallback_status,
                    "current_agent": next_agent_on_fail,
                    "audit_trail": [audit_entry]
                }
        return wrapper
    return decorator
