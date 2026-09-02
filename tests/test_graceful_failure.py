import sys
import os
import pytest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.agents.orchestrator import orchestrator_node
from src.agents.diagnostician import diagnostician_node
from src.agents.silent_recovery import silent_recovery_node
from src.models.transaction import Transaction, Customer, PaymentDetails, MerchantDetails


def make_state(error_code: str = "UNKNOWN_ERROR", status: str = "failed"):
    tx = Transaction(
        transaction_id="tx_graceful_test",
        customer=Customer(name="Grace", email="g@t.com", phone="+91111", type="B2C"),
        payment=PaymentDetails(amount=3000, currency="INR", method="UPI", bank="HDFC",
                               timestamp="2026-09-01T10:00:00Z", status=status, error_code=error_code),
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
def test_handles_unknown_error_code(mock_chat):
    """An unrecognized error code should not crash the system (LLM or fallback)."""
    mock_llm_instance = MagicMock()
    mock_chat.return_value = mock_llm_instance
    mock_llm_instance.with_structured_output.side_effect = Exception("LLM crash")
    
    state = make_state("TOTALLY_UNKNOWN_ERROR_XYZ")
    result = diagnostician_node(state)

    assert result["diagnosis"] is not None
    assert result["current_agent"] in ("silent_recovery", "outreach")
    assert len(result["audit_trail"]) == 1


def test_handles_unknown_status():
    """An unrecognized payment status should default to diagnostician."""
    state = make_state(status="weird_status")
    result = orchestrator_node(state)

    assert result["current_agent"] == "diagnostician"


@patch("src.agents.silent_recovery.razorpay_client")
def test_fault_tolerant_decorator(mock_razorpay):
    """Test that the @fault_tolerant decorator catches hard crashes and routes to compliance."""
    mock_razorpay.switch_gateway.side_effect = RuntimeError("Hard crash inside tool")
    
    state = make_state()
    from src.models.diagnosis import RootCauseDiagnosis, RecoveryAction
    state["diagnosis"] = RootCauseDiagnosis(
        primary_cause="Test",
        confidence=0.99,
        is_recoverable=True,
        recommended_action=RecoveryAction(action_type="SILENT_RETRY", requires_approval=False),
        reasoning="Test"
    )
    
    result = silent_recovery_node(state)
    
    # Normally this would raise RuntimeError, but @fault_tolerant catches it.
    assert result["recovery_status"] == "FAILED"
    assert result["current_agent"] == "compliance"
    assert "Agent Crash / Fault Boundary Triggered" == result["audit_trail"][0]["action"]
    assert "Hard crash inside tool" in result["audit_trail"][0]["details"]
