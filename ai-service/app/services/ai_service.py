import time
import requests
from sentence_transformers import util
from app.ml import engine as ml_engine
from app.core.config import BACKEND_URL, get_m2m_headers

def calculate_match_score(resume_text: str, job_description: str) -> float:
    start_time = time.time()
    if not resume_text or not job_description:
        return 0.0
        
    resume_vector = ml_engine.model.encode(resume_text, convert_to_tensor=True)
    job_vector = ml_engine.model.encode(job_description, convert_to_tensor=True)
    cosine_score = util.cos_sim(resume_vector, job_vector)
    percentage = round(cosine_score.item() * 100, 2)

    ml_engine.AI_PROCESSING_TIME.observe(time.time() - start_time)
    return max(0.0, percentage)

def generate_skill_gap_feedback(resume_text: str, job_description: str):
    print("🔍 Calculating Skill Gap...")
    job_kws = ml_engine.kw_model.extract_keywords(job_description, keyphrase_ngram_range=(1,2), stop_words='english', top_n=10)
    resume_kws = ml_engine.kw_model.extract_keywords(resume_text, keyphrase_ngram_range=(1,2), stop_words='english', top_n=20)
    
    job_skills = {kw[0].lower() for kw in job_kws}
    resume_skills = {kw[0].lower() for kw in resume_kws}
    missing_skills = job_skills - resume_skills
    missing_count = len(missing_skills)
    
    if not missing_skills:
        return "Your profile aligns perfectly with the core technical keywords of this role!", missing_count
        
    formatted_skills = ", ".join(list(missing_skills)[:4]).title()
    feedback_string = f"To strengthen your profile for similar roles, consider highlighting your experience with: {formatted_skills}."
    return feedback_string, missing_count

def process_job_with_ai(job_data):
    job_id = job_data.get("id")
    description = job_data.get("description", "")
    if not description:
        print(f"⚠️  No description found for Job {job_id}. Skipping...")
        return

    print(f"🔍 AI is scanning for undocumented skills in Job {job_id}...")
    keywords = ml_engine.kw_model.extract_keywords(description, keyphrase_ngram_range=(1,2), stop_words='english', top_n = 15)

    extracted_skills = set()
    new_skills_discovered = False

    for kw, kw_weight in keywords:
        kw_vector = ml_engine.model.encode(kw, convert_to_tensor=True)
        cosine_scores = util.cos_sim(kw_vector, ml_engine.skills_embeddings)[0]
        best_match_idx = cosine_scores.argmax().item()
        best_match_score = cosine_scores[best_match_idx].item()

        if best_match_score > 0.75:
            matched_skill = ml_engine.KNOWN_SKILLS[best_match_idx]
            extracted_skills.add(matched_skill)

        elif kw_weight > 0.35:
            if not any(kw.lower() == s.lower() for s in ml_engine.KNOWN_SKILLS):
                pretty_kw = kw.title()
                print(f"✨ AI discovered new skill: '{pretty_kw}'. Teaching backend...")
                try:
                    requests.post(f"{BACKEND_URL}/api/skills", json={"name": pretty_kw}, headers=get_m2m_headers())
                except Exception as e:
                    print(f"⚠️ Could not save '{pretty_kw}' to backend: {e}")

                ml_engine.KNOWN_SKILLS.append(pretty_kw)
                extracted_skills.add(pretty_kw)
                new_skills_discovered = True
    
    if new_skills_discovered:
        # Update the global state safely!
        ml_engine.skills_embeddings = ml_engine.model.encode(ml_engine.KNOWN_SKILLS, convert_to_tensor=True)
        
    final_skills_list = list(extracted_skills)
    print(f"🧠 AI Semantic Analysis Complete. Extracted Skills for Job {job_id}: {extracted_skills}")
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