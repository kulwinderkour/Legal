/**
 * Discriminated-union result type used at every module boundary instead of
 * throwing. Keeps error handling explicit and type-checked by the compiler
 * rather than relying on try/catch call sites remembering to happen.
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Wraps a value as a successful {@link Result}. */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/** Wraps an error as a failed {@link Result}. */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
