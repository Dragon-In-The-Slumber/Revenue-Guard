import json
from datetime import datetime
from src.persistence.cache import cache
from src.streaming.events import RecoveryEvent

CHANNEL = "revenueguard:events"

async def publish_event(
    event_type: str,
    transaction_id: str,
    agent: str,
    details: str,
    amount: float = None
):
    """Publish a recovery event to the Redis Pub/Sub channel for live dashboard updates."""
    event = RecoveryEvent(
        event_type=event_type,
        transaction_id=transaction_id,
        agent=agent,
        details=details,
        amount=amount,
        timestamp=datetime.now().isoformat()
    )
    await cache.publish(CHANNEL, event.model_dump_json())
    return event
