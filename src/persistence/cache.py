import redis.asyncio as redis
from src.config import settings

class Cache:
    def __init__(self):
        self.redis_client = None

    async def connect(self):
        if not self.redis_client:
            self.redis_client = redis.from_url(settings.redis_url, decode_responses=True)

    async def disconnect(self):
        if self.redis_client:
            await self.redis_client.aclose()

    async def get(self, key: str):
        return await self.redis_client.get(key)

    async def set(self, key: str, value: str, expire: int = None):
        await self.redis_client.set(key, value, ex=expire)
        
    async def publish(self, channel: str, message: str):
        await self.redis_client.publish(channel, message)

cache = Cache()
