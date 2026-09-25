import { describe, expect, it } from "vitest";
import { err, ok } from "./result";

describe("Result", () => {
  it("ok() produces a successful result carrying the value", () => {
    const result = ok(42);
    expect(result).toEqual({ ok: true, value: 42 });
  });

  it("err() produces a failed result carrying the error", () => {
    const result = err("boom");
    expect(result).toEqual({ ok: false, error: "boom" });
  });
});
