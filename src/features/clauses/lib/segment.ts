import { SEGMENTATION } from "@/config/constants";
import type { Clause } from "../model/clause";

/**
 * Matches a legal numbering label at the start of a paragraph: `1.`,
 * `5.1.`, `14.2.1(a)`, with or without a trailing period, provided
 * something follows it on the same paragraph. Capture group 1 is the
 * label itself (without trailing punctuation).
 */
// Anchored at the start with disjoint alternatives (digits vs. a literal
// "."), so there's no ambiguous overlap between the outer and inner
// quantifiers for the backtracking-based ReDoS this rule guards against.
const CLAUSE_NUMBER_PATTERN = new RegExp(
  "^(\\d+(?:\\.\\d+)*(?:\\([a-zA-Z0-9]+\\))?)[.)]?\\s+(?=" + "\\S)"
);

/** A clause label followed by its heading, ending at the first period. */
const HEADING_MAX_CHARS = 60;

interface ClauseDraft {
  number: string | null;
  text: string;
}

/** Splits raw text into paragraphs on blank lines, dropping empties. */
function splitParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Extracts a short heading from a clause's text, if one is present. */
function extractHeading(text: string): string | null {
  const match = CLAUSE_NUMBER_PATTERN.exec(text);
  const rest = match ? text.slice(match[0].length) : text;
  const periodIndex = rest.indexOf(".");
  if (periodIndex === -1 || periodIndex > HEADING_MAX_CHARS) return null;
  const heading = rest.slice(0, periodIndex).trim();
  return heading.length > 0 ? heading : null;
}

/**
 * Groups paragraphs into clause drafts. Paragraphs before the first
 * numbered one are front matter (title/intro) and are dropped. Once
 * numbering starts, every paragraph becomes its own clause unless it
 * doesn't match the numbering pattern, in which case it's a wrapped
 * continuation of the previous clause.
 */
function groupByNumbering(
  paragraphs: string[],
  firstNumberedIndex: number,
): ClauseDraft[] {
  const drafts: ClauseDraft[] = [];
  for (const paragraph of paragraphs.slice(firstNumberedIndex)) {
    const match = CLAUSE_NUMBER_PATTERN.exec(paragraph);
    const previous = drafts.at(-1);
    if (match) {
      drafts.push({ number: match[1] ?? null, text: paragraph });
    } else if (previous) {
      previous.text = `${previous.text}\n\n${paragraph}`;
    } else {
      drafts.push({ number: null, text: paragraph });
    }
  }
  return drafts;
}

/**
 * Merges a clause shorter than {@link SEGMENTATION.MIN_CLAUSE_CHARS} into
 * the *following* clause — such a fragment is almost always a heading or
 * numbering artifact split off on its own, not a standalone clause.
 */
function mergeShortDrafts(drafts: ClauseDraft[]): ClauseDraft[] {
  const merged: ClauseDraft[] = [];
  let pending = "";
  for (const draft of drafts) {
    const text = pending ? `${pending}\n\n${draft.text}` : draft.text;
    if (text.length < SEGMENTATION.MIN_CLAUSE_CHARS) {
      pending = text;
      continue;
    }
    merged.push({ ...draft, text });
    pending = "";
  }
  if (pending) {
    const last = merged.at(-1);
    if (last) {
      last.text = `${last.text}\n\n${pending}`;
    } else {
      merged.push({ number: null, text: pending });
    }
  }
  return merged;
}

/**
 * Segments a document's plain text into clauses using legal numbering
 * patterns and paragraph boundaries. Pure and synchronous: O(n) in the
 * document's length, with no I/O, so it never fails and returns a plain
 * array rather than a `Result`.
 *
 * When no numbering pattern is found anywhere in the document, every
 * paragraph becomes its own unnumbered clause (covers raw pasted text,
 * non-English documents without Western numbering, etc).
 */
export function segmentClauses(text: string): Clause[] {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length === 0) return [];

  const firstNumberedIndex = paragraphs.findIndex((p) => CLAUSE_NUMBER_PATTERN.test(p));
  const drafts =
    firstNumberedIndex === -1
      ? paragraphs.map((p) => ({ number: null, text: p }))
      : mergeShortDrafts(groupByNumbering(paragraphs, firstNumberedIndex));

  return drafts.map((draft, index) => ({
    id: `clause-${String(index)}`,
    index,
    number: draft.number,
    heading: extractHeading(draft.text),
    text: draft.text,
  }));
}
