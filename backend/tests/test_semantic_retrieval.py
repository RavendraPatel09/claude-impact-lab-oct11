import unittest

from app.services.semantic_retrieval import semantic_retriever


class TestSemanticRetrieval(unittest.TestCase):
    """
    Exercises the real embedding model (not mocked) to prove it generalizes
    past exact keyword overlap — the whole point of adding it. Downloads /
    loads the model on first call, which is slower than the keyword tests.
    """

    def test_paraphrased_farm_house_question(self):
        results = semantic_retriever.search(
            "Can I construct a house on this agricultural plot?",
            top_k=5
        )
        self.assertTrue(len(results) > 0)
        rule_ids = [r["rule"] for r in results]
        self.assertIn("17", rule_ids)

    def test_empty_query_returns_empty(self):
        self.assertEqual(semantic_retriever.search("", top_k=5), [])
        self.assertEqual(semantic_retriever.search("   ", top_k=5), [])

    def test_results_have_expected_shape(self):
        results = semantic_retriever.search("building permission documents", top_k=3)
        for r in results:
            self.assertIn("rule", r)
            self.assertIn("text", r)
            self.assertIn("score", r)
            self.assertIsInstance(r["score"], float)


if __name__ == "__main__":
    unittest.main()
