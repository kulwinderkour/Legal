"use client";

import React, { useState, useEffect } from "react";
import type {
  AnalysisProvider,
  ActionKit,
  Clause,
  ObligationItem,
  RightItem,
  InconsistencyItem,
} from "@/shared/providers/analysis-provider";

function CheckIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

export function ActionKitView({ clauses, provider }: { clauses: Clause[]; provider: AnalysisProvider }) {
  const [kit, setKit] = useState<ActionKit | null>(null);
  const [checkedObligations, setCheckedObligations] = useState<Record<string, boolean>>({});
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"checklist" | "rights" | "options" | "lawyer">("checklist");

  useEffect(() => {
    void provider.generateActionKit(clauses).then(setKit);
  }, [clauses, provider]);

  const toggleObligation = (id: string) => {
    setCheckedObligations((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyDossier = () => {
    if (!kit) return;
    const docMeta = kit.metadata;
    const lines = [
      `=== LEGAL CONSULTATION DOSSIER ===`,
      `Document Type: ${docMeta?.docType ?? "Legal Document"}`,
      `Parties: ${(docMeta?.parties ?? ["Not specified"]).join(" & ")}`,
      `Key Takeaway: ${docMeta?.keyTakeaway ?? kit.summary}`,
      `\n--- EXECUTIVE SUMMARY ---`,
      kit.summary,
      `\n--- KEY OBLIGATIONS & REQUIREMENTS ---`,
      ...kit.obligations.map((o) => {
        if (typeof o === "string") return `• ${o}`;
        return `• [${o.party}] ${o.obligation} (Timing: ${o.timing}; Breach consequence: ${o.consequence})`;
      }),
      `\n--- DETECTED INCONSISTENCIES & RED FLAGS ---`,
      ...(kit.inconsistencies ?? []).map((inc) => `• [${inc.severity} Severity] ${inc.title}: ${inc.description}\n  Recommendation: ${inc.recommendation}`),
      `\n--- RECOMMENDED QUESTIONS FOR LEGAL COUNSEL ---`,
      ...kit.lawyerQuestions.map((q, i) => `${i + 1}. ${q}`),
      `\n--- OPTIONS & ACTION ROADMAP ---`,
      ...(kit.options?.negotiationPoints ?? []).map((np) => `• Negotiation Lever (${np.topic}): Propose "${np.proposedChange}" - ${np.reason}`),
    ];

    void navigator.clipboard.writeText(lines.join("\n"));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!kit) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-neutral-500" role="status" aria-live="polite">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Generating Action Kit & Lawyer Consultation Brief…</p>
        </div>
      </div>
    );
  }

  const obligationsList: ObligationItem[] = kit.obligations.map((ob, idx) => {
    if (typeof ob === "string") {
      return {
        id: `ob-${idx}`,
        party: "Signatory",
        obligation: ob,
        timing: "As specified in contract",
        consequence: "Contractual default",
      };
    }
    return ob;
  });

  const completedCount = obligationsList.filter((ob) => checkedObligations[ob.id]).length;
  const progressPct = obligationsList.length > 0 ? Math.round((completedCount / obligationsList.length) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8 pb-32">
        {/* Header & Export Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Action Kit & Decision Advisor
            </div>
            <h2 className="text-3xl font-serif text-neutral-900 dark:text-white">
              Consultation Dossier & Action Plan
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              Plain-language obligations checklist, rights tracker, negotiation options, and lawyer consultation packet.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyDossier}
              className="px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-sm flex items-center gap-2"
              aria-label="Copy lawyer consultation briefing packet"
            >
              <CopyIcon />
              {copySuccess ? "Copied to Clipboard!" : "Copy Dossier"}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors shadow-sm"
              aria-label="Print or export consultation dossier"
            >
              Export / Print
            </button>
          </div>
        </div>

        {/* Metadata and Executive Summary */}
        <section aria-labelledby="ak-overview-heading" className="bg-white dark:bg-neutral-950 p-6 md:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 id="ak-overview-heading" className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
              Executive Summary & Document Profile
            </h3>
            {kit.metadata?.docType && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                {kit.metadata.docType}
              </span>
            )}
          </div>
          <p className="text-xl text-neutral-900 dark:text-white font-serif leading-relaxed">
            {kit.summary}
          </p>

          {kit.metadata && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-900 text-xs">
              <div>
                <span className="text-neutral-400 block font-medium">Parties</span>
                <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{kit.metadata.parties.join(", ")}</span>
              </div>
              <div>
                <span className="text-neutral-400 block font-medium">Duration</span>
                <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{kit.metadata.duration}</span>
              </div>
              <div>
                <span className="text-neutral-400 block font-medium">Effective Date</span>
                <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{kit.metadata.effectiveDate}</span>
              </div>
              <div>
                <span className="text-neutral-400 block font-medium">Jurisdiction</span>
                <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{kit.metadata.governingLaw}</span>
              </div>
            </div>
          )}
        </section>

        {/* Navigation Tabs for Action Kit */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-2 md:gap-6 overflow-x-auto" role="tablist">
          <button
            role="tab"
            aria-selected={activeSubTab === "checklist"}
            onClick={() => setActiveSubTab("checklist")}
            className={`py-3 px-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeSubTab === "checklist"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Pre-Signing Checklist ({completedCount}/{obligationsList.length})
          </button>
          <button
            role="tab"
            aria-selected={activeSubTab === "rights"}
            onClick={() => setActiveSubTab("rights")}
            className={`py-3 px-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeSubTab === "rights"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Rights Tracker ({kit.rights?.length ?? 0})
          </button>
          <button
            role="tab"
            aria-selected={activeSubTab === "options"}
            onClick={() => setActiveSubTab("options")}
            className={`py-3 px-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeSubTab === "options"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Options & Redline Proposals
          </button>
          <button
            role="tab"
            aria-selected={activeSubTab === "lawyer"}
            onClick={() => setActiveSubTab("lawyer")}
            className={`py-3 px-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeSubTab === "lawyer"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Questions for a Lawyer ({kit.lawyerQuestions.length})
          </button>
        </div>

        {/* Tab 1: Interactive Obligations Checklist */}
        {activeSubTab === "checklist" && (
          <section aria-labelledby="ak-checklist-heading" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 id="ak-checklist-heading" className="text-xl font-serif text-neutral-900 dark:text-white">
                  Obligations Verification Checklist
                </h3>
                <p className="text-xs text-neutral-500">Check off each requirement as you review and verify compliance.</p>
              </div>
              <div className="w-36">
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span>Progress</span>
                  <span className="font-semibold">{progressPct}%</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {obligationsList.map((ob) => {
                const isChecked = !!checkedObligations[ob.id];
                return (
                  <div
                    key={ob.id}
                    onClick={() => toggleObligation(ob.id)}
                    className={`p-5 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 opacity-75"
                        : "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        aria-label={`Mark obligation as reviewed: ${ob.obligation}`}
                        className="mt-1 w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                            {ob.party}
                          </span>
                          <span className="text-xs text-neutral-500 font-mono">Timing: {ob.timing}</span>
                        </div>
                        <p className={`text-base font-medium ${isChecked ? "line-through text-neutral-400" : "text-neutral-900 dark:text-white"}`}>
                          {ob.obligation}
                        </p>
                        {ob.consequence && (
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            <strong>Breach consequence:</strong> {ob.consequence}
                          </p>
                        )}
                        {ob.clauseQuote && (
                          <p className="text-xs text-neutral-400 italic font-serif">
                            &quot;{ob.clauseQuote}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Tab 2: Rights Tracker */}
        {activeSubTab === "rights" && (
          <section aria-labelledby="ak-rights-heading" className="space-y-4">
            <h3 id="ak-rights-heading" className="text-xl font-serif text-neutral-900 dark:text-white">
              Entitlements & Rights Tracker
            </h3>
            <p className="text-xs text-neutral-500">Legal rights and statutory entitlements explicitly secured for you in this document.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(kit.rights ?? []).map((rt) => (
                <div key={rt.id} className="p-6 bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
                      Entitlement: {rt.party}
                    </span>
                  </div>
                  <h4 className="text-base font-medium text-neutral-900 dark:text-white">{rt.right}</h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    <strong>Conditions to exercise:</strong> {rt.conditions}
                  </p>
                  {rt.clauseQuote && (
                    <p className="text-xs text-neutral-400 italic pt-2 border-t border-neutral-100 dark:border-neutral-900 font-serif">
                      &quot;{rt.clauseQuote}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tab 3: Options & Potential Next Steps */}
        {activeSubTab === "options" && (
          <section aria-labelledby="ak-options-heading" className="space-y-8">
            <div>
              <h3 id="ak-options-heading" className="text-xl font-serif text-neutral-900 dark:text-white">
                Practical Options & Redline Proposals
              </h3>
              <p className="text-xs text-neutral-500">
                Actionable levers, counter-language, and next steps before signing.
              </p>
            </div>

            {/* Negotiation points / Redlines */}
            {kit.options?.negotiationPoints && kit.options.negotiationPoints.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Recommended Redlines to Request
                </h4>
                <div className="space-y-4">
                  {kit.options.negotiationPoints.map((np, idx) => (
                    <div key={idx} className="p-6 bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{np.topic}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          Counter-Proposal
                        </span>
                      </div>
                      <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg text-sm font-mono text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800">
                        {np.proposedChange}
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        <strong>Why this protects you:</strong> {np.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inquiries and Precautions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 space-y-3">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                  Pre-Signing Inquiries to Counterparty
                </h4>
                <ul className="space-y-2 text-sm text-neutral-800 dark:text-neutral-200">
                  {(kit.options?.clarifications ?? []).map((c, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 bg-neutral-100 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-3">
                <h4 className="text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-widest">
                  Operational Safeguards (If Signing As-Is)
                </h4>
                <ul className="space-y-2 text-sm text-neutral-800 dark:text-neutral-200">
                  {(kit.options?.safeguards ?? []).map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-neutral-500 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Roadmap Milestones */}
            {kit.options?.actionMilestones && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Recommended Action Roadmap
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {kit.options.actionMilestones.map((ms) => (
                    <div key={ms.step} className="p-4 bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center">
                          {ms.step}
                        </span>
                        <h5 className="font-semibold text-sm text-neutral-900 dark:text-white">{ms.title}</h5>
                      </div>
                      <p className="text-xs text-neutral-500 leading-relaxed">{ms.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tab 4: Questions for a Lawyer */}
        {activeSubTab === "lawyer" && (
          <section aria-labelledby="ak-lawyer-heading" className="space-y-6">
            <div>
              <h3 id="ak-lawyer-heading" className="text-xl font-serif text-neutral-900 dark:text-white">
                Lawyer Consultation Checklist
              </h3>
              <p className="text-xs text-neutral-500">
                Calibrated questions to ask legal counsel during your consultation to save time and reduce billable hours.
              </p>
            </div>

            <div className="bg-neutral-900 dark:bg-neutral-950 text-white p-8 rounded-2xl shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <QuestionIcon />
                <h4 className="text-sm font-bold text-neutral-300 uppercase tracking-widest">
                  Priority Inquiries for Counsel
                </h4>
              </div>

              <ol className="space-y-4 list-decimal list-inside">
                {kit.lawyerQuestions.map((q, idx) => (
                  <li key={idx} className="font-serif text-lg leading-relaxed text-neutral-100 pl-2">
                    <span className="font-sans font-medium">{q}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
