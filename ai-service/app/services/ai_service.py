import time
import requests
from sentence_transformers import util
from app.ml import engine as ml_engine
from app.core.config import BACKEND_URL, get_m2m_headers

def calculate_match_score(resume_text: str, job_description: str) -> float:
    start_time = time.time()
    if not resume_text or not job_description:
        return 0.0
        
    # --- 1. The Semantic Score (The AI Vibe Check) ---
    resume_vector = ml_engine.model.encode(resume_text, convert_to_tensor=True)
    job_vector = ml_engine.model.encode(job_description, convert_to_tensor=True)
    cosine_score = util.cos_sim(resume_vector, job_vector).item()
    
    # NLP Normalizer: A 0.65 cosine score on massive documents is actually a 95%+ match.
    # We multiply by 1.4 to scale it nicely for humans.
    normalized_cosine = min(1.0, cosine_score * 1.4)

    # --- 2. The Hard Skill Score (The Reality Check) ---
    job_skills = extract_strict_skills(job_description)
    resume_skills = extract_strict_skills(resume_text)
    
    if len(job_skills) > 0:
        matched_skills = job_skills.intersection(resume_skills)
        skill_score = len(matched_skills) / len(job_skills)
    else:
        skill_score = normalized_cosine # Fallback if no skills listed

    # --- 3. The Hybrid Formula ---
    # Give 75% weight to exact skills, 25% to overall semantic context
    final_score = (skill_score * 0.75) + (normalized_cosine * 0.25)
    percentage = round(final_score * 100, 2)

    ml_engine.AI_PROCESSING_TIME.observe(time.time() - start_time)
    
    # Ensure it stays cleanly between 0 and 100
    return max(0.0, min(100.0, percentage))

def extract_strict_skills(text: str) -> set:
    """Helper function to cleanly extract only verified database skills from any text."""
    text_lower = text.lower()
    extracted = set()

    # 1. Exact matches (Catches "Java", "AWS" perfectly)
    for skill in ml_engine.KNOWN_SKILLS:
        if f" {skill.lower()} " in f" {text_lower} " or f" {skill.lower()}," in f" {text_lower} ":
            extracted.add(skill)

    # 2. Semantic matches (Catches variations, strict 82% threshold)
    keywords = ml_engine.kw_model.extract_keywords(text, keyphrase_ngram_range=(1,2), stop_words='english', top_n=20)
    for kw, _ in keywords:
        kw_vector = ml_engine.model.encode(kw, convert_to_tensor=True)
        cosine_scores = util.cos_sim(kw_vector, ml_engine.skills_embeddings)[0]
        best_match_idx = cosine_scores.argmax().item()
        
        if cosine_scores[best_match_idx].item() > 0.82:
            extracted.add(ml_engine.KNOWN_SKILLS[best_match_idx])
            
    return extracted

def generate_skill_gap_feedback(resume_text: str, job_description: str):
    print("🔍 Calculating Skill Gap (Strict Mode)...")
    
    # Use our new strict sandbox for both the job and the resume!
    job_skills = extract_strict_skills(job_description)
    resume_skills = extract_strict_skills(resume_text)
    
    missing_skills = job_skills - resume_skills
    missing_count = len(missing_skills)
    
    if not missing_skills:
        return "Your profile aligns perfectly with the core technical keywords of this role!", missing_count
        
    # Format exactly as before so the React UI splitter trick works perfectly
    formatted_skills = ", ".join(list(missing_skills)[:4])
    feedback_string = f"To strengthen your profile for similar roles, consider highlighting your experience with: {formatted_skills}."
    
    return feedback_string, missing_count

def process_job_with_ai(job_data):
    job_id = job_data.get("id")
    description = job_data.get("description", "")
    if not description: return

    print(f"🔍 AI is scanning for skills in Job {job_id}...")
    description_lower = description.lower()
    extracted_skills = set()

    # --- 1. EXACT TEXT MATCHING (Catches the obvious ones KeyBERT misses) ---
    for skill in ml_engine.KNOWN_SKILLS:
        # Add spaces around it so "Java" doesn't trigger inside "JavaScript"
        if f" {skill.lower()} " in f" {description_lower} " or f" {skill.lower()}," in f" {description_lower} ":
            extracted_skills.add(skill)

    # --- 2. SEMANTIC MATCHING (Catches variations via KeyBERT) ---
    keywords = ml_engine.kw_model.extract_keywords(description, keyphrase_ngram_range=(1,2), stop_words='english', top_n=15)
    for kw, kw_weight in keywords:
        kw_vector = ml_engine.model.encode(kw, convert_to_tensor=True)
        cosine_scores = util.cos_sim(kw_vector, ml_engine.skills_embeddings)[0]
        best_match_idx = cosine_scores.argmax().item()
        
        # 82% strict similarity threshold
        if cosine_scores[best_match_idx].item() > 0.82:
            extracted_skills.add(ml_engine.KNOWN_SKILLS[best_match_idx])

    final_skills_list = list(extracted_skills)
    print(f"🧠 AI Semantic Analysis Complete. Extracted Skills: {final_skills_list}")
    send_skills_to_backend(job_id, final_skills_list)
    ml_engine.AI_JOBS_PROCESSED.inc()

def send_skills_to_backend(job_id, skills):
    url = f"{BACKEND_URL}/api/jobs/{job_id}/skills"
    try:
        response = requests.put(url, json={"skills": skills}, headers=get_m2m_headers())
        if response.status_code in [200, 201]:
            print(f"✅ Successfully injected skills into Java Backend for Job {job_id}!")
        else:
            print(f"❌ Java Backend rejected payload. Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Network Error: Could not reach Java Backend: {e}")