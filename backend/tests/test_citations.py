import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.services.rule_service import rule_service


class TestCitations(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_citation_integrity_and_existence(self):
        response = self.client.post(
            "/api/ask",
            json={"question": "What is the fee for building permission for a residential house?", "language": "en"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        citations = data["citations"]
        self.assertGreater(len(citations), 0)

        for cit in citations:
            rule_id = cit["rule"]
            rule_record = rule_service.get_rule(rule_id)
            self.assertIsNotNone(rule_record, f"Citation references non-existent rule {rule_id}")

            # Verify page bounds
            if cit["page_start"] is not None:
                self.assertGreaterEqual(cit["page_start"], 1)
                self.assertLessEqual(cit["page_start"], 108)
                self.assertEqual(cit["page_start"], rule_record.get("page_start"))

            if cit["page_end"] is not None:
                self.assertEqual(cit["page_end"], rule_record.get("page_end"))

            # Excerpt must not be empty
            self.assertTrue(len(cit["excerpt"]) > 10)

    def test_citations_for_rule_56_front_setback(self):
        response = self.client.post(
            "/api/ask",
            json={"question": "My house faces a 10 m wide street and will be 9 m tall. How much open space do I leave at the front?", "language": "en"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        citations = data["citations"]
        self.assertEqual(len(citations), 1)
        cit = citations[0]
        self.assertEqual(cit["rule"], "56")
        self.assertEqual(cit["page_start"], 77)
        self.assertEqual(cit["page_end"], 80)
        self.assertIn("Front open spaces", cit["excerpt"])

    def test_no_hallucinated_citations_for_unrelated_queries(self):
        response = self.client.post(
            "/api/ask",
            json={"question": "What is the current market rate for land in Kolar Road, Bhopal?", "language": "en"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "insufficient_evidence")
        self.assertEqual(data["citations"], [])


if __name__ == "__main__":
    unittest.main()
