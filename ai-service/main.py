import spacy
from fastapi import FastAPI
from pydantic import BaseModel

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