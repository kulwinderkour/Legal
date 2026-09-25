import { beforeEach, describe, expect, it, vi } from "vitest";

const extractRawText = vi.fn();
vi.mock("mammoth", () => ({
  default: { extractRawText: (...args: unknown[]) => extractRawText(...args) },
}));

const { parseDocx } = await import("../lib/parse-docx");

describe("parseDocx", () => {
  beforeEach(() => {
    extractRawText.mockReset();
  });

  it("returns a RawDocument for a valid docx", async () => {
    extractRawText.mockResolvedValue({ value: "Extracted clause text.", messages: [] });
    const result = await parseDocx("agreement.docx", new ArrayBuffer(8));
    expect(result).toEqual({
      ok: true,
      value: {
        sourceFileName: "agreement.docx",
        kind: "docx",
        pageCount: 1,
        text: "Extracted clause text.",
      },
    });
  });

  it("reports no_text_layer when extraction yields no text", async () => {
    extractRawText.mockResolvedValue({ value: "   ", messages: [] });
    const result = await parseDocx("empty.docx", new ArrayBuffer(8));
    expect(result).toEqual({
      ok: false,
      error: { code: "no_text_layer", message: expect.any(String) },
    });
  });

  it("reports parse_failed when mammoth throws on a corrupt file", async () => {
    extractRawText.mockRejectedValue(new Error("not a valid zip"));
    const result = await parseDocx("corrupt.docx", new ArrayBuffer(8));
    expect(result).toEqual({
      ok: false,
      error: { code: "parse_failed", message: expect.any(String) },
    });
  });
});
