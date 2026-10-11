from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class AnswerStatus(str, Enum):
    ANSWERED = "answered"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    NEEDS_CLARIFICATION = "needs_clarification"
    SOURCE_VERSION_WARNING = "source_version_warning"


class Citation(BaseModel):
    rule: str = Field(..., description="Rule identifier, e.g., '56', '26-B'.")
    title: Optional[str] = Field(default=None, description="Official title or heading of the rule.")
    page_start: Optional[int] = Field(default=None, description="Starting PDF page number.")
    page_end: Optional[int] = Field(default=None, description="Ending PDF page number.")
    excerpt: str = Field(..., description="Verbatim or faithful passage excerpt from the rulebook.")


class AskResponse(BaseModel):
    answer: str = Field(..., description="Clear, source-grounded answer for the clerk.")
    status: AnswerStatus = Field(
        default=AnswerStatus.ANSWERED,
        description="Response status: answered, insufficient_evidence, needs_clarification, or source_version_warning."
    )
    citations: List[Citation] = Field(
        default_factory=list,
        description="Authoritative citations supporting the answer."
    )
    warnings: List[str] = Field(
        default_factory=list,
        description="Any legal, version, or applicability warnings."
    )
    source_version: Optional[str] = Field(
        default="2025-03-06",
        description="Cut-off date of the consolidated source rulebook."
    )
