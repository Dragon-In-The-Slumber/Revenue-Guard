import operator
from typing import TypedDict, Annotated, Sequence, List, Optional
from langchain_core.messages import BaseMessage
from src.models.transaction import Transaction
from src.models.diagnosis import RootCauseDiagnosis, RecoveryAction, AuditEntry

class RevenueGuardState(TypedDict):
    # Transaction context
    transaction: Transaction
    
    # Message history across agents
    messages: Annotated[Sequence[BaseMessage], operator.add]
    
    # Step-by-step state tracking
    current_agent: str
    diagnosis: Optional[RootCauseDiagnosis]
    selected_action: Optional[RecoveryAction]
    
    # Compliance & Execution
    contact_attempts: int
    max_attempts_reached: bool
    requires_human_approval: bool
    is_approved: bool
    
    # Final Outcome
    recovery_status: str # "PENDING", "SUCCESS", "FAILED", "ESCALATED"
    audit_trail: Annotated[List[AuditEntry], operator.add]
