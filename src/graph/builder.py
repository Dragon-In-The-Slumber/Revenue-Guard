from langgraph.graph import StateGraph, END
from src.graph.state import RevenueGuardState
from src.agents.orchestrator import orchestrator_node
from src.agents.prediction import prediction_node
from src.agents.compliance import compliance_node

from src.agents.services.card_service import card_service_node
from src.agents.services.upi_service import upi_service_node
from src.agents.services.netbanking_service import netbanking_service_node
from src.agents.services.wallet_service import wallet_service_node

def router(state: RevenueGuardState) -> str:
    """Routes based on the current_agent set in state."""
    return state["current_agent"]

def create_graph():
    workflow = StateGraph(RevenueGuardState)
    
    # Add nodes
    workflow.add_node("orchestrator", orchestrator_node)
    workflow.add_node("prediction", prediction_node)
    workflow.add_node("compliance", compliance_node)
    
    # Microservices Nodes
    workflow.add_node("card_service", card_service_node)
    workflow.add_node("upi_service", upi_service_node)
    workflow.add_node("netbanking_service", netbanking_service_node)
    workflow.add_node("wallet_service", wallet_service_node)
    
    # Define edges
    workflow.set_entry_point("orchestrator")
    
    # The orchestrator decides which microservice handles the failure
    workflow.add_conditional_edges(
        "orchestrator",
        router,
        {
            "card_service": "card_service",
            "upi_service": "upi_service",
            "netbanking_service": "netbanking_service",
            "wallet_service": "wallet_service",
            "prediction": "prediction"
        }
    )
    
    # Microservices route to compliance or end
    workflow.add_conditional_edges(
        "card_service",
        router,
        {"compliance": "compliance", "end": END}
    )
    
    workflow.add_conditional_edges(
        "upi_service",
        router,
        {"compliance": "compliance", "end": END}
    )
    
    workflow.add_conditional_edges(
        "netbanking_service",
        router,
        {"compliance": "compliance", "end": END}
    )
    
    workflow.add_conditional_edges(
        "wallet_service",
        router,
        {"compliance": "compliance", "end": END}
    )
    
    # Prediction routes to compliance (or end)
    workflow.add_conditional_edges(
        "prediction",
        router,
        {"compliance": "compliance", "end": END}
    )
    
    # Compliance is the final check before ending
    workflow.add_conditional_edges(
        "compliance",
        router,
        {"end": END}
    )
    
    return workflow.compile(checkpointer=None)

graph = create_graph()
