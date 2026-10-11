# AI & Data Engineering — Verification Status

This folder holds the planning guide (`AI_DATA_ENGINEERING_GUIDE.md`). The actual
AI/retrieval code is NOT here — it lives in `backend/app/services/`, where it is
imported directly by the FastAPI app (`backend/app/main.py`, `backend/app/api/routes.py`).
Moving it here would break that integration, so this file instead tracks what
was verified and fixed against the guide's checklist, with pointers to the
real files.

## Where each guide phase actually lives

| Guide concept | Real file |
|---|---|
| Ingestion / validation (Phase 4) | `backend/app/services/rule_service.py` |
| Keyword retrieval (Phase 5–7) | `backend/app/services/retrieval.py` |
| Semantic + hybrid retrieval (Phase 8, optional) | `backend/app/services/semantic_retrieval.py`, `backend/app/services/hybrid_retrieval.py` |
| RAG answer generation (Phase 9) | `backend/app/services/ai_service.py` (specialized cases + deterministic fallback), `backend/app/services/llm_service.py` (real LLM call, optional) |
| Citation validation (Phase 10) | `backend/tests/test_citations.py` + `validate_citations()` in `llm_service.py` |
| Amendment / source-version warning (Phase 11) | `backend/app/services/source_version.py` |
| Sample-question evaluation (Phase 12) | `backend/tests/test_sample_questions.py` |
| `answer_question(question, language)` contract (Phase 13) | `AIService.answer_question` in `ai_service.py`, called from `backend/app/api/routes.py` |

## What was verified (2026-10-11)

- Installed deps in a fresh `backend/.venv` and ran the full suite:
  `cd backend && source .venv/bin/activate && python -m pytest tests/ -q`
  → **44/44 passed**, including all 17 sample questions from
  `track-1-bhumi-vikas-sahayak/resources/sample_questions.md`.
- Ran a dataset validation pass against the real
  `track-1-bhumi-vikas-sahayak/data/bhumi_vikas_rules.jsonl`:
  106 records, 0 missing rule/title/text/page fields, 0 duplicate rule IDs.

## What was fixed

- **Retrieval length-normalization bug** (`retrieval.py`): the keyword scorer
  summed raw TF-IDF with no document-length normalization, so long,
  multi-topic rules could outrank short rules that were actually on-topic.
  Reproduced with the query *"What is the minimum parking requirement for a
  residential building?"* — it returned Rule 53 ("Size of plots and other
  norms") above Rule 63 ("Parking Floors"), the rule that's actually about
  parking. Added standard BM25-style length normalization
  (`k1=1.5, b=0.75`); Rule 53 no longer dominates, and all 44 tests still
  pass. Removed two unused variables flagged by lint in the same function.
- Added `backend/.gitignore` (`.venv/`, `__pycache__/`, `.env`,
  `.pytest_cache/`) — none existed, so a careless `git add -A` could have
  committed the virtualenv or `.env`.

## Known limitations (not fixed — bigger than a bug fix)

1. **Keyword ranking on novel questions** is still imperfect. For the
   parking example above, the correct rule (63) now ranks 3rd rather than
   1st — generic high-idf words in the query (e.g. "requirement") can still
   out-pull a specific content word (e.g. "parking") in titles. Semantic
   retrieval (added below) closes most of this gap for paraphrases, but not
   this specific case, since "parking" vs. generic words is a lexical
   problem, not a paraphrase problem.

## Update (2026-10-11, same day, follow-up session): semantic retrieval + LLM grounding

Added the two phases the first pass deliberately deferred (guide Phase 7–9),
after re-verifying the first pass's 44/44 result still held.

- **Semantic retrieval** — `backend/app/services/semantic_retrieval.py`
  (multilingual `sentence-transformers` + FAISS, lazily loaded) and
  `backend/app/services/hybrid_retrieval.py` (reciprocal rank fusion over
  keyword + semantic). Verified it actually generalizes: the paraphrase
  *"Can I construct a house on this agricultural plot?"* (no literal "farm
  house" words) correctly surfaces Rule 17 at the top, and *"How much space
  must I keep between my building and overhead power cables?"* correctly
  surfaces Rule 52 — neither matched any hardcoded specialized-case trigger
  in `ai_service.py`, so this is real retrieval, not the memorized template
  path.
- **Found and fixed a real bug while calibrating this**: the original
  keyword scorer counted term frequency with `text_lower.count(tok)` — a
  raw substring count, not a word-boundary count. A query containing
  "office" would match "Officer" as a substring, "close" would match
  "Closet", etc. Reproduced with *"What time does the Bhopal municipal
  office close on Fridays?"*, which previously scored Rule 71 ("Bathroom
  and Water Closets") at 27.3 — the highest score of any candidate — purely
  from "close" matching inside "Closets". Fixed by precomputing real
  tokenized term counts per rule at index-build time instead of
  substring-scanning raw text per query. All 44 original tests still pass
  after the fix.
- Calibrated the hybrid-fusion candidate floor (keyword score > 15, semantic
  cosine > 0.5) against measured scores: genuine matches land around
  20–30 / 0.55–0.70, generic-word false positives on out-of-domain
  questions top out around 6 / 0.45. This floor only applies inside
  `hybrid_retrieve()` — the existing `/api/search` endpoint's
  `retriever.retrieve()` keeps its original >1.5 threshold unchanged, so
  that endpoint's behavior (and the tests that exercise it) is untouched.
- **LLM-grounded generation** — `backend/app/services/llm_service.py` calls
  Anthropic's API with forced tool-use (schema-guaranteed JSON, not
  free-text parsing) for questions outside the 17 hand-verified sample
  questions. `validate_citations()` then re-checks every citation against
  the actually-retrieved passages: a rule the model didn't retrieve is
  dropped, and page numbers/excerpts always come from the real dataset,
  never from the model's output. If `ANTHROPIC_API_KEY` is unset, or the
  call/parse fails for any reason, `ai_service.py` falls back to the
  original deterministic "top retrieved passage" excerpt — the LLM path is
  strictly additive, never a single point of failure for the `/api/ask`
  endpoint.
- Added `tests/test_semantic_retrieval.py`, `tests/test_hybrid_retrieval.py`,
  `tests/test_llm_service.py` (citation validation is pure-function tested;
  the LLM call itself is tested against a mocked Anthropic client, plus one
  real end-to-end call gated behind `@unittest.skipUnless(os.getenv(...))`
  so it only runs once a real key is configured), and
  `tests/test_novel_questions.py` (full `/api/ask` round-trip on questions
  deliberately absent from `sample_questions.md`, to prove generalization
  rather than re-testing the memorized 17).
- Full suite as of this update: **67 collected, 66 passed, 1 skipped**
  (the real-API integration test, skipped because no `ANTHROPIC_API_KEY`
  was configured at the time of this run — see `backend/.env.example` for
  how to enable it).

### Still not done

- The hand-written specialized-case templates in `ai_service.py` for the 17
  sample questions are untouched — they still answer first, before hybrid
  retrieval or the LLM ever run. This was a deliberate choice carried over
  from the first pass (deterministic answers for known questions are safer
  than letting an LLM re-derive them), not something this update addressed.
- No evaluation was run comparing keyword-only vs. hybrid retrieval across
  a broader novel-question set beyond the handful used for calibration and
  the 4 in `test_novel_questions.py`. The thresholds are grounded in
  measured scores, not an exhaustive sweep.

## How to reproduce

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m pytest tests/ -v
```
