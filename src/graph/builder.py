from langgraph.graph import StateGraph, END
from src.graph.state import RevenueGuardState
from src.agents.orchestrator import orchestrator_node
from src.agents.diagnostician import diagnostician_node
from src.agents.silent_recovery import silent_recovery_node
from src.agents.outreach import outreach_node
from src.agents.prediction import prediction_node
from src.agents.compliance import compliance_node

def router(state: RevenueGuardState) -> str:
    """Routes based on the current_agent set in state."""
    return state["current_agent"]

def create_graph():
    workflow = StateGraph(RevenueGuardState)
    
    # Add nodes
    workflow.add_node("orchestrator", orchestrator_node)
    workflow.add_node("diagnostician", diagnostician_node)
    workflow.add_node("silent_recovery", silent_recovery_node)
    workflow.add_node("outreach", outreach_node)
    workflow.add_node("prediction", prediction_node)
    workflow.add_node("compliance", compliance_node)
    
    # Define edges
    workflow.set_entry_point("orchestrator")
    
    # The orchestrator decides where to go next
    workflow.add_conditional_edges(
        "orchestrator",
        router,
        {
            "diagnostician": "diagnostician",
            "prediction": "prediction"
        }
    )
    
    workflow.add_conditional_edges(
        "diagnostician",
        router,
        {
            "silent_recovery": "silent_recovery",
            "outreach": "outreach"
        }
    )
    
    workflow.add_conditional_edges(
        "silent_recovery",
        router,
        {"compliance": "compliance"}
    )
    
    workflow.add_conditional_edges(
        "outreach",
        router,
        {"compliance": "compliance"}
    )
    
    workflow.add_conditional_edges(
        "prediction",
        router,
        {"outreach": "outreach"}
    )
    
    workflow.add_conditional_edges(
        "compliance",
        router,
        {"end": END}
    )
    
    # We pass checkpointer=None for now to allow sync execution.
    # In a real async worker, we'd pass the AsyncPostgresSaver here.
    return workflow.compile(checkpointer=None)

graph = create_graph()
