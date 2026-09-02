from celery.schedules import crontab

# Celery Beat periodic task schedule
# These tasks run on a recurring basis for proactive recovery
beat_schedule = {
    # Every 15 minutes: Check for stalled recovery pipelines and retry them
    "retry-stalled-recoveries": {
        "task": "src.workers.retry_tasks.retry_failed_mandate",
        "schedule": crontab(minute="*/15"),
        "args": [],
        "options": {"queue": "retry_queue"}
    },
    # Every hour: Follow up on sent outreach messages with no response
    "follow-up-outreach": {
        "task": "src.workers.retry_tasks.follow_up_outreach",
        "schedule": crontab(minute=0),
        "args": [],
        "options": {"queue": "outreach_queue"}
    },
}
