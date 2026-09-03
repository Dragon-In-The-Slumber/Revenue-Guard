from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field

class RecoveryAction(BaseModel):
    action_type: Literal["SILENT_RETRY", "OPTIMIZER_RETRY", "KONNECT_OUTREACH", "WHATSAPP_MESSAGE", "EMAIL", "VOICE_CALL", "SCHEDULED_RETRY", "ESCALATE_TO_HUMAN"]
    channel: Optional[str] = None
    message_content: Optional[str] = None
    target_time: Optional[str] = None
    requires_approval: bool = False
    
class RootCauseDiagnosis(BaseModel):
    primary_cause: str = Field(description="The primary root cause of the payment failure")
    confidence: float = Field(description="Confidence score between 0 and 1")
    is_recoverable: bool = Field(description="Whether the transaction can be recovered")
    recommended_action: Optional[RecoveryAction] = None
    reasoning: str = Field(description="Detailed explanation of the diagnosis")

class AuditEntry(BaseModel):
    agent: str
    action: str
    details: str
    timestamp: str
