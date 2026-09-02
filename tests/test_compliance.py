import sys
import os
import pytest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.agents.compliance import compliance_node
from src.models.transaction import Transaction, Customer, PaymentDetails, MerchantDetails
from src.models.diagnosis import RecoveryAction


def make_compliance_state(attempts: int = 0, amount: float = 5000, action_type: str = "SILENT_RETRY"):
    """Helper to build a test state for compliance checks."""
    tx = Transaction(
        transaction_id="tx_compliance_test",
        customer=Customer(name="Test", email="t@t.com", phone="+91000", type="B2C"),
        payment=PaymentDetails(amount=amount, currency="INR", method="UPI", bank="HDFC",
                               timestamp="2026-09-01T10:00:00Z", status="failed", error_code="TIMEOUT"),
        merchant=MerchantDetails(id="mer_1", name="Merchant")
    )
    return {
        "transaction": tx,
        "messages": [],
        "current_agent": "compliance",
        "contact_attempts": attempts,
        "selected_action": RecoveryAction(action_type=action_type, requires_approval=False),
        "recovery_status": "PENDING",
        "audit_trail": []
    }


@patch("src.agents.compliance.datetime")
def test_approves_normal_transaction(mock_datetime):
    """Normal low-value, low-attempt transaction should be approved."""
    mock_datetime.now.return_value.hour = 14 # 2 PM
    state = make_compliance_state(attempts=1, amount=5000, action_type="WHATSAPP_MESSAGE")
    result = compliance_node(state)

    assert result["is_approved"] is True
    assert result["current_agent"] == "end"


@patch("src.agents.compliance.datetime")
def test_escalates_after_max_attempts(mock_datetime):
    """After 3 contact attempts, must escalate to human — NOT continue outreach."""
    mock_datetime.now.return_value.hour = 14
    state = make_compliance_state(attempts=3)
    result = compliance_node(state)

    assert result["is_approved"] is False
    assert result["recovery_status"] == "ESCALATED"
    assert "Max contact attempts" in result["audit_trail"][0]["details"]


@patch("src.agents.compliance.datetime")
def test_blocks_high_value(mock_datetime):
    """Transactions over ₹50,000 must be blocked pending approval."""
    mock_datetime.now.return_value.hour = 14
    state = make_compliance_state(amount=75000)
    result = compliance_node(state)

    assert result["is_approved"] is False
    assert result["recovery_status"] == "PENDING_APPROVAL"


@patch("src.agents.compliance.datetime")
def test_blocks_outreach_during_quiet_hours(mock_datetime):
    """Outreach actions should be blocked between 9 PM and 8 AM."""
    mock_datetime.now.return_value.hour = 22 # 10 PM
    state = make_compliance_state(action_type="WHATSAPP_MESSAGE")
    result = compliance_node(state)

    assert result["is_approved"] is False
    assert result["recovery_status"] == "BLOCKED_BY_COMPLIANCE"
    assert "prohibited during quiet hours" in result["audit_trail"][0]["details"]


@patch("src.agents.compliance.datetime")
def test_allows_silent_retry_during_quiet_hours(mock_datetime):
    """Silent retries should STILL be allowed during quiet hours."""
    mock_datetime.now.return_value.hour = 22 # 10 PM
    state = make_compliance_state(action_type="SILENT_RETRY")
    result = compliance_node(state)

    assert result["is_approved"] is True
