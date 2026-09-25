import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { UPLOAD_LIMITS } from "@/config/constants";
import { err, ok, type Result } from "@/shared/lib/result";
import type { IngestError, RawDocument } from "../model/document";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.mjs",
  import.meta.url,
).toString();

/** Joins one page's text-content items into a single space-separated string. */
async function extractPageText(
  doc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
): Promise<string> {
  const page = await doc.getPage(pageNumber);
  const content = await page.getTextContent();
  return content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
}

/**
 * Extracts text from a PDF's pages using pdf.js. Runs inside the ingest
 * Web Worker, never on the main thread, so a pathological PDF can't lock
 * the UI (Efficiency/Security: DoS via a malformed or oversized file).
 * Complexity is O(pages × items-per-page) — bounded by
 * {@link UPLOAD_LIMITS.MAX_PAGES}, checked before any page is read.
 */
export async function parsePdf(
  sourceFileName: string,
  bytes: Uint8Array,
): Promise<Result<RawDocument, IngestError>> {
  try {
    const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
    if (doc.numPages > UPLOAD_LIMITS.MAX_PAGES) {
      return err({
        code: "too_many_pages",
        message: `This PDF has ${String(doc.numPages)} pages; the limit is ${String(UPLOAD_LIMITS.MAX_PAGES)}.`,
      });
    }

    const pageTexts: string[] = [];
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      pageTexts.push(await extractPageText(doc, pageNumber));
    }

    const text = pageTexts.join("\n\n").trim();
    if (text.length === 0) {
      return err({
        code: "no_text_layer",
        message: "This PDF has no selectable text (it looks like a scanned image).",
      });
    }
    return ok({ sourceFileName, kind: "pdf", pageCount: doc.numPages, text });
  } catch (error) {
    if (error instanceof Error && error.name === "PasswordException") {
      return err({ code: "encrypted_pdf", message: "This PDF is password-protected." });
    }
    return err({ code: "parse_failed", message: "This PDF could not be read." });
  }
}
