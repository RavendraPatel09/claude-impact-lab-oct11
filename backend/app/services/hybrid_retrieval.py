import logging
from typing import Any, Dict, List

from app.services.retrieval import retriever
from app.services.semantic_retrieval import semantic_retriever

logger = logging.getLogger(__name__)


def _reciprocal_rank_fusion(result_lists: List[List[Dict[str, Any]]], k: int = 60) -> List[Dict[str, Any]]:
    """
    Combine multiple ranked passage lists into one ranking. A passage that
    ranks well in several lists outranks one that ranks #1 in only one list,
    which is what makes this more robust than trusting either system alone.
    """
    fused_scores: Dict[str, float] = {}
    passage_by_rule: Dict[str, Dict[str, Any]] = {}

    for results in result_lists:
        for rank, passage in enumerate(results, start=1):
            rule_id = str(passage.get("rule"))
            fused_scores[rule_id] = fused_scores.get(rule_id, 0.0) + 1.0 / (k + rank)
            passage_by_rule.setdefault(rule_id, passage)

    ranked_rule_ids = sorted(fused_scores, key=lambda rid: fused_scores[rid], reverse=True)
    fused = []
    for rule_id in ranked_rule_ids:
        passage = dict(passage_by_rule[rule_id])
        passage["score"] = round(fused_scores[rule_id], 6)
        fused.append(passage)
    return fused


def hybrid_retrieve(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Keyword (BM25-like) retrieval, fused with multilingual semantic
    retrieval via reciprocal rank fusion. Each side applies its own
    relevance floor before fusion, so a passage only enters the result if at
    least one system judged it genuinely relevant — fusion ranks candidates,
    it does not manufacture relevance on its own.

    Degrades to keyword-only results if the semantic model/index is
    unavailable (not installed, failed to load, or offline).
    """
    if not query or not query.strip():
        return []
    if retriever.is_likely_out_of_scope(query):
        return []

    # Thresholds calibrated against real queries: genuine matches score ~20-30
    # (keyword) / ~0.55-0.70 (semantic), while generic-word false positives on
    # out-of-domain questions (e.g. "office" matching "Officer") top out
    # around ~6 / ~0.45. These floors sit between the two, well clear of both.
    keyword_results = retriever.retrieve_candidates(query, limit=15, min_score=15.0)

    try:
        semantic_results = semantic_retriever.search(query, top_k=15, min_score=0.5)
    except Exception:
        logger.exception("Semantic retrieval raised; continuing with keyword-only results.")
        semantic_results = []

    result_lists = [lst for lst in (keyword_results, semantic_results) if lst]
    if not result_lists:
        return []

    fused = _reciprocal_rank_fusion(result_lists)
    return fused[:top_k]
