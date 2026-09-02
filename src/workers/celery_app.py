from celery import Celery
from src.config import settings

celery_app = Celery(
    "revenue_guard",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["src.workers.recovery_tasks", "src.workers.outreach_tasks", "src.workers.retry_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,
    worker_prefetch_multiplier=1,
)

if __name__ == "__main__":
    celery_app.start()
