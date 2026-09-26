"use client";

import React, { useState, useMemo } from "react";
import type { Clause, AnalysisProvider, QAResponse } from "@/shared/providers/analysis-provider";
import { SafetyRail } from "@/features/safety";

function AskForm({
  query,
  isSubmitting,
  onQueryChange,
  onSubmit,
}: {
  query: string;
  isSubmitting: boolean;
  onQueryChange: (q: string) => void;
  onSubmit: (e: React.SyntheticEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="mb-8 relative" role="search">
      <label htmlFor="ask-input" className="sr-only">
        Ask a grounded question about this document
      </label>
      <input
        id="ask-input"
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="e.g. Can I terminate early? What happens if payment is late? What are my restrictions?"
        aria-describedby="ask-hint"
        className="w-full pl-6 pr-32 py-5 text-base md:text-lg rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 focus:border-blue-500 focus:ring-0 outline-none transition-all shadow-sm"
      />
      <button
        type="submit"
        disabled={!query.trim() || isSubmitting}
        aria-label={isSubmitting ? "Searching document…" : "Submit question"}
        className="absolute right-3 top-3 bottom-3 px-6 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 text-sm md:text-base"
      >
        {isSubmitting ? "Searching…" : "Ask"}
      </button>
      <p id="ask-hint" className="sr-only">
        Answers are grounded strictly in the uploaded document text.
      </p>
    </form>
  );
}

export function AskDocument({
  clauses,
  provider,
  onNavigateToClause,
}: {
  clauses: Clause[];
  provider: AnalysisProvider;
  onNavigateToClause: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QAResponse | null>(null);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSubmitting(true);
    void provider.askQuestion(clauses, query).then((response) => {
      setResult(response);
      setIsSubmitting(false);
    });
  };

  const dynamicSuggestions = useMemo(() => {
    const fullText = clauses.map((c) => c.text).join(" ").toLowerCase();
    if (fullText.includes("rent") || fullText.includes("lease") || fullText.includes("tenant")) {
      return [
        "What is the monthly rent and payment due date?",
        "What are the notice period requirements to terminate?",
        "What happens if I pay rent late?",
        "Under what conditions is the security deposit refunded?",
        "Who is responsible for repairs and maintenance?",
      ];
    }
    if (fullText.includes("employee") || fullText.includes("employment") || fullText.includes("salary")) {
      return [
        "What are the working hours and overtime terms?",
        "Is there a non-compete or non-solicitation restriction?",
        "What is the required notice period for resignation?",
        "How is intellectual property created during employment treated?",
        "What constitutes termination for cause?",
      ];
    }
    if (fullText.includes("confidential") || fullText.includes("nda") || fullText.includes("disclose")) {
      return [
        "How long does the confidentiality duty last?",
        "What information is excluded from confidentiality?",
        "What are the permissible disclosures permitted by law?",
        "What remedies or injunctions are stipulated upon breach?",
      ];
    }
    return [
      "What are the primary obligations under this contract?",
      "How can either party terminate this agreement?",
      "What liabilities or warranties are explicitly disclaimed?",
      "What jurisdiction and law governs any disputes?",
    ];
  }, [clauses]);

  return (
    <div className="h-full flex flex-col p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="inline-block px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
          Evidence-Grounded Legal Q&A
        </div>
        <h2 className="text-3xl font-serif text-neutral-900 dark:text-white mb-2">Ask the Document</h2>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
          Get specific answers grounded strictly in your document&apos;s text. If something is not in the text, Clause will tell you directly rather than hallucinating.
        </p>
      </div>

      <AskForm query={query} isSubmitting={isSubmitting} onQueryChange={setQuery} onSubmit={handleSubmit} />

      <div aria-live="polite" aria-atomic="true" className="space-y-6">
        {result && (
          <AnswerResult
            result={result}
            clauses={clauses}
            onNavigateToClause={onNavigateToClause}
            onAskFollowUp={(q) => {
              setQuery(q);
              setIsSubmitting(true);
              void provider.askQuestion(clauses, q).then((res) => {
                setResult(res);
                setIsSubmitting(false);
              });
            }}
          />
        )}
        <Suggestions suggestions={dynamicSuggestions} onSelect={(q) => setQuery(q)} />
      </div>
    </div>
  );
}

function AnswerResult({
  result,
  clauses,
  onNavigateToClause,
  onAskFollowUp,
}: {
  result: QAResponse;
  clauses: Clause[];
  onNavigateToClause: (id: string) => void;
  onAskFollowUp: (q: string) => void;
}) {
  if (result.isLegalAdvice) {
    return (
      <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SafetyRail onNavigateToExplorer={() => {}} />
      </div>
    );
  }

  if (result.answer) {
    const citationClause = result.citationClauseId
      ? clauses.find((c) => c.id === result.citationClauseId)
      : null;

    return (
      <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
        {/* Answer card */}
        <div className="p-8 bg-blue-50/80 dark:bg-blue-900/15 border-l-4 border-blue-500 rounded-r-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              Grounded Answer
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
              Grounded in Document
            </span>
          </div>
          <p className="text-xl md:text-2xl text-neutral-900 dark:text-white font-serif leading-relaxed">
            {result.answer}
          </p>
        </div>

        {/* Source citation */}
        {citationClause && (
          <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-950 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                Source Citation — Clause {citationClause.index + 1}
              </span>
              <button
                onClick={() => onNavigateToClause(citationClause.id)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Inspect in Clause Explorer →
              </button>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl text-neutral-800 dark:text-neutral-200 font-serif leading-relaxed text-sm border border-neutral-100 dark:border-neutral-800">
              {citationClause.text}
            </div>
          </div>
        )}

        {/* Uncertainty / Limitations note */}
        {result.uncertainty && (
          <div className="p-4 bg-neutral-100 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
            <span className="font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block text-[10px]">
              Document Scope & Uncertainty Note
            </span>
            <p>{result.uncertainty}</p>
          </div>
        )}

        {/* Suggested next question */}
        {result.suggestedFollowUp && (
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs">
            <span className="text-neutral-500 font-medium">Logical follow-up:</span>
            <button
              onClick={() => onAskFollowUp(result.suggestedFollowUp!)}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline text-left"
            >
              &quot;{result.suggestedFollowUp}&quot; →
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 p-8 text-center bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
      <div className="text-3xl" aria-hidden="true">
        🔍
      </div>
      <h3 className="text-lg font-serif text-neutral-900 dark:text-white">
        This topic is not explicitly addressed in the document text.
      </h3>
      <p className="text-neutral-500 text-xs max-w-md mx-auto">
        Clause is calibrated to never hallucinate or invent terms. If a clause does not state a condition, Clause will honestly inform you so you can raise it with a legal professional.
      </p>
    </div>
  );
}

function Suggestions({
  suggestions,
  onSelect,
}: {
  suggestions: string[];
  onSelect: (q: string) => void;
}) {
  return (
    <div className="space-y-3 pt-4">
      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
        Suggested questions for this document:
      </span>
      <div className="flex gap-2 flex-wrap">
        {suggestions.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="text-xs px-3.5 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors text-neutral-700 dark:text-neutral-300 shadow-sm"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
