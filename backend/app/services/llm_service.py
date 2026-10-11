import logging
from typing import Any, Dict, List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Bhumi Vikas Sahayak, an assistant that explains the supplied
Madhya Pradesh building-regulation source material.

Use only the source passages supplied with the current request for claims
about legal requirements. Do not rely on memory to fill gaps. Do not invent
rule numbers, page references, exceptions, calculations, dates, fees, or
approval requirements.

If the supplied passages do not answer the question, say so clearly and set
status to "insufficient_evidence" with an empty citations list. If important
facts are missing from the question, ask a concise clarifying question and
set status to "needs_clarification". Only set status to "answered" when a
supplied passage actually supports the claim.

For every citation, the "rule" field must exactly match the rule identifier
of one of the supplied passages, and "excerpt" must be a short verbatim
quote copied from that passage's text — never paraphrase the excerpt and
never cite a rule that was not supplied.

Respond in the requested language (English or Hindi). Explain technical
terms simply without changing the regulation's meaning. Never present the
answer as an official legal advice, permit, or final administrative
decision."""


class LLMUnavailableError(RuntimeError):
    """Raised whenever the LLM call can't be trusted to produce a grounded
    answer — missing key, network/API failure, or a malformed response. The
    caller is expected to fall back to a safe deterministic response rather
    than surface this to the user."""


ANSWER_TOOL = {
    "name": "submit_grounded_answer",
    "description": (
        "Submit the final grounded answer, status, and citations for the "
        "user's building-regulation question."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "answer": {
                "type": "string",
                "description": "The answer text in the requested language."
            },
            "status": {
                "type": "string",
                "enum": ["answered", "insufficient_evidence", "needs_clarification"]
            },
            "citations": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "rule": {
                            "type": "string",
                            "description": "Rule identifier exactly as given in a supplied passage."
                        },
                        "excerpt": {
                            "type": "string",
                            "description": "Verbatim quote copied from that passage's text."
                        }
                    },
                    "required": ["rule", "excerpt"]
                }
            }
        },
        "required": ["answer", "status", "citations"]
    }
}


def _build_user_message(question: str, language: str, passages: List[Dict[str, Any]]) -> str:
    passage_block = "\n\n".join(
        f"[Passage rule={p.get('rule')} title={p.get('title')} pages={p.get('page_start')}-{p.get('page_end')}]\n"
        f"{p.get('text')}"
        for p in passages
    )
    lang_label = "Hindi" if language == "hi" else "English"
    return (
        f"Requested response language: {lang_label}\n\n"
        f"Question: {question}\n\n"
        f"Supplied source passages (use ONLY these for regulatory claims):\n{passage_block}"
    )


def generate_grounded_answer(
    question: str,
    language: str,
    passages: List[Dict[str, Any]],
    model: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Call the configured LLM to produce a grounded answer from the supplied
    passages only, via forced tool-use so the response shape is guaranteed
    rather than hoping free text parses as JSON.

    Raises LLMUnavailableError for any condition that means the result can't
    be trusted (no API key, network/API error, missing tool call) so the
    caller can fall back to a safe deterministic response instead of
    surfacing a broken answer.
    """
    if not settings.llm_enabled:
        raise LLMUnavailableError("ANTHROPIC_API_KEY is not configured.")
    if not passages:
        raise LLMUnavailableError("No passages supplied; refusing to call the LLM with no evidence.")

    try:
        import anthropic
    except ImportError as e:
        raise LLMUnavailableError("anthropic package is not installed.") from e

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model=model or settings.LLM_MODEL,
            max_tokens=800,
            system=SYSTEM_PROMPT,
            tools=[ANSWER_TOOL],
            tool_choice={"type": "tool", "name": "submit_grounded_answer"},
            messages=[{"role": "user", "content": _build_user_message(question, language, passages)}],
        )
    except Exception as e:
        raise LLMUnavailableError(f"LLM call failed: {e}") from e

    tool_use_block = next(
        (block for block in message.content if getattr(block, "type", None) == "tool_use"),
        None
    )
    if tool_use_block is None:
        raise LLMUnavailableError("LLM did not return the expected tool_use block.")

    parsed = tool_use_block.input
    if not isinstance(parsed, dict) or "answer" not in parsed or "status" not in parsed:
        raise LLMUnavailableError("LLM response missing required fields.")

    parsed.setdefault("citations", [])
    return parsed


def validate_citations(
    citations: List[Dict[str, Any]],
    retrieved_passages: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Keep only citations whose rule was actually retrieved for this question,
    and always attach that rule's real page metadata and a verified excerpt
    — never trust a rule, page number, or quote invented by the model.
    """
    passages_by_rule = {str(p.get("rule", "")).upper(): p for p in retrieved_passages}
    validated: List[Dict[str, Any]] = []

    for citation in citations:
        rule_id = str(citation.get("rule", "")).upper()
        passage = passages_by_rule.get(rule_id)
        if not passage:
            logger.warning(f"Dropping citation to rule '{rule_id}' not present in retrieved passages.")
            continue

        source_text = passage.get("text", "") or ""
        excerpt = (citation.get("excerpt") or "").strip()
        if not excerpt or excerpt[:40] not in source_text:
            excerpt = source_text[:300]

        validated.append({
            "rule": passage.get("rule"),
            "title": passage.get("title"),
            "page_start": passage.get("page_start"),
            "page_end": passage.get("page_end"),
            "excerpt": excerpt
        })

    return validated
