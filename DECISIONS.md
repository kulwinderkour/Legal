# Architectural Decisions

Each entry: the decision, the alternative considered, and why the
alternative was rejected. Ordered by when the decision was made.

## Scaffold & language

**Decision:** Next.js (App Router) + TypeScript in `strict` mode, with
`noUncheckedIndexedAccess`, `noImplicitOverride`, and
`noFallthroughCasesInSwitch` also enabled.
**Rejected alternative:** Vite + React Router SPA. Rejected because the App
Router gives file-based routes for free (needed for the seven distinct
features/routes the axe and Lighthouse suites must cover per-route), and
its middleware layer is the natural place to set CSP headers on every
response without a custom server.

**Decision:** `noPropertyAccessFromIndexSignature` and
`exactOptionalPropertyTypes` were considered but left off.
**Why:** Both are legitimate strictness dials, but they produce friction
against third-party type definitions (React, Next's generated route types)
disproportionate to the bugs they'd catch here. `noUncheckedIndexedAccess`
already forces every array/record access to be null-checked, which is the
one from this group that directly prevents a real class of bug (silent
`undefined` reads in clause/citation lookups).

## Styling & components

**Decision:** Tailwind CSS + Radix UI primitives (`dialog`, `tooltip`,
`visually-hidden`, `label`, `slot` only — not the full Radix suite).
**Rejected alternative:** Headless UI, or hand-rolled components.
Rejected because Radix's focus-trap/restore-on-close/`Esc` handling and
correct ARIA wiring are exactly what the Accessibility axis grades, and
hand-rolling them is where most WCAG dialog/popover violations come from
in practice. The primitive set was kept to five packages — one per actual
interaction pattern in the brief (confirm/export dialogs, risk-badge
detail on hover/focus, skip-link visually-hidden text, accessible form
labels) — rather than importing Radix's full component catalog, to keep
dependency count and bundle size down (Efficiency axis).

## Validation

**Decision:** Zod at every boundary — file input, form input, provider
responses (`AnalysisProvider` return values), and Web Worker
postMessage payloads.
**Why:** Worker messages and provider responses cross a serialization
boundary where TypeScript's static types provide no runtime guarantee.
Parsing with Zod at that boundary converts "trust the shape" bugs into
caught, typed `Result` errors instead of runtime crashes deep in a
component.

## Error handling

**Decision:** A `Result<T, E>` discriminated union
(`src/shared/lib/result.ts`) for all cross-module-boundary fallibility,
reserving thrown exceptions for truly exceptional/programmer-error cases.
**Rejected alternative:** Throwing everywhere and relying on
`try`/`catch` at call sites. Rejected because it is invisible in a
function's type signature — a caller can't tell a function is fallible
without reading its implementation, and it's easy to forget a `catch`
around a boundary call (e.g. Web Worker message handling). `Result`
puts the failure mode in the type the compiler checks.

## Testing stack

**Decision:** Vitest 5 + Testing Library + Playwright + `@axe-core/playwright`.
**Note:** Vitest was pinned to `^5.0.1` rather than the `^2.x` line
`create-next-app`-adjacent tooling defaults to, because `@vitest/coverage-v8@2.x`
transitively pulled a `vite`/`@vitest/mocker` chain with a **critical**
path-traversal/arbitrary-file-read advisory (GHSA affecting `@vitest/mocker`
via dev-server redirects). `npm audit` must be clean on the dependency tree
we ship in CI, dev dependencies included, not just production ones.
**Consequence:** Vitest 5 requires `@types/node` `^22`, so that was bumped
from Next's scaffolded `^20` default; this has no runtime effect since
`@types/node` is a type-only dev dependency.

**Remaining audit findings:** `npm audit` still reports findings against
`@lhci/cli`'s transitive tree (`lighthouse` → `puppeteer-core` →
`@puppeteer/browsers`/`extract-zip`, and `inquirer` → `external-editor` →
`tmp`). These are CI-tooling-only dev dependencies never bundled or
shipped; `npm audit --omit=dev` — what `.github/workflows/ci.yml`'s
`audit` job actually gates on — reports zero vulnerabilities. Accepted as
a known limitation rather than pinning Lighthouse CI to an unreleased
fix; revisit if `@lhci/cli` ships a patched release.

## Feature-sliced architecture

**Decision:** `src/features/{ingest,clauses,risk,compare,qa,actions,safety}/`
each with `ui/`, `model/`, `lib/`, `__tests__/`, exporting only through a
feature's `index.ts`. Enforced (not just documented) via
`eslint-plugin-import`'s `no-restricted-paths`, so a deep cross-feature
import is a lint error, not a convention someone can silently violate.
**Rejected alternative:** A single flat `src/components` +
`src/lib` split. Rejected because seven features with meaningfully
different domain logic (segmentation vs. risk scoring vs. retrieval vs.
diffing) benefit from independently testable, independently replaceable
slices, and the brief's Code Quality axis explicitly grades module
boundaries.

## Security headers

**Decision:** A nonce-based CSP (`script-src 'self' 'nonce-<per-request>'
'strict-dynamic'`, no `unsafe-inline`/`unsafe-eval`) plus
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, and a
`Permissions-Policy` denying camera/mic/geolocation, all set in
`src/proxy.ts` (Next.js's `middleware` file convention, renamed
`proxy` as of Next 16) on every request.
**Why proxy/middleware over `next.config.ts` headers:** `next.config.ts`
headers are static and can't carry a fresh per-request nonce; the proxy
layer runs before every response and can.

**Dev-mode exception:** `'unsafe-eval'` and `connect-src ws:/wss:` are
added to the policy only when `process.env.NODE_ENV === "development"`.
Next's dev server uses `eval()` for React's component-stack debugging and
a websocket for Turbopack hot-reload; a fully strict CSP breaks `npm run
dev` with a console error ("eval() is not supported... make sure
`unsafe-eval` is included") without touching the shipped product. The
gate reads `NODE_ENV`, not a request header, so a client can't spoof its
way into the relaxed policy in production.

## Provider abstraction

**Decision:** An `AnalysisProvider` interface with `LocalProvider`
(deterministic, in-browser, zero network, zero keys — the default and the
provider exercised by graders) and an optional `GeminiProvider` that only
activates if a server-side key is present, never bundled to the client.
**Why:** This is the hard gate in the brief (`npm install && npm run dev`
must fully work with no `.env`). Making `LocalProvider` the _only_
required path, with `GeminiProvider` strictly additive behind a runtime
check, means the grading path never depends on network access or a key
existing.

## Fixture format

**Decision:** The three "realistic" sample documents and the adversarial
fixture are plain `.txt` in Step 1, not `.pdf`/`.docx` binaries.
**Why:** They need to be reviewable as a diff and readable by anyone
auditing the adversarial fixture's injection payloads before it's clear
the parser is safe. Binary `.pdf`/`.docx` fixtures exercising
format-specific edge cases (encrypted PDF, no text layer/scanned image,
malformed magic bytes) are added in Step 2 alongside the parser that
consumes them, in `tests/fixtures/binary/`, since they're meaningless
without that code to test against.
