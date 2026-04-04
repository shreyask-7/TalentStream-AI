import spacy
import asyncio
from fastapi import FastAPI
from pydantic import BaseModel
from aiokafka import AIOKafkaConsumer
import httpx

nlp = spacy.load("en_core_web_md")
ruler = nlp.add_pipe("entity_ruler", before="ner")
tech_patterns = [
    {"label": "TECH_SKILL", "pattern": "Databricks"},
    {"label": "TECH_SKILL", "pattern": "AWS"},
    {"label": "TECH_SKILL", "pattern": [{"LOWER": "llms"}]},
    {"label": "TECH_SKILL", "pattern": [{"LOWER": "llm"}]},
    {"label": "TECH_SKILL", "pattern": "Java"},
    {"label": "TECH_SKILL", "pattern": "Spring Boot"}
]
ruler.add_patterns(tech_patterns)

app = FastAPI()

async def consume_kafka():
    consumer = AIOKafkaConsumer(
        'job-events', 
        bootstrap_servers='localhost:9092',
        group_id="ai-consumer-group",
        auto_offset_reset="earliest"
    )
    await consumer.start()
    print("🎧 Python AI is now listening to Kafka...")
    try:
        async for msg in consumer:
            raw_message = msg.value.decode('utf-8')
            print(f"📥 Received from Kafka: {raw_message}")

            job_id, description = raw_message.split(":", 1)
            job_id = job_id.strip()

            doc = nlp(description)
            skills = list(set(ent.text for ent in doc.ents if ent.label_ in ["ORG", "PRODUCT", "TECH_SKILL"]))

            async with httpx.AsyncClient() as client:
                java_url = f"http://localhost:8080/api/jobs/{job_id}/skills"
                response = await client.put(java_url, json=skills)
                if response.status_code == 200:
                    print(f"✅ Sent skills back to Java for Job {job_id}")
                else:
                    print(f"❌ FAILED to update Java. Status Code: {response.status_code}")
                    print(f"Java Error Details: {response.text}")
    finally:
        await consumer.stop()

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(consume_kafka())

class JobDescription(BaseModel):
    description: str

@app.post("/extract-skills")
async def extract_skills(job: JobDescription):
    doc = nlp(job.description)
    extracted_terms = []

    for ent in doc.ents:
        if ent.label_ in ["ORG", "PRODUCT", "TECH_SKILL"]:
            extracted_terms.append(ent.text)
    return {"skills": list(set(extracted_terms))}