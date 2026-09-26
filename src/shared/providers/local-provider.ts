import type { AnalysisProvider, Explanation, RiskAssessment, QAResponse, ActionKit, Clause } from "./analysis-provider";

// ---------- Helpers ----------

function firstSentences(text: string, n = 2): string {
  return (text.match(/[^.!?]{10,}[.!?]/g) ?? [text]).slice(0, n).join(" ").trim();
}

function detectClauseType(lower: string): string {
  if (lower.includes("payment") || lower.includes("fee") || lower.includes("invoice") || lower.includes("cost")) return "payment terms";
  if (lower.includes("terminat") || lower.includes("cancel") || lower.includes("end the") || lower.includes("expire")) return "termination conditions";
  if (lower.includes("liabilit") || lower.includes("indemnif") || lower.includes("responsib")) return "liability and responsibility";
  if (lower.includes("confiden") || lower.includes("disclos") || lower.includes("secret") || lower.includes("proprietary")) return "confidentiality obligations";
  if (lower.includes("intellectu") || lower.includes("copyright") || lower.includes("patent") || lower.includes("trademark")) return "intellectual property rights";
  if (lower.includes("govern") || lower.includes("jurisdiction") || lower.includes("law of")) return "governing law and jurisdiction";
  if (lower.includes("dispute") || lower.includes("arbitrat") || lower.includes("mediat")) return "dispute resolution";
  if (lower.includes("warrant") || lower.includes("represent") || lower.includes("guarant")) return "warranties and representations";
  if (lower.includes("deliver") || lower.includes("service") || lower.includes("perform")) return "service delivery obligations";
  if (lower.includes("renewal") || lower.includes("extend") || lower.includes("automat")) return "renewal and extension terms";
  if (lower.includes("notice") || lower.includes("communicat") || lower.includes("notify")) return "notice requirements";
  if (lower.includes("deposit") || lower.includes("security") || lower.includes("collateral")) return "security and deposit terms";
  return "general contractual terms";
}

function detectRisk(lower: string): { level: "High" | "Medium" | "Low" | null; reason: string | null } {
  const high = ["penalt", "forfeit", "void", "breach", "indemnif", "waiv", "irrevoc", "unconditional", "in perpetuity", "unlimited liabilit", "personally liable"];
  const medium = ["terminat", "renewal", "automatic", "payment", "late", "notice", "condition", "restrict", "shall not", "must not"];
  if (high.some(k => lower.includes(k))) return { level: "High", reason: "This clause may impose significant financial or legal obligations, penalties, or limitations on your rights." };
  if (medium.some(k => lower.includes(k))) return { level: "Medium", reason: "This clause contains conditions or requirements that deserve careful attention before signing." };
  return { level: null, reason: null };
}

function searchClauses(clauses: Clause[], keywords: string[]): Clause | undefined {
  return clauses.find(c => keywords.some(k => c.text.toLowerCase().includes(k)));
}

// ---------- Provider ----------

export class LocalProvider implements AnalysisProvider {
  explainClause(clause: Clause): Promise<Explanation> {
    const lower = clause.text.toLowerCase();
    const type = detectClauseType(lower);
    const summary = firstSentences(clause.text, 2);
    const wordCount = clause.text.split(/\s+/).length;
    return Promise.resolve({
      plainLanguage: `This clause (${wordCount} words) covers ${type}. In plain terms: ${summary || clause.text.substring(0, 200)}`,
    });
  }

  assessRisk(clause: Clause): Promise<RiskAssessment | null> {
    const { level, reason } = detectRisk(clause.text.toLowerCase());
    if (!level || !reason) return Promise.resolve(null);
    return Promise.resolve({ level, reason });
  }

  askQuestion(clauses: Clause[], question: string): Promise<QAResponse> {
    const q = question.toLowerCase();
    const legalPhrases = ["should i sign", "should i sue", "will i win", "legal action", "am i liable", "is this legal"];
    if (legalPhrases.some(p => q.includes(p))) {
      return Promise.resolve({ answer: null, citationClauseId: null, isLegalAdvice: true });
    }

    // Extract keywords from the question and search clause text
    const stopWords = new Set(["what", "is", "the", "a", "an", "are", "does", "how", "when", "where", "who", "which", "do", "i", "can"]);
    const keywords = q.split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w));

    const match = keywords.length > 0 ? searchClauses(clauses, keywords) : undefined;
    if (match) {
      const answer = firstSentences(match.text, 2);
      return Promise.resolve({ answer: answer || match.text.substring(0, 300), citationClauseId: match.id, isLegalAdvice: false });
    }
    return Promise.resolve({ answer: null, citationClauseId: null, isLegalAdvice: false });
  }

  generateActionKit(clauses: Clause[]): Promise<ActionKit> {
    // Derive summary from document content
    const totalWords = clauses.reduce((s, c) => s + c.text.split(/\s+/).length, 0);
    const types = [...new Set(clauses.map(c => detectClauseType(c.text.toLowerCase())))].slice(0, 4);

    const highRisk = clauses.filter(c => detectRisk(c.text.toLowerCase()).level === "High");
    const obligations = clauses
      .filter(c => /shall|must|required to|agrees to|obligated/i.test(c.text))
      .slice(0, 4)
      .map(c => firstSentences(c.text, 1) || c.text.substring(0, 120));

    const importantClauses = highRisk
      .slice(0, 4)
      .map(c => detectClauseType(c.text.toLowerCase()).replace(/^./, s => s.toUpperCase()));

    return Promise.resolve({
      summary: `This document contains ${clauses.length} clauses covering approximately ${totalWords} words. Key areas include: ${types.join(", ")}.`,
      obligations: obligations.length > 0 ? obligations : ["Review all clause obligations carefully before signing"],
      importantClauses: importantClauses.length > 0 ? importantClauses : ["Review all clauses carefully"],
      lawyerQuestions: [
        "What are my key obligations under this agreement?",
        "What happens if either party breaches the terms?",
        "Can I terminate this agreement early, and what are the consequences?",
        "Are there any clauses that limit my legal rights?",
        "What jurisdiction and law governs any disputes?",
      ],
    });
  }
}
