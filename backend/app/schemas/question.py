from pydantic import BaseModel, Field, field_validator


class QuestionRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="The query asked by the counter clerk or citizen."
    )
    language: str = Field(
        default="en",
        description="Language code for the response: 'en' for English or 'hi' for Hindi."
    )

    @field_validator("question")
    @classmethod
    def validate_and_strip_question(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Question cannot be empty or contain only whitespace.")
        return trimmed

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        clean_lang = v.strip().lower()
        if clean_lang not in ("en", "hi"):
            raise ValueError("Language must be either 'en' (English) or 'hi' (Hindi).")
        return clean_lang
