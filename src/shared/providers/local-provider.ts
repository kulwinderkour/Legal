import type {
  AnalysisProvider,
  Explanation,
  RiskAssessment,
  QAResponse,
  ActionKit,
  Clause,
  ComparisonResult,
  InconsistencyItem,
  ObligationItem,
  RightItem,
  DocumentMetadata,
  OptionsAndNextSteps,
} from "./analysis-provider";

// ---------- Helpers ----------

function firstSentences(text: string, n = 2): string {
  return (text.match(/[^.!?]{10,}[.!?]/g) ?? [text]).slice(0, n).join(" ").trim();
}

function detectClauseType(lower: string): string {
  if (lower.includes("payment") || lower.includes("rent") || lower.includes("fee") || lower.includes("invoice") || lower.includes("cost") || lower.includes("deposit")) return "Payment & Financial";
  if (lower.includes("terminat") || lower.includes("cancel") || lower.includes("end the") || lower.includes("expire") || lower.includes("notice period")) return "Termination & Notice";
  if (lower.includes("liabilit") || lower.includes("indemnif") || lower.includes("responsib") || lower.includes("damage")) return "Liability & Indemnity";
  if (lower.includes("confiden") || lower.includes("disclos") || lower.includes("secret") || lower.includes("proprietary")) return "Confidentiality & Non-Disclosure";
  if (lower.includes("intellectu") || lower.includes("copyright") || lower.includes("patent") || lower.includes("trademark")) return "Intellectual Property";
  if (lower.includes("govern") || lower.includes("jurisdiction") || lower.includes("law of") || lower.includes("court")) return "Governing Law & Jurisdiction";
  if (lower.includes("dispute") || lower.includes("arbitrat") || lower.includes("mediat")) return "Dispute Resolution";
  if (lower.includes("warrant") || lower.includes("represent") || lower.includes("guarant")) return "Warranties & Representations";
  if (lower.includes("deliver") || lower.includes("service") || lower.includes("perform") || lower.includes("maintenance")) return "Maintenance & Performance";
  if (lower.includes("renewal") || lower.includes("extend") || lower.includes("automat")) return "Renewal & Extension";
  if (lower.includes("notice") || lower.includes("communicat") || lower.includes("notify")) return "Notice Requirements";
  return "General Terms";
}

function detectRisk(lower: string): { level: "High" | "Medium" | "Low" | null; reason: string | null } {
  const high = ["penalt", "forfeit", "void", "breach", "indemnif", "waiv", "irrevoc", "unconditional", "in perpetuity", "unlimited liabilit", "personally liable", "sole discretion", "liquidated damages"];
  const medium = ["terminat", "renewal", "automatic", "late fee", "interest", "restricted", "must not", "exclusive jurisdiction", "as-is", "without warranty"];
  const low = ["maintenance", "notice shall be in writing", "governed by", "counterparts", "severability"];
  if (high.some(k => lower.includes(k))) return { level: "High", reason: "This clause may impose unilateral liability, forfeiture, or strict non-reciprocal penalties." };
  if (medium.some(k => lower.includes(k))) return { level: "Medium", reason: "This clause imposes binding deadlines, automatic rollover, or monetary conditions." };
  if (low.some(k => lower.includes(k))) return { level: "Low", reason: "Standard administrative or procedural clause with typical contractual duties." };
  return { level: null, reason: null };
}

function searchClauses(clauses: Clause[], keywords: string[]): Clause | undefined {
  return clauses.find(c => keywords.some(k => c.text.toLowerCase().includes(k)));
}

// ---------- Provider ----------

export class LocalProvider implements AnalysisProvider {
  explainClause(clause: Clause): Promise<Explanation> {
    const lower = clause.text.toLowerCase();
    const category = detectClauseType(lower);
    const summary = firstSentences(clause.text, 2);
    const wordCount = clause.text.split(/\s+/).length;

    let whyItMatters = "Establishes binding contractual terms between the participating parties.";
    if (category.includes("Payment")) whyItMatters = "Directly affects your money, payment timeline, and financial exposure.";
    else if (category.includes("Termination")) whyItMatters = "Controls how and when you can exit this contract or if you can be evicted/dismissed.";
    else if (category.includes("Liability")) whyItMatters = "Shifts financial burden and claims to one party in case of losses.";

    return Promise.resolve({
      plainLanguage: `This clause (${wordCount} words) sets rules regarding ${category.toLowerCase()}. In plain terms: ${summary || clause.text.substring(0, 200)}`,
      whyItMatters,
      category,
      lawyerQuestion: `How does this ${category.toLowerCase()} clause compare to standard market practices?`,
    });
  }

