# Bhumi Vikas Sahayak --- Frontend Work Guide

## Owner: Person 1 --- Frontend, Integration, and User Experience

## 1. Project purpose

Bhumi Vikas Sahayak helps users understand Madhya Pradesh building
regulations. A user asks a question in Hindi or English; the application
returns a plain-language answer supported by relevant rules and page
references from the supplied documents.

The interface must make it easy to ask questions, read answers, inspect
evidence, understand warnings, and recognize when the system lacks
enough evidence. It is an informational assistant, not official building
approval or a replacement for the relevant authority.

## 2. Responsibilities

You own: - React frontend and visual design. - Calling the FastAPI
backend. - Loading, empty, error, retry, and insufficient-evidence
states. - Language selection and answer display. - Showing citations,
source excerpts, source version, and warnings. - End-to-end testing,
deployment, and demo preparation. - Agreeing on the API contract with
the backend/AI teammate.

The AI teammate owns document ingestion, retrieval, ranking, and
grounded answer generation.

## 3. Recommended stack

-   React + TypeScript + Vite
-   Tailwind CSS
-   Optional shadcn/ui components
-   `fetch` or Axios for API calls
-   React Router only if multiple pages are genuinely required

Keep the first version simple. Do not spend hackathon time on
unnecessary libraries or complex state management.

## 4. Main user journey

1.  User opens the home page.
2.  User chooses English or Hindi.
3.  User enters a building-regulation question.
4.  The frontend validates the input and calls `POST /api/ask`.
5.  A loading state appears.
6.  The answer, status, citations, and warnings appear.
7.  The user expands a citation to inspect its source excerpt.
8.  If evidence is insufficient, the interface clearly explains that
    rather than showing a confident guess.

## 5. Required components

### `QuestionInput.tsx`

-   Text input or textarea.
-   Submit button.
-   Prevent empty submissions.
-   Disable submit while the request is running.
-   Support sample-question chips.
-   Set a reasonable input-length limit.
-   Display a useful validation message.

### `LanguageToggle.tsx`

-   Offer `en` and `hi`.
-   Send the selected language with each request.
-   Keep source excerpts in their original language when appropriate;
    the explanation may be in the chosen language.

### `AnswerCard.tsx`

-   Display the answer with readable line spacing.
-   Show the status clearly.
-   Distinguish normal answers, clarification requests, and insufficient
    evidence.
-   Display warnings prominently.
-   Never style an uncertain answer as an official legal decision.

### `SourceViewer.tsx`

For every citation, show: - Rule number. - Rule title, if available. -
Page range, if available. - Exact supporting excerpt. - Expand/collapse
control.

Never invent a rule number, page, title, or excerpt when metadata is
missing.

### Loading and error states

Include: - Loading indicator. - Backend-offline message. - Retry
button. - Empty state before the first question. - Insufficient-evidence
state. - Helpful response if the server returns an error.

## 6. API contract

### Request: `POST /api/ask`

``` json
{
  "question": "What documents are required for building permission?",
  "language": "en"
}
```

Initially, `language` should be `en` or `hi`.

### Response shape

The values below illustrate the schema only. Actual rule numbers, pages,
excerpts, and source versions must come from the real dataset.

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
      "excerpt": "Actual text from the source"
    }
  ],
  "warnings": [],
  "source_version": "2025-03-06"
}
```

Agree on the exact status values with both teammates. Suggested
values: - `answered` - `insufficient_evidence` - `needs_clarification` -
`source_version_warning` - `error`

Decide whether a version warning is a status or a warning accompanying
an answer; do not implement inconsistent behavior.

### Supporting endpoints

  Method   Endpoint                     Purpose
  -------- ---------------------------- --------------------------------------
  GET      `/api/health`                Check backend availability
  GET      `/api/search?q=...`          Search source rules/passages
  GET      `/api/rules/{rule_number}`   Retrieve one rule
  GET      `/api/sources`               Show source document/version details

Confirm the exact query parameters and response schemas with the backend
teammate.

## 7. Suggested file structure

``` text
frontend/
  src/
    components/
      QuestionInput.tsx
      AnswerCard.tsx
      SourceViewer.tsx
      LanguageToggle.tsx
      LoadingState.tsx
      ErrorState.tsx
    pages/
      Home.tsx
    services/
      api.ts
    types/
      api.ts
    App.tsx
    main.tsx
    index.css
  .env.example
  package.json
```

## 8. API integration

Keep network logic in `src/services/api.ts`, not scattered across
components. That module should: - Read `VITE_API_BASE_URL`. - Call
`POST /api/ask`. - Check `response.ok`. - Parse the response. - Handle
timeouts/network failures. - Return a typed result to the UI.

Example `.env.example`:

``` text
VITE_API_BASE_URL=http://localhost:8000
```

Do not place private API keys in `VITE_` variables. Frontend environment
variables are visible to users in the browser.

## 9. Design direction

Aim for a trustworthy civic-tech product: - Clean, accessible light
interface. - High contrast and readable typography. - Clear visual
separation between answer, source evidence, and warnings. - Responsive
desktop/mobile layout. - Visible keyboard focus and accessible labels. -
No fake statistics, fake testimonials, unsupported accuracy claims, or
unnecessary animation. - Do not make uncertain results look more
authoritative through design.

Suggested page sections: 1. Header with project name and language
selector. 2. Brief description and source-coverage note. 3. Question
form. 4. Sample questions. 5. Answer panel. 6. Source/citation panel. 7.
Footer with source version and informational-use disclaimer.

## 10. Source-version warning

The supplied consolidated English rulebook is reported as current
through **6 March 2025**. The problem statement mentions a later
amendment dated **28 August 2026** affecting Rule 2(5)(c) for plots up
to 500 sq. m.; the amendment is not included in the supplied dataset
described by the team.

Do not claim that the available rulebook is fully up to date. If a
question may depend on the amendment, display a visible warning and do
not invent its contents.

Suggested notice: \> Answers are based on the source documents currently
available in this system. Building rules may have changed. Verify
important decisions against the latest official notification or with the
relevant authority.

## 11. Testing checklist

-   [ ] Page loads without console errors.
-   [ ] Empty question cannot be submitted.
-   [ ] English question sends `language: "en"`.
-   [ ] Hindi question sends `language: "hi"`.
-   [ ] Loading state appears and disappears.
-   [ ] Answer and status render correctly.
-   [ ] Citations show source-provided rule/page details.
-   [ ] Missing metadata is not fabricated.
-   [ ] Warnings are visible.
-   [ ] Insufficient evidence is explained clearly.
-   [ ] Backend-offline error and retry work.
-   [ ] Layout works on mobile and desktop.
-   [ ] Keyboard navigation and focus are usable.
-   [ ] UI does not imply official approval or legal advice.

## 12. Git and collaboration

Branch: `feature/fullstack`

Suggested commits: -
`feat: create question form and language selector` -
`feat: add answer and source components` -
`feat: connect ask endpoint` -
`fix: handle insufficient evidence and API errors`

Build the UI with mock responses while the AI teammate works. Replace
the mock with the real API response after the contract is agreed.

## 13. Definition of done

A user can submit a Hindi or English question, receive the real backend
response, read the answer, inspect citations and warnings, and
understand what to do when evidence is insufficient. Setup and demo
instructions must work from a clean checkout.
