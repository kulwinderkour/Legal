import { describe, expect, it } from "vitest";
import { detectFileKind } from "../lib/detect-file-kind";

describe("detectFileKind", () => {
  it("recognizes a PDF from its magic bytes", () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
    expect(detectFileKind(bytes)).toBe("pdf");
  });

  it("recognizes a DOCX (zip magic) from its magic bytes", () => {
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
    expect(detectFileKind(bytes)).toBe("docx");
  });

  it("returns null for plain text content", () => {
    const bytes = new TextEncoder().encode("This is a plain text document.");
    expect(detectFileKind(bytes)).toBeNull();
  });

  it("returns null for an empty buffer", () => {
    expect(detectFileKind(new Uint8Array([]))).toBeNull();
  });

  it("is not fooled by a .pdf extension on non-PDF bytes", () => {
    const bytes = new TextEncoder().encode("not actually a pdf");
    expect(detectFileKind(bytes)).toBeNull();
  });

  it("returns null for a buffer shorter than any magic sequence", () => {
    expect(detectFileKind(new Uint8Array([0x25, 0x50]))).toBeNull();
  });
});
