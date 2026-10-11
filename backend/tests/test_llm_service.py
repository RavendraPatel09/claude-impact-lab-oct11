import os
import unittest
from unittest.mock import MagicMock, patch

from app.core.config import settings
from app.services.llm_service import (
    LLMUnavailableError,
    generate_grounded_answer,
    validate_citations,
)

SAMPLE_PASSAGES = [
    {
        "rule": "17",
        "title": "Permission of farm House",
        "page_start": 34,
        "page_end": 34,
        "text": "17. Permission of farm House.- In any area designated for agricultural use, Farm Houses shall be permissible subject to: (a) Minimum size of the plot shall be 0.40 hectare."
    },
    {
        "rule": "56",
        "title": "Residential Buildings",
        "page_start": 77,
        "page_end": 80,
        "text": "56. Residential Buildings.-Open Spaces,- Every Residential Building having height up to 12.5 meters, facing street shall have a front open space."
    }
]


class TestValidateCitations(unittest.TestCase):
    def test_keeps_citation_for_retrieved_rule(self):
        citations = [{"rule": "17", "excerpt": "Minimum size of the plot shall be 0.40 hectare"}]
        validated = validate_citations(citations, SAMPLE_PASSAGES)
        self.assertEqual(len(validated), 1)
        self.assertEqual(validated[0]["rule"], "17")
        self.assertEqual(validated[0]["page_start"], 34)
        self.assertEqual(validated[0]["page_end"], 34)

    def test_drops_citation_for_rule_not_retrieved(self):
        citations = [{"rule": "999", "excerpt": "invented text"}]
        validated = validate_citations(citations, SAMPLE_PASSAGES)
        self.assertEqual(validated, [])

    def test_replaces_excerpt_not_found_in_source(self):
        citations = [{"rule": "56", "excerpt": "This sentence was invented by the model and never appears in Rule 56."}]
        validated = validate_citations(citations, SAMPLE_PASSAGES)
        self.assertEqual(len(validated), 1)
        self.assertIn(validated[0]["excerpt"], SAMPLE_PASSAGES[1]["text"])

    def test_page_metadata_always_comes_from_dataset_not_model(self):
        # Even if the model hallucinates different page numbers, the real
        # dataset page range must win.
        citations = [{"rule": "17", "page_start": 1, "page_end": 2, "excerpt": "0.40 hectare"}]
        validated = validate_citations(citations, SAMPLE_PASSAGES)
        self.assertEqual(validated[0]["page_start"], 34)
        self.assertEqual(validated[0]["page_end"], 34)


class TestGenerateGroundedAnswer(unittest.TestCase):
    def test_raises_when_no_api_key_configured(self):
        with patch.object(settings, "ANTHROPIC_API_KEY", ""):
            with self.assertRaises(LLMUnavailableError):
                generate_grounded_answer("What is the minimum farm house plot size?", "en", SAMPLE_PASSAGES)

    def test_raises_when_no_passages_supplied(self):
        with patch.object(settings, "ANTHROPIC_API_KEY", "fake-key-for-test"):
            with self.assertRaises(LLMUnavailableError):
                generate_grounded_answer("Some question", "en", [])

    def test_successful_mocked_call_returns_parsed_dict(self):
        mock_tool_block = MagicMock()
        mock_tool_block.type = "tool_use"
        mock_tool_block.input = {
            "answer": "The minimum farm house plot size is 0.40 hectare under Rule 17.",
            "status": "answered",
            "citations": [{"rule": "17", "excerpt": "Minimum size of the plot shall be 0.40 hectare"}]
        }
        mock_message = MagicMock()
        mock_message.content = [mock_tool_block]

        mock_client = MagicMock()
        mock_client.messages.create.return_value = mock_message

        with patch.object(settings, "ANTHROPIC_API_KEY", "fake-key-for-test"):
            with patch("anthropic.Anthropic", return_value=mock_client):
                result = generate_grounded_answer(
                    "What is the minimum farm house plot size?", "en", SAMPLE_PASSAGES
                )

        self.assertEqual(result["status"], "answered")
        self.assertIn("0.40 hectare", result["answer"])
        self.assertEqual(result["citations"][0]["rule"], "17")

    def test_raises_when_llm_response_missing_tool_use(self):
        mock_message = MagicMock()
        mock_message.content = []  # no tool_use block
        mock_client = MagicMock()
        mock_client.messages.create.return_value = mock_message

        with patch.object(settings, "ANTHROPIC_API_KEY", "fake-key-for-test"):
            with patch("anthropic.Anthropic", return_value=mock_client):
                with self.assertRaises(LLMUnavailableError):
                    generate_grounded_answer("Some question", "en", SAMPLE_PASSAGES)

    def test_raises_when_api_call_raises(self):
        mock_client = MagicMock()
        mock_client.messages.create.side_effect = RuntimeError("network error")

        with patch.object(settings, "ANTHROPIC_API_KEY", "fake-key-for-test"):
            with patch("anthropic.Anthropic", return_value=mock_client):
                with self.assertRaises(LLMUnavailableError):
                    generate_grounded_answer("Some question", "en", SAMPLE_PASSAGES)


@unittest.skipUnless(
    os.getenv("ANTHROPIC_API_KEY"),
    "Requires a real ANTHROPIC_API_KEY to hit the live API; skipped otherwise."
)
class TestRealLLMIntegration(unittest.TestCase):
    """
    One real, non-mocked call to prove end-to-end grounding actually works
    against the live Anthropic API, for a question that is deliberately NOT
    one of the 17 hand-verified sample questions.
    """

    def test_real_call_grounds_answer_in_supplied_passage(self):
        result = generate_grounded_answer(
            "Is it legal to build a small house for my family on a piece of farmland?",
            "en",
            SAMPLE_PASSAGES
        )
        self.assertIn(result["status"], ["answered", "insufficient_evidence", "needs_clarification"])
        if result["status"] == "answered":
            rule_ids = [c["rule"] for c in result["citations"]]
            self.assertTrue(all(rid in ("17", "56") for rid in rule_ids))


if __name__ == "__main__":
    unittest.main()
