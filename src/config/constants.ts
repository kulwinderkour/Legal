/**
 * Central, typed home for every tunable threshold in the app.
 *
 * Rule: no magic numbers or strings anywhere else in the codebase. If a
 * value influences behaviour, it lives here with a comment explaining why
 * that specific value was chosen, so a reviewer (or a future contributor)
 * never has to guess.
 */

/** File upload limits (Security: DoS via oversized/pathological files). */
export const UPLOAD_LIMITS = {
  /**
   * 10 MB covers the overwhelming majority of real-world rental
   * agreements, offer letters and ToS documents (typically 50KB-2MB as
   * text/PDF) while keeping client-side parsing memory bounded on
   * low-end devices. Matches the brief's hard gate.
   */
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  /**
   * 300 pages is far beyond any consumer legal document but bounds
   * worst-case parse time in the Web Worker to a few seconds.
   */
  MAX_PAGES: 300,
  /** Accepted MIME types, validated against magic bytes, not trusted alone. */
  ACCEPTED_MIME_TYPES: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ] as const,
} as const;

/** Clause segmentation heuristics. */
export const SEGMENTATION = {
  /**
   * A clause shorter than this (in characters) after numbering-pattern
   * splitting is almost always a heading or a numbering artifact, not a
   * standalone clause, so it is merged into the following block.
   */
  MIN_CLAUSE_CHARS: 20,
  /**
   * Clauses longer than this are still valid (e.g. dense indemnity
   * clauses) but are flagged for virtualization performance testing.
   */
  LONG_CLAUSE_CHARS: 1200,
} as const;

/** Plain-language rewrite targets (Alignment: quantified readability delta). */
export const READABILITY = {
  /**
   * U.S. Plain Writing Act guidance and consumer-literacy research both
   * converge on 8th-grade reading level as the ceiling for documents
   * meant for a general adult audience.
   */
  TARGET_GRADE_LEVEL: 8,
  /** Anything above this on the original clause is flagged high-complexity. */
  HIGH_COMPLEXITY_GRADE_LEVEL: 14,
} as const;

/** Risk Radar scoring. */
export const RISK = {
  CATEGORIES: [
    "obligation",
    "right",
    "penalty",
    "termination",
    "liability",
    "payment",
    "data",
    "renewal",
    "boilerplate",
  ] as const,
  LEVELS: ["low", "medium", "high"] as const,
  /**
   * Minimum keyword/pattern score (0-1) required to classify a clause as
   * "high" risk rather than "medium" — calibrated against the bundled
   * fixtures so known-high-risk clauses (e.g. uncapped liability,
   * unilateral termination) clear the bar and boilerplate does not.
   */
  HIGH_RISK_SCORE_THRESHOLD: 0.66,
  MEDIUM_RISK_SCORE_THRESHOLD: 0.33,
} as const;

/** Ask the Document retrieval. */
export const RETRIEVAL = {
  /**
   * BM25 top-k candidates re-ranked by cosine similarity before an answer
   * is composed. 8 balances answer grounding breadth against noise.
   */
  TOP_K: 8,
  /**
   * Below this normalized confidence score, the UI must show the
   * explicit "not found in this document" state rather than improvise.
   * This is a hard product-safety rule, not a UX nicety.
   */
  MIN_CONFIDENCE_THRESHOLD: 0.2,
  /** Debounce for the Q&A input, avoiding a retrieval pass per keystroke. */
  INPUT_DEBOUNCE_MS: 250,
} as const;

/** Compare / diff. */
export const COMPARE = {
  /**
   * Minimum cosine similarity for two clauses across documents to be
   * considered the "same" clause for alignment purposes. Below this they
   * are treated as added/removed rather than changed.
   */
  ALIGNMENT_SIMILARITY_THRESHOLD: 0.5,
  /** At or above this similarity, a change is cosmetic rather than material. */
  COSMETIC_SIMILARITY_THRESHOLD: 0.92,
} as const;

/** Virtualization / rendering performance. */
export const PERFORMANCE = {
  /** Estimated row height (px) for the virtualized clause list. */
  CLAUSE_ROW_ESTIMATE_PX: 160,
  /** Overscan rows kept mounted outside the viewport for smooth scroll. */
  VIRTUAL_OVERSCAN: 6,
} as const;

/** Safety Rail request classification. */
export const SAFETY = {
  /**
   * Requests scoring at or above this on the legal-advice classifier are
   * refused and rerouted, rather than answered. Calibrated to catch
   * "should I sue" / "will I win" phrasing without over-triggering on
   * legitimate "what does this clause say" questions.
   */
  ADVICE_REQUEST_SCORE_THRESHOLD: 0.5,
} as const;
