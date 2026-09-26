"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { Clause } from "../model/clause";
import type { AnalysisProvider, Explanation } from "@/shared/providers/analysis-provider";

function getInitialActiveId(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  return hash.startsWith("#clause-") ? hash.replace("#clause-", "") : null;
}

function useExplanations(clauses: Clause[], provider: AnalysisProvider): Record<string, Explanation> {
  const [explanations, setExplanations] = useState<Record<string, Explanation>>({});
  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      const results: Record<string, Explanation> = {};
      await Promise.all(
        clauses.map(async (c) => {
          const exp = await provider.explainClause(c);
          if (isMounted) results[c.id] = exp;
        })
      );
      if (isMounted) setExplanations(results);
    };
    void fetchAll();
    return () => {
      isMounted = false;
    };
  }, [clauses, provider]);
  return explanations;
}

export function ClauseExplorer({ clauses, provider }: { clauses: Clause[]; provider: AnalysisProvider }) {
  const [activeId, setActiveId] = useState<string | null>(getInitialActiveId);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const explanations = useExplanations(clauses, provider);

  useEffect(() => {
    if (!activeId) return;
    const el = document.getElementById(`orig-clause-${activeId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    Object.values(explanations).forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return ["All", ...Array.from(set)];
  }, [explanations]);

  const filteredClauses = useMemo(() => {
    return clauses.filter((c) => {
      const exp = explanations[c.id];
      const matchesSearch =
        searchQuery === "" ||
        c.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exp?.plainLanguage && exp.plainLanguage.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategory === "All" ||
        (exp?.category && exp.category.toLowerCase() === selectedCategory.toLowerCase());

      return matchesSearch && matchesCat;
    });
  }, [clauses, explanations, searchQuery, selectedCategory]);

  const handleSelect = (id: string) => {
    setActiveId(id);
    window.location.hash = `#clause-${id}`;
    setTimeout(() => {
      const el = document.getElementById(`exp-clause-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search and Category Filter Bar */}
      <div className="flex-none p-4 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords, clauses, or obligations…"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 text-neutral-400 w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-xs text-neutral-400 mr-1 hidden sm:inline">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Explorer */}
      <div className="flex-1 flex divide-x divide-neutral-200 dark:divide-neutral-800 overflow-hidden">
        {/* Left: Original Clauses */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          <div className="max-w-2xl mx-auto space-y-6 pb-32">
            <div className="sticky top-0 bg-neutral-50/95 dark:bg-neutral-900/95 backdrop-blur py-2 z-10 flex items-center justify-between border-b border-neutral-200/50 dark:border-neutral-800/50">
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Original Clauses ({filteredClauses.length})
              </h2>
              <span className="text-xs text-neutral-400">Click any clause to inspect plain English</span>
            </div>

            {filteredClauses.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-sm">
                No clauses match the current filter or search criteria.
              </div>
            ) : (
              <ul className="space-y-4 list-none p-0" aria-label="Original document clauses">
                {filteredClauses.map((clause) => {
                  const isActive = activeId === clause.id;
                  const exp = explanations[clause.id];
                  return (
                    <li key={clause.id}>
                      <button
                        id={`orig-clause-${clause.id}`}
                        type="button"
                        onClick={() => handleSelect(clause.id)}
                        aria-pressed={isActive}
                        className={`w-full text-left p-5 rounded-2xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 border ${
                          isActive
                            ? "bg-white dark:bg-neutral-950 border-blue-500 shadow-md ring-1 ring-blue-500/20"
                            : "bg-white/70 dark:bg-neutral-900/70 border-neutral-200/80 dark:border-neutral-800 hover:bg-white dark:hover:bg-neutral-950 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-blue-700 dark:text-blue-400 font-mono font-bold tracking-wider">
                            CLAUSE {clause.index + 1}
                          </span>
                          {exp?.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-medium">
                              {exp.category}
                            </span>
                          )}
                        </div>
                        <div
                          className={`font-serif whitespace-pre-wrap leading-relaxed text-sm ${
                            isActive ? "text-neutral-900 dark:text-white" : "text-neutral-700 dark:text-neutral-300"
                          }`}
                        >
                          {clause.text}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right: Plain Language Translation & Practical Impact */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white dark:bg-neutral-950 relative">
          <div className="max-w-xl mx-auto space-y-6 pb-32">
            <div className="sticky top-0 bg-white/95 dark:bg-neutral-950/95 backdrop-blur py-2 z-10 border-b border-neutral-100 dark:border-neutral-900">
              <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Plain English & Practical Significance
              </h2>
            </div>

            {!activeId && (
              <div className="p-8 text-center text-neutral-400 dark:text-neutral-500 space-y-2">
                <p className="text-base font-serif">Select any clause on the left</p>
                <p className="text-xs">
                  Clause explains what the term means in non-technical terms, why it matters to you, and what to ask legal counsel.
                </p>
              </div>
            )}

            <ul className="space-y-6 list-none p-0" aria-label="Plain language explanations" aria-live="polite">
              {filteredClauses.map((clause) => {
                const isActive = activeId === clause.id;
                const exp = explanations[clause.id];
                return (
                  <li key={`exp-${clause.id}`}>
                    <div
                      id={`exp-clause-${clause.id}`}
                      className={`p-6 rounded-2xl transition-all border ${
                        isActive
                          ? "bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 shadow-lg scale-[1.01]"
                          : "opacity-45 hover:opacity-100 border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          Clause {clause.index + 1} — What this means
                        </span>
                        {exp?.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-semibold">
                            {exp.category}
                          </span>
                        )}
                      </div>

                      <p className="text-base text-neutral-900 dark:text-white leading-relaxed font-sans mb-4">
                        {exp?.plainLanguage ?? <span className="text-neutral-400 italic">Analyzing clause…</span>}
                      </p>

                      {exp?.whyItMatters && (
                        <div className="p-3 bg-white/80 dark:bg-neutral-900/80 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 mb-3 text-xs">
                          <span className="font-bold text-neutral-700 dark:text-neutral-300 block mb-0.5">
                            Why it matters:
                          </span>
                          <span className="text-neutral-600 dark:text-neutral-400">{exp.whyItMatters}</span>
                        </div>
                      )}

                      {exp?.lawyerQuestion && (
                        <div className="p-3 bg-neutral-900 text-white dark:bg-neutral-800 rounded-xl text-xs flex items-start gap-2">
                          <span className="text-amber-400 font-bold" aria-hidden="true">💡</span>
                          <div>
                            <span className="font-semibold text-neutral-300 block">Question for your lawyer:</span>
                            <span className="text-neutral-100 font-serif">{exp.lawyerQuestion}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
