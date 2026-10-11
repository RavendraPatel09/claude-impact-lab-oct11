# Bhumi Vikas Sahayak --- AI and Data Engineering Work Guide

## Owner: Person 2 --- Dataset, Retrieval, RAG, Citations, and Evaluation

## 1. Project purpose

Bhumi Vikas Sahayak answers questions about Madhya Pradesh building
regulations. The main requirement is trustworthy, source-backed answers:
retrieve relevant passages, answer only from evidence, cite actual
rules/pages, and admit when evidence is insufficient.

## 2. Responsibilities

You own: - Dataset inspection and validation. - Ingestion and passage
chunking. - Keyword retrieval. - Optional semantic retrieval and hybrid
ranking. - RAG prompt and answer generation. - Citation construction and
validation. - Insufficient-evidence behavior. - Hindi/English response
handling. - Source-version warnings. - AI/retrieval evaluation and
tests.

The full-stack teammate owns React, FastAPI routes, integration, and
deployment.

## 3. Supplied dataset

The project folder is reported to include: -
`data/bhumi_vikas_rules.jsonl` -
`data/bhumi_vikas_rules_fulltext_by_page.txt` -
`data/bhumi_vikas_rules_sample.jsonl` - `resources/sample_questions.md`

The full JSONL was previously reported to contain 106 records: 105
numbered rules plus Rule 26-B, with fields such as `rule`, `title`,
`part`, `page_start`, `page_end`, and `text`. Verify this against the
actual files before relying on the counts or fields.

The consolidated English rulebook is reported as current through **6
March 2025**. The problem statement mentions a later amendment dated
**28 August 2026** affecting Rule 2(5)(c) for plots up to 500 sq. m.;
the amendment is not included in the supplied dataset described by the
team.

## 4. First task: inspect and validate

Before retrieval: 1. Confirm all expected files exist. 2. Inspect
several JSONL records and confirm the schema. 3. Count records and
identify duplicate rule IDs. 4. Find empty text, missing rule numbers,
titles, or page metadata. 5. Compare JSONL text with the page-organized
full-text file where practical. 6. Preserve the original legal text. 7.
Record source filename and version metadata. 8. Inspect special cases
such as Rule 26-B rather than assuming every rule follows the same
pattern.

Produce a validation report containing counts, missing fields,
duplicates, parse errors, and suspiciously short records. Do not delete
unusual records without inspecting them.

## 5. Suggested module structure

``` text
backend/
  app/
    services/
      ingestion.py
      retrieval.py
      answer.py
      source_version.py
tests/
  test_retrieval.py
  test_citations.py
  test_sample_questions.py
  test_no_evidence.py
```

Coordinate module paths and imports with the backend teammate before
moving files.

## 6. Ingestion and chunking

Load the JSONL into structured objects. Each passage should preserve: -
Rule identifier. - Title and part, if available. - Page start and end. -
Original text. - Source filename/version.

Chunking principles: - Keep short rules intact. - Split long rules at
meaningful headings or paragraph boundaries. - Keep exceptions and
provisos with the provision they qualify. - Avoid splitting table values
from their labels. - Preserve rule/page metadata on every chunk. - Avoid
chunks that combine unrelated rules. - Do not silently paraphrase source
text during ingestion.

For the first version, one rule per passage may be enough if rules are
reasonably short. Add sub-rule chunking only where it improves
retrieval.

## 7. Build keyword retrieval first

Implement BM25 or another lexical-search method before adding
embeddings. Exact rule numbers and legal terms are often important.

The retrieval function should accept a query and return ranked passages
with original metadata, for example:

``` python
[
    {
        "rule": "actual rule number",
        "title": "actual rule title",
        "page_start": 1,
        "page_end": 2,
        "text": "Actual passage from source",
        "score": 0.91
    }
]
```

The values above are examples of the shape only.

Requirements: - Search exact rule numbers and terms effectively. -
Return a small set of relevant passages. - Preserve metadata through
ranking. - Treat empty or irrelevant results as insufficient evidence. -
Do not assume the top result is always relevant.

## 8. Optional semantic and hybrid retrieval

After keyword search works: 1. Generate embeddings using an appropriate
Sentence Transformers model. 2. Store vectors in FAISS or a lightweight
in-memory index. 3. Embed the user's query. 4. Retrieve semantic
matches. 5. Combine lexical and semantic results using a simple
rank-fusion method. 6. Measure whether hybrid search improves the sample
questions.

Keep the model configurable and consider package size, memory, startup
time, and deployment constraints. Do not introduce a complicated vector
database without a clear benefit.

## 9. RAG answer generation

The answer function receives: - User question. - Requested language
(`en` or `hi`). - Retrieved passages. - Source-version metadata.

It returns: - `answer` - `status` - `citations` - `warnings` -
`source_version`

The model must: - Use only retrieved passages for regulatory claims. -
Never invent rules, page numbers, exceptions, fees, formulas, dates, or
requirements. - Cite only passages actually retrieved for the
question. - Distinguish explicit source statements from assumptions. -
Say evidence is insufficient when passages do not support an answer. -
Ask a concise clarifying question if key facts are missing. - Respond in
the requested language where possible. - Preserve legal terms when
translation could change meaning. - Never claim the answer is an
official permit or legal decision.

### Suggested system prompt

``` text
You are Bhumi Vikas Sahayak, an assistant that explains the supplied
Madhya Pradesh building-regulation source material.

Use only the source passages supplied with the current request for claims
about legal requirements. Do not rely on memory to fill gaps. Do not
invent rule numbers, page references, exceptions, calculations, dates,
fees, or approval requirements.

If evidence is insufficient, say so clearly and set status to
insufficient_evidence. If important facts are missing, ask for
clarification. Cite the actual supplied rule and page metadata for each
substantive regulatory claim. Keep source excerpts faithful to the text.

Respond in the requested language, English or Hindi. Explain technical
terms simply without changing the regulation's meaning. State source
version limitations when relevant. Do not present the answer as official
legal advice or building approval.
```

