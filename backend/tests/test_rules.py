import unittest
from fastapi.testclient import TestClient
from app.main import app


class TestRulesEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_list_all_rules(self):
        response = self.client.get("/api/rules")
        self.assertEqual(response.status_code, 200)
        rules = response.json()
        self.assertEqual(len(rules), 106)
        rule_ids = [r["rule"] for r in rules]
        self.assertIn("1", rule_ids)
        self.assertIn("56", rule_ids)
        self.assertIn("26-B", rule_ids)
        self.assertIn("105", rule_ids)

    def test_get_existing_rule_56(self):
        response = self.client.get("/api/rules/56")
        self.assertEqual(response.status_code, 200)
        rule = response.json()
        self.assertEqual(rule["rule"], "56")
        self.assertEqual(rule["title"], "Residential Buildings")
        self.assertEqual(rule["page_start"], 77)
        self.assertEqual(rule["page_end"], 80)
        self.assertIn("Exterior open spaces", rule["text"])

    def test_get_rule_26_b(self):
        response = self.client.get("/api/rules/26-B")
        self.assertEqual(response.status_code, 200)
        rule = response.json()
        self.assertEqual(rule["rule"], "26-B")
        self.assertIn("Architect", rule["title"])

    def test_get_nonexistent_rule_returns_404(self):
        response = self.client.get("/api/rules/9999")
        self.assertEqual(response.status_code, 404)
        self.assertIn("not found", response.json()["detail"].lower())

    def test_search_rules(self):
        response = self.client.get("/api/search?q=electric&top_k=5")
        self.assertEqual(response.status_code, 200)
        results = response.json()
        self.assertGreater(len(results), 0)
        rules_found = [r["rule"] for r in results]
        self.assertIn("52", rules_found)

    def test_sources_endpoint(self):
        response = self.client.get("/api/sources")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["source_version"], "2025-03-06")
        self.assertEqual(len(data["documents"]), 2)
        self.assertGreater(len(data["limitations"]), 0)
        self.assertGreater(len(data["unverified_amendments"]), 0)


if __name__ == "__main__":
    unittest.main()
