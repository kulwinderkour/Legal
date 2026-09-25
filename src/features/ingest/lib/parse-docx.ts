import mammoth from "mammoth";
import { err, ok, type Result } from "@/shared/lib/result";
import type { IngestError, RawDocument } from "../model/document";

/**
 * Extracts plain text from a `.docx` file via mammoth. DOCX has no fixed
 * "page" concept (pagination is a rendering detail, not stored in the
 * file), so `pageCount` is fixed at 1 — only the PDF path enforces
 * `UPLOAD_LIMITS.MAX_PAGES`.
 */
export async function parseDocx(
  sourceFileName: string,
  bytes: ArrayBuffer,
): Promise<Result<RawDocument, IngestError>> {
  try {
    const { value } = await mammoth.extractRawText({ arrayBuffer: bytes });
    const text = value.trim();
    if (text.length === 0) {
      return err({
        code: "no_text_layer",
        message: "This document has no extractable text.",
      });
    }
    return ok({ sourceFileName, kind: "docx", pageCount: 1, text });
  } catch {
    return err({ code: "parse_failed", message: "This .docx file could not be read." });
  }
}
