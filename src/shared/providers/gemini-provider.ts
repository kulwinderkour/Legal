import type { AnalysisProvider, Explanation, RiskAssessment, QAResponse, ActionKit } from "./analysis-provider";
import type { Clause } from "@/features/clauses";

/**
 * GeminiProvider — calls the server-side /api/analyze route handler,
 * which in turn calls Gemini 2.0 Flash. The API key is never in the client bundle.
 */
export class GeminiProvider implements AnalysisProvider {
  private cache = new Map<string, unknown>();

  private async call<T>(body: Record<string, unknown>): Promise<T> {
    const key = JSON.stringify(body);
    if (this.cache.has(key)) return this.cache.get(key) as T;

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API error ${String(res.status)}`);
    const data = (await res.json()) as T;
    this.cache.set(key, data);
    return data;
  }

  async explainClause(clause: Clause): Promise<Explanation> {
    const data = await this.call<{ plainLanguage: string }>({
      op: "explain",
      clauseText: clause.text,
    });
    return { plainLanguage: data.plainLanguage };
  }

  async assessRisk(clause: Clause): Promise<RiskAssessment | null> {
    const data = await this.call<{ level: string | null; reason: string | null }>({
      op: "risk",
      clauseText: clause.text,
    });
    if (!data.level || !data.reason) return null;
    return { level: data.level as RiskAssessment["level"], reason: data.reason };
  }

  async askQuestion(clauses: Clause[], question: string): Promise<QAResponse> {
    const data = await this.call<{ answer: string | null; citationClauseId: string | null; isLegalAdvice: boolean }>({
      op: "ask",
      clauses: clauses.map((c) => ({ id: c.id, text: c.text })),
      question,
    });
    return data;
  }

  async generateActionKit(clauses: Clause[]): Promise<ActionKit> {
    const data = await this.call<ActionKit>({
      op: "actionkit",
      clauses: clauses.map((c) => ({ id: c.id, text: c.text })),
    });
    return data;
  }
}
