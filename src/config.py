from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    anthropic_api_key: str = ""
    langchain_api_key: str = ""
    langchain_tracing_v2: bool = True
    langchain_project: str = "revenue-guard"
    
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5433/revenueguard"
    redis_url: str = "redis://localhost:6380/0"
    
    use_celery: bool = False
    celery_broker_url: str = "amqp://guest:guest@localhost:5672//"
    celery_result_backend: str = "redis://localhost:6380/1"
    
    pinecone_api_key: str = ""
    pinecone_env: str = ""
    
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_whatsapp_number: str = "+14155238886"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
