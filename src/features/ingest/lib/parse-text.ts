import { err, ok, type Result } from "@/shared/lib/result";
import type { IngestError, RawDocument } from "../model/document";

/**
 * Wraps raw pasted or plain-text input as a {@link RawDocument}. Plain
 * text has no page concept, so `pageCount` is always 1 — page counts
 * only carry meaning for PDF's `MAX_PAGES` check.
 */
export function parseText(
  sourceFileName: string,
  text: string,
): Result<RawDocument, IngestError> {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return err({ code: "empty_input", message: "There's no text to analyze." });
  }
  return ok({ sourceFileName, kind: "text", pageCount: 1, text: trimmed });
}
