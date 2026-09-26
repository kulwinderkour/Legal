import { describe, it, expect } from "vitest";
import { LocalProvider } from "@/shared/providers/local-provider";
import { segmentClauses } from "@/features/clauses/lib/segment";
import { DEMO_DOCUMENT_TEXT } from "@/shared/demo-document";

describe("Risk & Inconsistencies Detection", () => {
  it("detects inconsistencies, rights, and action options from clauses", async () => {
    const provider = new LocalProvider();
    const clauses = segmentClauses(DEMO_DOCUMENT_TEXT);

    const kit = await provider.generateActionKit(clauses);

    // Metadata validation
    expect(kit.metadata).toBeDefined();
    expect(kit.metadata?.docType).toBe("Residential Rental Agreement");
    expect(kit.metadata?.keyTakeaway).toBeDefined();

    // Obligations structured validation
    expect(kit.obligations.length).toBeGreaterThan(0);
    const firstOb = kit.obligations[0];
    if (typeof firstOb !== "string") {
      expect(firstOb.party).toBeDefined();
      expect(firstOb.timing).toBeDefined();
    }

    // Rights tracker validation
    expect(kit.rights).toBeDefined();
    expect(kit.rights!.length).toBeGreaterThan(0);

    // Inconsistencies validation
    expect(kit.inconsistencies).toBeDefined();
    expect(kit.inconsistencies!.length).toBeGreaterThan(0);

    // Options & Redlines validation
    expect(kit.options).toBeDefined();
    expect(kit.options?.negotiationPoints.length).toBeGreaterThan(0);
    expect(kit.options?.actionMilestones.length).toBe(4);
  });
});
