import json
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, workspace_id: str, ws: WebSocket):
        await ws.accept()
        self._connections.setdefault(workspace_id, []).append(ws)

    def disconnect(self, workspace_id: str, ws: WebSocket):
        self._connections.get(workspace_id, []).remove(ws)

    async def broadcast(self, workspace_id: str, payload: dict):
        for ws in self._connections.get(workspace_id, []):
            try:
                await ws.send_text(json.dumps(payload, default=str))
            except Exception:
                self.disconnect(workspace_id, ws)


manager = ConnectionManager()
