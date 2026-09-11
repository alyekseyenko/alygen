import os
from dotenv import load_dotenv

# Localizar o ficheiro .env no backend
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_env_path = os.path.join(BASE_DIR, 'backend', '.env')
if not os.path.exists(_env_path):
    _env_path = os.path.join(BASE_DIR, '.env')

load_dotenv(_env_path)

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    PAGESPEED_API_KEY: str = os.getenv("PAGESPEED_API_KEY", "")
    
    PYTHON_PORT: int = int(os.getenv("PYTHON_PORT", "3003"))
    PYTHON_HOST: str = os.getenv("PYTHON_HOST", "0.0.0.0")
    
    CACHE_DIR: str = os.path.join(BASE_DIR, "data", "cache")

settings = Settings()

# Criar directório de cache se não existir
os.makedirs(settings.CACHE_DIR, exist_ok=True)
