import unittest
from unittest.mock import patch

from app.services.hybrid_retrieval import hybrid_retrieve, _reciprocal_rank_fusion


class TestReciprocalRankFusion(unittest.TestCase):
    def test_passage_ranked_in_both_lists_wins(self):
        list_a = [{"rule": "56", "score": 10}, {"rule": "17", "score": 8}]
        list_b = [{"rule": "17", "score": 0.9}, {"rule": "99", "score": 0.5}]
        fused = _reciprocal_rank_fusion([list_a, list_b])
        rule_order = [p["rule"] for p in fused]
        # "17" ranks #2 in list_a and #1 in list_b -> should beat "56" (#1 in
        # only one list) and "99" (#2 in only one list).
        self.assertEqual(rule_order[0], "17")

    def test_empty_lists_produce_empty_result(self):
        self.assertEqual(_reciprocal_rank_fusion([]), [])
        self.assertEqual(_reciprocal_rank_fusion([[], []]), [])


class TestHybridRetrieve(unittest.TestCase):
    def test_out_of_scope_query_returns_empty(self):
        results = hybrid_retrieve("What is the current market rate for land in Kolar Road, Bhopal?")
        self.assertEqual(results, [])

    def test_empty_query_returns_empty(self):
        self.assertEqual(hybrid_retrieve(""), [])
        self.assertEqual(hybrid_retrieve("   "), [])

    def test_paraphrased_question_finds_right_rule(self):
        results = hybrid_retrieve("Can I construct a house on this agricultural plot?", top_k=3)
        self.assertTrue(len(results) > 0)
        rule_ids = [r["rule"] for r in results]
        self.assertIn("17", rule_ids)

    def test_degrades_to_keyword_only_if_semantic_fails(self):
        with patch(
            "app.services.hybrid_retrieval.semantic_retriever.search",
            side_effect=RuntimeError("model load failed")
        ):
            results = hybrid_retrieve("What is the fee for building permission?", top_k=3)
        self.assertTrue(len(results) > 0)
        self.assertIn("21", [r["rule"] for r in results])


if __name__ == "__main__":
    unittest.main()
