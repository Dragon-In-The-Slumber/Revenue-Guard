from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from src.config import settings
from src.workers.recovery_tasks import run_recovery_pipeline, execute_graph_sync
from src.models.transaction import Transaction
from src.persistence.audit_store import audit_store
import uuid
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="RevenueGuard API",
    description="Scalable API for AI Revenue Recovery",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, this should be restricted
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

@app.get("/api/metrics")
async def get_metrics():
    """Aggregated metrics for the dashboard."""
    recent = await audit_store.get_recent(limit=1000)
    
    total_recovered = 0
    silent_recoveries = 0
    outreach_conversions = 0
    escalated = 0

    for r in recent:
        if r["action"] == "Gateway Switch Attempted":
            silent_recoveries += 1
            total_recovered += 14500 # rough average placeholder
        elif r["action"] == "WhatsApp Message Sent":
            outreach_conversions += 1
        elif r["action"] == "Escalated to Human":
            escalated += 1
            
    return {
        "metrics": [
            {
                "label": "Total Recovered",
                "value": f"₹{total_recovered:,}",
                "change": "Live",
                "changeColor": "text-emerald-400",
                "subtitle": "based on recent activity"
            },
            {
                "label": "Silent Recoveries",
                "value": str(silent_recoveries),
                "change": "",
                "changeColor": "text-gold",
                "subtitle": "resolved by agent"
            },
            {
                "label": "Outreach Interventions",
                "value": str(outreach_conversions),
                "change": "",
                "changeColor": "text-gold",
                "subtitle": "initiated via WhatsApp"
            },
            {
                "label": "Escalated",
                "value": str(escalated),
                "change": "",
                "changeColor": "text-red-400",
                "subtitle": "requires human review"
            }
        ]
    }

@app.get("/api/pipeline")
async def get_pipeline():
    """Returns transactions currently in the pipeline."""
    recent = await audit_store.get_recent(limit=50)
    
    pipeline = []
    seen_tx = set()
    
    for r in recent:
        tx_id = r["transaction_id"]
        if tx_id in seen_tx:
            continue
        seen_tx.add(tx_id)
        
        statusColor = "text-emerald-400"
        dotColor = "bg-emerald-500"
        borderColor = "border-l-emerald-500"
        
        if "Escalated" in r["action"]:
            statusColor = "text-red-400"
            dotColor = "bg-red-500"
            borderColor = "border-l-red-500"
        elif "Outreach" in r["agent"] or "WhatsApp" in r["action"]:
            statusColor = "text-gold"
            dotColor = "bg-[#D9A353]"
            borderColor = "border-l-[#D9A353]"
            
        pipeline.append({
            "id": tx_id,
            "agent": r["agent"],
            "amount": "₹...", # Not tracked in audit_trail directly yet
            "status": r["action"],
            "statusColor": statusColor,
            "dotColor": dotColor,
            "borderColor": borderColor,
        })
        
        if len(pipeline) >= 10:
            break
            
    return {"pipeline": pipeline}

@app.get("/api/events")
async def get_events():
    """Returns the live event stream."""
    recent = await audit_store.get_recent(limit=20)
    
    events = []
    for r in recent:
        dot = "bg-emerald-500"
        if "Escalated" in r["action"]:
            dot = "bg-red-500"
        elif "Diagnosed" in r["action"]:
            dot = "bg-cyan-500"
        elif "Approved" in r["action"]:
            dot = "bg-[#F0E7D6]"
            
        events.append({
            "agent": r["agent"],
            "details": r["details"],
            "time": r["timestamp"].strftime("%H:%M:%S"),
            "dot": dot
        })
        
    return {"events": events}

@app.get("/api/audit/{transaction_id}")
async def get_audit_trail(transaction_id: str):
    """Returns the audit trail for a specific transaction."""
    trail = await audit_store.get_trail(transaction_id)
    
    formatted_trail = []
    for r in trail:
        dot = "bg-emerald-500"
        if "Escalated" in r["action"]:
            dot = "bg-red-500"
        elif "Diagnosed" in r["action"]:
            dot = "bg-cyan-500"
        elif "Approved" in r["action"]:
            dot = "bg-[#F0E7D6]"
            
        formatted_trail.append({
            "agent": r["agent"],
            "action": r["action"],
            "details": r["details"],
            "time": r["timestamp"].strftime("%H:%M:%S"),
            "dotColor": dot
        })
        
    return {"trail": formatted_trail}
