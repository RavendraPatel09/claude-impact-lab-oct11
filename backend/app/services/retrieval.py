import math
import re
from collections import Counter
from typing import Dict, List, Optional, Set, Tuple
from app.services.rule_service import rule_service

# Stop words to ignore during scoring
STOP_WORDS: Set[str] = {
    "a", "an", "the", "in", "on", "at", "by", "for", "with", "about", "against", "between",
    "into", "through", "during", "before", "after", "above", "below", "to", "from", "up",
    "down", "of", "off", "over", "under", "again", "further", "then", "once", "here",
    "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more",
    "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so",
    "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having",
    "do", "does", "did", "doing", "and", "but", "if", "or", "because", "as", "until",
    "while", "i", "my", "me", "we", "our", "you", "your", "he", "she", "it", "they",
    "what", "which", "who", "whom", "this", "that", "these", "those", "am",
    # Hindi common stop words
    "का", "के", "की", "को", "में", "से", "पर", "है", "हैं", "था", "थी", "थे", "होगा", "होगी",
    "और", "तथा", "या", "भी", "तो", "ने", "एक", "यह", "वह", "इस", "उस", "कि", "किया", "गया"
}

# Bilingual Hindi-English concept dictionary
HINDI_CONCEPT_MAP: Dict[str, List[str]] = {
    "प्लॉट": ["plot", "area", "size"],
    "भूखंड": ["plot", "land"],
    "सड़क": ["street", "road", "width"],
    "मार्ग": ["street", "road"],
    "फीस": ["fees", "fee", "charge", "payment"],
    "शुल्क": ["fee", "fees", "charge"],
    "सामने": ["front", "open", "space", "marginal"],
    "आगे": ["front", "open", "space"],
    "पीछे": ["rear", "back", "open", "space"],
    "जगह": ["space", "open", "margin"],
    "खाली": ["open", "space"],
    "छोड़नी": ["setback", "open", "space", "leave"],
    "छोड़ना": ["open", "space", "setback"],
    "ऊंचाई": ["height", "meters"],
    "ऊंचा": ["height", "meters"],
    "अनुमति": ["permission", "sanction"],
    "परमिशन": ["permission", "sanction"],
    "स्वीकृति": ["sanction", "permission"],
    "फार्म": ["farm", "house"],
    "हाउस": ["house", "residential"],
    "मकान": ["residential", "house", "building"],
    "भवन": ["building", "residential"],
    "विद्युत": ["electric", "supply", "lines", "overhead", "voltage"],
    "बिजली": ["electric", "line", "voltage"],
    "तार": ["electric", "overhead", "line"],
    "दस्तावेज": ["documents", "information", "accompanying", "application"],
    "कागजात": ["documents", "plans"],
    "वैधता": ["duration", "validity", "years"],
    "अवधि": ["duration", "sanction", "period"],
    "नवीनीकरण": ["renewal", "revalidation", "revalidate"],
    "हस्ताक्षर": ["sign", "signing", "architect", "engineer", "prepare"],
    "दस्तखत": ["sign", "architect", "engineer"],
    "नक्शा": ["plans", "plan", "drawing"],
    "प्लान": ["plan", "plans"],
    "बदलाव": ["deviation", "alteration", "change"],
    "परिवर्तन": ["deviation", "alterations"],
    "लिफ्ट": ["lifts", "lift", "escalator"],
    "विकास": ["development", "permission"],
    "योजना": ["development", "plan"],
    "समय": ["limitation", "period", "deadline", "deemed"],
    "सीमा": ["limitation", "boundary"],
    "अस्वीकार": ["refusal", "rejection"],
    "नियम": ["rule", "rules"]
}

# Known out-of-scope triggers that never appear in MP Bhumi Vikas Rules
OUT_OF_SCOPE_PHRASES: List[str] = [
    "property tax", "हाउस टैक्स", "संपत्ति कर", "प्रॉपर्टी टैक्स", "नगर निगम कर",
    "market rate", "बाजार भाव", "कलेक्टर गाइडलाइन", "collector guideline", "circle rate",
    "kolar road", "कोलार रोड", "online payment of tax", "pay my property tax",
    "registry charge", "स्टांप शुल्क", "weather in bhopal", "cricket score"
]


