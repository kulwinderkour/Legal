import type { Clause } from "@/features/clauses";
export type { Clause };

export interface Explanation {
  plainLanguage: string;
  whyItMatters?: string;
  category?: string;
  lawyerQuestion?: string;
}

export interface RiskAssessment {
  level: "High" | "Medium" | "Low";
  reason: string;
  evidenceQuote?: string;
}

export interface QAResponse {
  answer: string | null;
  citationClauseId: string | null;
  citationQuote?: string | null;
  uncertainty?: string | null;
  suggestedFollowUp?: string | null;
  confidence?: "High" | "Medium" | "Low";
  isLegalAdvice: boolean;
}

export interface DocumentMetadata {
  docType: string;
  parties: string[];
  effectiveDate: string;
  duration: string;
  governingLaw: string;
  keyTakeaway: string;
}

export interface ObligationItem {
  id: string;
  party: string;
  obligation: string;
  timing: string;
  consequence: string;
  clauseId?: string;
  clauseQuote?: string;
}

export interface RightItem {
  id: string;
  party: string;
  right: string;
  conditions: string;
  clauseId?: string;
  clauseQuote?: string;
}

export interface InconsistencyItem {
  id: string;
  title: string;
  description: string;
  severity: "High" | "Medium" | "Low";
  clauseIds: string[];
  recommendation: string;
}

export interface OptionsAndNextSteps {
  negotiationPoints: { topic: string; proposedChange: string; reason: string }[];
  clarifications: string[];
  safeguards: string[];
  actionMilestones: { step: number; title: string; detail: string; status: "pending" | "ready" }[];
}

export interface ComparisonDifference {
  title: string;
  category: string;
  changeType: "modified" | "added" | "removed";
  docAText: string;
  docBText: string;
  impact: string;
  riskShift: "Increased Risk" | "Reduced Risk" | "Neutral";
}

export interface ComparisonDimension {
  dimension: string;
  docAValue: string;
  docBValue: string;
  notes: string;
}

export interface ComparisonResult {
  summary: string;
  riskVerdict: string;
  materialDifferences: ComparisonDifference[];
  dimensionComparison: ComparisonDimension[];
}

export interface ActionKit {
  summary: string;
  metadata?: DocumentMetadata;
  obligations: (string | ObligationItem)[];
  rights?: RightItem[];
  inconsistencies?: InconsistencyItem[];
  options?: OptionsAndNextSteps;
  importantClauses: string[];
  lawyerQuestions: string[];
}

export interface AnalysisProvider {
  explainClause(clause: Clause): Promise<Explanation>;
  assessRisk(clause: Clause): Promise<RiskAssessment | null>;
  askQuestion(clauses: Clause[], question: string): Promise<QAResponse>;
  generateActionKit(clauses: Clause[]): Promise<ActionKit>;
  compareDocuments?(docAClauses: Clause[], docBClauses: Clause[], docAName?: string, docBName?: string): Promise<ComparisonResult>;
  detectInconsistencies?(clauses: Clause[]): Promise<InconsistencyItem[]>;
}

