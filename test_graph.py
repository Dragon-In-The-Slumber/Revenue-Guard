import asyncio
from src.graph.builder import graph
from src.models.transaction import Transaction

async def test():
    tx_data = {
        "transaction_id": "pay_test_001",
        "customer": {"id": "cust_001", "name": "Abhinav", "email": "test@example.com", "phone": "9876543210", "type": "STANDARD"},
        "payment": {
            "amount": 250000,
            "currency": "INR",
            "method": "upi",
            "bank": "PhonePe",
            "error_code": "BAD_REQUEST_ERROR",
            "error_reason": "INSUFFICIENT_FUNDS"
        },
        "merchant": {"id": "merch_001", "name": "Test Merchant", "category": "retail"}
    }
    
    initial_state = {
        "transaction": Transaction(**tx_data),
        "messages": [],
        "current_agent": "orchestrator",
        "diagnosis": None,
        "selected_action": None,
        "contact_attempts": 0,
        "max_attempts_reached": False,
        "requires_human_approval": False,
        "is_approved": False,
        "recovery_status": "PENDING",
        "audit_trail": []
    }
    
    print("Executing graph...")
    # Invoke the graph synchronously
    result = graph.invoke(initial_state)
    
    print("\n--- FINAL AUDIT TRAIL ---")
    for entry in result.get("audit_trail", []):
        print(f"[{entry['agent']}] {entry['action']}")
        print(f"Details: {entry['details']}")
        print("-" * 30)

if __name__ == "__main__":
    asyncio.run(test())
