# Bhumi Vikas Sahayak — Frontend

> **Participant Track 1:** Bhopal Building Rules Decision Support Assistant  
> **Target User:** Building-Permission Counter Clerk, Bhopal Municipal Corporation (BMC)  
> **Source Law:** Madhya Pradesh Bhumi Vikas Rules, 2012 (Consolidated through 6 March 2025)

---

## 🏛️ Overview

**Bhumi Vikas Sahayak** is a purpose-built civic-tech web application that assists counter clerks at the Bhopal Municipal Corporation in answering citizens' building permission questions accurately, in English and Hindi, within seconds.

Every answer is grounded in the official **108-page MP Bhumi Vikas Rules, 2012**, citing exact **Rule numbers**, **PDF page ranges**, and **verbatim legal excerpts**. When evidence is missing or the inquiry is outside the building rules (e.g. property taxes or market rates), the system abstains with an explicit **"insufficient_evidence"** status rather than guessing.

---

## ✨ Features

1. **Bilingual Counter Experience (English & हिन्दी)**
   - Instant toggle between English and Hindi.
   - Preserves official rule names while formatting plain-language explanations.

2. **Grounded Question & Answer Engine (`QuestionInput` & `AnswerCard`)**
   - Categorized sample question chips from the official hackathon benchmark set (`sample_questions.md`).
   - Character count limits, validation, and keyboard shortcuts (`Enter`).
   - Visual status badges:
     - `answered` — Green, verified rule-grounded answer
     - `insufficient_evidence` — Amber, explicit abstention for unverified/out-of-scope queries
     - `source_version_warning` — Orange, alerts for post-cutoff amendments (e.g., 28 Aug 2026 amendment to Rule 2(5)(c))
     - `needs_clarification` / `error`

3. **Verifiable Source Inspector (`SourceViewer`)**
   - Expandable citations showing Rule Number, Title, PDF Page Start/End, and exact verbatim quotation.
   - Deep-link button to view the full text of any cited rule.

4. **Deterministic Setback & Clearance Calculator (`QuickCalculator`)**
   - Implements verified table mathematics directly in deterministic code (as requested by the problem statement: *"Maths belongs in code, not in a language model's head"*).
   - Computes:
     - **Rule 56(1)(a)** Front Open Space from road width (<=9m: 3.0m, 9-12m: 3.6m, 12-18m: 4.5m, >18m: 6.0m).
     - **Rule 56(2)(a)** Rear Open Space from plot area (<=40m²: Nil, 40-150m²: 1.5m, 150-225m²: 2.5m, >225m²: 3.0m).
     - **Rule 56(3)** Side Open Space for detached, semi-detached, and row housing.
     - **Rule 52** Overhead electric line clearances (2.5m vertical, 1.2m horizontal).

5. **Full 106-Rule Directory & Search (`RuleDirectoryModal`)**
   - Search across all 105 rules + Rule 26-B.
   - Filter by Part (Part I through Part VIII).
   - Read complete verbatim legal gazetted text and PDF page references.

6. **Citizen Counter Slip Generator (`CounterSlipModal`)**
   - Generates an official printable inquiry slip with BMC header, timestamp, inquiry text, verified rule citations, and officer signature line.
   - Print-ready using CSS `@media print`.

7. **Source Coverage & Amendment Cutoff Notice (`SourceCoverageModal`)**
   - Clear disclosure that the dataset is consolidated through **6 March 2025**.
   - Explicit alert that the **28 August 2026** amendment regarding plots up to 500 sq. m. (Rule 2(5)(c)) is outside the supplied baseline dataset.
   - Direct download links to official Town & Country Planning MP gazettes.

8. **Dual Mode: FastAPI Backend + Standalone Demo Engine**
   - Automatically connects to `POST /api/ask` on `http://localhost:8000`.
   - If the backend is not yet started, smoothly falls back to the client-side grounded rules engine with instant verified answers for all 17 benchmark questions.
   - Status badge in header displays live connection state with toggle.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env
```
*(Default: `VITE_API_BASE_URL=http://localhost:8000`)*

### Step 3: Start Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🏗️ Production Build

To test or generate the production bundle:
```bash
npm run build
```
Build output is generated cleanly in `dist/`.

---

## 📁 File Structure

```text
frontend/
├── src/
│   ├── components/
│   │   ├── AnswerCard.tsx          # Answer display with status badges, warnings & actions
│   │   ├── CounterSlipModal.tsx    # Printable BMC citizen counter receipt
│   │   ├── ErrorState.tsx          # Friendly network failure & retry state
│   │   ├── Footer.tsx              # Disclaimers, cutoff notice & attribution
│   │   ├── Header.tsx              # Civic branding, quick tools & backend status
│   │   ├── LanguageToggle.tsx      # Bilingual EN/HI switcher
│   │   ├── LoadingState.tsx        # Multi-stage civic verification indicator
│   │   ├── QuestionInput.tsx       # Textarea, char counter, sample question chips
│   │   ├── QuickCalculator.tsx     # Rule 56 setback & Rule 52 clearance calculator
│   │   ├── RuleDirectoryModal.tsx  # Full 106-rule browser and legal viewer
│   │   ├── SourceCoverageModal.tsx # Cutoff date, PDF links, amendment notices
│   │   └── SourceViewer.tsx        # Expandable citations with verbatim quotes
│   ├── data/
│   │   └── rules.json              # All 106 official rules from bhumi_vikas_rules.jsonl
│   ├── pages/
│   │   └── Home.tsx                # Main counter application page
│   ├── services/
│   │   ├── api.ts                  # Network calls to FastAPI (/api/ask, /api/health)
│   │   └── mockData.ts             # Benchmark answers & offline search engine
│   ├── types/
│   │   └── api.ts                  # Shared TypeScript interfaces & schemas
│   ├── App.tsx
│   ├── index.css                   # Tailwind styles, glassmorphism, print CSS
│   └── main.tsx
├── .env.example
├── FRONTEND_WORK_GUIDE.md
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## ⚖️ License & Disclaimer

Open source under the **MIT License**.  
*Informational Use Notice:* Bhumi Vikas Sahayak is a decision-support tool. It does not constitute official building sanction or legal advice. Final building permissions remain the authority of the Bhopal Municipal Corporation and Town & Country Planning Department.
