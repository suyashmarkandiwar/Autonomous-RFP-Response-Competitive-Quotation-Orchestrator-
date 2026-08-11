import os
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT", "8000"))
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "sme_quotation_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_key_change_in_production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
settings = Settings()