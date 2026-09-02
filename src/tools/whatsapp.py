class TwilioMockClient:
    def send_whatsapp(self, to: str, message: str):
        print(f"[TWILIO WHATSAPP] Sending to {to}: {message}")
        return {"status": "queued", "channel": "whatsapp"}
        
    def send_sms(self, to: str, message: str):
        print(f"[TWILIO SMS] Sending to {to}: {message}")
        return {"status": "queued", "channel": "sms"}

twilio_client = TwilioMockClient()
