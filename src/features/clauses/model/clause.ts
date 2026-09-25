import { z } from "zod";

/**
 * A single segmented clause from a source document. `number` is the
 * document's own numbering label (e.g. `"5.1"`), not a display index —
 * it's what every citation chip and risk entry elsewhere in the app
 * points back to, so it must survive round-trips through Zod untouched.
 */
export const clauseSchema = z.object({
  id: z.string(),
  /** 0-based position in reading order; stable even if `number` is null. */
  index: z.number().int().nonnegative(),
  /** The document's own numbering label, e.g. "5.1", or null if unnumbered. */
  number: z.string().nullable(),
  /** Short title extracted from the clause's opening sentence, if any. */
  heading: z.string().nullable(),
  /** Full clause text, including its number/heading, exactly as authored. */
  text: z.string().min(1),
});

export type Clause = z.infer<typeof clauseSchema>;
