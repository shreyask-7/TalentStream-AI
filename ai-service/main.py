import json
import os
import asyncio
import httpx
import requests
from fastapi import FastAPI
from aiokafka import AIOKafkaConsumer
from sentence_transformers import SentenceTransformer, util
from dotenv import load_dotenv
from resume_parser import extract_text_from_pdf

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

JAVA_BACKEND_DIR = "C:/AcePK7/Projects/TalentStream-AI"

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

async def consume_resume_events():
    consumer = AIOKafkaConsumer(
        "resume-uploaded",
        bootstrap_servers='localhost:9092',
        group_id='ai-resume-group',
        auto_offset_reset='latest'
    )
    await consumer.start()
    print("🎧 Python AI listening for 'resume-uploaded' events...")
    try:
        async for msg in consumer:
            try:
                event = json.loads(msg.value.decode('utf-8'))
                app_id = event.get("applicationId")
                job_id = event.get("jobId")
                relative_file_path = event.get("resumeUploadedPath")

                print(f"\n📥 Received resume upload Application {app_id}")

                async with httpx.AsyncClient() as client:
                    job_response = await client.get(f"{BACKEND_URL}/api/jobs/{job_id}")
                    if job_response.status_code != 200:
                        print(f"⚠️ Could not find Job {job_id}")
                        continue
                    job_data = job_response.json()
                    job_desc = job_data.get("description", "")
                
                clean_relative_path = relative_file_path.replace("\\", "/")
                absolute_file_path = f"{JAVA_BACKEND_DIR}/{clean_relative_path}"
                print(f"📂 Reading PDF from: {absolute_file_path}")

                resume_text = extract_text_from_pdf(absolute_file_path)
                match_score = calculate_match_score(resume_text, job_desc)
                print(f"📊 Resume Match Score for Application {app_id}: {match_score}%")
                payload = {"aiMatchScore": match_score}
                async with httpx.AsyncClient() as client:
                    put_response = await client.put(
                        f"{BACKEND_URL}/api/applications/{app_id}/score",
                        json=payload
                    )
                    if put_response.status_code == 200:
                        print(f"✅ Successfully updated Application {app_id} with score {match_score}%")
                    else:
                        print(f"⚠️ Failed to update Java Backend. Status: {put_response.status_code}")
            except Exception as e:
                print(f"🚨 Error processing resume event: {e}")
    finally: 
        await consumer.stop()

def calculate_match_score(resume_text: str, job_description: str) -> float:
    """Calculates semantic similarity between the resume and job description."""
    if not resume_text or not job_description:
        return 0.0
    resume_vector = model.encode(resume_text, convert_to_tensor=True)
    job_vector = model.encode(job_description, convert_to_tensor=True)
    cosine_score = util.cos_sim(resume_vector, job_vector)
    percentage = round(cosine_score.item() * 100, 2)
    return max(0.0, percentage)

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
    asyncio.create_task(consume_resume_events())

@app.get("/health")
def health_check():
    return {"status": "AI Vector Engine is Operational!"}