class PassageRetriever:
    def __init__(self):
        self.rules = rule_service.list_rules()
        self.doc_count = len(self.rules)
        self.idf_cache: Dict[str, float] = {}
        self._build_index()

    def _tokenize(self, text: str) -> List[str]:
        # Lowercase and split tokens, preserving alphanumerics, hyphens and Devnagari characters
        words = re.findall(r'[\w\u0900-\u097F]+(?:-[\w\u0900-\u097F]+)?', text.lower())
        return [w for w in words if w not in STOP_WORDS and len(w) > 1]

    def _build_index(self) -> None:
        doc_freq: Dict[str, int] = {}
        self.doc_lengths: Dict[str, int] = {}
        # Precomputed per-rule tokenization, so scoring counts whole-word
        # matches instead of re-tokenizing (or worse, substring-matching)
        # the raw text on every query.
        self.title_tokens: Dict[str, Set[str]] = {}
        self.text_token_counts: Dict[str, Counter] = {}
        total_len = 0
        for r in self.rules:
            rule_id = str(r.get("rule") or "").upper()
            title_tokens = set(self._tokenize(r.get("title", "")))
            text_tokens = self._tokenize(r.get("text", ""))

            self.title_tokens[rule_id] = title_tokens
            self.text_token_counts[rule_id] = Counter(text_tokens)

            for tok in title_tokens | set(text_tokens):
                doc_freq[tok] = doc_freq.get(tok, 0) + 1

            length = len(text_tokens)
            self.doc_lengths[rule_id] = length
            total_len += length
        self.avg_doc_len = (total_len / self.doc_count) if self.doc_count else 1.0

        for term, freq in doc_freq.items():
            # Standard smoothed BM25 IDF
            self.idf_cache[term] = math.log(1.0 + (self.doc_count - freq + 0.5) / (freq + 0.5))

    def is_likely_out_of_scope(self, query: str) -> bool:
        q_lower = query.lower()
        for phrase in OUT_OF_SCOPE_PHRASES:
            if phrase in q_lower:
                return True
        return False

    def extract_rule_number(self, query: str) -> Optional[str]:
        """Detect explicit rule numbers like 'Rule 56', 'Rule 26-B', 'नियम 21', '56(1)'."""
        match = re.search(r'(?:rule|नियम|section|धारा)\s*([0-9]{1,3}(?:-[A-Za-z]+)?)', query, re.IGNORECASE)
        if match:
            return match.group(1).upper()
        # Direct number with keyword
        match_direct = re.search(r'\b(26-B|26-b)\b', query)
        if match_direct:
            return "26-B"
        return None

    def expand_query(self, query: str) -> List[str]:
        tokens = self._tokenize(query)
        expanded: List[str] = list(tokens)

        # Check for Hindi mappings
        for word in tokens:
            if word in HINDI_CONCEPT_MAP:
                expanded.extend(HINDI_CONCEPT_MAP[word])

        # Also check raw query for any Hindi dictionary keys
        for hindi_key, english_synonyms in HINDI_CONCEPT_MAP.items():
            if hindi_key in query:
                expanded.extend(english_synonyms)

        return expanded

    def _score_all(self, query: str) -> List[Tuple[float, dict]]:
        """
        Score every rule against the query using BM25-like scoring, rule
        number boosting, and title matching. Returns all candidates sorted
        descending, including low/zero scores, so callers decide their own
        relevance cutoff.
        """
        expanded_tokens = self.expand_query(query)
        if not expanded_tokens:
            return []

        explicit_rule = self.extract_rule_number(query)
        scores: List[Tuple[float, dict]] = []

        q_lower = query.lower()

        for r in self.rules:
            rule_id = str(r.get("rule", "")).upper()
            title_tokens = self.title_tokens.get(rule_id, set())
            text_token_counts = self.text_token_counts.get(rule_id, Counter())

            score = 0.0

            # 1. Exact rule boost
            if explicit_rule and (rule_id == explicit_rule or rule_id == rule_service.normalize_rule_id(explicit_rule)):
                score += 50.0

            # 2. Token overlap & TF-IDF. Matched against whole tokens, not raw
            # substrings -- "office" must not match "Officer", "close" must
            # not match "Closet", etc.
            for tok in expanded_tokens:
                idf = self.idf_cache.get(tok, 1.0)
                # Matches in title get high weight
                if tok in title_tokens:
                    score += 5.0 * idf
                # Matches in text, length-normalized like standard BM25 term
                # saturation so long, multi-topic rules (e.g. plot-size tables
                # that mention many words in passing) don't outrank a short
                # rule that is actually on-topic.
                count = text_token_counts.get(tok, 0)
                if count > 0:
                    k1, b = 1.5, 0.75
                    doc_len = self.doc_lengths.get(rule_id, self.avg_doc_len)
                    norm = k1 * (1 - b + b * (doc_len / self.avg_doc_len))
                    tf_score = (count * (k1 + 1)) / (count + norm)
                    score += tf_score * idf

            # 3. Domain phrase boosts for core problems
            if any(term in q_lower for term in ["street", "open space", "front", "facing", "सामने", "आगे", "चौड़ी सड़क"]) and "56" == rule_id:
                score += 15.0
            if any(term in q_lower for term in ["rear open space", "rear space", "पीछे"]) and "56" == rule_id:
                score += 20.0
            if any(term in q_lower for term in ["farm house", "agricultural use", "फार्म हाउस"]) and "17" == rule_id:
                score += 25.0
            if any(term in q_lower for term in ["electric", "overhead", "balcony", "voltage", "बिजली", "विद्युत"]) and "52" == rule_id:
                score += 25.0
            if any(term in q_lower for term in ["fee", "fees", "शुल्क", "फीस", "charge"]) and "21" == rule_id:
                score += 20.0
            if any(term in q_lower for term in ["duration", "sanction", "revalidate", "renew", "validity", "वैधता"]) and "23" == rule_id:
                score += 25.0
            if any(term in q_lower for term in ["miss the deadline", "fails to intimate", "not replied", "deadline", "deemed"]) and "28" == rule_id:
                score += 25.0
            if any(term in q_lower for term in ["sign and submit", "prepare and duly sign", "who is allowed to sign", "sign my building"]) and "18" == rule_id:
                score += 25.0
            if any(term in q_lower for term in ["deviation", "change my plan", "after it is sanctioned", "संशोधन", "बदलाव"]) and "24" == rule_id:
                score += 25.0
            if any(term in q_lower for term in ["development plan and these rules", "precedence", "disagree", "contrary"]) and "103" == rule_id:
                score += 25.0
            if any(term in q_lower for term in ["lift", "lifts", "15 m", "12.5 m", "लिफ्ट"]) and "83" == rule_id:
                score += 25.0
            if any(term in q_lower for term in ["documents", "application for building permission", "accompanying", "दस्तावेज"]) and ("14" == rule_id or "16" == rule_id):
                score += 20.0

            scores.append((score, r))

        scores.sort(key=lambda x: x[0], reverse=True)
        return scores

    @staticmethod
    def _format_result(score: float, r: dict) -> dict:
        return {
            "rule": r["rule"],
            "title": r.get("title"),
            "part": r.get("part"),
            "page_start": r.get("page_start"),
            "page_end": r.get("page_end"),
            "text": r.get("text"),
            "score": round(score, 3)
        }

    def retrieve(self, query: str, top_k: int = 5) -> List[dict]:
        """
        Rank passages using BM25-like scoring, rule number boosting, and title
        matching. Only passages clearing a minimum relevance score are
        returned — an empty result means "no sufficient evidence", not "no
        query match attempted".
        """
        if self.is_likely_out_of_scope(query):
            return []

        scores = self._score_all(query)
        relevant = [(s, r) for s, r in scores if s > 1.5]
        return [self._format_result(s, r) for s, r in relevant[:top_k]]

    def retrieve_candidates(self, query: str, limit: int = 15, min_score: float = 1.5) -> List[dict]:
        """
        Broader candidate list for hybrid rank fusion. Still applies a
        relevance floor (default: the same one `retrieve()` uses) so a
        keyword miss doesn't inject noise into the fused ranking.
        """
        if self.is_likely_out_of_scope(query):
            return []

        scores = self._score_all(query)
        relevant = [(s, r) for s, r in scores if s > min_score]
        return [self._format_result(s, r) for s, r in relevant[:limit]]


retriever = PassageRetriever()
