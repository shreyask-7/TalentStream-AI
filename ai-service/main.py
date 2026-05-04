import asyncio
from fastapi import FastAPI
from prometheus_client import make_asgi_app

from app.api.routes import router as api_router
from app.ml import engine as ml_engine
from app.services.kafka_consumer import consume_kafka_messages, consume_resume_events

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.zipkin.json import ZipkinExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from app.core.config import ZIPKIN_ENDPOINT

app = FastAPI(title="TalentStream AI Engine")

resource = Resource.create({"service.name": "python-ai-service"})
trace.set_tracer_provider(TracerProvider(resource=resource))

zipkin_exporter = ZipkinExporter(endpoint=ZIPKIN_ENDPOINT)
trace.get_tracer_provider().add_span_processor(BatchSpanProcessor(zipkin_exporter))

FastAPIInstrumentor.instrument_app(app)
RequestsInstrumentor().instrument()

metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

app.include_router(api_router)

@app.on_event("startup")
async def startup_event():
    ml_engine.load_skills_from_backend()
    ml_engine.train_feedback_model()
    
    asyncio.create_task(consume_kafka_messages())
    asyncio.create_task(consume_resume_events())