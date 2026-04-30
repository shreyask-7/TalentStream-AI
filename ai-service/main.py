import json
import os
import asyncio
import time
import httpx
import requests
import numpy as np
from fastapi import FastAPI
from aiokafka import AIOKafkaConsumer
from sentence_transformers import SentenceTransformer, util
from dotenv import load_dotenv
from resume_parser import extract_text_from_pdf
from prometheus_client import make_asgi_app, Counter, Histogram
from keybert import KeyBERT
from sklearn.ensemble import RandomForestClassifier

load_dotenv()

app = FastAPI()
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

feedback_model = None
IS_MODEL_TRAINED = False

AI_JOBS_PROCESSED = Counter('ai_jobs_processed_total', 'Total jobs semantically analyzed')
AI_RESUMES_SCORED = Counter('ai_resumes_scored_total', 'Total resumes scored against jobs')
AI_PROCESSING_TIME = Histogram('ai_processing_time_seconds', 'Time spent processing AI vectors')

print("Loading AI Model (This might take a few seconds)...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ AI Model Loaded Successfully!")

kw_model = KeyBERT(model=model)  # Initialize KeyBERT with the same SentenceTransformer model
print("✅ AI Model & Keybert Loaded Successfully!")

KNOWN_SKILLS = []
skills_embeddings = None

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
KAFKA_TOPIC = "job-created"
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")

JAVA_BACKEND_DIR = "C:/AcePK7/Projects/TalentStream-AI"

def load_skills_from_backend():
    global KNOWN_SKILLS, skills_embeddings
    print("🔄 Fetching Knowledge Base from Java Backend...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/skills")
        if response.status_code == 200:
            KNOWN_SKILLS = response.json()
            skills_embeddings = model.encode(KNOWN_SKILLS, convert_to_tensor=True)
            print(f"✅ Knowledge Base Initialized with {len(KNOWN_SKILLS)} skills!")
        else:
            print(f"⚠️ Failed to fetch skills. Status: {response.status_code}")
    except Exception as e:
        print(f"🚨 Network error connecting to Java Backend: {e}")

load_skills_from_backend()

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
                skill_gap_feedback, missing_count = generate_skill_gap_feedback(resume_text, job_desc)
                final_score = match_score
                
                if IS_MODEL_TRAINED:
                    prediction = feedback_model.predict([[match_score, missing_count]])[0]
                    if prediction == -1:
                        print("📉 ML Model predicts Recruiter Rejection (Implicit Bias detected). Penalizing score...")
                        final_score = max(0.0, match_score - 15.0)
                    else:
                        print("📈 ML Model predicts Recruiter Approval. Boosting score...")
                        final_score = min(100.0, match_score + 5.0)
                
                print(f"📊 Final AI Match Score for Application {app_id}: {final_score}%")

                payload = {
                    "aiMatchScore": final_score,
                    "aiSkillGap": skill_gap_feedback
                }
                async with httpx.AsyncClient() as client:
                    put_response = await client.put(
                        f"{BACKEND_URL}/api/applications/{app_id}/score",
                        json=payload
                    )
                    if put_response.status_code == 200:
                        print(f"✅ Successfully updated Application {app_id} with score {final_score}%")
                        AI_RESUMES_SCORED.inc()
                    else:
                        print(f"⚠️ Failed to update Java Backend. Status: {put_response.status_code}")
            except Exception as e:
                print(f"🚨 Error processing resume event: {e}")
    finally: 
        await consumer.stop()

def train_feedback_model():
    global feedback_model, IS_MODEL_TRAINED
    print("🔄 Fetching historical ML training data from Java...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/applications/training-data")
        if response.status_code == 200:
            data = response.json()
            if len(data) < 3:
                print(f"⚠️ Only {len(data)} feedback records found. Waiting for more data to activate ML Loop.")
                # data = [
                #     {"matchScore": 95.0, "missingSkillsCount": 0, "feedback": 1},   # Perfect match
                #     {"matchScore": 88.0, "missingSkillsCount": 1, "feedback": 1},   # Good match
                #     {"matchScore": 92.0, "missingSkillsCount": 4, "feedback": -1},  # High score but missing core skills! (Bias)
                #     {"matchScore": 85.0, "missingSkillsCount": 5, "feedback": -1},  # Missed too many skills
                #     {"matchScore": 40.0, "missingSkillsCount": 8, "feedback": -1},  # Terrible match
                #     {"matchScore": 75.0, "missingSkillsCount": 2, "feedback": 1},   # Decent match
                #     {"matchScore": 81.0, "missingSkillsCount": 3, "feedback": -1},  # Borderline, rejected
                #     {"matchScore": 98.0, "missingSkillsCount": 1, "feedback": 1},   # Great match
                #     {"matchScore": 55.0, "missingSkillsCount": 6, "feedback": -1},  # Bad match
                #     {"matchScore": 89.0, "missingSkillsCount": 0, "feedback": 1},   # Great match
                # ]
                return
            X = []
            y = []
            for item in data:
                X.append([item['matchScore'], item['missingSkillsCount']])
                y.append(item['feedback'])
            
            clf = RandomForestClassifier(max_depth = 3, random_state = 42)
            clf.fit(X, y)
            feedback_model = clf
            IS_MODEL_TRAINED = True
            print(f"🧠 Active ML Learning Loop Trained on {len(data)} historical interactions!")
    except Exception as e:
        print(f"🚨 Failed to train ML model: {e}")


