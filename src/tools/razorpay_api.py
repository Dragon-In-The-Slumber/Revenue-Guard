import httpx
from src.config import settings
import logging

logger = logging.getLogger(__name__)

class RazorpayClient:
    def __init__(self):
        self.base_url = "https://api.razorpay.com/v1"
        self.auth = (settings.razorpay_key_id, settings.razorpay_key_secret)
        
    def fetch_payment(self, payment_id: str):
        if not self.auth[0] or not self.auth[1]:
            logger.warning("Razorpay credentials not set. Returning mock fetch_payment.")
            return {"id": payment_id, "status": "failed", "amount": 100000}
            
        try:
            with httpx.Client(auth=self.auth) as client:
                response = client.get(f"{self.base_url}/payments/{payment_id}")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to fetch payment {payment_id}: {e}")
            raise
            
    def create_payment_link(self, amount: float, customer: dict, reference_id: str = None):
        if not self.auth[0] or not self.auth[1]:
            logger.warning("Razorpay credentials not set. Returning mock create_payment_link.")
            return {"short_url": f"https://rzp.io/i/mock_{reference_id}"}
            
        payload = {
            "amount": int(amount * 100), # amount in paise
            "currency": "INR",
            "accept_partial": False,
            "description": "Payment Retry",
            "customer": {
                "name": customer.get("name", "Unknown"),
                "email": customer.get("email", ""),
                "contact": customer.get("phone", "")
            },
            "notify": {
                "sms": True,
                "email": True
            },
            "reminder_enable": True
        }
        
        if reference_id:
            payload["reference_id"] = reference_id
            
        try:
            with httpx.Client(auth=self.auth) as client:
                response = client.post(f"{self.base_url}/payment_links", json=payload)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to create payment link: {e}")
            raise
            
    def switch_gateway(self, payment_id: str, new_gateway: str):
        """Mock method for silent switch since it's an internal Razorpay capability, not a public API."""
        return {"status": "success", "switched_to": new_gateway}
        
razorpay_client = RazorpayClient()
