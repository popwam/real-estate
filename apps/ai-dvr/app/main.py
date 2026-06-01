from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title="POPWAM AI/DVR Service",
        version="0.1.0",
        description="AI/DVR service skeleton. Face matching and detection are not implemented yet.",
    )
    app.include_router(health_router)
    return app


app = create_app()
