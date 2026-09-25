import { describe, expect, it } from "vitest";
import { parseText } from "../lib/parse-text";

describe("parseText", () => {
  it("wraps non-empty text as a RawDocument", () => {
    const result = parseText("pasted.txt", "Some clause text.");
    expect(result).toEqual({
      ok: true,
      value: {
        sourceFileName: "pasted.txt",
        kind: "text",
        pageCount: 1,
        text: "Some clause text.",
      },
    });
  });

  it("trims surrounding whitespace", () => {
    const result = parseText("pasted.txt", "  \n  Hello.  \n  ");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.text).toBe("Hello.");
  });

  it("rejects empty input", () => {
    const result = parseText("pasted.txt", "");
    expect(result).toEqual({
      ok: false,
      error: { code: "empty_input", message: expect.any(String) },
    });
  });

  it("rejects whitespace-only input", () => {
    const result = parseText("pasted.txt", "   \n\t  ");
    expect(result.ok).toBe(false);
  });
});
