import React, { useState, useEffect } from "react";
import type { Clause } from "@/shared/providers/analysis-provider";
import type { AnalysisProvider, RiskAssessment } from "@/shared/providers/analysis-provider";
import * as Tooltip from "@radix-ui/react-tooltip";

export function RiskRadar({ clauses, provider, onNavigateToClause }: { clauses: Clause[], provider: AnalysisProvider, onNavigateToClause: (id: string) => void }) {
  const [assessments, setAssessments] = useState<Record<string, RiskAssessment>>({});

  useEffect(() => {
    const results: Record<string, RiskAssessment> = {};
    Promise.all(clauses.map(c => provider.assessRisk(c).then(a => { if (a) results[c.id] = a; }))).then(() => {
      setAssessments(results);
    }).catch(() => { /* handle */ });
  }, [clauses, provider]);

  const highRisks = clauses.filter(c => assessments[c.id]?.level === "High");
  const mediumRisks = clauses.filter(c => assessments[c.id]?.level === "Medium");
  const lowRisks = clauses.filter(c => assessments[c.id]?.level === "Low");

  const noRisksFound = highRisks.length === 0 && mediumRisks.length === 0 && lowRisks.length === 0;
  const isLoading = Object.keys(assessments).length === 0;

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-12 pb-32">
        <div className="space-y-4">
          <h2 className="text-3xl font-serif text-neutral-900 dark:text-white">Risk Radar</h2>
          <p className="text-neutral-600 dark:text-neutral-400">Potentially important clauses categorized by their impact. Clause does not provide legal advice.</p>
        </div>
        <div className="space-y-8" aria-live="polite" aria-label="Risk assessment results">
          {isLoading && <p className="text-neutral-500" role="status">Analysing clauses…</p>}
          {!isLoading && noRisksFound && <p className="text-neutral-500">No significant risks were identified in this document.</p>}
          <RiskSection title="HIGH / IMPORTANT" clauses={highRisks} assessments={assessments} color="red" onNavigate={onNavigateToClause} />
          <RiskSection title="MEDIUM" clauses={mediumRisks} assessments={assessments} color="amber" onNavigate={onNavigateToClause} />
          <RiskSection title="LOW" clauses={lowRisks} assessments={assessments} color="blue" onNavigate={onNavigateToClause} />
        </div>
      </div>
    </div>
  );
}

function RiskSection({ title, clauses, assessments, color, onNavigate }: { title: string, clauses: Clause[], assessments: Record<string, RiskAssessment>, color: "red" | "amber" | "blue", onNavigate: (id: string) => void }) {
  if (clauses.length === 0) return null;
  const bgClass = color === "red" ? "bg-red-50" : color === "amber" ? "bg-amber-50" : "bg-blue-50";
  const textClass = color === "red" ? "text-red-700" : color === "amber" ? "text-amber-700" : "text-blue-700";
  return (
    <div className="space-y-4">
      <h3 className={`font-bold text-sm tracking-widest ${textClass}`}>{title}</h3>
      <div className="space-y-4">
        {clauses.map(clause => {
          const assessment = assessments[clause.id];
          if (!assessment) return null;
          return <RiskItem key={clause.id} clause={clause} assessment={assessment} bgClass={bgClass} onNavigate={onNavigate} />;
        })}
      </div>
    </div>
  );
}

function RiskItem({ clause, assessment, bgClass, onNavigate }: { clause: Clause, assessment: RiskAssessment, bgClass: string, onNavigate: (id: string) => void }) {
  return (
    <div className={`p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 ${bgClass} dark:bg-opacity-10`}>
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <div className="text-sm font-medium text-neutral-500">Clause {clause.index + 1}</div>
          <h4 className="text-lg font-medium text-neutral-900 dark:text-white">{clause.text.split("\n")[0]?.replace(/^\d+\.\s*/, "")}</h4>
        </div>
        <button
          onClick={() => { onNavigate(clause.id); }}
          aria-label={`View clause ${String(clause.index + 1)} in explorer`}
          className="px-4 py-2 bg-white dark:bg-neutral-800 text-sm font-medium rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          View clause
        </button>
      </div>
      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">{assessment.reason}</p>
      
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <div className="text-xs font-mono text-neutral-500 bg-white/50 dark:bg-black/20 p-3 rounded overflow-hidden text-ellipsis whitespace-nowrap cursor-help">
              {clause.text.substring(0, 100)}...
            </div>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content className="max-w-xs bg-neutral-900 text-white p-3 rounded-lg text-sm shadow-xl z-50">
              {clause.text}
              <Tooltip.Arrow className="fill-neutral-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>
  );
}
