import os


class Settings:
    ENV: str = os.getenv("FLASK_ENV", "development")
    DEBUG: bool = os.getenv("FLASK_DEBUG", "1") == "1"
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")


settings = Settings()
