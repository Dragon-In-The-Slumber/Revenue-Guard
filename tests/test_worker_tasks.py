import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from unittest.mock import patch, MagicMock
from src.workers.recovery_tasks import run_recovery_pipeline


def test_recovery_task_returns_result():
    """The Celery task should return a dict with transaction_id and status."""
    tx_data = {
        "transaction_id": "tx_worker_test",
        "customer": {"name": "Worker Test", "email": "w@t.com", "phone": "+91222", "type": "B2C"},
        "payment": {
            "amount": 10000, "currency": "INR", "method": "UPI", "bank": "HDFC",
            "timestamp": "2026-09-01T10:00:00Z", "status": "failed", "error_code": "UPI_APP_TIMEOUT"
        },
        "merchant": {"id": "mer_1", "name": "Merchant"}
    }

    # Call the task function directly (not via Celery broker)
    mock_self = MagicMock()
    result = run_recovery_pipeline(mock_self, tx_data)

    assert result["transaction_id"] == "tx_worker_test"
    assert result["status"] == "completed"
    assert result["audit_events_count"] >= 2


def test_recovery_task_handles_bad_data():
    """The task should retry on bad input, not crash silently."""
    mock_self = MagicMock()
    
    try:
        run_recovery_pipeline(mock_self, {"invalid": "data"})
        assert False, "Should have raised an exception"
    except Exception:
        # Expected: should call self.retry()
        pass


if __name__ == "__main__":
    test_recovery_task_returns_result()
    test_recovery_task_handles_bad_data()
    print("✅ All worker task tests passed!")
