# Bhumi Vikas Sahayak — Backend API

FastAPI backend service for **Bhumi Vikas Sahayak** (Track 1, Claude Impact Lab × Cerebras Café Compute, Bhopal).

The service serves a building-permission counter clerk at the Bhopal Municipal Corporation. A citizen or clerk asks a building regulation question in English or Hindi, and the backend retrieves grounded statutory passages from the official **MP Bhumi Vikas Rules, 2012** (consolidated through 6 March 2025) and returns plain-language answers with verified rule citations, PDF page numbers, and version warnings.

---

## 1. Quick Start (Run in 3 Steps)

### Prerequisites
- Python 3.11+
- Virtual environment

### Step 1: Clone repository & navigate to backend
```bash
cd backend
```

### Step 2: Create virtual environment & install dependencies
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

`requirements.txt` includes two optional-at-runtime groups: `sentence-transformers`/`faiss-cpu` for semantic retrieval, and `anthropic` for LLM-grounded answers. Both degrade gracefully if missing or unconfigured — see section 7.

### Step 3: Run the API server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Open interactive Swagger API docs at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

## 2. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint returning `{"status": "ok"}`. |
| `POST` | `/api/ask` | Primary Q&A endpoint taking `question` and `language` (`en` or `hi`). Returns grounded answer, citations, status, and warnings. |
| `GET` | `/api/search` | Lexical and semantic search across the 106 rules (`?q=...&top_k=5`). |
| `GET` | `/api/rules` | Directory listing of all 106 statutory rules with metadata. |
| `GET` | `/api/rules/{rule_number}` | Retrieve full rule text and PDF page metadata (e.g. `/api/rules/56`, `/api/rules/26-B`). Returns `404` if not found. |
| `GET` | `/api/sources` | Metadata on source documents, consolidation cut-off dates, and coverage limits. |
| `POST` | `/api/calculate/setback` | Deterministic setback calculator for Rule 56 (front, rear, side open spaces). |
| `GET` | `/api/calculate/fee` | Deterministic fee calculator for Rule 21 residential building permission. |

---

## 3. Request & Response Specification

### `POST /api/ask`

**Request:**
```json
{
  "question": "My house faces a 10 m wide street and will be 9 m tall. How much open space do I leave at the front?",
  "language": "en"
}
```

**Response (`200 OK`):**
```json
{
  "answer": "Under Rule 56(1)(a), Table 13 of the MP Bhumi Vikas Rules, 2012, for a residential building up to 12.5 meters in height facing a 10-meter wide street (which falls in the 'More than 9.0 meters and up to 12 meters' category), the minimum required front open space is 3.6 meters.",
  "status": "answered",
  "citations": [
    {
      "rule": "56",
      "title": "Residential Buildings",
      "page_start": 77,
      "page_end": 80,
      "excerpt": "56. Residential Buildings.-Open Spaces,- Exterior open spaces for buildings having height up to 12.5 meters. (1) Front open spaces,- (a) Every Residential Building having height up to 12.5 meters, facing street shall have a front open space: 2. More than 9.0 meters and up to 12 meters -> 3.6 meters."
    }
  ],
  "warnings": [],
  "source_version": "2025-03-06"
}
```

### Possible `status` Values:
- `answered`: Valid answer grounded in retrieved passages with verified citations.
- `insufficient_evidence`: The rulebook does not contain provisions on this topic (e.g., property tax, market rate) or no matching evidence exists.
- `needs_clarification`: Vital parameters are missing.
- `source_version_warning`: Answer is provided from the 2025 rulebook but is accompanied by a warning regarding subsequent amendments (such as the 28 August 2026 amendment to Rule 2(5)(c)).

---

## 4. Source Version & Legal Boundary

- **Consolidated Cut-off Date:** 6 March 2025.
- **Subsequent Amendments:** On 28 August 2026, the Government of Madhya Pradesh published an amendment to Rule 2(5)(c) affecting development permission requirements for plots up to 500 sq. m. matching the Development Plan.
- Queries potentially touching this provision automatically include a prominent notice advising verification with the latest MP Rajpatra or the building permission authority.
- The system never presents its answers as formal legal permits or official sanctions.

---

## 5. Deterministic Calculation Module

Maths belongs in deterministic code, not in language model hallucination:
- **Rule 56(1) Table 13:** Front open spaces (up to 9m -> 3.0m; >9m to 12m -> 3.6m; >12m to 18m -> 4.5m; >18m -> 6.0m; narrow existing streets < 6m -> 6.0m from center line).
- **Rule 56(2) Table 14:** Rear open spaces (up to 40 sq m -> Nil; >40 to 150 sq m -> 1.50m; >150 to 225 sq m -> 2.50m; >225 sq m -> 3.00m).
- **Rule 17:** Farm house norms (min plot size 0.40 ha, max FAR 0.10, max height 7.5m, 100 live trees/ha, road >= 7.5m, 7.50m MOS all sides).
- **Rule 52:** Clearances from overhead electric supply lines (low/medium voltage: vertical 2.5m, horizontal 1.2m; high voltage up to 33kV: vertical 3.7m).
- **Rule 21:** Application fee (Rs 1.00/sq.m. built-up) and permission fee tiers.

---

## 6. Running Tests

Run the full automated test suite:
```bash
python3 -m unittest discover -s tests -p "test_*.py"
# or: pytest tests/ -q
```

The test suite validates:
1. Health checks and root metadata.
2. Input sanitization (whitespace, empty input, unsupported languages, length boundaries).
3. Citation integrity (verifies rule existence, page start/end bounds, excerpt authenticity).
4. Boundary condition tests on all deterministic statutory formulas.
5. All 17 sample questions from `sample_questions.md`, including English, Hindi, and out-of-scope queries.
6. Semantic retrieval and keyword+semantic hybrid fusion, including graceful degradation if the embedding model is unavailable.
7. LLM grounding (`generate_grounded_answer`) and citation validation against mocked responses, plus one real end-to-end call against the live Anthropic API — skipped automatically unless `ANTHROPIC_API_KEY` is set.
8. Generalization to novel questions (`test_novel_questions.py`) that are *not* among the 17 sample questions, proving the system isn't just pattern-matching a memorized answer key.

---

## 7. Semantic Retrieval & LLM-Grounded Answers (Optional)

Both layers are additive and fail open to the original deterministic pipeline:

- **Semantic retrieval** (`app/services/semantic_retrieval.py`): a multilingual sentence-transformer model (`SEMANTIC_MODEL_NAME`, default `paraphrase-multilingual-MiniLM-L12-v2`) embeds the 106 rules into a FAISS index, lazily built on first use. `app/services/hybrid_retrieval.py` fuses this with the keyword scorer via reciprocal rank fusion. If the model/index fails to load (not installed, offline, etc.), it silently falls back to keyword-only retrieval.
- **LLM-grounded generation** (`app/services/llm_service.py`): if `ANTHROPIC_API_KEY` is set in `.env`, novel questions outside the 17 hand-verified sample questions are answered by Claude (forced tool-use for a schema-guaranteed response), constrained to the retrieved passages only. Every citation is re-validated against the actual dataset in `validate_citations()` — a rule or page number the model didn't actually retrieve is dropped, never trusted. Without a key, the system uses the original deterministic "top retrieved passage" excerpt instead.

To enable both, add to `backend/.env`:
```
SEMANTIC_MODEL_NAME=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
ANTHROPIC_API_KEY=sk-ant-...
LLM_MODEL=claude-haiku-5-5
```
