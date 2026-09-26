# Clause — AI-Powered Legal Document Intelligence

> **"Clause explains documents. It never gives legal advice."**

Clause is a **Generative AI-powered legal document workspace** built with **OpenAI GPT-4o Mini**. It helps non-lawyers understand, risk-assess, and act on legal documents — rental agreements, employment contracts, loan documents, NDAs, insurance policies, and more — before they sign.

Every answer is grounded strictly in the uploaded document. If Clause cannot find the answer in the document, it says so. If a question crosses into legal advice territory, Clause detects this via AI and redirects the user to consult a lawyer.

---

## 🤖 Generative AI Integration

**Clause uses OpenAI GPT-4o Mini** for all intelligent features via the `openai` SDK. All AI calls are server-side only (in `/src/app/api/analyze/route.ts`) — the API key is never exposed to the browser.

### Where GenAI is used

| Feature | AI Operation | What GenAI Does |
|---|---|---|
| **Clause Explorer** | `op: "explain"` | Converts dense legal text into plain-language explanations, practical impact ("Why it matters"), category tags, and clause-specific lawyer questions |
| **Risk Radar & Inconsistencies** | `op: "risk"`, `op: "inconsistencies"` | Classifies clauses as High / Medium / Low concern with verbatim evidence; detects contradictory notice windows, liability mismatches, and ambiguous terms |
| **Ask the Document** | `op: "ask"` | Answers natural-language questions grounded strictly in document text; returns verbatim quotes, uncertainty notes, and suggested follow-ups |
| **Document Comparison** | `op: "compare"` | Dimension-by-dimension comparison between two documents/versions, material differences list, and obligation/risk shift analysis |
| **Action Kit & Decision Advisor** | `op: "actionkit"` | Structured metadata, interactive obligations checklist, rights tracker, negotiation redline suggestions, and lawyer consultation packet |
| **Safety Rail** | Built into `op: "ask"` | Detects legal advice questions (strategy, enforceability, litigation probability) and routes user to professional counsel |

### AI Architecture

```
Browser (Client)
    │
    ├── GeminiProvider.ts ──► POST /api/analyze  ──► OpenAI GPT-4o Mini
    │       ↑ switches to                              (server-side only)
    │       │ on startup probe
    └── LocalProvider.ts  (fallback when no API key)
```

The app probes `/api/analyze` on startup. If the server returns HTTP 200 (API key valid), the UI automatically switches from `LocalProvider` (rule-based fallback) to `GeminiProvider` (real OpenAI AI). A green **"GPT-4o Mini"** badge appears in the header confirming AI is active.

---

## Features Matrix

| Problem Statement Use Case | Solution Feature | Status |
|---|---|---|
| **1. Simplifying complex legal documents** | **Clause Explorer** — Side-by-side original + plain-language meanings, "Why it matters", and category filters | ✅ Fully Live |
| **2. Comparing contracts, agreements, or policies** | **Compare Mode** — Upload 2nd PDF/TXT or paste text; dimension comparison table (Financials, Duration, Liabilities) & material differences | ✅ Fully Live |
| **3. Highlighting important clauses, obligations, risks, or inconsistencies** | **Risk Radar & Inconsistencies Engine** — High/Medium/Low concerns with evidence quotes + detected internal contract contradictions | ✅ Fully Live |
| **4. Answering questions based on provided legal documents** | **Ask the Document** — Grounded Q&A with exact clause citations, uncertainty boundary notes, and dynamic follow-up suggestions | ✅ Fully Live |
| **5. Helping users understand their options and potential next steps** | **Options & Next Steps Navigator** — Specific negotiation redline language, pre-signing inquiries, safeguards, and 4-step action roadmap | ✅ Fully Live |
| **6. Generating summaries, checklists, or other actionable outputs** | **Interactive Action Kit** — Executive summary, interactive pre-signing checklist with progress tracking, and rights tracker | ✅ Fully Live |
| **7. Helping users prepare information or questions for a legal professional** | **Consultation Dossier** — Curated lawyer questions, structured briefing packet, and one-click clipboard copy / export print | ✅ Fully Live |
| **8. Responsible AI & Legal Disclaimers** | **Safety Rail** — Detects legal advice prompts, calibrates language ("document states" vs legal verdict), and disclaims legal counsel | ✅ Fully Live |

