import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Load .env if present
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


class Settings:
    PROJECT_NAME: str = "Bhumi Vikas Sahayak API"
    VERSION: str = "1.0.0"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Official source version
    SOURCE_VERSION: str = os.getenv("SOURCE_VERSION", "2025-03-06")
    AMENDMENT_CUTOFF_DATE: str = "2025-03-06"
    LATER_AMENDMENT_DATE: str = "2026-08-28"
    
    AMENDMENT_WARNING_EN: str = (
        "Note: The supplied consolidated rulebook is current up to 6 March 2025. "
        "A subsequent amendment dated 28 August 2026 affecting Rule 2(5)(c) for plots up to 500 sq. m. "
        "is not verified in the available data. Please verify with the authority or the latest official gazette."
    )
    AMENDMENT_WARNING_HI: str = (
        "सूचना: उपलब्ध समेकित नियम पुस्तिका 6 मार्च 2025 तक अद्यतन है। "
        "500 वर्ग मीटर तक के भूखंडों के लिए नियम 2(5)(c) को प्रभावित करने वाला 28 अगस्त 2026 का संशोधन "
        "उपलब्ध डेटा में सत्यापित नहीं है। कृपया प्राधिकरण या नवीनतम राजपत्र अधिसूचना से पुष्टि करें।"
    )

    # Semantic retrieval (optional; degrades to keyword-only if unavailable)
    SEMANTIC_MODEL_NAME: str = os.getenv(
        "SEMANTIC_MODEL_NAME",
        "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    )

    # LLM-backed answer generation (optional; falls back to a deterministic
    # excerpt-based answer when no API key is configured)
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "claude-haiku-5-5")

    @property
    def llm_enabled(self) -> bool:
        return bool(self.ANTHROPIC_API_KEY)

    # CORS settings
    @property
    def cors_origins(self) -> List[str]:
        raw_origins = os.getenv(
            "FRONTEND_ORIGIN",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
        )
        origins = [orig.strip() for orig in raw_origins.split(",") if orig.strip()]
        # Always include development defaults if not present
        for default_orig in ["http://localhost:5173", "http://127.0.0.1:5173"]:
            if default_orig not in origins:
                origins.append(default_orig)
        return origins

    # Data paths resolution
    @property
    def rules_data_path(self) -> Path:
        custom_path = os.getenv("RULES_DATA_PATH")
        if custom_path:
            p = Path(custom_path)
            if not p.is_absolute():
                # Try relative to backend dir first, then cwd
                backend_dir = Path(__file__).resolve().parent.parent.parent
                candidate = backend_dir / custom_path
                if candidate.exists():
                    return candidate
            if p.exists():
                return p

        # Check standard locations
        backend_dir = Path(__file__).resolve().parent.parent.parent
        workspace_dir = backend_dir.parent

        candidates = [
            workspace_dir / "track-1-bhumi-vikas-sahayak" / "data" / "bhumi_vikas_rules.jsonl",
            backend_dir / "data" / "bhumi_vikas_rules.jsonl",
            workspace_dir / "data" / "bhumi_vikas_rules.jsonl",
            Path.cwd() / "track-1-bhumi-vikas-sahayak" / "data" / "bhumi_vikas_rules.jsonl",
            Path.cwd() / "data" / "bhumi_vikas_rules.jsonl"
        ]

        for cand in candidates:
            if cand.exists():
                return cand.resolve()

        # Fallback to the first candidate path
        return (workspace_dir / "track-1-bhumi-vikas-sahayak" / "data" / "bhumi_vikas_rules.jsonl").resolve()


settings = Settings()
