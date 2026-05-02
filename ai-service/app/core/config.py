import os
import requests
from dotenv import load_dotenv

load_dotenv()

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8080")
JAVA_BACKEND_DIR = os.getenv("JAVA_BACKEND_DIR", "C:/AcePK7/Projects/TalentStream-AI")

M2M_CLIENT_ID = os.getenv("M2M_CLIENT_ID", "ai-vector-engine-v1")
M2M_CLIENT_SECRET = os.getenv("M2M_CLIENT_SECRET", "super-secret-cryptographic-key-change-in-prod")
_m2m_jwt_token = None

def get_m2m_headers():
    """Negotiates the M2M handshake or returns the cached JWT token."""
    global _m2m_jwt_token
    if _m2m_jwt_token:
        return {"Authorization": f"Bearer {_m2m_jwt_token}"}
        
    print("🔐 Negotiating M2M Handshake with Java Bouncer...")
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/auth/m2m",
            json={"clientId": M2M_CLIENT_ID, "clientSecret": M2M_CLIENT_SECRET}
        )
        if response.status_code == 200:
            _m2m_jwt_token = response.json().get("token")
            print("🎟️ Handshake successful! VIP Wristband secured.")
            return {"Authorization": f"Bearer {_m2m_jwt_token}"}
        else:
            print(f"❌ Handshake failed. Bouncer said: {response.status_code}")
            return {}
    except Exception as e:
        print(f"🚨 Network error during M2M handshake: {e}")
        return {}