from pydantic import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DCA Trading API"
    COVALENT_API_KEY: str
    INFURA_API_KEY: str
    CONTRACT_ADDRESS: str
    PRIVATE_KEY: str
    DB_HOST: str
    DB_PORT: str
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str

    class Config:
        env_file = ".env"

settings = Settings()