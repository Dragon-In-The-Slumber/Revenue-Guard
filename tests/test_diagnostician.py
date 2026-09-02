import sys
import os
import pytest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.agents.diagnostician import diagnostician_node
from src.models.transaction import Transaction, Customer, PaymentDetails, MerchantDetails
from src.models.diagnosis import RootCauseDiagnosis, RecoveryAction


def make_state(error_code: str, method: str = "UPI", bank: str = "HDFC", amount: float = 5000):
    """Helper to build a minimal test state."""
    tx = Transaction(
        transaction_id="tx_test_001",
        customer=Customer(name="Test User", email="test@test.com", phone="+919999999999", type="B2C"),
        payment=PaymentDetails(amount=amount, currency="INR", method=method, bank=bank,
                               timestamp="2026-09-01T22:47:00Z", status="failed", error_code=error_code),
        merchant=MerchantDetails(id="mer_test", name="Test Merchant")
    )
    return {
        "transaction": tx,
        "messages": [],
        "current_agent": "diagnostician",
        "contact_attempts": 0,
        "max_attempts_reached": False,
        "requires_human_approval": False,
        "is_approved": False,
        "recovery_status": "PENDING",
        "audit_trail": []
    }


@patch("src.agents.diagnostician.ChatAnthropic")
def test_diagnoses_bank_downtime_llm(mock_chat):
    """Test when LLM returns SCHEDULED_RETRY for bank downtime."""
    # Mock LLM response
    mock_llm_instance = MagicMock()
    mock_structured = MagicMock()
    mock_chat.return_value = mock_llm_instance
    mock_llm_instance.with_structured_output.return_value = mock_structured
    
    mock_structured.invoke.return_value = RootCauseDiagnosis(
        primary_cause="Infrastructure instability (Bank downtime)",
        confidence=0.95,
        is_recoverable=True,
        recommended_action=RecoveryAction(action_type="SCHEDULED_RETRY", requires_approval=False),
        reasoning="Bank is down."
    )
    
    state = make_state("ISSUING_BANK_DOWNTIME")
    result = diagnostician_node(state)

    assert result["diagnosis"].primary_cause.startswith("Infrastructure")
    assert result["selected_action"].action_type == "SCHEDULED_RETRY"
    assert result["current_agent"] == "silent_recovery"


@patch("src.agents.diagnostician.ChatAnthropic")
def test_diagnoses_insufficient_funds_llm(mock_chat):
    """Test when LLM returns WHATSAPP_MESSAGE for insufficient funds."""
    mock_llm_instance = MagicMock()
    mock_structured = MagicMock()
    mock_chat.return_value = mock_llm_instance
    mock_llm_instance.with_structured_output.return_value = mock_structured
    
    mock_structured.invoke.return_value = RootCauseDiagnosis(
        primary_cause="Insufficient funds",
        confidence=0.99,
        is_recoverable=True,
        recommended_action=RecoveryAction(action_type="WHATSAPP_MESSAGE", requires_approval=False, channel="WHATSAPP"),
        reasoning="Customer lacks funds."
    )
    
    state = make_state("INSUFFICIENT_FUNDS")
    result = diagnostician_node(state)

    assert result["selected_action"].action_type == "WHATSAPP_MESSAGE"
    assert result["current_agent"] == "outreach"


@patch("src.agents.diagnostician.ChatAnthropic")
def test_diagnoses_fallback_heuristic(mock_chat):
    """Test fallback heuristic triggers when LLM throws an exception."""
    mock_llm_instance = MagicMock()
    mock_chat.return_value = mock_llm_instance
    # Simulate LLM crash
    mock_llm_instance.with_structured_output.side_effect = Exception("LLM timeout")
    
    state = make_state("RISK_DECLINE")
    result = diagnostician_node(state)

    # Heuristic says RISK_DECLINE -> EMAIL -> outreach
    assert result["selected_action"].action_type == "EMAIL"
    assert result["current_agent"] == "outreach"
    assert result["diagnosis"].primary_cause == "High-risk transaction blocked by gateway"


@patch("src.agents.diagnostician.ChatAnthropic")
def test_diagnosis_audit_trail(mock_chat):
    """Ensure audit trail is properly recorded."""
    mock_llm_instance = MagicMock()
    mock_structured = MagicMock()
    mock_chat.return_value = mock_llm_instance
    mock_llm_instance.with_structured_output.return_value = mock_structured
    
    mock_structured.invoke.return_value = RootCauseDiagnosis(
        primary_cause="Random Error",
        confidence=0.5,
        is_recoverable=False,
        recommended_action=RecoveryAction(action_type="EMAIL", requires_approval=True),
        reasoning="Test."
    )
    
    state = make_state("UNKNOWN")
    result = diagnostician_node(state)

    assert len(result["audit_trail"]) == 1
    assert result["audit_trail"][0]["agent"] == "Diagnostician"
    assert "Random Error" in result["audit_trail"][0]["details"]

