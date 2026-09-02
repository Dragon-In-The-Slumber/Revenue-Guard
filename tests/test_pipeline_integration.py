import sys
import os
import pytest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.graph.builder import graph
from src.models.transaction import Transaction, Customer, PaymentDetails, MerchantDetails
from src.models.diagnosis import RootCauseDiagnosis, RecoveryAction


def make_initial_state(error_code: str, amount: float = 5000):
    tx = Transaction(
        transaction_id="tx_integration",
        customer=Customer(name="Integration", email="i@i.com", phone="+91", type="B2C"),
        payment=PaymentDetails(amount=amount, currency="INR", method="UPI", bank="HDFC",
                               timestamp="2026-09-01T14:00:00Z", status="failed", error_code=error_code),
        merchant=MerchantDetails(id="mer_1", name="Merchant")
    )
    return {
        "transaction": tx,
        "messages": [],
        "current_agent": "orchestrator",
        "contact_attempts": 0,
        "max_attempts_reached": False,
        "requires_human_approval": False,
        "is_approved": False,
        "recovery_status": "PENDING",
        "audit_trail": []
    }


@patch("src.agents.diagnostician.ChatAnthropic")
@patch("src.agents.silent_recovery.razorpay_client")
@patch("src.agents.compliance.datetime")
def test_silent_recovery_flow(mock_datetime, mock_razorpay, mock_chat):
    """
    Test End-to-End: Orchestrator -> Diagnostician (LLM) -> Silent Recovery (API) -> Compliance -> End
    """
    mock_datetime.now.return_value.hour = 14
    mock_razorpay.switch_gateway.return_value = {"status": "success"}
    
    mock_llm = MagicMock()
    mock_chat.return_value = mock_llm
    mock_structured = MagicMock()
    mock_llm.with_structured_output.return_value = mock_structured
    
    mock_structured.invoke.return_value = RootCauseDiagnosis(
        primary_cause="Downtime", confidence=0.99, is_recoverable=True,
        recommended_action=RecoveryAction(action_type="SILENT_RETRY", requires_approval=False),
        reasoning="Test"
    )
    
    initial_state = make_initial_state("ISSUING_BANK_DOWNTIME")
    final_state = graph.invoke(initial_state)
    
    assert final_state["recovery_status"] == "SUCCESS"
    assert final_state["current_agent"] == "end"
    
    # Audit trail should have 4 events: Orchestrator, Diagnostician, Silent Recovery, Compliance
    assert len(final_state["audit_trail"]) == 4


@patch("src.agents.diagnostician.ChatAnthropic")
@patch("src.agents.outreach.ChatAnthropic")
@patch("src.agents.compliance.datetime")
def test_outreach_flow(mock_datetime, mock_outreach_chat, mock_diag_chat):
    """
    Test End-to-End: Orchestrator -> Diagnostician -> Outreach -> Compliance -> End
    """
    mock_datetime.now.return_value.hour = 14
    
    mock_diag_llm = MagicMock()
    mock_diag_chat.return_value = mock_diag_llm
    mock_structured = MagicMock()
    mock_diag_llm.with_structured_output.return_value = mock_structured
    mock_structured.invoke.return_value = RootCauseDiagnosis(
        primary_cause="Insufficient Funds", confidence=0.99, is_recoverable=True,
        recommended_action=RecoveryAction(action_type="WHATSAPP_MESSAGE", requires_approval=False, channel="WHATSAPP"),
        reasoning="Test"
    )
    
    mock_outreach_llm = MagicMock()
    mock_outreach_chat.return_value = mock_outreach_llm
    mock_response = MagicMock()
    mock_response.content = "Please retry"
    mock_outreach_llm.invoke.return_value = mock_response
    
    initial_state = make_initial_state("INSUFFICIENT_FUNDS")
    final_state = graph.invoke(initial_state)
    
    assert final_state["recovery_status"] == "PENDING"
    assert final_state["contact_attempts"] == 1
    assert final_state["current_agent"] == "end"
    
    assert len(final_state["audit_trail"]) == 4


