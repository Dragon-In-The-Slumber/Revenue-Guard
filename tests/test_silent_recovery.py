import sys
import os
import pytest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.agents.silent_recovery import silent_recovery_node
from src.models.transaction import Transaction, Customer, PaymentDetails, MerchantDetails
from src.models.diagnosis import RootCauseDiagnosis, RecoveryAction


def make_silent_recovery_state(action_type="SILENT_RETRY"):
    tx = Transaction(
        transaction_id="tx_silent_1",
        customer=Customer(name="Test", email="t@t.com", phone="+91000", type="B2C"),
        payment=PaymentDetails(amount=5000, currency="INR", method="UPI", bank="HDFC",
                               timestamp="2026-09-01T10:00:00Z", status="failed", error_code="TIMEOUT"),
        merchant=MerchantDetails(id="mer_1", name="Merchant")
    )
    
    action = RecoveryAction(action_type=action_type, requires_approval=False)
    diagnosis = RootCauseDiagnosis(
        primary_cause="Bank downtime",
        confidence=0.99,
        is_recoverable=True,
        recommended_action=action,
        reasoning="Test."
    )
    
    return {
        "transaction": tx,
        "diagnosis": diagnosis,
        "selected_action": action,
        "recovery_status": "PENDING",
        "current_agent": "silent_recovery",
        "audit_trail": []
    }


@patch("src.agents.silent_recovery.razorpay_client")
def test_silent_recovery_success(mock_razorpay):
    """Test successful gateway switch."""
    mock_razorpay.switch_gateway.return_value = {"status": "success", "switched_to": "payu"}
    
    state = make_silent_recovery_state(action_type="SILENT_RETRY")
    result = silent_recovery_node(state)

    assert result["recovery_status"] == "SUCCESS"
    assert result["current_agent"] == "compliance"
    assert "Successfully switched gateway" in result["audit_trail"][0]["details"]
    mock_razorpay.switch_gateway.assert_called_once_with("tx_silent_1", "alternate_gateway")


@patch("src.agents.silent_recovery.razorpay_client")
def test_silent_recovery_failure(mock_razorpay):
    """Test when gateway switch API fails."""
    mock_razorpay.switch_gateway.return_value = {"status": "failed", "error": "Invalid target gateway"}
    
    state = make_silent_recovery_state(action_type="SILENT_RETRY")
    result = silent_recovery_node(state)

    assert result["recovery_status"] == "FAILED"
    assert "Silent retry failed" in result["audit_trail"][0]["details"]


@patch("src.agents.silent_recovery.bank_analyzer")
def test_silent_recovery_scheduled(mock_analyzer):
    """Test scheduled retry logs properly and returns success."""
    mock_analyzer.get_optimal_retry_time.return_value = "14:00"
    
    state = make_silent_recovery_state(action_type="SCHEDULED_RETRY")
    result = silent_recovery_node(state)

    assert result["recovery_status"] == "SUCCESS"
    assert "Scheduled smart retry for 14:00" in result["audit_trail"][0]["details"]
    mock_analyzer.get_optimal_retry_time.assert_called_once_with("HDFC")


def test_silent_recovery_exception():
    """Test when an exception occurs inside the agent (e.g. tool throws error)."""
    with patch("src.agents.silent_recovery.razorpay_client") as mock_razorpay:
        mock_razorpay.switch_gateway.side_effect = Exception("API Down")
        
        state = make_silent_recovery_state(action_type="SILENT_RETRY")
        result = silent_recovery_node(state)

        assert result["recovery_status"] == "FAILED"
        assert "API Down" in result["audit_trail"][0]["details"]
