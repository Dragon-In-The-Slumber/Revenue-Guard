from celery import shared_task
from src.workers.recovery_tasks import run_recovery_pipeline

@shared_task(bind=True, max_retries=2)
def retry_failed_mandate(self, transaction_data: dict):
    """
    Retry a failed subscription mandate payment.
    Uses the bank analyzer to find the optimal retry time.
    """
    try:
        from src.tools.bank_analyzer import bank_analyzer
        bank = transaction_data.get("payment", {}).get("bank", "Unknown")
        optimal_time = bank_analyzer.get_optimal_retry_time(bank)
        
        print(f"[RETRY] Scheduling mandate retry for {transaction_data.get('transaction_id')} at {optimal_time}")
        
        # Re-run the full recovery pipeline
        result = run_recovery_pipeline.delay(transaction_data)
        return {
            "status": "retry_scheduled",
            "optimal_retry_time": optimal_time,
            "celery_task_id": str(result.id)
        }
    except Exception as e:
        self.retry(exc=e, countdown=120)

@shared_task(bind=True, max_retries=1)
def follow_up_outreach(self, transaction_data: dict, previous_channel: str):
    """
    Follow up on a previously sent outreach message if no response was received.
    Escalates to the next channel (WhatsApp → Email → Voice).
    """
    channel_escalation = {
        "whatsapp": "email",
        "email": "voice",
        "voice": "escalate"
    }
    
    next_channel = channel_escalation.get(previous_channel, "escalate")
    
    if next_channel == "escalate":
        print(f"[FOLLOW-UP] All channels exhausted for {transaction_data.get('transaction_id')}. Escalating to human.")
        return {"status": "escalated", "reason": "all_channels_exhausted"}
    
    print(f"[FOLLOW-UP] Escalating {transaction_data.get('transaction_id')} from {previous_channel} to {next_channel}")
    
    # Re-run recovery pipeline (it will pick up the new channel)
    result = run_recovery_pipeline.delay(transaction_data)
    return {
        "status": "follow_up_scheduled",
        "previous_channel": previous_channel,
        "next_channel": next_channel,
        "celery_task_id": str(result.id)
    }
