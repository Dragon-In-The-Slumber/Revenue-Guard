"""
Locust Load Test for RevenueGuard API
Simulates high-volume webhook delivery.

Usage:
  pip install locust
  locust -f tests/load_test.py --host=http://localhost:8000
  # Then open http://localhost:8089 in your browser
"""
import json
import random
from locust import HttpUser, task, between

BANKS = ["HDFC", "ICICI", "SBI", "Axis", "Kotak"]
METHODS = ["UPI", "Credit Card", "Debit Card", "Netbanking"]
ERROR_CODES = [
    "UPI_APP_TIMEOUT", "ISSUING_BANK_DOWNTIME", "INSUFFICIENT_FUNDS",
    "RISK_DECLINE", "EXPIRED_CARD", "AUTHENTICATION_FAILED", "VPA_INVALID"
]


class RevenueGuardUser(HttpUser):
    """Simulates a Razorpay webhook sender delivering payment.failed events."""
    wait_time = between(0.1, 0.5)

    @task(weight=10)
    def send_single_webhook(self):
        """Simulate a single payment.failed webhook."""
        payload = {
            "transaction_id": f"tx_load_{random.randint(100000, 999999)}",
            "customer": {
                "name": f"Load Test User {random.randint(1, 1000)}",
                "email": f"user{random.randint(1,1000)}@test.com",
                "phone": f"+9198{random.randint(10000000, 99999999)}",
                "type": random.choice(["B2B", "B2C"])
            },
            "payment": {
                "amount": round(random.uniform(500, 100000), 2),
                "currency": "INR",
                "method": random.choice(METHODS),
                "bank": random.choice(BANKS),
                "timestamp": "2026-09-01T10:00:00Z",
                "status": "failed",
                "error_code": random.choice(ERROR_CODES)
            },
            "merchant": {
                "id": f"mer_{random.randint(1, 100)}",
                "name": f"Merchant {random.randint(1, 100)}"
            }
        }
        self.client.post(
            "/webhooks/razorpay/payment.failed",
            json=payload,
            headers={"Content-Type": "application/json"}
        )

    @task(weight=2)
    def send_batch(self):
        """Simulate a batch of 10 failed transactions."""
        batch = []
        for _ in range(10):
            batch.append({
                "transaction_id": f"tx_batch_{random.randint(100000, 999999)}",
                "customer": {
                    "name": f"Batch User {random.randint(1, 500)}",
                    "email": f"batch{random.randint(1,500)}@test.com",
                    "phone": f"+9199{random.randint(10000000, 99999999)}",
                    "type": "B2C"
                },
                "payment": {
                    "amount": round(random.uniform(500, 50000), 2),
                    "currency": "INR",
                    "method": random.choice(METHODS),
                    "bank": random.choice(BANKS),
                    "timestamp": "2026-09-01T10:00:00Z",
                    "status": "failed",
                    "error_code": random.choice(ERROR_CODES)
                },
                "merchant": {"id": "mer_batch", "name": "Batch Merchant"}
            })
        self.client.post(
            "/api/batch",
            json={"transactions": batch},
            headers={"Content-Type": "application/json"}
        )

    @task(weight=5)
    def health_check(self):
        """Check the API health endpoint."""
        self.client.get("/health")