def calculate_match_score(resume_text: str, job_description: str) -> float:
    """Calculates semantic similarity between the resume and job description."""
    start_time = time.time()

    if not resume_text or not job_description:
        return 0.0
    resume_vector = model.encode(resume_text, convert_to_tensor=True)
    job_vector = model.encode(job_description, convert_to_tensor=True)
    cosine_score = util.cos_sim(resume_vector, job_vector)
    percentage = round(cosine_score.item() * 100, 2)

    AI_PROCESSING_TIME.observe(time.time() - start_time)

    return max(0.0, percentage)

def generate_skill_gap_feedback(resume_text: str, job_description: str) -> str:
    print("🔍 Calculating Skill Gap...")
    job_kws = kw_model.extract_keywords(job_description, keyphrase_ngram_range=(1,2), stop_words='english', top_n=10)
    resume_kws = kw_model.extract_keywords(resume_text, keyphrase_ngram_range=(1,2), stop_words='english', top_n=20)
    job_skills = {kw[0].lower() for kw in job_kws}
    resume_skills = {kw[0].lower() for kw in resume_kws}
    missing_skills = job_skills - resume_skills
    missing_count = len(missing_skills)
    if not missing_skills:
        return "Your profile aligns perfectly with the core technical keywords of this role!", missing_count
    formatted_skills = ", ".join(list(missing_skills)[:4]).title()
    feedbacK_string = f"To strengthen your profile for similar roles, consider highlighting your experience with: {formatted_skills}."
    return feedbacK_string, missing_count

def process_job_with_ai(job_data):
    global skills_embeddings
    job_id = job_data.get("id")
    description = job_data.get("description", "")

    if not description:
        print(f"⚠️  No description found for Job {job_id}. Skipping...")
        return

    print(f"🔍 AI is scanning for undocumented skills in Job {job_id}...")
    keywords = kw_model.extract_keywords(description, keyphrase_ngram_range=(1,2), stop_words='english', top_n = 15)

    extracted_skills = set()
    new_skills_discovered = False

    known_skills_lower = {s.lower() for s in KNOWN_SKILLS}

    for kw, kw_weight in keywords:
        kw_vector = model.encode(kw, convert_to_tensor=True)
        cosine_scores = util.cos_sim(kw_vector, skills_embeddings)[0]
        best_match_idx = cosine_scores.argmax().item()
        best_match_score = cosine_scores[best_match_idx].item()

        if best_match_score > 0.75:
            matched_skill = KNOWN_SKILLS[best_match_idx]
            extracted_skills.add(matched_skill)

        elif kw_weight > 0.35:
            if not any(kw.lower() == s.lower() for s in KNOWN_SKILLS):
                pretty_kw = kw.title()
                print(f"✨ AI discovered new skill: '{pretty_kw}'. Teaching backend...")
                try:
                    requests.post(f"{BACKEND_URL}/api/skills", json={"name": pretty_kw})
                except Exception as e:
                    print(f"⚠️ Could not save '{pretty_kw}' to backend: {e}")

                KNOWN_SKILLS.append(pretty_kw)
                extracted_skills.add(pretty_kw)
                new_skills_discovered = True
    
    if new_skills_discovered:
        skills_embeddings = model.encode(KNOWN_SKILLS, convert_to_tensor=True)
    final_skills_list = list(extracted_skills)

    print(f"🧠 AI Semantic Analysis Complete. Extracted Skills for Job {job_id}: {extracted_skills}")
    send_skills_to_backend(job_id, final_skills_list)
    AI_JOBS_PROCESSED.inc()

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
    load_skills_from_backend()
    train_feedback_model()
    asyncio.create_task(consume_kafka_messages())
    asyncio.create_task(consume_resume_events())


@app.get("/health")
def health_check():
    return {"status": "AI Vector Engine is Operational!"}