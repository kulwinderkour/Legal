# Fixtures

Deterministic sample documents used by unit, integration, and e2e tests, and
by the bundled demo (see [`DEMO.md`](../../DEMO.md)). Plain `.txt` is used
instead of real `.pdf`/`.docx` binaries so fixtures are diffable in code
review; PDF/DOCX-specific parsing paths (magic bytes, encrypted files, no
text layer) are covered separately by small generated binary fixtures in
`tests/fixtures/binary/` (added alongside the parser in Step 2).

## Ground truth

| File                           |       Clauses (numbered segments) | Notes                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------ | --------------------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rental-agreement.txt`         | 16 (`1`–`14`, incl. `5.1`, `5.2`) | Candidate high-risk clauses: `3` (compounding late fees), `5`/`5.1`/`5.2` (no-cure termination at landlord's sole discretion), `9` (liability disclaimer regardless of negligence), `10` (rent increase via deemed acceptance).                                                                                                                                                                 |
| `offer-letter.txt`             |        13 (`1`–`12`, incl. `5.1`) | Candidate high-risk clauses: `3` (bonus clawback), `5`/`5.1` (12-month non-compete), `7` (arbitration + jury/class-action waiver).                                                                                                                                                                                                                                                              |
| `saas-terms-of-service-v1.txt` |                     13 (`1`–`13`) | Baseline for Compare.                                                                                                                                                                                                                                                                                                                                                                           |
| `saas-terms-of-service-v2.txt` |                     13 (`1`–`13`) | Compare counterpart. Relative to v1: clause `5` ("Data Use by Company", the no-sell promise) is **removed**; a new `10` ("Arbitration") is **added**; termination notice (30→7 days), free trial (14→7 days), liability cap (12mo fees→$100 or 1mo fees), and data retention (30→7 days) are **materially changed** and adverse to the user; clause `1` wording is a **cosmetic** rewrite only. |
| `adversarial-injection.txt`    |   9 (`1`–`7`, incl. `3.1`, `3.2`) | Security fixture, not a real document. Clause `3` is a direct prompt-injection attempt; `3.1`/`3.2` are `<script>`/`onerror` XSS payloads; `5` attempts to impersonate a system message to disable the Safety Rail. Document content must always be treated as inert data — see [`SECURITY.md`](../../SECURITY.md).                                                                             |

## Why these three "realistic" documents

They map directly to three of the product's named use cases (rental
agreements, offer letters, terms of service) and each was written to
contain at least one clause per Risk Radar category the classifier must
support (`obligation`, `right`, `penalty`, `termination`, `liability`,
`payment`, `data`, `renewal`, `boilerplate`).