---

## Running the Project

**Requirements:** Node.js 20+

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Enabling Real Gemini AI

Without an API key the app uses `LocalProvider` (a rule-based fallback). To enable **real Gemini 2.0 Flash AI**:

1. Get an OpenAI API key at [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create `.env.local` in the project root:
   ```bash
   OPENAI_API_KEY=sk-YOUR_KEY_HERE
   ```
3. Restart the dev server — the header will show a green **"GPT-4o Mini"** badge

The API key is **server-side only** — it is read exclusively in `src/app/api/analyze/route.ts` and never bundled into the client JavaScript.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| **AI / GenAI** | **OpenAI GPT-4o Mini via `openai` SDK** |
| Styling | Tailwind CSS + custom design tokens |
| Accessibility | WCAG 2.2 AA — `jsx-a11y` strict ruleset |
| Security | CSP, server-only API key, `eslint-plugin-security` |
| Testing | Vitest (unit) + Playwright (E2E + a11y) |

---

## All Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server at `http://localhost:3000` |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript strict check (zero errors) |
| `npm run lint` | ESLint — strict TypeScript + a11y + security (zero warnings) |
| `npm test` | Vitest unit/integration tests |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run test:a11y` | Accessibility-only Playwright tests |

---

## Documentation

- [`DECISIONS.md`](DECISIONS.md) — Architecture decisions and GenAI provider design
- [`SECURITY.md`](SECURITY.md) — API key security, CSP, threat model  
- [`ACCESSIBILITY.md`](ACCESSIBILITY.md) — WCAG 2.2 AA conformance notes
- [`PERFORMANCE.md`](PERFORMANCE.md) — Performance budgets
- [`DEMO.md`](DEMO.md) — 3-minute demo walkthrough

---

## 🏆 Problem Statement Alignment (100% Comprehensive Coverage)

This project achieves complete alignment with the **AI for Legal Assistance & Access** challenge brief:

- 🎯 **1. Simplifying Complex Legal Documents**: Clause Explorer translates clauses into plain English, provides practical significance ("Why it matters"), category tags, and lawyer inquiry chips.
- 🎯 **2. Comparing Contracts, Agreements, or Policies**: Dedicated multi-document comparison engine supporting PDF/TXT uploads or text pasting, with side-by-side dimension tables, material differences, and obligation/risk shift analysis.
- 🎯 **3. Highlighting Important Clauses, Obligations, Risks, or Inconsistencies**: Dual-engine Risk Radar classifies High/Medium/Low concerns with verbatim evidence, plus an Inconsistencies detector for contradictory notice windows, conflicting liability caps, and ambiguous terms.
- 🎯 **4. Answering Questions Based on Provided Legal Documents**: Grounded Q&A with exact clause citations, uncertainty boundary notes, dynamic follow-up suggestions, and calibrated confidence.
- 🎯 **5. Helping Users Understand Their Options & Potential Next Steps**: Practical redline proposals with recommended contract language, pre-signing written inquiries, operational safeguards, and an interactive 4-step action roadmap.
- 🎯 **6. Generating Summaries, Checklists, or Other Actionable Outputs**: Executive summaries, interactive pre-signing checklist with progress tracking, and rights tracker.
- 🎯 **7. Preparing Information or Questions for a Legal Professional**: Curated questions for counsel, structured briefing packet, and one-click printable / clipboard Consultation Dossier.
- 🎯 **8. Responsible AI & Guardrails**: Automatic detection of legal advice prompts, calibrated informational language ("the document states..." vs legal certainty), and prominent disclaimers throughout.

