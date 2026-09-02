import requests
import time
import sys
import os

# Ensure src.data.generator is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from src.data.generator import generate_transaction
import uuid

API_URL = "https://revenueguard-api-qbkp.onrender.com"

print(f"📡 Simulating traffic to {API_URL}...")

# Generate 5 fake transactions
for i in range(5):
    tx_id = f"tx_{uuid.uuid4().hex[:8]}"
    tx_data = generate_transaction(tx_id)
    
    print(f"\n📤 Sending Webhook for {tx_id} ({tx_data['payment']['error_code']} - ₹{tx_data['payment']['amount']})")
    
    try:
        response = requests.post(f"{API_URL}/webhooks/razorpay/payment.failed", json=tx_data)
        if response.status_code == 200:
            print(f"✅ Success! Task ID: {response.json().get('task_id')}")
            print(f"🧠 LangGraph Agents are now processing {tx_id} in the background...")
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"⚠️ Error connecting to API: {e}")
        
    time.sleep(2)

print("\n🎉 Done! Check your live dashboard to watch the AI agents work!")
