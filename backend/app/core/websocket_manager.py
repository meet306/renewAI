import json
import asyncio
from typing import List, Dict, Any
from fastapi import WebSocket

class WebSocketManager:
    """Manages active WebSocket connections for live telemetry broadcasts."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        json_data = json.dumps(message)
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json_data)
            except Exception:
                self.disconnect(connection)

websocket_manager = WebSocketManager()
