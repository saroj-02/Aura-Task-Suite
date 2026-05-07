from pydantic_settings import BaseSettings
from pydantic import validator
from typing import List, Union

class Settings(BaseSettings):
    PROJECT_NAME: str = "Aura Task Suite"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-super-secret-key-for-development" # In production, use env var
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    MONGODB_URL: str = "mongodb+srv://sarojpadhi28:IBqTzLV0d2TBTuDj@cluster0.n9zjrky.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    DATABASE_NAME: str = "aura_task_suite"
    ADMIN_KEY: str = "Saroj@Admin"
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = ["*"] # Allow all origins for troubleshooting

    # Support for comma-separated string in env var
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
