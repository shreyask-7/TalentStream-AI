import time
import requests
from sentence_transformers import SentenceTransformer, util
from keybert import KeyBERT
from sklearn.ensemble import RandomForestClassifier
from app.core.config import BACKEND_URL, get_m2m_headers
from prometheus_client import Counter, Histogram

print("Loading AI Model (This might take a few seconds)...")
model = SentenceTransformer('all-MiniLM-L6-v2')
kw_model = KeyBERT(model=model)
print("✅ AI Model & Keybert Loaded Successfully!")

# Global State
KNOWN_SKILLS = []
skills_embeddings = None
feedback_model = None
IS_MODEL_TRAINED = False

# Metrics
AI_JOBS_PROCESSED = Counter('ai_jobs_processed_total', 'Total jobs semantically analyzed')
AI_RESUMES_SCORED = Counter('ai_resumes_scored_total', 'Total resumes scored against jobs')
AI_PROCESSING_TIME = Histogram('ai_processing_time_seconds', 'Time spent processing AI vectors')

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

def train_feedback_model():
    global feedback_model, IS_MODEL_TRAINED
    print("🔄 Fetching historical ML training data from Java...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/applications/training-data", headers=get_m2m_headers())
        if response.status_code == 200:
            data = response.json()
            if len(data) < 3:
                print(f"⚠️ Only {len(data)} feedback records found. Waiting for more data to activate ML Loop.")
                return
            
            X = [[item['matchScore'], item['missingSkillsCount']] for item in data]
            y = [item['feedback'] for item in data]
            
            clf = RandomForestClassifier(max_depth=3, random_state=42)
            clf.fit(X, y)
            feedback_model = clf
            IS_MODEL_TRAINED = True
            print(f"🧠 Active ML Learning Loop Trained on {len(data)} historical interactions!")
    except Exception as e:
        print(f"🚨 Failed to train ML model: {e}")

def get_ml_prediction(match_score, missing_count):
    if IS_MODEL_TRAINED and feedback_model:
        return feedback_model.predict([[match_score, missing_count]])[0]
    return 0 # Neutral