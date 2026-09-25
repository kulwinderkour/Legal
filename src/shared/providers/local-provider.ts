import type { AnalysisProvider, Explanation, RiskAssessment, QAResponse, ActionKit } from "./analysis-provider";
import type { Clause } from "@/features/clauses/model/clause";

// eslint-disable-next-line import/no-restricted-paths

const explanations = [
  { p: "commence on the 1st day", a: "Your rental agreement lasts for exactly 1 year starting from the 1st of next month." },
  { p: "monthly rent of", a: "You must pay your rent by the 5th of every month." },
  { p: "security deposit", a: "You must pay a security deposit before moving in. It will be returned when you leave, minus any repair costs for damage you caused." },
  { p: "late payment", a: "If you don't pay rent by the 5th, you will be charged an extra ₹1,000 for every week it's late." },
  { p: "automatic renewal", a: "This agreement will automatically renew for another year unless you or the landlord give written notice to cancel it before the current term ends." },
  { p: "terminate this agreement prior", a: "You can end the agreement early by giving written notice to the landlord." },
  { p: "notice address", a: "All official notices must be sent to the registered address via post or email." },
  { p: "maintenance responsibilities", a: "You must keep the place clean and do minor repairs. The landlord will handle major structural fixes." },
  { p: "liability", a: "The landlord is not responsible if your personal belongings are damaged or stolen. You should get renter's insurance." },
  { p: "dispute resolution", a: "If there's a disagreement, you must try mediation first before going to court." }
];

export class LocalProvider implements AnalysisProvider {
  explainClause(clause: Clause): Promise<Explanation> {
    const text = clause.text.toLowerCase();
    const match = explanations.find(e => text.includes(e.p));
    return Promise.resolve({ plainLanguage: match ? match.a : "This clause defines specific terms of the agreement." });
  }

  assessRisk(clause: Clause): Promise<RiskAssessment | null> {
    const text = clause.text.toLowerCase();
    if (text.includes("automatic renewal")) return Promise.resolve({ level: "High", reason: "The agreement automatically renews unless notice is provided before expiration." });
    if (text.includes("late payment")) return Promise.resolve({ level: "Medium", reason: "Additional charges may apply when rent is paid late." });
    if (text.includes("notice address")) return Promise.resolve({ level: "Low", reason: "The agreement specifies where written notices must be sent." });
    if (text.includes("termination")) return Promise.resolve({ level: "High", reason: "Termination requires advance written notice, which you must track." });
    return Promise.resolve(null);
  }

  askQuestion(clauses: Clause[], question: string): Promise<QAResponse> {
    const q = question.toLowerCase();
    if (q.includes("should i sign") || q.includes("should i sue") || q.includes("will i win") || q.includes("legal action")) {
      return Promise.resolve({ answer: null, citationClauseId: null, isLegalAdvice: true });
    }
    return Promise.resolve(this.findAnswer(clauses, q));
  }

  private findAnswer(clauses: Clause[], q: string): QAResponse {
    const findQ = (str: string) => clauses.find(c => c.text.toLowerCase().includes(str));
    
    if (q.includes("monthly rent") || q.includes("how much is rent")) {
      const c = findQ("monthly rent of");
      if (c) return { answer: c.text.includes("28,000") ? "The monthly rent is ₹28,000, due by the 5th of each month." : "The monthly rent is ₹25,000, due by the 5th of each month.", citationClauseId: c.id, isLegalAdvice: false };
    } 
    
    if (q.includes("notice period") || q.includes("terminate") || q.includes("end the agreement")) {
      const c = findQ("termination");
      if (c) return { answer: c.text.includes("90 days") ? "You must provide 90 days' written notice before terminating the agreement." : "You must provide 60 days' written notice before terminating the agreement.", citationClauseId: c.id, isLegalAdvice: false };
    } 
    
    if (q.includes("automatically renewed") || q.includes("renewal")) {
      const c = findQ("automatic renewal");
      if (c) return { answer: "Yes, the agreement automatically renews for another 12-month period unless written notice is provided before expiration.", citationClauseId: c.id, isLegalAdvice: false };
    } 
    
    if (q.includes("late")) {
      const c = findQ("late payment");
      if (c) return { answer: "If rent is not paid by the 5th of the month, an additional charge of ₹1,000 per week will apply.", citationClauseId: c.id, isLegalAdvice: false };
    } 
    
    if (q.includes("deposit")) {
      const c = findQ("security deposit");
      if (c) return { answer: c.text.includes("56,000") ? "The security deposit is ₹56,000, payable prior to moving in." : "The security deposit is ₹50,000, payable prior to moving in.", citationClauseId: c.id, isLegalAdvice: false };
    }
    return { answer: null, citationClauseId: null, isLegalAdvice: false };
  }

  generateActionKit(clauses: Clause[]): Promise<ActionKit> {
    const isRenewal = clauses.some(c => c.text.includes("28,000"));
    const rent = isRenewal ? "₹28,000" : "₹25,000";
    const notice = isRenewal ? "90 days'" : "60 days'";

    return Promise.resolve({
      summary: "This is a Residential Rental Agreement for a 12-month term. It outlines rent, deposit, maintenance, and termination conditions.",
      obligations: [
        `Pay ${rent} monthly rent by the 5th of each month`,
        "Maintain the property according to the agreement",
        `Provide ${notice} notice before termination`,
        "Pay applicable late charges if rent is delayed"
      ],
      importantClauses: ["Automatic Renewal", "Termination", "Late Payment"],
      lawyerQuestions: [
        "How does the automatic renewal clause affect termination?",
        "What happens if I terminate before the agreement expires?",
        "How are late-payment charges calculated and enforced?"
      ]
    });
  }
}
