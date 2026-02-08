import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env file explicitly
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    PROJECT_NAME: str = "La Previa Maldita API"
    VERSION: str = "2.0.0"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "maldita_secreta_key_2025_horror_666")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    MYSQL_URL: str = os.getenv("MYSQL_URL", "")
    
    # CORS
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5500,http://127.0.0.1:5500")

    def get_database_url(self) -> str:
        url = self.DATABASE_URL
        if not url:
            url = self.MYSQL_URL
        if not url:
            raise ValueError("❌ DATABASE_URL or MYSQL_URL is not set in .env file. MySQL is required.")
        
        # Railway Fix
        if url.startswith("mysql://"):
            url = url.replace("mysql://", "mysql+pymysql://", 1)
        return url

settings = Settings()
