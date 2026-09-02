from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from src.config import settings
from src.workers.recovery_tasks import execute_graph_async
from src.models.transaction import Transaction
from src.persistence.audit_store import audit_store
from src.persistence.database import db
import uuid
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    await audit_store.initialize()
    yield
    await db.disconnect()

app = FastAPI(
    title="RevenueGuard API",
    description="Scalable API for AI Revenue Recovery",
    version="0.1.0",
    lifespan=lifespan
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
async def handle_payment_failed(payload: Dict[str, Any], background_tasks: BackgroundTasks):
    """
    Ingest a single payment failure webhook from Razorpay.
    """
    try:
        # Check if it's our synthetic simulator payload
        if "customer" in payload and "payment" in payload:
            transaction = Transaction(**payload)
        else:
            # Parse real Razorpay Webhook
            payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            if not payment_entity:
                raise ValueError("Invalid Razorpay payload structure")
                
            tx_id = payment_entity.get("id", f"pay_{uuid.uuid4().hex[:8]}")
            
            # Amount in Razorpay is in paise, convert to INR
            amount_in_rupees = payment_entity.get("amount", 0) / 100
            
            customer_data = {
                "name": payment_entity.get("email", "Unknown").split("@")[0] if payment_entity.get("email") else "Unknown",
                "email": payment_entity.get("email", "unknown@example.com"),
                "phone": payment_entity.get("contact", ""),
                "type": "B2C"
            }
            
            payment_data = {
                "amount": amount_in_rupees,
                "currency": payment_entity.get("currency", "INR"),
                "method": payment_entity.get("method", "card"),
                "bank": payment_entity.get("bank", "Unknown Bank") or "Unknown Bank",
                "timestamp": datetime.now().isoformat(),
                "status": payment_entity.get("status", "failed"),
                "error_code": payment_entity.get("error_code", "UNKNOWN_ERROR")
            }
            
            merchant_data = {
                "id": payload.get("account_id", "mer_unknown"),
                "name": "Razorpay Merchant"
            }
            
            transaction = Transaction(
                transaction_id=tx_id,
                customer=customer_data,
                payment=payment_data,
                merchant=merchant_data
            )
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse webhook payload: {str(e)}")

    # Run natively in background tasks (Microservice pattern without celery overhead)
    background_tasks.add_task(execute_graph_async, transaction.model_dump())
    task_id = f"sync-{uuid.uuid4().hex[:8]}"
    
    return {"status": "accepted", "task_id": task_id, "transaction_id": transaction.transaction_id}

@app.post("/api/batch")
async def process_batch(request: BatchRequest, background_tasks: BackgroundTasks):
    """
    Process a batch of failed transactions (e.g., from CSV upload or Tally sync).
    """
    task_ids = []
    for tx in request.transactions:
        background_tasks.add_task(execute_graph_async, tx.model_dump())
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
            
        reasoning = None
        if "Reasoning:" in r["details"]:
            parts = r["details"].split("Reasoning:", 1)
            reasoning = parts[1].strip()
            
        events.append({
            "agent": r["agent"],
            "details": r["details"].split("\n")[0] if "\n" in r["details"] else r["details"],
            "reasoning": reasoning,
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
            
        reasoning = None
        confidence = None
        recommended_action = None
        
        details = r["details"]
        
        # Simple parser to extract structured agent outputs from details string
        if "Reasoning:" in details:
            parts = details.split("Reasoning:", 1)
            reasoning = parts[1].strip()
            details = parts[0].strip()
            
        if "Recommended Action:" in details:
            parts = details.split("Recommended Action:", 1)
            recommended_action = parts[1].split("|")[0].strip() if "|" in parts[1] else parts[1].strip()
            
        formatted_trail.append({
            "agent": r["agent"],
            "action": r["action"],
            "details": details,
            "reasoning": reasoning,
            "confidence": confidence,
            "recommended_action": recommended_action,
            "time": r["timestamp"].strftime("%H:%M:%S"),
            "dotColor": dot
        })
        
    return {"trail": formatted_trail}
