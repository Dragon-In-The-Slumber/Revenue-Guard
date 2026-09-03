import httpx
import uuid
import datetime
import asyncio

async def test_webhook():
    url = "https://revenueguard-api-qbkp.onrender.com/webhooks/razorpay/payment.failed"
    
    # Real Razorpay webhook format for payment.failed
    tx_id = f"pay_{uuid.uuid4().hex[:14]}"
    
    payload = {
      "entity": "event",
      "account_id": "acc_BFQ7uEA5nqdEdf",
      "event": "payment.failed",
      "contains": [
        "payment"
      ],
      "payload": {
        "payment": {
          "entity": {
            "id": tx_id,
            "entity": "payment",
            "amount": 250000, # 2500.00 INR
            "currency": "INR",
            "status": "failed",
            "order_id": f"order_{uuid.uuid4().hex[:14]}",
            "invoice_id": None,
            "international": False,
            "method": "card",
            "amount_refunded": 0,
            "refund_status": None,
            "captured": False,
            "description": "Test Transaction",
            "card_id": f"card_{uuid.uuid4().hex[:14]}",
            "bank": "HDFC",
            "wallet": None,
            "vpa": None,
            "email": "gaurav.kumar@example.com",
            "contact": "+919876543210",
            "notes": [],
            "fee": None,
            "tax": None,
            "error_code": "BAD_REQUEST_ERROR",
            "error_description": "Payment processing failed due to error at bank or wallet gateway",
            "error_source": "bank",
            "error_step": "payment_authentication",
            "error_reason": "ISSUING_BANK_DOWNTIME",
            "created_at": int(datetime.datetime.now().timestamp())
          }
        }
      },
      "created_at": int(datetime.datetime.now().timestamp())
    }

    print(f"Sending synthetic Razorpay webhook for transaction {tx_id}...")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            print("Webhook accepted:", response.json())
            
            print("Waiting for agents to process...")
            await asyncio.sleep(5)
            
            # Fetch audit trail
            audit_url = f"https://revenueguard-api-qbkp.onrender.com/api/audit/{tx_id}"
            audit_resp = await client.get(audit_url)
            audit_resp.raise_for_status()
            
            print("\n--- Audit Trail ---")
            trail = audit_resp.json().get("trail", [])
            for event in trail:
                print(f"[{event['time']}] {event['agent']} -> {event['action']}")
                print(f"  Details: {event['details']}")
                if event.get("reasoning"):
                    print(f"  Reasoning: {event['reasoning']}")
                print("-" * 30)
                
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_webhook())
