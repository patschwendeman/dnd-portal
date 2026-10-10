from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    db_driver: str
    db_host: str
    db_port: int
    postgres_user: str
    postgres_password: str
    postgres_db: str

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:8080"]

    @property
    def database_url(self) -> URL:
        return URL.create(
            drivername=self.db_driver,
            username=self.postgres_user,
            password=self.postgres_password,
            host=self.db_host,
            port=self.db_port,
            database=self.postgres_db,
        )


settings = Settings()
