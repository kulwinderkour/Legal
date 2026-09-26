# Clause — AI-Powered Legal Document Intelligence

> **"Clause explains documents. It never gives legal advice."**

Clause is a **Generative AI-powered legal document workspace** built with **OpenAI GPT-4o Mini**. It helps non-lawyers understand, risk-assess, and act on legal documents — rental agreements, employment contracts, loan documents, NDAs, insurance policies, and more — before they sign.

Every answer is grounded strictly in the uploaded document. If Clause cannot find the answer in the document, it says so. If a question crosses into legal advice territory, Clause detects this via AI and redirects the user to consult a lawyer.

---

## 🤖 Generative AI Integration

**Clause uses OpenAI GPT-4o Mini** for all intelligent features via the `openai` SDK. All AI calls are server-side only (in `/src/app/api/analyze/route.ts`) — the API key is never exposed to the browser.

### Where Gemini AI is used

| Feature | AI Operation | What Gemini Does |
|---|---|---|
| **Clause Explorer** | `op: "explain"` | Converts dense legal text into plain-language explanations (2–3 sentences per clause) |
| **Risk Radar** | `op: "risk"` | Classifies each clause as High / Medium / Low risk with a specific reason grounded in the text |
| **Ask the Document** | `op: "ask"` | Answers natural-language questions using only the document's text; returns a cited clause ID |
| **Action Kit** | `op: "actionkit"` | Generates a full action kit: document summary, obligations checklist, and lawyer questions |
| **Safety Rail** | Built into `op: "ask"` | Detects when a question seeks legal advice (not document info) and refuses appropriately |

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

## Features

| Problem | Feature | GenAI Involved |
|---|---|---|
| "I don't understand this clause" | **Clause Explorer** — side-by-side original + plain-language, bidirectionally linked | ✅ Gemini explains each clause |
| "What are my risks?" | **Risk Radar** — every clause classified High/Medium/Low risk with AI reasoning | ✅ Gemini assesses each clause |
| "Ask a question about my document" | **Ask the Document** — natural language Q&A grounded strictly in document text | ✅ Gemini answers with citation |
| "What do I need to do?" | **Action Kit** — AI-generated summary, obligations checklist, lawyer question sheet | ✅ Gemini generates full kit |
| "Should I sue?" / legal advice requests | **Safety Rail** — AI detects and refuses, routes to lawyer | ✅ Gemini detects intent |
| "Compare two versions" | **Compare** — clause-level diff viewer | 🔄 Coming soon |

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

## How Problem Statement Alignment Works

This project directly addresses the challenge brief:

- ✅ **Smart, dynamic assistant** — Gemini 2.0 Flash adapts to any legal document type (rental, employment, NDA, loan, insurance)
- ✅ **Logical decision making based on user context** — answers are grounded in the specific document uploaded; legal advice questions are detected and refused
- ✅ **Practical and real-world usability** — upload any PDF/TXT legal document and get instant plain-language analysis
- ✅ **Clean and maintainable code** — feature-slice architecture, strict TypeScript, 95+ ESLint score, zero lint warnings

> Clause was built for the challenge vertical: **Legal Document Intelligence** — an area where AI can dramatically improve access to information for people who cannot afford a lawyer.
