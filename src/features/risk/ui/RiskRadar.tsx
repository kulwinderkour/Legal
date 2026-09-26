"use client";

import React, { useState, useEffect } from "react";
import type { Clause, AnalysisProvider, RiskAssessment, InconsistencyItem } from "@/shared/providers/analysis-provider";
import * as Tooltip from "@radix-ui/react-tooltip";

export function RiskRadar({
  clauses,
  provider,
  onNavigateToClause,
}: {
  clauses: Clause[];
  provider: AnalysisProvider;
  onNavigateToClause: (id: string) => void;
}) {
  const [assessments, setAssessments] = useState<Record<string, RiskAssessment>>({});
  const [inconsistencies, setInconsistencies] = useState<InconsistencyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      setIsLoading(true);
      try {
        const results: Record<string, RiskAssessment> = {};
        await Promise.all(
          clauses.map(async (c) => {
            const a = await provider.assessRisk(c);
            if (a && isMounted) results[c.id] = a;
          })
        );
        if (isMounted) setAssessments(results);

        if (provider.detectInconsistencies) {
          const incs = await provider.detectInconsistencies(clauses);
          if (isMounted) setInconsistencies(incs);
        }
      } catch {
        // graceful fallback
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void loadAll();
    return () => {
      isMounted = false;
    };
  }, [clauses, provider]);

  const highRisks = clauses.filter((c) => assessments[c.id]?.level === "High");
  const mediumRisks = clauses.filter((c) => assessments[c.id]?.level === "Medium");
  const lowRisks = clauses.filter((c) => assessments[c.id]?.level === "Low");

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-10 pb-32">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-block px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-semibold uppercase tracking-wider">
            Risk & Inconsistency Intelligence
          </div>
          <h2 className="text-3xl font-serif text-neutral-900 dark:text-white">Risk Radar</h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm max-w-2xl">
            Prioritized concern findings and internal contract inconsistencies backed by verbatim evidence from your document.
            Clause provides calibrated information, never a legal verdict or legal advice.
          </p>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <span className="text-xs text-neutral-500 font-medium block">High Concerns</span>
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">{highRisks.length}</span>
          </div>
          <div className="bg-white dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <span className="text-xs text-neutral-500 font-medium block">Medium Concerns</span>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{mediumRisks.length}</span>
          </div>
          <div className="bg-white dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <span className="text-xs text-neutral-500 font-medium block">Standard Terms</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{lowRisks.length}</span>
          </div>
          <div className="bg-white dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <span className="text-xs text-neutral-500 font-medium block">Inconsistencies</span>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{inconsistencies.length}</span>
          </div>
        </div>

        {/* Section: Inconsistencies & Internal Conflicts */}
        {inconsistencies.length > 0 && (
          <section aria-labelledby="inconsistencies-heading" className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" aria-hidden="true" />
              <h3 id="inconsistencies-heading" className="text-lg font-serif text-neutral-900 dark:text-white">
                Detected Inconsistencies & Contract Ambiguities ({inconsistencies.length})
              </h3>
            </div>
            <div className="space-y-4">
              {inconsistencies.map((inc) => (
                <div
                  key={inc.id}
                  className="p-6 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 rounded-2xl shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="font-semibold text-purple-950 dark:text-purple-200 text-base">{inc.title}</h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">
                      {inc.severity} Ambiguity
                    </span>
                  </div>
                  <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">{inc.description}</p>
                  <div className="p-3 bg-white/80 dark:bg-neutral-900/80 rounded-xl border border-purple-100 dark:border-purple-900/30 text-xs">
                    <span className="font-semibold text-purple-800 dark:text-purple-300 block mb-1">
                      Recommended Action:
                    </span>
                    <span className="text-neutral-700 dark:text-neutral-300">{inc.recommendation}</span>
                  </div>
                  {inc.clauseIds.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-neutral-500">Related clauses:</span>
                      {inc.clauseIds.map((cid) => (
                        <button
                          key={cid}
                          onClick={() => onNavigateToClause(cid)}
                          className="text-xs text-purple-700 dark:text-purple-400 underline font-medium hover:opacity-80"
                        >
                          View Clause
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Clause Risk Findings */}
        <section aria-labelledby="clause-risks-heading" className="space-y-8" aria-live="polite">
          <h3 id="clause-risks-heading" className="text-lg font-serif text-neutral-900 dark:text-white">
            Prioritized Clause Concerns
          </h3>

          {isLoading && <p className="text-neutral-500 text-sm" role="status">Evaluating clause impacts…</p>}

          {!isLoading && highRisks.length === 0 && mediumRisks.length === 0 && lowRisks.length === 0 && (
            <p className="text-neutral-500 text-sm">No significant concerns or atypical clauses were detected in this document.</p>
          )}

          <RiskSection
            title="HIGH CONCERN / SIGNIFICANT IMPACT"
            clauses={highRisks}
            assessments={assessments}
            color="red"
            onNavigate={onNavigateToClause}
          />
          <RiskSection
            title="MEDIUM CONCERN / CONDITIONAL OBLIGATIONS"
            clauses={mediumRisks}
            assessments={assessments}
            color="amber"
            onNavigate={onNavigateToClause}
          />
          <RiskSection
            title="LOW CONCERN / STANDARD PROCEDURAL TERMS"
            clauses={lowRisks}
            assessments={assessments}
            color="blue"
            onNavigate={onNavigateToClause}
          />
        </section>
      </div>
    </div>
  );
}

function RiskSection({
  title,
  clauses,
  assessments,
  color,
  onNavigate,
}: {
  title: string;
  clauses: Clause[];
  assessments: Record<string, RiskAssessment>;
  color: "red" | "amber" | "blue";
  onNavigate: (id: string) => void;
}) {
  if (clauses.length === 0) return null;
  const bgClass = color === "red" ? "bg-red-50/70" : color === "amber" ? "bg-amber-50/70" : "bg-blue-50/70";
  const textClass = color === "red" ? "text-red-700" : color === "amber" ? "text-amber-700" : "text-blue-700";

  return (
    <div className="space-y-4">
      <h4 className={`font-bold text-xs tracking-widest ${textClass}`}>{title}</h4>
      <div className="space-y-4">
        {clauses.map((clause) => {
          const assessment = assessments[clause.id];
          if (!assessment) return null;
          return <RiskItem key={clause.id} clause={clause} assessment={assessment} bgClass={bgClass} onNavigate={onNavigate} />;
        })}
      </div>
    </div>
  );
}

function RiskItem({
  clause,
  assessment,
  bgClass,
  onNavigate,
}: {
  clause: Clause;
  assessment: RiskAssessment;
  bgClass: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <div className={`p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 ${bgClass} dark:bg-opacity-10 space-y-3`}>
      <div className="flex justify-between items-start gap-4">
        <div>
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Clause {clause.index + 1}
          </span>
          <h5 className="text-base font-semibold text-neutral-900 dark:text-white mt-0.5">
            {clause.text.split("\n")[0]?.replace(/^\d+\.\s*/, "")}
          </h5>
        </div>
        <button
          onClick={() => onNavigate(clause.id)}
          aria-label={`View clause ${String(clause.index + 1)} in explorer`}
          className="px-3.5 py-1.5 bg-white dark:bg-neutral-800 text-xs font-medium rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 transition-colors flex-shrink-0"
        >
          View in Explorer
        </button>
      </div>

      <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed">{assessment.reason}</p>

      {/* Verbatim Evidence Drawer */}
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <div className="text-xs font-mono text-neutral-600 dark:text-neutral-400 bg-white/70 dark:bg-black/30 p-3 rounded-xl overflow-hidden text-ellipsis whitespace-nowrap cursor-help border border-neutral-200/50 dark:border-neutral-800/50">
              <span className="font-bold text-neutral-500 mr-2 uppercase text-[10px]">Evidence:</span>
              {assessment.evidenceQuote || clause.text}
            </div>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="max-w-md bg-neutral-900 text-white p-4 rounded-xl text-xs shadow-2xl z-50 leading-relaxed font-serif">
              {clause.text}
              <Tooltip.Arrow className="fill-neutral-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>
  );
}
