import json
import os
import asyncio
import requests
from fastapi import FastAPI
from aiokafka import AIOKafkaConsumer
from sentence_transformers import SentenceTransformer, util
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

print("Loading AI Model (This might take a few seconds)...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ AI Model Loaded Successfully!")

KNOWN_SKILLS = [
    "Python", "Java", "React", "Spring Boot", "Docker", "Kubernetes",
    "Kafka", "Machine Learning", "Data Analysis", "SQL", "PostgreSQL",
    "AWS", "Microservices", "REST APIs", "Node.js", "C++", "Frontend Development",
    "Backend Development", "System Design", "Vector Databases", "Pandas"
]

print("Generating Vector Embeddings for Knownledge Base...")
skills_embeddings = model.encode(KNOWN_SKILLS, convert_to_tensor=True)
print("✅ Knowledge Base Initialized!")

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
KAFKA_TOPIC = "job-created"
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")

async def consume_kafka_messages():
    consumer = AIOKafkaConsumer(
        KAFKA_TOPIC,
        bootstrap_servers=KAFKA_BROKER,
        group_id='ai_vector_group-v2',
        auto_offset_reset='earliest'
    )
    await consumer.start()
    print(f"🚀 Kafka Consumer Connected to topic: {KAFKA_TOPIC}")
    try:
        async for msg in consumer:
            raw_value = msg.value.decode('utf-8')

            try:
                job_data = json.loads(raw_value)
                job_id = job_data.get("id")

                if job_id:
                    print(f"\n📥 Received Job {job_id}. Analyzing Context...")
                    process_job_with_ai(job_data)
            except json.JSONDecodeError:
                print(f"⚠️ SKIPPING POISON PILL (Not JSON): {raw_value}")
    except Exception as e:
        print(f"🚨 FATAL ERROR in Kafka loop: {e}")
    finally:
        await consumer.stop()

def process_job_with_ai(job_data):
    job_id = job_data.get("id")
    description = job_data.get("description", "")

    if not description:
        print(f"⚠️  No description found for Job {job_id}. Skipping...")
        return
    
    jb_embedding = model.encode(description, convert_to_tensor=True)
    cosine_scores = util.cos_sim(jb_embedding, skills_embeddings)[0]

    extracted_skills = []
    for i, score in enumerate(cosine_scores):
        if score > 0.25: 
            extracted_skills.append(KNOWN_SKILLS[i])
    
    print(f"🧠 AI Semantic Analysis Complete. Extracted Skills for Job {job_id}: {extracted_skills}")
    send_skills_to_backend(job_id, extracted_skills)

def send_skills_to_backend(job_id, skills):
    url = f"{BACKEND_URL}/api/jobs/{job_id}/skills"
    payload = {"skills": skills}
    try:
        response = requests.put(url, json=payload)
        if response.status_code in [200, 201]:
            print(f"✅ Successfully injected skills into Java Backend for Job {job_id}!")
        else:
            print(f"❌ Java Backend rejected payload. Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Network Error: Could not reach Java Backend: {e}")

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(consume_kafka_messages())

@app.get("/health")
def health_check():
    return {"status": "AI Vector Engine is Operational!"}