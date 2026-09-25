import React, { useState, useEffect } from "react";
import type { Clause } from "@/features/clauses";
import type { AnalysisProvider, ActionKit } from "@/shared/providers/analysis-provider";

export function ActionKitView({ clauses, provider }: { clauses: Clause[], provider: AnalysisProvider }) {
  const [kit, setKit] = useState<ActionKit | null>(null);

  useEffect(() => {
    provider.generateActionKit(clauses).then(setKit);
  }, [clauses, provider]);

  if (!kit) {
    return <div className="p-8 text-neutral-500">Generating Action Kit...</div>;
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-12 pb-32">
        <div>
          <h2 className="text-3xl font-serif text-neutral-900 dark:text-white mb-2">Action Kit</h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            A practical summary and next steps based on your document.
          </p>
        </div>

        <div className="space-y-12">
          {/* Summary */}
          <section className="bg-white dark:bg-neutral-950 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Document Summary</h3>
            <p className="text-xl text-neutral-900 dark:text-white font-serif leading-relaxed">
              {kit.summary}
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Obligations */}
            <section className="bg-blue-50 dark:bg-blue-900/10 p-8 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-6">Key Obligations</h3>
              <ul className="space-y-4">
                {kit.obligations.map((ob, i) => (
                  <li key={i} className="flex gap-4 text-neutral-800 dark:text-neutral-200">
                    <div className="mt-1 text-blue-500">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <span>{ob}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Important Clauses */}
            <section className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-2xl border border-amber-100 dark:border-amber-900/30">
              <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-6">Important Clauses to Review</h3>
              <ul className="space-y-4">
                {kit.importantClauses.map((ic, i) => (
                  <li key={i} className="flex gap-4 text-neutral-800 dark:text-neutral-200">
                    <div className="mt-1 text-amber-500">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <span>{ic}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Questions for a Lawyer */}
          <section className="bg-neutral-900 dark:bg-neutral-50 p-8 rounded-2xl shadow-lg">
            <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-6">Questions to ask a Lawyer</h3>
            <ul className="space-y-4">
              {kit.lawyerQuestions.map((lq, i) => (
                <li key={i} className="flex gap-4 text-white dark:text-neutral-900">
                  <div className="mt-1 opacity-50">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <span className="font-serif text-lg">{lq}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
