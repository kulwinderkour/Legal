import React, { useState, useEffect } from "react";
import type { Clause } from "../model/clause";
import type { AnalysisProvider } from "@/shared/providers/analysis-provider";

function getInitialActiveId(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  return hash.startsWith("#clause-") ? hash.replace("#clause-", "") : null;
}

function useExplanations(clauses: Clause[], provider: AnalysisProvider): Record<string, string> {
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  useEffect(() => {
    const fetchAll = async () => {
      const results: Record<string, string> = {};
      await Promise.all(clauses.map(async (c) => { const exp = await provider.explainClause(c); results[c.id] = exp.plainLanguage; }));
      setExplanations(results);
    };
    void fetchAll();
  }, [clauses, provider]);
  return explanations;
}

function ClauseItem({ clause, isActive, onSelect }: { clause: Clause; isActive: boolean; onSelect: (id: string) => void }) {
  return (
    <li>
      <button id={`orig-clause-${clause.id}`} type="button" onClick={() => { onSelect(clause.id); }} aria-pressed={isActive}
        className={`w-full text-left p-4 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isActive ? "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}
      >
        <div className="text-[10px] text-neutral-400 font-mono mb-2">CLAUSE {String(clause.index + 1)}</div>
        <div className={`font-serif whitespace-pre-wrap leading-relaxed ${isActive ? "text-neutral-900 dark:text-white" : "text-neutral-700 dark:text-neutral-300"}`}>{clause.text}</div>
      </button>
    </li>
  );
}

function ExplanationItem({ clause, explanation, isActive, onSelect }: { clause: Clause; explanation: string | undefined; isActive: boolean; onSelect: (id: string) => void }) {
  return (
    <li>
      <button id={`exp-clause-${clause.id}`} type="button" onClick={() => { onSelect(clause.id); }} aria-pressed={isActive}
        className={`w-full text-left p-6 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${isActive ? "bg-white dark:bg-neutral-900 shadow-lg ring-1 ring-neutral-200 dark:ring-neutral-800 transform scale-[1.02]" : "opacity-40 hover:opacity-100"}`}
      >
        <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">Clause {String(clause.index + 1)} — Plain Language</div>
        <div className="text-lg text-neutral-900 dark:text-white leading-relaxed">{explanation ?? <span className="text-neutral-400 italic">Loading…</span>}</div>
      </button>
    </li>
  );
}

export function ClauseExplorer({ clauses, provider }: { clauses: Clause[], provider: AnalysisProvider }) {
  const [activeId, setActiveId] = useState<string | null>(getInitialActiveId);
  const explanations = useExplanations(clauses, provider);

  // Scroll to initial clause on mount (DOM update — not setState — so effect is correct here)
  useEffect(() => {
    if (!activeId) return;
    const el = document.getElementById(`orig-clause-${activeId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (id: string) => {
    setActiveId(id);
    window.location.hash = `#clause-${id}`;
    setTimeout(() => { const el = document.getElementById(`exp-clause-${id}`); if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 50);
  };

  return (
    <div className="flex h-full divide-x divide-neutral-200 dark:divide-neutral-800">
      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-2xl mx-auto space-y-6 pb-32">
          <h2 className="sticky top-0 bg-neutral-50/90 dark:bg-neutral-900/90 backdrop-blur pb-4 z-10 text-xs font-bold text-neutral-500 uppercase tracking-wider">Original Document</h2>
          <ul className="space-y-6 list-none p-0" aria-label="Document clauses">
            {clauses.map((clause) => <ClauseItem key={clause.id} clause={clause} isActive={activeId === clause.id} onSelect={handleSelect} />)}
          </ul>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-neutral-950 relative">
        <div className="max-w-xl mx-auto space-y-6 pb-32">
          <h2 className="sticky top-0 bg-white/90 dark:bg-neutral-950/90 backdrop-blur pb-4 z-10 text-xs font-bold text-neutral-500 uppercase tracking-wider">Plain Language</h2>
          {!activeId && <p className="text-neutral-400 dark:text-neutral-600 text-sm mt-8 text-center">Click any clause on the left to see its plain-language explanation.</p>}
          <ul className="space-y-4 list-none p-0" aria-label="Plain language explanations" aria-live="polite">
            {clauses.map((clause) => <ExplanationItem key={`exp-${clause.id}`} clause={clause} explanation={explanations[clause.id]} isActive={activeId === clause.id} onSelect={handleSelect} />)}
          </ul>
        </div>
      </div>
    </div>
  );
}
