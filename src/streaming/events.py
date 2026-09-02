from typing import Literal, Optional
from pydantic import BaseModel

class RecoveryEvent(BaseModel):
    """Schema for real-time events published via Redis Pub/Sub to the dashboard."""
    event_type: Literal[
        "recovery.started",
        "recovery.diagnosed",
        "recovery.silent_attempt",
        "recovery.silent_success",
        "recovery.silent_failed",
        "recovery.outreach_sent",
        "recovery.outreach_delivered",
        "recovery.payment_received",
        "recovery.escalated",
        "recovery.terminated",
        "recovery.compliance_approved",
        "recovery.compliance_blocked"
    ]
    transaction_id: str
    agent: str
    details: str
    amount: Optional[float] = None
    currency: str = "INR"
    timestamp: str
