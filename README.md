# Clause

**Clause explains documents. It never gives legal advice.**

Clause is a legal document intelligence workspace that helps a non-lawyer
understand, compare, and act on the legal documents in their life — rental
agreements, offer letters, loan sanction letters, insurance policies,
NDAs, terms of service. Every substantive output is grounded in a specific
clause of a document you upload and is traceable back to it. If Clause
can't ground an answer in your document, it says so and offers to turn
your question into one for a lawyer.

> [!IMPORTANT]
> Clause provides **information about your document, not legal advice**.
> See the Safety Rail row in the table below and [`SECURITY.md`](SECURITY.md).

## Problem → feature map

| Problem-statement use case                                    | Feature                                                                            | Where it lives                                 |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------- |
| Understand a document I don't have a lawyer to explain        | **Clause Explorer** — side-by-side original/plain-language, bidirectionally linked | [`src/features/clauses`](src/features/clauses) |
| Know what I'm agreeing to before I sign                       | **Risk Radar** — every clause classified and risk-scored, cited                    | [`src/features/risk`](src/features/risk)       |
| Choose between two offers, or check what changed in a renewal | **Compare** — clause-level semantic diff                                           | [`src/features/compare`](src/features/compare) |
| Ask a specific question about my document                     | **Ask the Document** — retrieval-grounded Q&A with citation chips                  | [`src/features/qa`](src/features/qa)           |
| Prepare for signing / prepare to talk to a lawyer             | **Action Kit** — summary, obligations checklist, lawyer-questions sheet            | [`src/features/actions`](src/features/actions) |
| Get real legal advice ("should I sue", "will I win")          | **Safety Rail** — warm refusal, reframed, routed to Action Kit                     | [`src/features/safety`](src/features/safety)   |
| Upload a PDF/DOCX/pasted document to start                    | **Ingest** — client-side parse, preview, clause count                              | [`src/features/ingest`](src/features/ingest)   |

## Running the project

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

That's it — **no `.env` file, no API key, and no network call is
required.** Document parsing, clause segmentation, plain-language
rewriting, risk classification, and Q&A retrieval are all designed to run
**in your browser** via `LocalProvider`, a deterministic, rule-based
pipeline (see [`DECISIONS.md`](DECISIONS.md)). An optional
`GeminiProvider` upgrade path exists behind a key in `.env.local` (see
[`.env.example`](.env.example)) but is never required.

For a production build instead of the dev server:

```bash
npm run build
npm run start
```

> **Current status:** the project is at Step 1 of the build (scaffold,
> strict TypeScript/ESLint config, CI skeleton, test fixtures). The route
> above currently renders a placeholder page — the seven features in the
> table are directories with a public `index.ts` each, not yet
> implemented. `npm run dev` and all commands below already work end to
> end against this scaffold.

## All commands

| Command                 | What it does                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| `npm run dev`           | Start the dev server at `http://localhost:3000`                                                 |
| `npm run build`         | Production build                                                                                |
| `npm run start`         | Serve the production build (run `build` first)                                                  |
| `npm run typecheck`     | Regenerate Next's route types, then `tsc --noEmit` in strict mode                               |
| `npm run lint`          | ESLint — strict TypeScript, accessibility, security, and feature-boundary rules; zero warnings  |
| `npm run lint:fix`      | ESLint with autofix                                                                             |
| `npm run format`        | Prettier — write                                                                                |
| `npm run format:check`  | Prettier — check only (what CI runs)                                                            |
| `npm test`              | Vitest — run all unit/integration tests once                                                    |
| `npm run test:watch`    | Vitest — watch mode                                                                             |
| `npm run test:coverage` | Vitest with coverage (build fails below 90% on `lib/`/`shared/`)                                |
| `npm run test:e2e`      | Playwright end-to-end tests (builds and serves the app automatically)                           |
| `npm run test:e2e:ui`   | Playwright's interactive test runner UI                                                         |
| `npm run test:a11y`     | Just the `@a11y`-tagged Playwright/axe accessibility checks                                     |
| `npm run scan:secrets`  | Fails if the compiled `.next` bundle contains any key-shaped string (run after `npm run build`) |
| `npm run lighthouse`    | Lighthouse CI against a production build, asserted against the budgets in `lighthouserc.json`   |

## Documentation

- [`DECISIONS.md`](DECISIONS.md) — architectural choices and rejected alternatives
- [`SECURITY.md`](SECURITY.md) — threat model and mitigations
- [`ACCESSIBILITY.md`](ACCESSIBILITY.md) — WCAG 2.2 AA conformance notes
- [`PERFORMANCE.md`](PERFORMANCE.md) — measured performance budgets
- [`DEMO.md`](DEMO.md) — 3-minute demo script using the bundled fixtures

## Beyond the brief

_Filled in once the chosen differentiator (readability delta, vernacular
mode, or obligation calendar) is implemented — see [`DECISIONS.md`](DECISIONS.md)._
