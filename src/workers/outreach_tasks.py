from celery import shared_task
from src.tools.whatsapp import twilio_client
from src.tools.email_sender import email_client
from src.tools.voice_caller import voice_client

@shared_task(bind=True, max_retries=2)
def send_whatsapp_message(self, to: str, message: str):
    """Send a WhatsApp recovery message via Twilio (mocked)."""
    try:
        result = twilio_client.send_whatsapp(to, message)
        return {"status": "sent", "channel": "whatsapp", "to": to}
    except Exception as e:
        self.retry(exc=e, countdown=30)

@shared_task(bind=True, max_retries=2)
def send_sms_message(self, to: str, message: str):
    """Send an SMS recovery message via Twilio (mocked)."""
    try:
        result = twilio_client.send_sms(to, message)
        return {"status": "sent", "channel": "sms", "to": to}
    except Exception as e:
        self.retry(exc=e, countdown=30)

@shared_task(bind=True, max_retries=2)
def send_recovery_email(self, to: str, subject: str, body: str):
    """Send a recovery email (mocked)."""
    try:
        result = email_client.send_recovery_email(to, subject, body)
        return {"status": "sent", "channel": "email", "to": to}
    except Exception as e:
        self.retry(exc=e, countdown=30)

@shared_task(bind=True, max_retries=1)
def initiate_voice_call(self, to: str, customer_name: str, amount: float, merchant_name: str):
    """Initiate a voice recovery call (mocked)."""
    try:
        result = voice_client.recovery_call(to, customer_name, amount, merchant_name)
        return {"status": "call_initiated", "channel": "voice", "to": to}
    except Exception as e:
        self.retry(exc=e, countdown=60)
