import sys
import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.main import app
from src.models.transaction import Transaction, Customer, PaymentDetails, MerchantDetails

client = TestClient(app)

def make_dummy_transaction():
    return {
        "transaction_id": "tx_api_1",
        "customer": {"name": "Test", "email": "test@test.com", "phone": "+91", "type": "B2C"},
        "payment": {"amount": 5000, "currency": "INR", "method": "UPI", "bank": "HDFC", "timestamp": "2026-09-01T10:00:00Z", "status": "failed", "error_code": "TIMEOUT"},
        "merchant": {"id": "mer_1", "name": "Merchant"}
    }


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


@patch("src.main.execute_graph_async")
def test_webhook_payment_failed(mock_execute):
    """Test webhook ingestion adds task and returns 200."""
    payload = make_dummy_transaction()
    
    response = client.post("/webhooks/razorpay/payment.failed", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "accepted"
    assert "task_id" in data
    assert data["transaction_id"] == "tx_api_1"


@patch("src.main.execute_graph_async")
def test_webhook_parsing_real_razorpay_payload(mock_execute):
    """Test parsing a real Razorpay webhook payload format."""
    payload = {
        "entity": "event",
        "account_id": "acc_23894",
        "event": "payment.failed",
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test_002",
                    "amount": 500000, # 5000 INR
                    "currency": "INR",
                    "status": "failed",
                    "method": "upi",
                    "error_code": "BAD_REQUEST_ERROR",
                    "email": "test@razorpay.com",
                    "contact": "+919999999999"
                }
            }
        }
    }
    
    response = client.post("/webhooks/razorpay/payment.failed", json=payload)
    
    assert response.status_code == 200
    assert response.json()["transaction_id"] == "pay_test_002"


@patch("src.main.execute_graph_async")
def test_batch_processing(mock_execute):
    """Test batch processing endpoint."""
    payload = {
        "transactions": [
            make_dummy_transaction(),
            make_dummy_transaction()
        ]
    }
    
    response = client.post("/api/batch", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "accepted"
    assert data["processed_count"] == 2
    assert len(data["task_ids"]) == 2


# We can't easily test the GET endpoints for /api/metrics etc. cleanly in standard sync Pytest 
# because they call `await audit_store.get_recent()`. 
# To test them, we'd either need pytest-asyncio or to mock them synchronously if possible.
# We will use mock_audit_store in a way that doesn't block.

class AsyncMock(MagicMock):
    async def __call__(self, *args, **kwargs):
        return super(AsyncMock, self).__call__(*args, **kwargs)

@patch("src.main.audit_store.get_recent", new_callable=AsyncMock)
def test_api_metrics(mock_get_recent):
    # Mocking the async DB fetch
    mock_get_recent.return_value = [
        {"action": "Gateway Switch Attempted", "transaction_id": "tx1", "agent": "Silent Recovery", "details": "", "timestamp": "2026-09-01"},
        {"action": "WhatsApp Message Sent", "transaction_id": "tx2", "agent": "Outreach", "details": "", "timestamp": "2026-09-01"},
        {"action": "Escalated to Human", "transaction_id": "tx3", "agent": "Compliance", "details": "", "timestamp": "2026-09-01"}
    ]
    
    with TestClient(app) as test_client:
        response = test_client.get("/api/metrics")
        assert response.status_code == 200
        metrics = response.json()["metrics"]
        
        # Verify calculations based on mock data
        silent = next(m for m in metrics if m["label"] == "Silent Recoveries")
        assert silent["value"] == "1"
        
        outreach = next(m for m in metrics if m["label"] == "Outreach Interventions")
        assert outreach["value"] == "1"
        
        escalated = next(m for m in metrics if m["label"] == "Escalated")
        assert escalated["value"] == "1"
