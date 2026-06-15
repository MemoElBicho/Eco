from celery import Celery

from app.config import settings

celery_app = Celery("eco", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.update(task_track_started=True, task_serializer="json")
celery_app.conf.update(imports=["app.tasks.ai_tasks", "app.tasks.hubspot_tasks"])

# Las tareas se descubren via imports=["app.tasks.ai_tasks"] abajo
