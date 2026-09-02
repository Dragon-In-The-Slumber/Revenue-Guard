import sys
import os
import pytest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.agents.outreach import outreach_node
from src.models.transaction import Transaction, Customer, PaymentDetails, MerchantDetails
from src.models.diagnosis import RootCauseDiagnosis, RecoveryAction


def make_outreach_state(customer_type="B2C", channel=None):
    tx = Transaction(
        transaction_id="tx_outreach_1",
        customer=Customer(name="Test", email="t@t.com", phone="+91000", type=customer_type),
        payment=PaymentDetails(amount=5000, currency="INR", method="UPI", bank="HDFC",
                               timestamp="2026-09-01T10:00:00Z", status="failed", error_code="TIMEOUT"),
        merchant=MerchantDetails(id="mer_1", name="Merchant")
    )
    
    action = RecoveryAction(action_type="WHATSAPP_MESSAGE" if channel == "WHATSAPP" else "EMAIL", requires_approval=False, channel=channel)
    diagnosis = RootCauseDiagnosis(
        primary_cause="Insufficient funds",
        confidence=0.99,
        is_recoverable=True,
        recommended_action=action,
        reasoning="Test."
    )
    
    return {
        "transaction": tx,
        "diagnosis": diagnosis,
        "selected_action": action,
        "contact_attempts": 0,
        "current_agent": "outreach",
        "audit_trail": []
    }


@patch("src.agents.outreach.ChatAnthropic")
def test_outreach_drafts_message_llm(mock_chat):
    """Test LLM successfully drafts a message."""
    mock_llm_instance = MagicMock()
    mock_chat.return_value = mock_llm_instance
    mock_response = MagicMock()
    mock_response.content = "Hi Test, please retry your payment."
    mock_llm_instance.invoke.return_value = mock_response
    
    state = make_outreach_state(channel="WHATSAPP")
    result = outreach_node(state)

    assert result["current_agent"] == "compliance"
    assert result["contact_attempts"] == 1
    assert "Hi Test" in result["audit_trail"][0]["details"]
    assert "WHATSAPP" in result["audit_trail"][0]["action"]


@patch("src.agents.outreach.ChatAnthropic")
def test_outreach_fallback_template(mock_chat):
    """Test fallback template is used if LLM fails."""
    mock_llm_instance = MagicMock()
    mock_chat.return_value = mock_llm_instance
    mock_llm_instance.invoke.side_effect = Exception("LLM failure")
    
    state = make_outreach_state(customer_type="B2B")
    # Action channel is None for this state by default if not specified
    result = outreach_node(state)

    assert result["current_agent"] == "compliance"
    assert "payment of ₹5000.0 for Merchant failed" in result["audit_trail"][0]["details"]
    assert "EMAIL" in result["audit_trail"][0]["action"] # Because B2B defaults to EMAIL