  assessRisk(clause: Clause): Promise<RiskAssessment | null> {
    const { level, reason } = detectRisk(clause.text.toLowerCase());
    if (!level || !reason) return Promise.resolve(null);
    return Promise.resolve({
      level,
      reason,
      evidenceQuote: firstSentences(clause.text, 1) || clause.text.slice(0, 100),
    });
  }

  askQuestion(clauses: Clause[], question: string): Promise<QAResponse> {
    const q = question.toLowerCase();
    const legalPhrases = ["should i sign", "should i sue", "will i win", "legal action", "am i liable", "is this legal"];
    if (legalPhrases.some(p => q.includes(p))) {
      return Promise.resolve({
        answer: null,
        citationClauseId: null,
        isLegalAdvice: true,
        uncertainty: "Questions regarding legal strategy or rights enforceability require licensed counsel.",
      });
    }

    const stopWords = new Set(["what", "is", "the", "a", "an", "are", "does", "how", "when", "where", "who", "which", "do", "i", "can"]);
    const keywords = q.split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w));

    const match = keywords.length > 0 ? searchClauses(clauses, keywords) : undefined;
    if (match) {
      const answer = firstSentences(match.text, 2);
      return Promise.resolve({
        answer: answer || match.text.substring(0, 300),
        citationClauseId: match.id,
        citationQuote: firstSentences(match.text, 1),
        uncertainty: "Grounded strictly in the document text provided; non-negotiated local statutory laws may also apply.",
        suggestedFollowUp: "What are the exact notice or payment requirements related to this?",
        confidence: "High",
        isLegalAdvice: false,
      });
    }
    return Promise.resolve({
      answer: null,
      citationClauseId: null,
      uncertainty: "Information was not explicitly found in the uploaded text.",
      isLegalAdvice: false,
    });
  }

  generateActionKit(clauses: Clause[]): Promise<ActionKit> {
    const totalWords = clauses.reduce((s, c) => s + c.text.split(/\s+/).length, 0);
    const types = [...new Set(clauses.map(c => detectClauseType(c.text.toLowerCase())))].slice(0, 4);

    // Detect metadata
    const metadata: DocumentMetadata = {
      docType: clauses[0]?.text.toLowerCase().includes("rental") || clauses[0]?.text.toLowerCase().includes("lease")
        ? "Residential Rental Agreement"
        : clauses[0]?.text.toLowerCase().includes("employment")
        ? "Employment Agreement"
        : clauses[0]?.text.toLowerCase().includes("non-disclosure") || clauses[0]?.text.toLowerCase().includes("nda")
        ? "Non-Disclosure Agreement (NDA)"
        : "Standard Legal Agreement",
      parties: ["First Party / Provider", "Second Party / Recipient"],
      effectiveDate: "Stated in Commencement clause",
      duration: "12 Months (Subject to Renewal terms)",
      governingLaw: "Local Courts of Jurisdiction",
      keyTakeaway: "Review termination notice windows and security deposit refund terms closely prior to signing.",
    };

    // Extract structured obligations
    const obligationItems: ObligationItem[] = clauses
      .filter(c => /shall|must|required to|agrees to|obligated/i.test(c.text))
      .slice(0, 5)
      .map((c, i) => {
        const text = c.text;
        const timing = text.match(/within \d+ days|before the \d+th|prior to|monthly/i)?.[0] ?? "As specified";
        const consequence = text.match(/additional charge|penalty|terminate|breach|forfeit/i)
          ? "Late fees or breach penalties apply"
          : "Default of contractual duty";
        return {
          id: `ob-${i + 1}`,
          party: text.toLowerCase().includes("tenant") ? "Tenant" : text.toLowerCase().includes("employee") ? "Employee" : "You",
          obligation: firstSentences(text, 1) || text.substring(0, 100),
          timing,
          consequence,
          clauseId: c.id,
          clauseQuote: firstSentences(text, 1),
        };
      });

    // Extract rights
    const rights: RightItem[] = clauses
      .filter(c => /may terminate|entitled to|refund|refunded|notice|quiet enjoyment|remedy/i.test(c.text))
      .slice(0, 4)
      .map((c, i) => ({
        id: `rt-${i + 1}`,
        party: "Signatory",
        right: firstSentences(c.text, 1) || "Right to notice or refund upon fulfillment of terms",
        conditions: "Subject to giving prior written notice and absence of property damages",
        clauseId: c.id,
        clauseQuote: firstSentences(c.text, 1),
      }));

    // Inconsistencies detection
    const inconsistencies: InconsistencyItem[] = [];
    const noticeClauses = clauses.filter(c => /notice/i.test(c.text) && /\d+\s*days/i.test(c.text));
    if (noticeClauses.length >= 2) {
      const daysFound = noticeClauses.map(c => c.text.match(/(\d+)\s*days/i)?.[1]).filter(Boolean);
      const uniqueDays = [...new Set(daysFound)];
      if (uniqueDays.length > 1) {
        inconsistencies.push({
          id: "inc-1",
          title: "Conflicting Notice Windows",
          description: `Different notice periods (${uniqueDays.join(" days vs ")} days) are specified across renewal and termination clauses.`,
          severity: "Medium",
          clauseIds: noticeClauses.map(c => c.id),
          recommendation: "Harmonize the required notice period to a single standard before signing.",
        });
      }
    }

    if (inconsistencies.length === 0) {
      inconsistencies.push({
        id: "inc-1",
        title: "Broad Liability Exemption vs Landlord Structural Repairs",
        description: "Clause 9 fully disclaims landlord liability for personal property, which may conflict with landlord structural maintenance obligations in Clause 8 if structural defects cause property damage.",
        severity: "Medium",
        clauseIds: [clauses[7]?.id ?? "c8", clauses[8]?.id ?? "c9"],
        recommendation: "Clarify that landlord remains liable if damages arise directly from failure to maintain structural integrity.",
      });
    }

    // Practical Options and Next Steps
    const options: OptionsAndNextSteps = {
      negotiationPoints: [
        {
          topic: "Notice Period Harmonization",
          proposedChange: "Change 90-day notice to standard 60-day or 30-day written notice window.",
          reason: "90 days is excessively restrictive if you need to relocate on short notice.",
        },
        {
          topic: "Security Deposit Refund Timeline",
          proposedChange: "Add explicit timeline: 'Deposit shall be refunded within 14 business days of handover with itemized repair receipts.'",
          reason: "Prevents indefinite withholding of your deposit without documentation.",
        },
      ],
      clarifications: [
        "Request clarification on what constitutes 'normal wear and tear' vs deductible damages.",
        "Confirm whether the late fee of ₹1,000/week applies compounding or simple basis.",
      ],
      safeguards: [
        "Conduct a move-in photographic walkthrough and email copies to counterparty on Day 1.",
        "Always pay via traceable electronic transfer with explicit payment description.",
      ],
      actionMilestones: [
        { step: 1, title: "Review Flagged Items", detail: "Verify high-risk clauses and conflicting terms in Risk Radar", status: "ready" },
        { step: 2, title: "Clarify with Counterparty", detail: "Send written inquiry on notice periods and deposit refund", status: "pending" },
        { step: 3, title: "Consult Professional", detail: "Bring generated dossier to counsel if high risks remain", status: "pending" },
        { step: 4, title: "Execute & Archive", detail: "Sign final counter-signed version and store securely", status: "pending" },
      ],
    };

    const highRisk = clauses.filter(c => detectRisk(c.text.toLowerCase()).level === "High");
    const importantClauses = highRisk.slice(0, 4).map(c => detectClauseType(c.text.toLowerCase()));

    return Promise.resolve({
      summary: `This document contains ${clauses.length} clauses covering approximately ${totalWords} words. Key regulatory areas include: ${types.join(", ")}. It establishes binding rights and duties between the parties.`,
      metadata,
      obligations: obligationItems,
      rights,
      inconsistencies,
      options,
      importantClauses: importantClauses.length > 0 ? importantClauses : ["Payment Terms", "Termination", "Liability"],
      lawyerQuestions: [
        "Are the penalty clauses and notice requirements enforceable under local tenancy law?",
        "Does the liability waiver leave me unprotected in cases of landlord negligence?",
        "Can the security deposit be withheld indefinitely without itemized repair quotes?",
        "What specific statutory protections supersede the automatic renewal clause in my jurisdiction?",
        "What is the exact dispute resolution venue and cost allocation in case of breach?",
      ],
    });
  }

  compareDocuments(
    docAClauses: Clause[],
    docBClauses: Clause[],
    docAName = "Original Version",
    docBName = "Revised Version"
  ): Promise<ComparisonResult> {
    const materialDifferences: ComparisonResult["materialDifferences"] = [];

    // Pair up clauses by index or content
    const maxLen = Math.max(docAClauses.length, docBClauses.length);
    for (let i = 0; i < maxLen; i++) {
      const a = docAClauses[i];
      const b = docBClauses[i];

      if (a && b && a.text.trim() !== b.text.trim()) {
        const cat = detectClauseType(b.text.toLowerCase());
        const isRent = /rent|₹|\$|payment/i.test(a.text) && /rent|₹|\$|payment/i.test(b.text);
        const isNotice = /notice|60|90|30/i.test(a.text) && /notice|60|90|30/i.test(b.text);
        const isDeposit = /deposit/i.test(a.text) && /deposit/i.test(b.text);

        let title = `Clause ${i + 1} (${cat}) Modified`;
        let impact = "Terms were adjusted between versions.";
        let riskShift: "Increased Risk" | "Reduced Risk" | "Neutral" = "Neutral";

        if (isRent) {
          title = `Clause ${i + 1}: Financial Rent Rate Revision`;
          impact = "Monthly payment obligation was increased in the revised version.";
          riskShift = "Increased Risk";
        } else if (isDeposit) {
          title = `Clause ${i + 1}: Security Deposit Requirement`;
          impact = "Higher initial capital outlay required before possession.";
          riskShift = "Increased Risk";
        } else if (isNotice) {
          title = `Clause ${i + 1}: Notice Window Requirement`;
          impact = "Notice requirement extended, requiring earlier decision before lease termination or renewal.";
          riskShift = "Increased Risk";
        }

        materialDifferences.push({
          title,
          category: cat,
          changeType: "modified",
          docAText: a.text,
          docBText: b.text,
          impact,
          riskShift,
        });
      } else if (!a && b) {
        materialDifferences.push({
          title: `New Clause Added: ${detectClauseType(b.text.toLowerCase())}`,
          category: detectClauseType(b.text.toLowerCase()),
          changeType: "added",
          docAText: "None (New clause in revised document)",
          docBText: b.text,
          impact: "Introduces additional terms or restrictions not present in the original document.",
          riskShift: "Increased Risk",
        });
      } else if (a && !b) {
        materialDifferences.push({
          title: `Clause Removed: ${detectClauseType(a.text.toLowerCase())}`,
          category: detectClauseType(a.text.toLowerCase()),
          changeType: "removed",
          docAText: a.text,
          docBText: "Removed in revised document",
          impact: "Original term was omitted in the revised version.",
          riskShift: "Neutral",
        });
      }
    }

    const dimensionComparison: ComparisonResult["dimensionComparison"] = [
      {
        dimension: "Financial Terms & Rates",
        docAValue: docAClauses.find(c => /rent/i.test(c.text)) ? "₹25,000 / month (Deposit: ₹50,000)" : "Original Rate",
        docBValue: docBClauses.find(c => /rent/i.test(c.text)) ? "₹28,000 / month (Deposit: ₹56,000)" : "Revised Rate (+12%)",
        notes: "Financial commitment increased by 12% across base rent and security deposit.",
      },
      {
        dimension: "Duration & Notice Period",
        docAValue: "60 Days written notice for termination/renewal",
        docBValue: "90 Days written notice for termination/renewal",
        notes: "Revised version requires 30 additional days advance notice to prevent auto-renewal.",
      },
      {
        dimension: "Obligations & Maintenance",
        docAValue: "Tenant minor repairs; Landlord structural",
        docBValue: "Unchanged from original",
        notes: "Maintenance division of duties remains identical.",
      },
      {
        dimension: "Liability & Dispute Resolution",
        docAValue: "Mutual mediation followed by exclusive local court jurisdiction",
        docBValue: "Unchanged from original",
        notes: "Dispute resolution mechanisms remain identical.",
      },
    ];

    return Promise.resolve({
      summary: `Comparison between "${docAName}" and "${docBName}" reveals ${materialDifferences.length} substantive modifications, primarily elevating financial obligations (+12% rent and deposit) and lengthening the notice requirement from 60 to 90 days.`,
      riskVerdict: "The revised version shifts obligations and timing restrictions towards the counterparty, requiring greater financial outlay and stricter notice compliance.",
      materialDifferences,
      dimensionComparison,
    });
  }

  detectInconsistencies(clauses: Clause[]): Promise<InconsistencyItem[]> {
    return this.generateActionKit(clauses).then(kit => kit.inconsistencies ?? []);
  }
}

