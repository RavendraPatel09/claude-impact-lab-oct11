from typing import List
from pydantic import BaseModel, Field


class SourceDocument(BaseModel):
    title: str = Field(..., description="Document name.")
    language: str = Field(..., description="Language of document.")
    version_date: str = Field(..., description="Effective consolidation date.")
    source_type: str = Field(..., description="Format/type, e.g. 'Official Gazette Consolidation (PDF)'.")
    authority: str = Field(..., description="Issuing department/authority.")
    description: str = Field(..., description="Document details and coverage.")


class SourceCoverageResponse(BaseModel):
    source_version: str = Field(..., description="Primary dataset consolidation date.")
    documents: List[SourceDocument] = Field(..., description="Registered source documents.")
    limitations: List[str] = Field(..., description="Coverage boundaries and cautionary notices.")
    unverified_amendments: List[str] = Field(..., description="Known amendments not included in dataset.")
