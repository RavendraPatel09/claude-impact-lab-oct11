import unittest
from fastapi.testclient import TestClient
from app.main import app


class TestSampleQuestions(unittest.TestCase):
    """
    Evaluates all 17 sample questions from track-1-bhumi-vikas-sahayak/resources/sample_questions.md.
    """
    def setUp(self):
        self.client = TestClient(app)

    def test_q1_street_width_front_setback(self):
        q = "My house faces a 10 m wide street and will be 9 m tall. How much open space do I leave at the front?"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "answered")
        self.assertIn("3.6", data["answer"])
        self.assertTrue(any(c["rule"] == "56" for c in data["citations"]))

    def test_q2_farm_house_norms(self):
        q = "I want a farm house on agricultural land. What is the minimum plot size and the maximum FAR?"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "answered")
        self.assertIn("0.40", data["answer"])
        self.assertIn("0.10", data["answer"])
        self.assertTrue(any(c["rule"] == "17" for c in data["citations"]))

    def test_q3_sanction_duration_and_renewal(self):
        q = "My development permission was granted in 2023. How long does it stay valid, and how many times can I renew it?"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "answered")
        self.assertIn("three", data["answer"].lower())
        self.assertTrue(any(c["rule"] == "23" for c in data["citations"]))

    def test_q4_authority_missed_deadline(self):
        q = "I applied for building permission and the authority has not replied. What happens if they miss the deadline?"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "answered")
        self.assertIn("deemed", data["answer"].lower())
        self.assertTrue(any(c["rule"] == "28" for c in data["citations"]))

    def test_q5_electric_line_clearance(self):
        q = "How far must my balcony stay from a low-voltage overhead electric line, vertically and horizontally?"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "answered")
        self.assertIn("2.5", data["answer"])
        self.assertIn("1.2", data["answer"])
        self.assertTrue(any(c["rule"] == "52" for c in data["citations"]))

    def test_q6_who_signs_plans(self):
        q = "Who is allowed to sign and submit my building plans?"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "answered")
        self.assertIn("architect", data["answer"].lower())
        self.assertTrue(any(c["rule"] == "18" for c in data["citations"]))

    def test_q7_application_documents(self):
        q = "What documents go with an application for building permission?"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "answered")
        self.assertTrue(any(c["rule"] in ("14", "16") for c in data["citations"]))

    def test_q8_fee_for_residential_house(self):
        q = "What is the fee for building permission for a residential house?"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "answered")
        self.assertTrue(any(c["rule"] == "21" for c in data["citations"]))

    def test_q9_change_plan_after_sanction(self):
        q = "Can I change my plan after it is sanctioned?"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "answered")
        self.assertIn("deviation", data["answer"].lower())
        self.assertTrue(any(c["rule"] == "24" for c in data["citations"]))

    def test_q10_rear_open_space_150_sqm(self):
        q = "What is the minimum rear open space for a 150 sq m residential plot?"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "answered")
        self.assertIn("1.50", data["answer"])
        self.assertTrue(any(c["rule"] == "56" for c in data["citations"]))

    def test_q11_300_sqm_plot_amendment_warning(self):
        q = "Do I need separate development permission for a 300 sq m plot that matches the Development Plan? (Tip: this changed in August 2026.)"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("28 August 2026", str(data["warnings"]))

    def test_q12_development_plan_precedence(self):
        q = "Which rule decides what happens when the Development Plan and these rules disagree?"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "answered")
        self.assertTrue(any(c["rule"] == "103" for c in data["citations"]))

    def test_q13_lifts_in_tall_building(self):
        q = "What are the rules for lifts in a building taller than 15 m?"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "answered")
        self.assertTrue(any(c["rule"] == "83" for c in data["citations"]))

    def test_q14_hindi_plot_200_sqm_street_9m(self):
        q = "मेरा प्लॉट 200 वर्ग मीटर का है और सामने 9 मीटर चौड़ी सड़क है। आगे कितनी जगह खाली छोड़नी होगी?"
        res = self.client.post("/api/ask", json={"question": q, "language": "hi"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "answered")
        self.assertIn("3.0", data["answer"])
        self.assertTrue(any(c["rule"] == "56" for c in data["citations"]))

    def test_q15_hindi_fees(self):
        q = "बिल्डिंग परमिशन की फीस कितनी है और किस नियम में लिखी है?"
        res = self.client.post("/api/ask", json={"question": q, "language": "hi"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "answered")
        self.assertTrue(any(c["rule"] == "21" for c in data["citations"]))

    def test_q16_outside_property_tax(self):
        q = "How do I pay my property tax online?"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "insufficient_evidence")
        self.assertEqual(len(data["citations"]), 0)

    def test_q17_outside_market_rate(self):
        q = "What is the current market rate for land in Kolar Road, Bhopal?"
        res = self.client.post("/api/ask", json={"question": q, "language": "en"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "insufficient_evidence")
        self.assertEqual(len(data["citations"]), 0)


if __name__ == "__main__":
    unittest.main()
