class EmailMockClient:
    """Mock email sender for buildathon demo. Simulates sending recovery emails."""

    def send_recovery_email(self, to: str, subject: str, body: str) -> dict:
        print(f"[EMAIL] Sending to {to}")
        print(f"  Subject: {subject}")
        print(f"  Body: {body[:100]}...")
        return {"status": "sent", "channel": "email", "to": to}

    def send_invoice_reminder(self, to: str, invoice_id: str, amount: float) -> dict:
        subject = f"Payment Reminder: Invoice #{invoice_id}"
        body = f"Dear Customer, your invoice of ₹{amount} is overdue. Please settle at your earliest convenience."
        return self.send_recovery_email(to, subject, body)

email_client = EmailMockClient()
