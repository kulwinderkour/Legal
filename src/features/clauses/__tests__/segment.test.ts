import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { segmentClauses } from "../lib/segment";

const FIXTURES_DIR = join(process.cwd(), "tests", "fixtures");

function loadFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), "utf8");
}

describe("segmentClauses — edge cases", () => {
  it("returns an empty array for an empty document", () => {
    expect(segmentClauses("")).toEqual([]);
    expect(segmentClauses("   \n\n  ")).toEqual([]);
  });

  it("treats a single unnumbered paragraph as one clause", () => {
    const clauses = segmentClauses("This is the only sentence in the document.");
    expect(clauses).toHaveLength(1);
    expect(clauses[0]).toMatchObject({ index: 0, number: null });
  });

  it("treats every paragraph as its own clause when no numbering exists anywhere", () => {
    const text =
      "First paragraph of raw pasted text.\n\nSecond paragraph, still no numbers.";
    const clauses = segmentClauses(text);
    expect(clauses).toHaveLength(2);
    expect(clauses.every((c) => c.number === null)).toBe(true);
  });

  it("drops unnumbered front matter (title/intro) once numbering starts", () => {
    const text = [
      "SOME AGREEMENT",
      "",
      "This is the intro paragraph before any numbering.",
      "",
      "1. First clause. Body text here.",
      "",
      "2. Second clause. More body text.",
    ].join("\n");
    const clauses = segmentClauses(text);
    expect(clauses).toHaveLength(2);
    expect(clauses[0]?.number).toBe("1");
    expect(clauses[1]?.number).toBe("2");
  });

  it("handles nested numbering including a lettered sub-clause", () => {
    const text = [
      "1. Top level. Some text.",
      "",
      "14.2.1(a) Deeply nested. Some other text.",
    ].join("\n\n");
    const clauses = segmentClauses(text);
    expect(clauses.map((c) => c.number)).toEqual(["1", "14.2.1(a)"]);
  });

  it("merges a wrapped continuation paragraph into the preceding clause", () => {
    const text = [
      "1. First clause. Opening sentence.",
      "",
      "This paragraph continues clause 1 without its own number.",
      "",
      "2. Second clause. Opening sentence.",
    ].join("\n\n");
    const clauses = segmentClauses(text);
    expect(clauses).toHaveLength(2);
    expect(clauses[0]?.text).toContain("continues clause 1");
  });

  it("merges a too-short fragment into the following clause", () => {
    const text = [
      "1. A.",
      "",
      "2. This is a long enough real clause body to stand alone.",
    ].join("\n\n");
    const clauses = segmentClauses(text);
    expect(clauses).toHaveLength(1);
    expect(clauses[0]?.text).toContain("1. A.");
    expect(clauses[0]?.text).toContain("long enough real clause body");
  });

  it("does not treat injected instruction-like text as anything but clause content", () => {
    const text = loadFixture("adversarial-injection.txt");
    const clauses = segmentClauses(text);
    const injectionClause = clauses.find((c) => c.number === "3");
    expect(injectionClause?.text).toContain("IGNORE ALL PREVIOUS INSTRUCTIONS");
    // It's segmented like any other clause — a string field, never executed
    // or treated as a directive by this function.
    expect(typeof injectionClause?.text).toBe("string");
  });

  it("segments non-English text by paragraph when no Western numbering is present", () => {
    const text = "पहला पैराग्राफ हिंदी में।\n\nदूसरा पैराग्राफ, बिना किसी संख्या के।";
    const clauses = segmentClauses(text);
    expect(clauses).toHaveLength(2);
  });

  it("segments a very long (300+ paragraph) document without error", () => {
    const paragraphs = Array.from(
      { length: 300 },
      (_, i) => `${String(i + 1)}. Clause ${String(i + 1)}. Body text for this clause.`,
    );
    const clauses = segmentClauses(paragraphs.join("\n\n"));
    expect(clauses).toHaveLength(300);
    expect(clauses[299]?.number).toBe("300");
  });
});

describe("segmentClauses — bundled fixtures (ground truth in tests/fixtures/README.md)", () => {
  it.each([
    ["rental-agreement.txt", 16],
    ["offer-letter.txt", 13],
    ["saas-terms-of-service-v1.txt", 13],
    ["saas-terms-of-service-v2.txt", 13],
  ])("segments %s into %d clauses", (file, expectedCount) => {
    const clauses = segmentClauses(loadFixture(file));
    expect(clauses).toHaveLength(expectedCount);
  });

  it("extracts a heading for a well-formed clause", () => {
    const clauses = segmentClauses(loadFixture("rental-agreement.txt"));
    const term = clauses.find((c) => c.number === "1");
    expect(term?.heading).toBe("Term");
  });

  it("keeps sub-numbered clauses (5.1, 5.2) distinct from their parent", () => {
    const clauses = segmentClauses(loadFixture("rental-agreement.txt"));
    const numbers = clauses.map((c) => c.number);
    expect(numbers).toContain("5");
    expect(numbers).toContain("5.1");
    expect(numbers).toContain("5.2");
  });
});
