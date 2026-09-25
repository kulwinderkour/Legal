import { beforeEach, describe, expect, it, vi } from "vitest";

const getDocument = vi.fn();

vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  GlobalWorkerOptions: {},
  getDocument: (...args: unknown[]) => getDocument(...args),
}));

const { parsePdf } = await import("../lib/parse-pdf");

function pageWithText(text: string): {
  getTextContent: () => Promise<{ items: { str: string }[] }>;
} {
  return {
    getTextContent: () => Promise.resolve({ items: [{ str: text }] }),
  };
}

describe("parsePdf", () => {
  beforeEach(() => {
    getDocument.mockReset();
  });

  it("extracts and joins text across pages", async () => {
    getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 2,
        getPage: (n: number) => Promise.resolve(pageWithText(`page ${String(n)} text`)),
      }),
    });
    const result = await parsePdf("doc.pdf", new Uint8Array());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.pageCount).toBe(2);
      expect(result.value.text).toContain("page 1 text");
      expect(result.value.text).toContain("page 2 text");
    }
  });

  it("rejects a document over the page limit before reading any page", async () => {
    const getPage = vi.fn();
    getDocument.mockReturnValue({
      promise: Promise.resolve({ numPages: 301, getPage }),
    });
    const result = await parsePdf("huge.pdf", new Uint8Array());
    expect(result).toEqual({
      ok: false,
      error: { code: "too_many_pages", message: expect.any(String) },
    });
    expect(getPage).not.toHaveBeenCalled();
  });

  it("reports no_text_layer for a scanned PDF with no text", async () => {
    getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: () => Promise.resolve(pageWithText("")),
      }),
    });
    const result = await parsePdf("scanned.pdf", new Uint8Array());
    expect(result).toEqual({
      ok: false,
      error: { code: "no_text_layer", message: expect.any(String) },
    });
  });

  it("reports encrypted_pdf for a password-protected file", async () => {
    const passwordError = new Error("Password required");
    passwordError.name = "PasswordException";
    getDocument.mockReturnValue({ promise: Promise.reject(passwordError) });
    const result = await parsePdf("locked.pdf", new Uint8Array());
    expect(result).toEqual({
      ok: false,
      error: { code: "encrypted_pdf", message: expect.any(String) },
    });
  });

  it("reports parse_failed for any other corruption", async () => {
    getDocument.mockReturnValue({ promise: Promise.reject(new Error("bad xref table")) });
    const result = await parsePdf("corrupt.pdf", new Uint8Array());
    expect(result).toEqual({
      ok: false,
      error: { code: "parse_failed", message: expect.any(String) },
    });
  });
});
