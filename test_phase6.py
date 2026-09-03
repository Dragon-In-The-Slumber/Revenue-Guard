import urllib.request
import json
import time

API_URL = "https://revenueguard-api-qbkp.onrender.com"

# The webhook payload for a failed payment
payload = {
    "transaction_id": "tx_phase6_test_01",
    "customer": {
        "name": "Phase 6 Tester",
        "email": "test@phase6.com",
        "phone": "+919876543210",
        "type": "B2C"
    },
    "payment": {
        "amount": 75000, # 75,000 is over the 50,000 limit in the Compliance policy!
        "currency": "INR",
        "method": "UPI",
        "bank": "HDFC",
        "timestamp": "2026-09-03T10:00:00Z",
        "status": "failed",
        "error_code": "INSUFFICIENT_FUNDS"
    },
    "merchant": {
        "id": "mer_test",
        "name": "Test Merchant"
    }
}

print("1. Triggering Webhook on Render API...")
req = urllib.request.Request(
    f"{API_URL}/webhooks/razorpay/payment.failed", 
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

try:
    with urllib.request.urlopen(req) as response:
        print(f"Webhook Response Status: {response.status}")
        data = json.loads(response.read().decode())
        print(f"Webhook Response Body: {json.dumps(data, indent=2)}")
except Exception as e:
    print(f"Webhook failed: {e}")

print("\n2. Waiting 10 seconds for AI Agents to process the graph...")
time.sleep(10)

print("\n3. Fetching the Audit Trail from PostgreSQL to verify Agent decisions...")
req_audit = urllib.request.Request(f"{API_URL}/api/audit/tx_phase6_test_01")
try:
    with urllib.request.urlopen(req_audit) as response:
        audit_data = json.loads(response.read().decode())
        print("\n=== AI AGENT AUDIT LOGS ===")
        for log in audit_data.get("audit_trail", []):
            print(f"\n[{log['timestamp']}] Agent: {log['agent']}")
            print(f"Action: {log['action']}")
            print(f"Details: {log['details']}")
except Exception as e:
    print(f"Failed to fetch audit: {e}")
