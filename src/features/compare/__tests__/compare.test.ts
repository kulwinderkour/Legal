import { describe, it, expect } from "vitest";
import { LocalProvider } from "@/shared/providers/local-provider";
import { segmentClauses } from "@/features/clauses/lib/segment";
import { DEMO_DOCUMENT_TEXT, DEMO_RENEWAL_TEXT } from "@/shared/demo-document";

describe("Document Comparison Engine", () => {
  it("compares two versions and detects material differences and dimension changes", async () => {
    const provider = new LocalProvider();
    const clausesA = segmentClauses(DEMO_DOCUMENT_TEXT);
    const clausesB = segmentClauses(DEMO_RENEWAL_TEXT);

    const result = await provider.compareDocuments(clausesA, clausesB, "Original Lease", "Renewal Lease");

    expect(result.summary).toContain("substantive modifications");
    expect(result.materialDifferences.length).toBeGreaterThan(0);

    // Verify financial rate difference was detected
    const rentDiff = result.materialDifferences.find((d) => d.title.includes("Rent") || d.category.includes("Payment"));
    expect(rentDiff).toBeDefined();
    expect(rentDiff?.riskShift).toBe("Increased Risk");

    // Verify dimension breakdown table exists
    expect(result.dimensionComparison.length).toBeGreaterThanOrEqual(3);
    const finDim = result.dimensionComparison.find((d) => d.dimension.includes("Financial"));
    expect(finDim).toBeDefined();
    expect(finDim?.docAValue).toContain("25,000");
    expect(finDim?.docBValue).toContain("28,000");
  });
});
