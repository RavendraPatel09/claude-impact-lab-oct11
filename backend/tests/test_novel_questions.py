import unittest
from fastapi.testclient import TestClient

from app.main import app


class TestNovelQuestions(unittest.TestCase):
    """
    Proves generalization beyond the 17 hand-verified sample questions in
    test_sample_questions.py. These are deliberately phrased so they do NOT
    match any hardcoded specialized case in ai_service._answer_specialized_cases
    — they must be answered purely through hybrid (keyword + semantic)
    retrieval, with or without a configured LLM.
    """

    def setUp(self):
        self.client = TestClient(app)

    def test_paraphrased_farm_house_question(self):
        q = "Is it legal to build a small house for my family on a piece of farmland?"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn(data["status"], ["answered", "source_version_warning"])
        self.assertTrue(any(c["rule"] == "17" for c in data["citations"]))

    def test_paraphrased_electric_clearance_question(self):
        q = "How much space must I keep between my building and overhead power cables?"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn(data["status"], ["answered", "source_version_warning"])
        self.assertTrue(any(c["rule"] == "52" for c in data["citations"]))

    def test_every_citation_traces_to_a_real_rule(self):
        q = "Is it legal to build a small house for my family on a piece of farmland?"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        data = res.json()
        from app.services.rule_service import rule_service
        for citation in data["citations"]:
            rule_record = rule_service.get_rule(citation["rule"])
            self.assertIsNotNone(rule_record, f"Citation references non-existent rule {citation['rule']}")
            self.assertEqual(citation["page_start"], rule_record.get("page_start"))
            self.assertEqual(citation["page_end"], rule_record.get("page_end"))

    def test_still_abstains_on_genuinely_unrelated_question(self):
        q = "What time does the Bhopal municipal office close on Fridays?"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        # Either explicitly out-of-scope, or no passage clears the relevance
        # floor -- never a fabricated "answered" with invented citations.
        if data["status"] == "answered":
            self.fail(
                "Expected insufficient_evidence/needs_clarification for an "
                f"unrelated question, got 'answered' with citations={data['citations']}"
            )


if __name__ == "__main__":
    unittest.main()
