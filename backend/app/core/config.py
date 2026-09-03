import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    APP_NAME: str = "RenewAI"
    APP_SUBTITLE: str = "Agentic Intelligence for Solar-Wind Renewable Energy Parks"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api"
    SECRET_KEY: str = "ibm-bob-hackathon-super-secret-key-2026-gujarat-renewables"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Database
    DATABASE_URL: str = "sqlite:///./renewai.db"

    # IBM watsonx.ai & IBM Granite LLM
    WATSONX_APIKEY: str = ""
    WATSONX_PROJECT_ID: str = ""
    WATSONX_URL: str = "https://us-south.ml.cloud.ibm.com"
    WATSONX_MODEL_ID: str = "ibm/granite-3-8b-instruct"
    WATSONX_SPACE_ID: str = ""

    # IBM Watson Orchestrate Live Cloud Configuration
    ORCHESTRATE_APIKEY: str = "WLfDUXEIX1PjyVxNjv17JbCrv-LCAlDZBWBghKXJ-2Fb"
    ORCHESTRATE_IAM_APIKEY: str = "WLfDUXEIX1PjyVxNjv17JbCrv-LCAlDZBWBghKXJ-2Fb"
    ORCHESTRATE_URL: str = "https://api.au-syd.watson-orchestrate.cloud.ibm.com/instances/a19fd6bf-ec9e-4f53-9175-42452cfe1239"
    ORCHESTRATE_AUTH_TYPE: str = "iam"
    ORCHESTRATE_AGENT_ID: str = "54e4d870-3914-4f32-975d-34950a09634d"
    ORCHESTRATE_ENVIRONMENT_ID: str = "2a06a8ce-09e8-4d28-a750-f0b5b1ca5bfb"

    # Telemetry & Simulation
    TELEMETRY_INTERVAL_SECONDS: int = 2
    SIMULATION_ACCELERATION_FACTOR: float = 1.0

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"

settings = Settings()
