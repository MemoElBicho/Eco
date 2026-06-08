import os
import httpx
from dotenv import load_dotenv

# Cargamos el archivo .env
load_dotenv(".env")

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
NGROK = "https://sincerity-amiable-dramatize.ngrok-free.dev"
WEBHOOK_PATH = "/api/v1/webhooks/telegram"
URL = f"{NGROK}{WEBHOOK_PATH}"

print(f"Intentando registrar la URL: {URL}")

# Petición a los servidores de Telegram
resp = httpx.post(f"https://api.telegram.org/bot{TOKEN}/setWebhook", params={"url": URL})
data = resp.json()

print("\n--- RESPUESTA DE TELEGRAM ---")
print(data)
print("-----------------------------\n")

if data.get("ok"):
    print(f"¡Éxito! Webhook configurado correctamente hacia: {URL}")
else:
    print(f"Error al configurar el webhook: {data.get('description', 'Desconocido')}")