import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.core.config import settings
from app.services.rule_service import rule_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("bhumi_vikas_backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure rules dataset is loaded
    count = rule_service.count()
    logger.info(f"Bhumi Vikas Sahayak API initialized with {count} statutory rules.")
    logger.info(f"CORS allowed origins: {settings.cors_origins}")
    yield
    logger.info("Bhumi Vikas Sahayak API shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Backend API for Bhumi Vikas Sahayak — answering questions about the MP Bhumi Vikas Rules, 2012 "
        "with verified statutory citations, version warnings, and deterministic calculations."
    ),
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "source_version": settings.SOURCE_VERSION,
        "docs_url": "/docs",
        "health_check": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
