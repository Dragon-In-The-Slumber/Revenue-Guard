class RazorpayMockClient:
    def __init__(self):
        self.base_url = "https://api.razorpay.com/v1"
        
    def fetch_payment(self, payment_id: str):
        return {"id": payment_id, "status": "failed", "amount": 100000}
        
    def switch_gateway(self, payment_id: str, new_gateway: str):
        return {"status": "success", "switched_to": new_gateway}
        
razorpay_client = RazorpayMockClient()
