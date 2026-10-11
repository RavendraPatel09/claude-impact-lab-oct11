from typing import Optional
from pydantic import BaseModel, Field


class RuleResponse(BaseModel):
    rule: str = Field(..., description="Rule number/identifier, e.g. '56', '26-B'.")
    title: Optional[str] = Field(default=None, description="Title/heading of the rule.")
    part: Optional[str] = Field(default=None, description="Part of the rules, e.g. 'Part V: General Building Requirements'.")
    page_start: Optional[int] = Field(default=None, description="Starting PDF page.")
    page_end: Optional[int] = Field(default=None, description="Ending PDF page.")
    text: str = Field(..., description="Complete official text of the rule.")


class SearchResult(BaseModel):
    rule: str = Field(..., description="Rule number/identifier.")
    title: Optional[str] = Field(default=None, description="Rule heading.")
    part: Optional[str] = Field(default=None, description="Part of the rulebook.")
    page_start: Optional[int] = Field(default=None, description="Start page.")
    page_end: Optional[int] = Field(default=None, description="End page.")
    text: str = Field(..., description="Rule text or relevant passage.")
    score: float = Field(..., description="Relevance ranking score.")
