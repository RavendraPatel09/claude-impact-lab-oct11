import logging
import threading
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.services.rule_service import rule_service

logger = logging.getLogger(__name__)


class SemanticRuleRetriever:
    """
    Multilingual embedding-based retrieval over the rule passages, used to
    catch paraphrases and Hindi/English cross-language matches that the
    keyword scorer in retrieval.py misses. The model and FAISS index are
    built lazily on first use (not at import time) so importing this module,
    and running the existing test suite, stays fast when semantic search is
    never actually invoked.
    """

    def __init__(self):
        self._model = None
        self._index = None
        self._passages: List[Dict[str, Any]] = []
        self._lock = threading.Lock()
        self._load_failed = False

    def _ensure_loaded(self) -> None:
        if self._index is not None or self._load_failed:
            return
        with self._lock:
            if self._index is not None or self._load_failed:
                return
            try:
                import numpy as np
                import faiss
                from sentence_transformers import SentenceTransformer

                model = SentenceTransformer(settings.SEMANTIC_MODEL_NAME)
                passages = rule_service.list_rules()
                texts = [
                    " ".join([
                        str(p.get("rule") or ""),
                        str(p.get("title") or ""),
                        str(p.get("text") or "")
                    ])
                    for p in passages
                ]
                embeddings = model.encode(
                    texts,
                    convert_to_numpy=True,
                    normalize_embeddings=True,
                    show_progress_bar=False
                )
                embeddings = np.asarray(embeddings, dtype="float32")
                index = faiss.IndexFlatIP(embeddings.shape[1])
                index.add(embeddings)

                self._model = model
                self._passages = passages
                self._index = index
                logger.info(f"Semantic index built over {len(passages)} passages using {settings.SEMANTIC_MODEL_NAME}.")
            except Exception:
                logger.exception("Semantic retrieval unavailable; falling back to keyword-only search.")
                self._load_failed = True

    def available(self) -> bool:
        self._ensure_loaded()
        return self._index is not None

    def search(self, query: str, top_k: int = 5, min_score: float = 0.35) -> List[Dict[str, Any]]:
        if not query or not query.strip():
            return []
        self._ensure_loaded()
        if self._index is None:
            return []

        import numpy as np

        query_embedding = self._model.encode(
            [query],
            convert_to_numpy=True,
            normalize_embeddings=True
        )
        query_embedding = np.asarray(query_embedding, dtype="float32")

        k = min(max(top_k, 1), len(self._passages))
        scores, indexes = self._index.search(query_embedding, k)

        results: List[Dict[str, Any]] = []
        for score, idx in zip(scores[0], indexes[0]):
            if idx < 0 or float(score) < min_score:
                continue
            p = self._passages[idx]
            results.append({
                "rule": str(p.get("rule") or ""),
                "title": p.get("title"),
                "part": p.get("part"),
                "page_start": p.get("page_start"),
                "page_end": p.get("page_end"),
                "text": p.get("text"),
                "score": round(float(score), 4)
            })
        return results


semantic_retriever = SemanticRuleRetriever()
