import os
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

def _require_env(key: str) -> str:
    """Raises a clear RuntimeError if a required env variable is missing."""
    value = os.getenv(key)
    if not value:
        raise RuntimeError(
            f"[Config Error] Required environment variable '{key}' is not set. "
            f"Add it to your .env file before starting the server."
        )
    return value

class Settings:
    PORT: int = int(os.getenv("PORT", "8000"))
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "sme_quotation_db")
    # SECRET_KEY is required — no fallback allowed
    SECRET_KEY: str = _require_env("SECRET_KEY")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    # Path to Tesseract binary — override in .env for non-standard installs
    TESSERACT_PATH: str = os.getenv("TESSERACT_PATH", r"C:\Program Files\Tesseract-OCR\tesseract.exe")

settings = Settings()