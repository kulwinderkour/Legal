import { z } from "zod";

/** The three source kinds Clause can ingest, detected from file bytes. */
export const fileKindSchema = z.enum(["pdf", "docx", "text"]);
export type FileKind = z.infer<typeof fileKindSchema>;

/** Metadata about an uploaded file, validated before any parsing begins. */
export const uploadedFileMetaSchema = z.object({
  name: z.string().min(1),
  size: z.number().int().nonnegative(),
  type: z.string(),
});
export type UploadedFileMeta = z.infer<typeof uploadedFileMetaSchema>;

/** A document after successful parsing, before clause segmentation. */
export const rawDocumentSchema = z.object({
  sourceFileName: z.string(),
  kind: fileKindSchema,
  pageCount: z.number().int().positive(),
  text: z.string(),
});
export type RawDocument = z.infer<typeof rawDocumentSchema>;

/** Every way ingestion can fail, surfaced to the user with a specific message. */
export const ingestErrorSchema = z.object({
  code: z.enum([
    "file_too_large",
    "too_many_pages",
    "unsupported_type",
    "encrypted_pdf",
    "no_text_layer",
    "empty_input",
    "parse_failed",
  ]),
  message: z.string(),
});
export type IngestError = z.infer<typeof ingestErrorSchema>;
