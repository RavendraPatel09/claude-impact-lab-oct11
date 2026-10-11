# Bhumi Vikas Sahayak --- Backend Work Guide

## Owner: Person 1 --- FastAPI, API Contract, Integration, and Deployment

## 1. Project purpose

The backend receives a question from the frontend, calls the AI
teammate's retrieval-and-answer pipeline, validates the result, and
returns an answer with citations, warnings, and source-version metadata.
It is the integration boundary between the frontend and AI modules.

## 2. Responsibilities

You own: - FastAPI application and routing. - Request/response
schemas. - Integration with the AI service. - Rule lookup and source
metadata endpoints. - CORS and configuration. - Error handling and
health checks. - Tests and deployment setup. - Deterministic
calculations only when the formula is verified in the source.

The AI teammate owns ingestion, chunking, retrieval, embeddings, and
grounded answer generation.

## 3. Recommended stack

-   Python 3.11+ (or the version supported by the deployment
    environment)
-   FastAPI
-   Uvicorn
-   Pydantic
-   pytest and FastAPI TestClient
-   Environment variables / `python-dotenv`

Avoid adding a database for the first prototype unless needed. JSONL and
an in-memory index are sufficient initially.

## 4. Suggested structure

``` text
backend/
  app/
    main.py
    api/
      routes.py
    schemas/
      question.py
      answer.py
    services/
      ai_service.py
      rule_service.py
      calculator.py
    core/
      config.py
  tests/
    test_health.py
    test_ask.py
    test_citations.py
  requirements.txt
  .env.example
  README.md
```

The AI teammate may put `ingestion.py`, `retrieval.py`, and `answer.py`
in the same package or a separate module. Agree on paths and imports
early.

## 5. Required endpoints

### `GET /api/health`

Return a simple response confirming the API is running, for example:

``` json
{"status": "ok"}
```

Do not expose secrets or internal environment variables.

### `POST /api/ask`

Request:

``` json
{
  "question": "What documents are required for building permission?",
  "language": "en"
}
```

Requirements: - Trim whitespace and reject empty questions. - Validate
language as `en` or `hi` initially. - Apply a reasonable maximum input
length. - Call the AI service. - Validate the response shape. - Return
answer, status, citations, warnings, and source version. - Handle AI
service errors safely.

Example response shape (values are illustrative only):

``` json
{
  "answer": "Answer supported by retrieved source passages.",
  "status": "answered",
  "citations": [
    {
      "rule": "actual rule number",
      "title": "actual rule title",
      "page_start": 10,
      "page_end": 11,
      "excerpt": "Actual source text"
    }
  ],
  "warnings": [],
  "source_version": "2025-03-06"
}
```

### `GET /api/search`

Return matching rules/passages. Coordinate the query parameters and
response shape with the AI teammate.

### `GET /api/rules/{rule_number}`

Return a rule and its metadata. Return HTTP 404 if the requested rule
does not exist.

### `GET /api/sources`

Return source document names, available version information, and
coverage limitations. Do not imply unverified amendments are included.

## 6. Shared response schema

Define a single Pydantic schema and share it with the frontend and AI
teammate.

Suggested response fields: - `answer: str` - `status`: `answered`,
`insufficient_evidence`, `needs_clarification`, or another agreed
value. - `citations: list[Citation]` - `warnings: list[str]` -
`source_version: str | None`

Suggested citation fields: - `rule: str` - `title: str | None` -
`page_start: int | None` - `page_end: int | None` - `excerpt: str`

Nullable metadata is preferable to inventing missing values. Agree on
exact status semantics before integration.

## 7. AI integration contract

Ask the AI teammate to expose a function similar to:

``` python
def answer_question(question: str, language: str) -> dict:
    """Return a JSON-serializable object matching the shared schema."""
```

Keep AI logic independent of FastAPI request objects. The backend
should: - Validate required fields and data types. - Ensure citations
have the expected structure. - Ensure warnings are a list of strings. -
Catch unexpected exceptions. - Return safe messages to the client. - Log
diagnostic details on the server during development.

Structural validation does not prove that a citation supports a claim.
Relevance and grounding must also be evaluated by the AI tests.

## 8. Error handling

Recommended behavior: - `200`: request processed, including an
`insufficient_evidence` result. - `400` or `422`: invalid request. -
`404`: rule not found. - `500`: unexpected internal error. - `503`: AI
pipeline temporarily unavailable, if appropriate.

Safe error example:

``` json
{"detail": "The answer service is temporarily unavailable. Please try again."}
```

Never return API keys, secrets, local file paths, prompts containing
secrets, or stack traces to users.

## 9. CORS and configuration

Allow the local Vite origin during development, usually
`http://localhost:5173`. Configure the deployed frontend origin through
environment variables. Avoid unrestricted production CORS unless it is
explicitly required.

Example `.env.example`:

``` text
APP_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
SOURCE_VERSION=2025-03-06
```

Use the actual source version from the supplied files. Never commit real
credentials or API keys; keep `.env` out of Git.

## 10. Source-version limitations

The supplied consolidated English rulebook is reported as current
through **6 March 2025**. The problem statement mentions a later
amendment dated **28 August 2026** affecting Rule 2(5)(c) for plots up
to 500 sq. m.; that amendment is not included in the supplied dataset
described by the team.

Implement behavior to: - Expose source coverage through
`/api/sources`. - Include warnings for questions that may depend on the
missing amendment. - Avoid claiming the dataset is the complete current
law. - Add later legal text only after verifying its authoritative
source, wording, and effective date.

## 11. Deterministic calculation module

If adding calculations such as plot area, setback, FAR/FSI, or fees: -
Implement verified formulas as deterministic Python functions. - Tie
every formula to an actual source rule. - Validate units and input
ranges. - Explain assumptions and units. - Add tests for normal,
boundary, and invalid values. - Return insufficient evidence if the
applicable formula or required inputs are unavailable.

Do not ask the language model to invent legal formulas or thresholds.

## 12. Local setup

Example for macOS/Linux:

``` bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn pydantic python-dotenv pytest httpx
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` to inspect the API. Ensure the
`app.main:app` path matches the actual file structure. Add AI-related
dependencies only after coordinating with the AI teammate.

## 13. Testing checklist

-   [ ] Health endpoint works.
-   [ ] Empty question is rejected.
-   [ ] Unsupported language is handled consistently.
-   [ ] Valid request returns the agreed response schema.
-   [ ] Citation field types are valid.
-   [ ] Unknown rule returns 404.
-   [ ] Search handles empty and normal queries.
-   [ ] AI service failure returns a controlled error.
-   [ ] CORS allows the frontend.
-   [ ] No secrets are exposed or committed.
-   [ ] Source version and amendment warning are correct.
-   [ ] Verified calculation functions have boundary tests.
-   [ ] README setup commands work from a clean checkout.

## 14. Git and collaboration

Branch: `feature/fullstack`

Suggested commits: - `feat: add FastAPI app and health endpoint` -
`feat: define question and answer schemas` -
`feat: add ask and rule lookup routes` -
`feat: integrate AI answer service` -
`test: add API and citation validation tests`

Connect a stub AI function first so the API can be tested before the
full RAG pipeline is ready.

## 15. Definition of done

All documented endpoints work; the frontend can call `/api/ask`; the
response matches the shared schema; citations are passed through without
fabrication; errors are controlled; and the service runs using
documented setup commands.