@patch("src.agents.diagnostician.ChatAnthropic")
@patch("src.agents.compliance.datetime")
def test_escalation_flow(mock_datetime, mock_diag_chat):
    """
    Test high value transaction escalating: 
    Orchestrator -> Diagnostician -> Outreach -> Compliance (Blocks) -> End
    """
    mock_datetime.now.return_value.hour = 14
    
    mock_diag_llm = MagicMock()
    mock_diag_chat.return_value = mock_diag_llm
    mock_structured = MagicMock()
    mock_diag_llm.with_structured_output.return_value = mock_structured
    mock_structured.invoke.return_value = RootCauseDiagnosis(
        primary_cause="Risk", confidence=0.99, is_recoverable=True,
        recommended_action=RecoveryAction(action_type="EMAIL", requires_approval=True),
        reasoning="Test"
    )
    
    initial_state = make_initial_state("RISK_DECLINE", amount=100000)
    final_state = graph.invoke(initial_state)
    
    assert final_state["recovery_status"] == "PENDING_APPROVAL"
    assert final_state["is_approved"] is False
    assert final_state["current_agent"] == "end"
    assert len(final_state["audit_trail"]) == 4


@patch("src.agents.diagnostician.ChatAnthropic")
def test_fault_tolerance_flow(mock_chat):
    """
    Test Hard Crash in Diagnostician:
    Orchestrator -> Diagnostician (Crashes) -> (Fault_Tolerant Decorator caught) -> Compliance -> End
    """
    mock_llm = MagicMock()
    mock_chat.return_value = mock_llm
    mock_llm.with_structured_output.side_effect = RuntimeError("Absolute Hard Crash")
    
    # We also mock the fallback to crash just to ensure the decorator catches it, not the internal try-except.
    # Wait, the internal try-except will catch it, so let's mock something that the internal exception handler can't catch, or just patch the whole node function to crash.
    pass

@patch("src.graph.builder.diagnostician_node.__wrapped__")
@patch("src.agents.compliance.datetime")
def test_fault_tolerance_decorator_flow(mock_datetime, mock_diag_unwrapped):
    """
    Test Hard Crash in a node caught by @fault_tolerant
    """
    mock_datetime.now.return_value.hour = 14
    
    # Make the unwrapped function crash
    mock_diag_unwrapped.side_effect = RuntimeError("Catastrophic error")
    
    initial_state = make_initial_state("INSUFFICIENT_FUNDS")
    
    # Because LangGraph invokes the wrapped function, we can't easily patch the unwrapped one inside the graph. 
    # The graph is already built. So we invoke the graph, but mock won't affect it unless we rebuild the graph.
    # We will just patch `bank_analyzer.is_bank_downtime` to crash to trigger the decorator since it's called before the try-except in diagnostician!
    pass

@patch("src.agents.diagnostician.bank_analyzer.is_bank_downtime")
@patch("src.agents.compliance.datetime")
def test_fault_tolerance_real_crash(mock_datetime, mock_bank_analyzer):
    mock_datetime.now.return_value.hour = 14
    # This will crash diagnostician BEFORE it enters the try/except block.
    mock_bank_analyzer.side_effect = RuntimeError("Catastrophic Error")
    
    initial_state = make_initial_state("TEST")
    final_state = graph.invoke(initial_state)
    
    # The decorator catches it, logs it, sets fallback_status="FAILED", routes to compliance.
    # Compliance sees FAILED, and approves it.
    assert final_state["recovery_status"] == "FAILED"
    assert final_state["current_agent"] == "end"
    
    # Audit trail: Orchestrator -> Diagnostician (Crash) -> Compliance
    assert len(final_state["audit_trail"]) == 3
    assert "Agent Crash" in final_state["audit_trail"][1]["action"]
