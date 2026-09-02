from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from src.config import settings

class Checkpointer:
    def __init__(self):
        self.saver = None

    async def initialize(self):
        if not self.saver:
            self.saver = AsyncPostgresSaver.from_conn_string(settings.database_url)
            await self.saver.setup()
            
checkpointer = Checkpointer()
