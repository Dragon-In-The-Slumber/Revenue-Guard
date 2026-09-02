import sys
import os
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


def test_handles_unknown_error_code():
    """An unrecognized error code should not crash the system."""
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


def test_silent_recovery_without_diagnosis():
    """Silent recovery with no diagnosis should not crash."""
    state = make_state()
    state["diagnosis"] = None
    state["current_agent"] = "silent_recovery"
    
    result = silent_recovery_node(state)
    
    assert result["recovery_status"] in ("PENDING", "SUCCESS")
    assert len(result["audit_trail"]) == 1


def test_pipeline_always_produces_audit():
    """Every agent execution must produce at least one audit entry."""
    state = make_state()
    
    r1 = orchestrator_node(state)
    assert len(r1["audit_trail"]) >= 1
    
    state.update(r1)
    r2 = diagnostician_node(state)
    assert len(r2["audit_trail"]) >= 1


if __name__ == "__main__":
    test_handles_unknown_error_code()
    test_handles_unknown_status()
    test_silent_recovery_without_diagnosis()
    test_pipeline_always_produces_audit()
    print("✅ All graceful failure tests passed!")
