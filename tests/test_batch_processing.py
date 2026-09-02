import sys
import os
import json
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.data.generator import generate_batch
from src.agents.orchestrator import orchestrator_node
from src.agents.diagnostician import diagnostician_node
from src.agents.silent_recovery import silent_recovery_node
from src.agents.outreach import outreach_node
from src.agents.compliance import compliance_node
from src.models.transaction import Transaction


def run_pipeline(transaction: Transaction) -> dict:
    """Run the full agent pipeline synchronously for a single transaction."""
    state = {
        "transaction": transaction,
        "messages": [],
        "current_agent": "orchestrator",
        "contact_attempts": 0,
        "max_attempts_reached": False,
        "requires_human_approval": False,
        "is_approved": False,
        "recovery_status": "PENDING",
        "audit_trail": []
    }

    # Step 1: Orchestrator
    result = orchestrator_node(state)
    state.update(result)
    state["audit_trail"] = state.get("audit_trail", [])

    # Step 2: Diagnostician
    result = diagnostician_node(state)
    state.update(result)

    # Step 3: Route to Silent Recovery or Outreach
    if state["current_agent"] == "silent_recovery":
        result = silent_recovery_node(state)
        state.update(result)
    elif state["current_agent"] == "outreach":
        result = outreach_node(state)
        state.update(result)

    # Step 4: Compliance
    result = compliance_node(state)
    state.update(result)

    return state


def test_batch_processing():
    """Process a batch of 100 synthetic transactions and verify metrics."""
    # Generate batch without writing to file
    batch = generate_batch(100)
    assert len(batch) == 100

    results = {"SUCCESS": 0, "PENDING": 0, "ESCALATED": 0, "PENDING_APPROVAL": 0, "FAILED": 0}
    total_recovered = 0.0
    silent_count = 0
    outreach_count = 0

    for tx_data in batch:
        tx = Transaction(**tx_data)
        final_state = run_pipeline(tx)

        status = final_state.get("recovery_status", "PENDING")
        results[status] = results.get(status, 0) + 1

        if status == "SUCCESS":
            total_recovered += tx.payment.amount
            silent_count += 1

        # Count outreach attempts
        for entry in final_state.get("audit_trail", []):
            if entry.get("agent") == "Outreach":
                outreach_count += 1

        # Verify every transaction has an audit trail
        assert len(final_state.get("audit_trail", [])) >= 2, \
            f"Transaction {tx.transaction_id} has insufficient audit trail"

    print(f"\n{'='*60}")
    print(f"BATCH PROCESSING RESULTS (100 transactions)")
    print(f"{'='*60}")
    print(f"  Silent Recoveries:    {silent_count}")
    print(f"  Outreach Attempts:    {outreach_count}")
    print(f"  Escalated:            {results.get('ESCALATED', 0)}")
    print(f"  Pending Approval:     {results.get('PENDING_APPROVAL', 0)}")
    print(f"  Total Recovered:      ₹{total_recovered:,.2f}")
    print(f"{'='*60}")

    # At least some should be recovered
    assert silent_count > 0, "No silent recoveries — something is wrong"
    assert total_recovered > 0, "No revenue recovered"

    print("✅ Batch processing test passed!")


if __name__ == "__main__":
    test_batch_processing()
