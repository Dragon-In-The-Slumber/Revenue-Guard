from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from src.config import settings
from src.workers.recovery_tasks import run_recovery_pipeline, execute_graph_sync
from src.models.transaction import Transaction
import uuid

app = FastAPI(
    title="RevenueGuard API",
    description="Scalable API for AI Revenue Recovery",
    version="0.1.0"
)

class BatchRequest(BaseModel):
    transactions: List[Transaction]

@app.post("/webhooks/razorpay/payment.failed")
async def handle_payment_failed(transaction: Transaction, background_tasks: BackgroundTasks):
    """
    Ingest a single payment failure webhook from Razorpay.
    """
    if settings.use_celery:
        # Option 1: Dispatch to Celery worker asynchronously
        task = run_recovery_pipeline.delay(transaction.model_dump())
        task_id = str(task.id)
    else:
        # Option 2: Run natively in background tasks (Free Tier fallback)
        background_tasks.add_task(execute_graph_sync, transaction.model_dump())
        task_id = f"sync-{uuid.uuid4().hex[:8]}"
    
    return {"status": "accepted", "task_id": task_id, "transaction_id": transaction.transaction_id}

@app.post("/api/batch")
async def process_batch(request: BatchRequest, background_tasks: BackgroundTasks):
    """
    Process a batch of failed transactions (e.g., from CSV upload or Tally sync).
    """
    task_ids = []
    for tx in request.transactions:
        if settings.use_celery:
            task = run_recovery_pipeline.delay(tx.model_dump())
            task_ids.append(str(task.id))
        else:
            background_tasks.add_task(execute_graph_sync, tx.model_dump())
            task_ids.append(f"sync-{uuid.uuid4().hex[:8]}")
        
    return {
        "status": "accepted",
        "processed_count": len(request.transactions),
        "task_ids": task_ids
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
