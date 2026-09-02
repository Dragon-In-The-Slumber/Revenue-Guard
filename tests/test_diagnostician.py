import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.agents.diagnostician import diagnostician_node
from src.models.transaction import Transaction, Customer, PaymentDetails, MerchantDetails
from src.models.diagnosis import RootCauseDiagnosis


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


def test_diagnoses_bank_downtime():
    """Bank downtime errors should route to silent recovery."""
    state = make_state("ISSUING_BANK_DOWNTIME")
    result = diagnostician_node(state)

    assert result["diagnosis"].primary_cause.startswith("Infrastructure")
    assert result["selected_action"].action_type == "SILENT_RETRY"
    assert result["current_agent"] == "silent_recovery"
    assert len(result["audit_trail"]) == 1


def test_diagnoses_upi_timeout():
    """UPI timeout should also route to silent recovery."""
    state = make_state("UPI_APP_TIMEOUT")
    result = diagnostician_node(state)

    assert result["selected_action"].action_type == "SILENT_RETRY"
    assert result["current_agent"] == "silent_recovery"


def test_diagnoses_insufficient_funds():
    """Insufficient funds requires customer action — should route to outreach."""
    state = make_state("INSUFFICIENT_FUNDS")
    result = diagnostician_node(state)

    assert result["selected_action"].action_type == "WHATSAPP_MESSAGE"
    assert result["current_agent"] == "outreach"


def test_diagnoses_risk_decline():
    """Risk decline should route to outreach via email."""
    state = make_state("RISK_DECLINE")
    result = diagnostician_node(state)

    assert result["selected_action"].action_type == "EMAIL"
    assert result["current_agent"] == "outreach"


def test_diagnosis_has_confidence():
    """Every diagnosis must have a confidence score."""
    state = make_state("EXPIRED_CARD")
    result = diagnostician_node(state)

    assert 0 <= result["diagnosis"].confidence <= 1


def test_diagnosis_always_recoverable():
    """Current mock always marks as recoverable."""
    state = make_state("VPA_INVALID")
    result = diagnostician_node(state)

    assert result["diagnosis"].is_recoverable is True


if __name__ == "__main__":
    test_diagnoses_bank_downtime()
    test_diagnoses_upi_timeout()
    test_diagnoses_insufficient_funds()
    test_diagnoses_risk_decline()
    test_diagnosis_has_confidence()
    test_diagnosis_always_recoverable()
    print("✅ All diagnostician tests passed!")
