import { UPLOAD_LIMITS } from "@/config/constants";
import { err, ok, type Result } from "@/shared/lib/result";
import type { IngestError, UploadedFileMeta } from "../model/document";

/**
 * Validates file metadata *before* any bytes are read or parsed
 * (Security: DoS via oversized files — reject on size alone, cheaply,
 * rather than starting an expensive parse first). This is a first-pass
 * check only; the authoritative type check is
 * {@link import("./detect-file-kind").detectFileKind} against magic
 * bytes, since `meta.type` is attacker-controllable.
 */
export function validateFileMeta(meta: UploadedFileMeta): Result<true, IngestError> {
  if (meta.size === 0) {
    return err({ code: "empty_input", message: "The selected file is empty." });
  }
  if (meta.size > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
    const maxMb = UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES / (1024 * 1024);
    return err({
      code: "file_too_large",
      message: `This file is larger than the ${String(maxMb)}MB limit.`,
    });
  }
  return ok(true);
}
