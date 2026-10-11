import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app


class TestAskEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_empty_question_rejected(self):
        response = self.client.post("/api/ask", json={"question": "", "language": "en"})
        self.assertEqual(response.status_code, 422)

    def test_whitespace_only_question_rejected(self):
        response = self.client.post("/api/ask", json={"question": "   \n\t  ", "language": "en"})
        self.assertEqual(response.status_code, 422)

    def test_unsupported_language_rejected(self):
        response = self.client.post("/api/ask", json={"question": "What is Rule 56?", "language": "fr"})
        self.assertEqual(response.status_code, 422)

    def test_too_long_question_rejected(self):
        long_q = "A" * 1005
        response = self.client.post("/api/ask", json={"question": long_q, "language": "en"})
        self.assertEqual(response.status_code, 422)

    def test_valid_english_question_schema(self):
        response = self.client.post(
            "/api/ask",
            json={"question": "What documents are required for building permission?", "language": "en"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("answer", data)
        self.assertIn("status", data)
        self.assertIn("citations", data)
        self.assertIn("warnings", data)
        self.assertEqual(data.get("source_version"), "2025-03-06")
        self.assertIsInstance(data["citations"], list)
        self.assertGreater(len(data["citations"]), 0)

    def test_valid_hindi_question_schema(self):
        response = self.client.post(
            "/api/ask",
            json={"question": "बिल्डिंग परमिशन की फीस कितनी है और किस नियम में लिखी है?", "language": "hi"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "answered")
        self.assertGreater(len(data["citations"]), 0)
        self.assertEqual(data["citations"][0]["rule"], "21")

    def test_out_of_scope_question(self):
        response = self.client.post(
            "/api/ask",
            json={"question": "How do I pay my property tax online?", "language": "en"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "insufficient_evidence")
        self.assertEqual(len(data["citations"]), 0)

    def test_amendment_warning_detection(self):
        response = self.client.post(
            "/api/ask",
            json={
                "question": "Do I need separate development permission for a 300 sq m plot that matches the Development Plan? (Tip: this changed in August 2026.)",
                "language": "en"
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(len(data["warnings"]), 0)
        self.assertTrue(any("28 August 2026" in w for w in data["warnings"]))

    def test_ai_service_error_handling(self):
        with patch("app.api.routes.ai_service.answer_question", side_effect=RuntimeError("Database down")):
            response = self.client.post(
                "/api/ask",
                json={"question": "What is Rule 56?", "language": "en"}
            )
            self.assertEqual(response.status_code, 500)
            self.assertEqual(response.json(), {"detail": "The answer service is temporarily unavailable. Please try again."})


if __name__ == "__main__":
    unittest.main()
