import sys

from fastapi.testclient import TestClient

from app.main import app
from app.tasks.celery_app import celery_app

client = TestClient(app)


def test_whatsapp_webhook_verify():
    response = client.get("/api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test_token&hub.challenge=123")
    assert response.status_code == 200
    print("PASS  whatsapp verify → 200")


def test_whatsapp_webhook_message():
    payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "123",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {"phone_number_id": "12345"},
                    "messages": [{
                        "from": "5511999999999",
                        "id": "wamid_test",
                        "text": {"body": "Hola, ¿qué precios manejan?"},
                    }],
                }
            }],
        }],
    }
    print("DISABLE Celery emit_task for harness validation")
    celery_app.send_task = lambda name, args=None, kwargs=None, **opts: None

    response = client.post("/api/v1/webhooks/whatsapp", json=payload)
    assert response.status_code == 200
    print("PASS  whatsapp message webhook → 200")


def test_telegram_webhook_message():
    payload = {
        "update_id": 1,
        "message": {
            "message_id": 10,
            "chat": {"id": 999, "type": "private"},
            "text": "¿Cuáles son sus horarios de atención?",
        },
    }
    response = client.post("/api/v1/webhooks/telegram", json=payload)
    assert response.status_code == 200
    print("PASS  telegram message webhook → 200")


if __name__ == "__main__":
    try:
        test_whatsapp_webhook_verify()
        test_whatsapp_webhook_message()
        test_telegram_webhook_message()
        print("\nALL WEBHOOK HARNESS TESTS PASSED")
    except AssertionError as e:
        print(f"FAIL {e}")
        sys.exit(1)
