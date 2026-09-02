import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.agents.compliance import compliance_node
from src.models.transaction import Transaction, Customer, PaymentDetails, MerchantDetails


def make_compliance_state(attempts: int = 0, amount: float = 5000, requires_approval: bool = False):
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
        "max_attempts_reached": False,
        "requires_human_approval": requires_approval,
        "is_approved": False,
        "recovery_status": "PENDING",
        "audit_trail": []
    }


def test_approves_normal_transaction():
    """Normal low-value, low-attempt transaction should be approved."""
    state = make_compliance_state(attempts=1, amount=5000)
    result = compliance_node(state)

    assert result["is_approved"] is True
    assert result["current_agent"] == "end"


def test_escalates_after_max_attempts():
    """After 3 contact attempts, must escalate to human — NOT continue outreach."""
    state = make_compliance_state(attempts=3)
    result = compliance_node(state)

    assert result["is_approved"] is False
    assert result["recovery_status"] == "ESCALATED"
    assert "Max contact attempts" in result["audit_trail"][0]["details"]


def test_blocks_high_value_without_approval():
    """Transactions over ₹50,000 requiring human approval must be blocked."""
    state = make_compliance_state(amount=75000, requires_approval=True)
    result = compliance_node(state)

    assert result["is_approved"] is False
    assert result["recovery_status"] == "PENDING_APPROVAL"


def test_allows_high_value_without_flag():
    """High value transaction WITHOUT the requires_human_approval flag should pass."""
    state = make_compliance_state(amount=75000, requires_approval=False)
    result = compliance_node(state)

    assert result["is_approved"] is True


def test_audit_trail_always_populated():
    """Every compliance check must produce an audit entry."""
    state = make_compliance_state()
    result = compliance_node(state)

    assert len(result["audit_trail"]) == 1
    assert result["audit_trail"][0]["agent"] == "Compliance"


if __name__ == "__main__":
    test_approves_normal_transaction()
    test_escalates_after_max_attempts()
    test_blocks_high_value_without_approval()
    test_allows_high_value_without_flag()
    test_audit_trail_always_populated()
    print("✅ All compliance tests passed!")
