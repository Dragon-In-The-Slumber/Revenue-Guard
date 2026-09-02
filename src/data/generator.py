import json
import random
from datetime import datetime, timedelta
from faker import Faker

fake = Faker('en_IN')

# Indian banks commonly used for synthetic data
BANKS = ["HDFC", "ICICI", "SBI", "Axis", "Kotak"]
PAYMENT_METHODS = ["UPI", "Credit Card", "Debit Card", "Netbanking", "Wallet"]
FAILURE_REASONS = {
    "UPI": ["UPI_APP_TIMEOUT", "ISSUING_BANK_DOWNTIME", "INSUFFICIENT_FUNDS", "VPA_INVALID"],
    "Credit Card": ["RISK_DECLINE", "INSUFFICIENT_FUNDS", "EXPIRED_CARD", "AUTHENTICATION_FAILED"],
    "Debit Card": ["INSUFFICIENT_FUNDS", "ISSUING_BANK_DOWNTIME", "LIMIT_EXCEEDED"],
    "Netbanking": ["BANK_UNAVAILABLE", "USER_ABORTED"],
    "Wallet": ["BALANCE_INSUFFICIENT", "ACCOUNT_LOCKED"]
}

def generate_transaction(tx_id: str):
    method = random.choice(PAYMENT_METHODS)
    bank = random.choice(BANKS)
    reason = random.choice(FAILURE_REASONS[method])
    
    amount = round(random.uniform(500, 50000), 2)
    is_b2b = amount > 10000
    
    return {
        "transaction_id": tx_id,
        "customer": {
            "name": fake.name(),
            "email": fake.email(),
            "phone": fake.phone_number(),
            "type": "B2B" if is_b2b else "B2C"
        },
        "payment": {
            "amount": amount,
            "currency": "INR",
            "method": method,
            "bank": bank,
            "timestamp": (datetime.now() - timedelta(minutes=random.randint(1, 1440))).isoformat(),
            "status": "failed",
            "error_code": reason
        },
        "merchant": {
            "id": f"mer_{fake.bban()}",
            "name": fake.company()
        }
    }

def generate_batch(num_records: int = 100, output_path: str = None):
    transactions = [generate_transaction(f"tx_{fake.uuid4()}") for _ in range(num_records)]
    if output_path:
        with open(output_path, 'w') as f:
            json.dump(transactions, f, indent=2)
    return transactions

if __name__ == "__main__":
    import os
    output_dir = os.path.join(os.path.dirname(__file__))
    generate_batch(100, os.path.join(output_dir, "sample_batch.json"))
