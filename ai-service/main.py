import asyncio
from fastapi import FastAPI
from prometheus_client import make_asgi_app

from app.api.routes import router as api_router
from app.ml import engine as ml_engine
from app.services.kafka_consumer import consume_kafka_messages, consume_resume_events

app = FastAPI(title="TalentStream AI Engine")

# Mount Metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Mount Routes
app.include_router(api_router)

@app.on_event("startup")
async def startup_event():
    # 1. Boot up the AI Brain
    ml_engine.load_skills_from_backend()
    ml_engine.train_feedback_model()
    
    # 2. Start the Kafka Background Tasks
    asyncio.create_task(consume_kafka_messages())
    asyncio.create_task(consume_resume_events())