import type { FileKind } from "../model/document";

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // "%PDF"
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]; // "PK\x03\x04" — DOCX is a zip

function startsWith(bytes: Uint8Array, magic: number[]): boolean {
  if (bytes.length < magic.length) return false;
  // `bytes` is the raw file buffer being sniffed, not a user-keyed
  // object; indexing it by position is exactly `Uint8Array`'s contract.
  return magic.every((byte, i) => bytes.at(i) === byte);
}

/**
 * Detects a file's real kind from its magic bytes rather than trusting
 * its extension or `File.type` (Security: a `.txt` renamed to `.pdf`, or
 * an incorrect MIME type from the browser, must not fool the parser
 * chosen for it). Returns `null` for anything unrecognized; the caller
 * decides whether to fall back to treating it as plain text.
 */
export function detectFileKind(bytes: Uint8Array): FileKind | null {
  if (startsWith(bytes, PDF_MAGIC)) return "pdf";
  // Any zip-magic file is treated as a DOCX candidate — it's the only
  // zip-based format Clause accepts. If it isn't actually a Word
  // document, `parse-docx.ts`'s mammoth call fails with "parse_failed"
  // rather than this function misclassifying it as something else.
  if (startsWith(bytes, ZIP_MAGIC)) return "docx";
  return null;
}
