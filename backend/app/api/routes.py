import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.question import QuestionRequest
from app.schemas.answer import AskResponse
from app.schemas.rule import RuleResponse, SearchResult
from app.schemas.source import SourceCoverageResponse
from app.schemas.calculator import SetbackCalculationRequest, SetbackCalculationResponse
from app.services.ai_service import ai_service
from app.services.retrieval import retriever
from app.services.rule_service import rule_service
from app.services.source_version import source_version_service
from app.services.calculator import calculate_residential_setbacks, calculate_residential_building_fee

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Building Regulations API"])


@router.get("/health", summary="Health check endpoint")
async def health_check():
    """Confirms API service is alive and healthy."""
    return {"status": "ok"}


@router.post("/ask", response_model=AskResponse, summary="Ask building regulation question")
async def ask_question(request: QuestionRequest):
    """
    Primary endpoint for Bhopal Municipal Corporation counter clerk or citizen.
    Accepts question in English or Hindi, retrieves authoritative rule passages,
    and returns a grounded answer with citations and version warnings.
    """
    try:
        raw_result = ai_service.answer_question(
            question=request.question,
            language=request.language
        )
        return AskResponse(**raw_result)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Unexpected error while processing /api/ask: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The answer service is temporarily unavailable. Please try again."
        )


@router.get("/search", response_model=List[SearchResult], summary="Search rule passages")
async def search_passages(
    q: str = Query(..., min_length=1, description="Search query string"),
    top_k: int = Query(default=5, ge=1, le=20, description="Maximum results to return")
):
    """Lexical and semantic keyword search across MP Bhumi Vikas Rules."""
    trimmed = q.strip()
    if not trimmed:
        return []
    try:
        results = retriever.retrieve(query=trimmed, top_k=top_k)
        return [SearchResult(**r) for r in results]
    except Exception as e:
        logger.exception(f"Error during search: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search temporarily unavailable."
        )


@router.get("/rules", response_model=List[dict], summary="List all rules")
async def list_all_rules():
    """Returns directory of all 106 rules in the MP Bhumi Vikas Rules, 2012 dataset."""
    all_rules = rule_service.list_rules()
    return [
        {
            "rule": r["rule"],
            "title": r.get("title"),
            "part": r.get("part"),
            "page_start": r.get("page_start"),
            "page_end": r.get("page_end")
        }
        for r in all_rules
    ]


@router.get("/rules/{rule_number}", response_model=RuleResponse, summary="Get rule by number")
async def get_rule_by_number(rule_number: str):
    """
    Retrieve full text and metadata for a specific rule (e.g. '56', '26-B', '17').
    Returns 404 if the rule is not found.
    """
    rule = rule_service.get_rule(rule_number)
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rule '{rule_number}' not found in the MP Bhumi Vikas Rules, 2012."
        )
    return RuleResponse(**rule)


@router.get("/sources", response_model=SourceCoverageResponse, summary="Source documents and version metadata")
async def get_sources():
    """
    Provides official source document names, version cutoff dates,
    and explicit limitations regarding later amendments.
    """
    coverage = source_version_service.get_source_coverage()
    return SourceCoverageResponse(**coverage)


@router.post("/calculate/setback", response_model=SetbackCalculationResponse, summary="Deterministic setback calculator")
async def calculate_setback(payload: SetbackCalculationRequest):
    """
    Computes front, rear, and side open spaces for residential buildings up to 12.5m
    using statutory tables from Rule 56(1) and Rule 56(2).
    """
    try:
        res = calculate_residential_setbacks(
            street_width_m=payload.street_width_m,
            plot_area_sqm=payload.plot_area_sqm,
            building_height_m=payload.building_height_m,
            is_existing_narrow_street=payload.is_existing_narrow_street
        )
        if res.get("status") == "insufficient_evidence":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=res.get("error")
            )
        return SetbackCalculationResponse(**res)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.exception(f"Setback calculation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating setbacks."
        )


@router.get("/calculate/fee", summary="Deterministic residential fee calculator")
async def calculate_fee(built_up_area_sqm: float = Query(..., gt=0, description="Proposed built-up area in sq. m.")):
    """Computes application fee and building permission fee under Rule 21."""
    try:
        return calculate_residential_building_fee(built_up_area_sqm)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.exception(f"Fee calculation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating fee."
        )
