import asyncio
import json
import os
from collections import defaultdict
from typing import Any

from fastapi import WebSocket
from redis.asyncio import Redis
from redis.exceptions import RedisError


class ConnectionManager:
    """Держит WebSocket-соединения по user_id и рассылает через Redis pub/sub."""

    def __init__(self) -> None:
        self._connections: dict[int, set[WebSocket]] = defaultdict(set)
        self._redis: Redis | None = None
        self._pubsub_task: asyncio.Task | None = None
        self._pubsub: Any = None

    async def start(self) -> None:
        url = os.getenv("REDIS_URL", "redis://redis:6379/0")
        try:
            self._redis = Redis.from_url(url, decode_responses=True)
            await self._redis.ping()
            self._pubsub = self._redis.pubsub()
            await self._pubsub.subscribe("ws:broadcast")
            self._pubsub_task = asyncio.create_task(self._listen())
            print("[ws] Redis pub/sub подключён")
        except (RedisError, OSError) as e:
            print(f"[ws] Redis недоступен, работаем локально: {e}")
            self._redis = None

    async def stop(self) -> None:
        if self._pubsub_task:
            self._pubsub_task.cancel()
            try:
                await self._pubsub_task
            except asyncio.CancelledError:
                pass
        if self._pubsub:
            await self._pubsub.close()
        if self._redis:
            await self._redis.close()

    async def connect(self, user_id: int, ws: WebSocket) -> None:
        await ws.accept()
        self._connections[user_id].add(ws)

    def disconnect(self, user_id: int, ws: WebSocket) -> None:
        if user_id in self._connections:
            self._connections[user_id].discard(ws)
            if not self._connections[user_id]:
                del self._connections[user_id]

    # 👇 Новый метод
    def is_online(self, user_id: int) -> bool:
        """Онлайн = есть активное WebSocket-соединение в этом инстансе."""
        return bool(self._connections.get(user_id))

    async def send_to_user(self, user_id: int, payload: dict) -> None:
        message = json.dumps(payload, ensure_ascii=False, default=str)
        for ws in list(self._connections.get(user_id, [])):
            try:
                await ws.send_text(message)
            except Exception:
                self.disconnect(user_id, ws)

    async def broadcast(self, user_ids: list[int], payload: dict) -> None:
        """Разослать событие списку юзеров. Через Redis — всем инстансам бэкенда."""
        message = json.dumps(
            {"user_ids": user_ids, "payload": payload},
            ensure_ascii=False,
            default=str,
        )
        if self._redis is not None:
            try:
                await self._redis.publish("ws:broadcast", message)
                return
            except RedisError:
                pass
        for uid in user_ids:
            await self.send_to_user(uid, payload)

    async def _listen(self) -> None:
        assert self._pubsub is not None
        async for raw in self._pubsub.listen():
            if raw.get("type") != "message":
                continue
            try:
                data = json.loads(raw["data"])
                user_ids = data.get("user_ids", [])
                payload = data.get("payload", {})
                for uid in user_ids:
                    await self.send_to_user(uid, payload)
            except (ValueError, KeyError):
                continue


manager = ConnectionManager()