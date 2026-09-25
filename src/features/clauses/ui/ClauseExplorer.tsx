import React, { useState, useEffect } from "react";
import type { Clause } from "../model/clause";
import type { AnalysisProvider } from "@/shared/providers/analysis-provider";

export function ClauseExplorer({ clauses, provider }: { clauses: Clause[], provider: AnalysisProvider }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check if we arrived via hash navigation from another tab
    const hash = window.location.hash;
    if (hash && hash.startsWith("#clause-")) {
      const id = hash.replace("#clause-", "");
      setActiveId(id);
      
      setTimeout(() => {
        const el = document.getElementById(`orig-clause-${id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, []);

  useEffect(() => {
    // Fetch explanations for all clauses
    const fetchExplanations = async () => {
      const results: Record<string, string> = {};
      await Promise.all(
        clauses.map(async (c) => {
          const exp = await provider.explainClause(c);
          results[c.id] = exp.plainLanguage;
        })
      );
      setExplanations(results);
    };
    fetchExplanations();
  }, [clauses, provider]);

  const handleSelect = (id: string) => {
    setActiveId(id);
                  window.location.hash = `#clause-${id}`;
  };

  return (
    <div className="flex h-full divide-x divide-neutral-200 dark:divide-neutral-800">
      {/* LEFT COLUMN: Original Document */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-2xl mx-auto space-y-6 pb-32">
          <h2 className="sticky top-0 bg-neutral-50/90 dark:bg-neutral-900/90 backdrop-blur pb-4 z-10 text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Original Document
          </h2>
          
          <div className="space-y-6">
            {clauses.map(clause => {
              const isActive = activeId === clause.id;
              return (
                <div
                  key={clause.id}
                  id={`orig-clause-${clause.id}`}
                  onClick={() => { handleSelect(clause.id); }}
                  className={`p-4 rounded-xl cursor-pointer transition-colors ${
                    isActive 
                      ? "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800" 
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  <div className="text-[10px] text-neutral-400 font-mono mb-2">CLAUSE {clause.index + 1}</div>
                  <div className={`font-serif whitespace-pre-wrap leading-relaxed ${isActive ? "text-neutral-900 dark:text-white" : "text-neutral-700 dark:text-neutral-300"}`}>
                    {clause.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Plain Language */}
      <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-neutral-950 relative">
        <div className="max-w-xl mx-auto space-y-6 pb-32">
          <h2 className="sticky top-0 bg-white/90 dark:bg-neutral-950/90 backdrop-blur pb-4 z-10 text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Plain Language
          </h2>
          
          <div className="space-y-4">
            {clauses.map(clause => {
              const isActive = activeId === clause.id;
              const exp = explanations[clause.id];
              
              if (!isActive) return null; // Only show active explanation to keep it clean, or show all and scroll. Let's show all and highlight.
              
              return null; // Handled below
            })}

            {/* Actually, the prompt says "When user clicks... highlight explanation". Let's render all and highlight. */}
            {clauses.map(clause => {
              const isActive = activeId === clause.id;
              const exp = explanations[clause.id];
              
              return (
                <div
                  key={`exp-${clause.id}`}
                  id={`exp-clause-${clause.id}`}
                  onClick={() => { handleSelect(clause.id); }}
                  className={`p-6 rounded-xl cursor-pointer transition-all ${
                    isActive 
                      ? "bg-white dark:bg-neutral-900 shadow-lg ring-1 ring-neutral-200 dark:ring-neutral-800 transform scale-[1.02]" 
                      : "opacity-40 hover:opacity-100"
                  }`}
                >
                  <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wider">Explanation</div>
                  <div className="text-lg text-neutral-900 dark:text-white leading-relaxed">
                    {exp ? exp : "Loading explanation..."}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
