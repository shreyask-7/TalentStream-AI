from fastapi import FastAPI
from typing import List
import re

app = FastAPI()

COMMON_SKILLS = ["Java", "Python", "React", "SQL", "Docker", "AWS", "Spring Boot", "DSA"]

@app.get("/")
def home():
    return {"message": "TalentStream AI Service is Online"}

@app.post("/extract-skills")
async def extract_skills(data: dict):
    text = data.get("description", "").lower()
    found_skills = []
    for skill in COMMON_SKILLS:
        if re.search(rf"\b{skill.lower()}\b", text):
            found_skills.append(skill)
    return {"skills": found_skills}