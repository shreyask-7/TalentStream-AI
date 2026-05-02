from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "AI Vector Engine is Operational!"}