from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from src.config import settings
from src.workers.recovery_tasks import run_recovery_pipeline
from src.models.transaction import Transaction

app = FastAPI(
    title="RevenueGuard API",
    description="Scalable API for AI Revenue Recovery",
    version="0.1.0"
)

class BatchRequest(BaseModel):
    transactions: List[Transaction]

@app.post("/webhooks/razorpay/payment.failed")
async def handle_payment_failed(transaction: Transaction):
    """
    Ingest a single payment failure webhook from Razorpay.
    """
    # Dispatch to Celery worker asynchronously
    task = run_recovery_pipeline.delay(transaction.model_dump())
    
    return {"status": "accepted", "task_id": str(task.id), "transaction_id": transaction.transaction_id}

@app.post("/api/batch")
async def process_batch(request: BatchRequest):
    """
    Process a batch of failed transactions (e.g., from CSV upload or Tally sync).
    """
    task_ids = []
    for tx in request.transactions:
        # Fan out processing across Celery workers
        task = run_recovery_pipeline.delay(tx.model_dump())
        task_ids.append(str(task.id))
        
    return {
        "status": "accepted",
        "processed_count": len(request.transactions),
        "task_ids": task_ids
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