Prefer structured model output and validate citations against the
retrieved passages.

## 10. Citation integrity

Each citation must originate from a retrieved passage and may contain: -
Rule identifier. - Rule title. - Page range. - Short exact source
excerpt.

Validate that: 1. The rule exists in the dataset. 2. Page metadata
matches the source. 3. The excerpt exists in or faithfully matches the
passage. 4. The passage was retrieved for this question. 5. The passage
actually supports the answer's claim.

A citation that exists is not necessarily relevant. Test grounding and
relevance, not only field formatting. Never fabricate missing page
numbers.

## 11. Insufficient evidence and clarification

Use `insufficient_evidence` when: - No useful passage is retrieved. -
Retrieved passages do not answer the question. - A required rule is
missing from the source. - The question depends on an unverified
amendment. - A calculation needs an unavailable formula or input.

Use `needs_clarification` when important user details are missing. A
safe abstention is better than a plausible but unsupported regulatory
claim.

## 12. Source-version warning

The supplied consolidated English rulebook is reported as current
through **6 March 2025**. The problem statement mentions a later
amendment dated **28 August 2026** affecting Rule 2(5)(c) for plots up
to 500 sq. m.; it is not included in the supplied dataset described by
the team.

Required handling: - Keep the actual source version in
metadata/configuration. - Detect questions that may depend on Rule
2(5)(c) and plots up to 500 sq. m. - Warn that the later amendment has
not been verified in the available data. - Do not state what it changed
unless its authoritative text is obtained and checked. - If the answer
depends materially on the amendment, abstain or provide only a narrowly
scoped answer from the older source with a prominent warning. - If the
amendment is later added, record the official source, publication date,
effective date, and text separately.

Do not describe the dataset as fully current law.

## 13. Hindi and English support

-   Accept `language="en"` or `language="hi"`.
-   Preserve source excerpts and rule numbers.
-   Generate the explanation in the requested language.
-   Test Hindi questions separately.
-   If source text is English, use cross-language embeddings or an
    additional translated query only if tested. Do not replace the
    original query with a possibly inaccurate translation.
-   Avoid translating legal terms in a way that changes their meaning.

## 14. Numerical calculations

Calculations must use deterministic code, not invented model reasoning.

Implement a calculation only if: - The formula is explicitly available
in a verified source. - Required inputs and units are known. -
Exceptions and boundary conditions are understood. - The output can cite
the supporting rule.

For each calculation, document the source rule, validate units/ranges,
test normal/boundary/invalid inputs, and explain assumptions. If the
formula is unavailable or uncertain, return insufficient evidence. Do
not implement speculative FAR/FSI, setback, plot-coverage, fee, or
approval calculations just because these concepts are common.

## 15. Shared function contract

Coordinate with the backend teammate. Recommended interface:

``` python
def answer_question(question: str, language: str) -> dict:
    """Return a JSON-serializable object matching the agreed API schema."""
```

Also expose smaller testable functions: - `load_rules()` -
`build_passages()` - `retrieve_passages(query, top_k=...)` -
`validate_citations(citations, retrieved_passages)`

The returned dictionary must include `answer`, `status`, `citations`,
`warnings`, and `source_version`. Keep AI logic independent of FastAPI
request objects.

## 16. Evaluation plan

Use `resources/sample_questions.md` as the initial evaluation set. It
was previously reported to contain 17 English/Hindi questions; verify
the actual file.

For each question, record: - Was the expected rule retrieved? - Was the
evidence relevant? - Is the answer supported by evidence? - Are
citations valid and relevant? - Is the requested language used? - Does
the system abstain when evidence is missing? - Does the amendment
warning appear when appropriate? - Are numerical answers correct and
linked to a verified formula?

Track retrieval hit rate, citation validity, unsupported-claim count,
correct abstention behavior, language success, and calculation test pass
rate. Do not claim accuracy percentages that have not been measured.

## 17. Essential test cases

-   Exact rule-number query.
-   Exact phrase from a rule.
-   Paraphrased English question.
-   Hindi question about an English source.
-   Question with no answer in the source.
-   Ambiguous question requiring clarification.
-   Question affected by the missing amendment.
-   Rule containing a proviso or exception.
-   Long rule split into multiple passages.
-   Citation with missing page metadata.
-   Numeric question without a verified formula.

## 18. Dependencies and runtime

Start with a small dependency set. Possible packages: - `rank-bm25` or
an equivalent lexical search implementation. - `sentence-transformers`
for embeddings, if needed. - `faiss-cpu` for vector search, if
compatible. - The selected LLM provider SDK, if the project uses a
hosted model. - `pytest`.

Confirm model/provider and credentials with the team. Never hard-code
API keys; use environment variables and keep `.env` out of Git.

If model installation or deployment is difficult, deliver a working
keyword-search baseline first, then add semantic retrieval only if it
measurably improves results and remains stable.

## 19. Git and collaboration

Branch: `feature/ai-data`

Suggested commits: - `feat: load and validate regulation dataset` -
`feat: implement rule passage chunking` -
`feat: add keyword retrieval` - `feat: add grounded answer generation` -
`feat: validate source citations` -
`test: evaluate supplied sample questions`

Send the backend teammate a working stub and the response schema early.
Integrate before the entire RAG pipeline is complete.

## 20. Definition of done

The AI component can load the actual dataset, retrieve relevant
passages, produce grounded answers, attach valid citations, abstain when
evidence is insufficient, respect source-version limitations, and pass a
documented evaluation against the supplied sample questions.
