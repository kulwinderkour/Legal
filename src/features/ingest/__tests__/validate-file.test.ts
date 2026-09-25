import { describe, expect, it } from "vitest";
import { UPLOAD_LIMITS } from "@/config/constants";
import { validateFileMeta } from "../lib/validate-file";

describe("validateFileMeta", () => {
  it("accepts a normal-sized file", () => {
    const result = validateFileMeta({
      name: "lease.pdf",
      size: 50_000,
      type: "application/pdf",
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a zero-byte file", () => {
    const result = validateFileMeta({ name: "empty.txt", size: 0, type: "text/plain" });
    expect(result).toEqual({
      ok: false,
      error: { code: "empty_input", message: expect.any(String) },
    });
  });

  it("rejects a file over the size limit", () => {
    const result = validateFileMeta({
      name: "huge.pdf",
      size: UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES + 1,
      type: "application/pdf",
    });
    expect(result).toEqual({
      ok: false,
      error: { code: "file_too_large", message: expect.any(String) },
    });
  });

  it("accepts a file exactly at the size limit", () => {
    const result = validateFileMeta({
      name: "max.pdf",
      size: UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES,
      type: "application/pdf",
    });
    expect(result.ok).toBe(true);
  });
});
