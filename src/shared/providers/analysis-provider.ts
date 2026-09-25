import type { Clause } from "@/features/clauses/model/clause";

export interface Explanation {
  plainLanguage: string;
}

export interface RiskAssessment {
  level: "High" | "Medium" | "Low";
  reason: string;
}

export interface QAResponse {
  answer: string | null;
  citationClauseId: string | null;
  isLegalAdvice: boolean;
}

export interface ActionKit {
  summary: string;
  obligations: string[];
  importantClauses: string[];
  lawyerQuestions: string[];
}

export interface AnalysisProvider {
  explainClause(clause: Clause): Promise<Explanation>;
  assessRisk(clause: Clause): Promise<RiskAssessment | null>;
  askQuestion(clauses: Clause[], question: string): Promise<QAResponse>;
  generateActionKit(clauses: Clause[]): Promise<ActionKit>;
}
