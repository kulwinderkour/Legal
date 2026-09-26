import React, { useState } from "react";
import type { Clause } from "@/shared/providers/analysis-provider";
import type { AnalysisProvider } from "@/shared/providers/analysis-provider";
import { SafetyRail } from "@/features/safety";

interface QAResult { answer: string | null; citationId: string | null; isLegalAdvice: boolean; }

function AskForm({ query, isSubmitting, onQueryChange, onSubmit }: { query: string; isSubmitting: boolean; onQueryChange: (q: string) => void; onSubmit: (e: React.SyntheticEvent) => void }) {
  return (
    <form onSubmit={onSubmit} className="mb-12 relative" role="search">
      <label htmlFor="ask-input" className="sr-only">Ask a question about this document</label>
      <input id="ask-input" type="text" value={query} onChange={(e) => { onQueryChange(e.target.value); }} placeholder="Ask something about this document" aria-describedby="ask-hint" className="w-full pl-6 pr-32 py-5 text-lg rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 focus:border-blue-500 focus:ring-0 outline-none transition-all shadow-sm" />
      <button type="submit" disabled={!query.trim() || isSubmitting} aria-label={isSubmitting ? "Searching document\u2026" : "Submit question"} className="absolute right-3 top-3 bottom-3 px-6 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50">
        {isSubmitting ? "Searching..." : "Ask"}
      </button>
      <p id="ask-hint" className="sr-only">Answers are grounded strictly in the uploaded document text.</p>
    </form>
  );
}

export function AskDocument({ clauses, provider, onNavigateToClause }: { clauses: Clause[], provider: AnalysisProvider, onNavigateToClause: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QAResult | null>(null);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSubmitting(true);
    void provider.askQuestion(clauses, query).then(response => {
      setResult({ answer: response.answer, citationId: response.citationClauseId, isLegalAdvice: response.isLegalAdvice });
      setIsSubmitting(false);
    });
  };

  return (
    <div className="h-full flex flex-col p-8 max-w-4xl mx-auto">
      <div className="mb-12">
        <h2 className="text-3xl font-serif text-neutral-900 dark:text-white mb-2">Ask the Document</h2>
        <p className="text-neutral-600 dark:text-neutral-400">Get specific answers grounded strictly in your document&apos;s text.</p>
      </div>
      <AskForm query={query} isSubmitting={isSubmitting} onQueryChange={setQuery} onSubmit={handleSubmit} />
      <div aria-live="polite" aria-atomic="true">
        {result && <AnswerResult result={result} clauses={clauses} onNavigateToClause={onNavigateToClause} />}
        {!result && <Suggestions setQuery={setQuery} />}
      </div>
    </div>
  );
}


function AnswerResult({ result, clauses, onNavigateToClause }: { result: QAResult, clauses: Clause[], onNavigateToClause: (id: string) => void }) {
  if (result.isLegalAdvice) {
    return (
      <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SafetyRail onNavigateToExplorer={() => { /* empty */ }} />
      </div>
    );
  }
  
  if (result.answer) {
    const citationClause = result.citationId ? clauses.find(c => c.id === result.citationId) : null;
    return (
      <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
        <div className="p-8 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded-r-2xl">
          <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">Answer</h3>
          <p className="text-2xl text-neutral-900 dark:text-white font-medium leading-relaxed">{result.answer}</p>
        </div>
        {citationClause && (
          <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-950">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-neutral-500 uppercase tracking-widest">Source Citation</h4>
              <button onClick={() => { onNavigateToClause(citationClause.id); }} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">View source</button>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg text-neutral-700 dark:text-neutral-300 font-serif leading-relaxed">{citationClause.text}</div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 p-8 text-center bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
      <div className="text-4xl mb-4" aria-hidden="true">🤷</div>
      <h3 className="text-xl font-medium text-neutral-900 dark:text-white mb-2">I couldn&apos;t find enough information about this in the document.</h3>
      <p className="text-neutral-500 mb-6">Clause only answers using the text provided in the document itself.</p>
    </div>
  );
}

function Suggestions({ setQuery }: { setQuery: (q: string) => void }) {
  const suggestions = ["What is the monthly rent?", "What is the notice period?", "What happens if I pay late?", "What is the security deposit?"];
  return (
    <div className="flex gap-2 flex-wrap mt-8">
      <span className="text-sm text-neutral-500 py-2">Try asking:</span>
      {suggestions.map(q => (
        <button key={q} onClick={() => { setQuery(q); }} className="text-sm px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200 transition-colors text-neutral-700 dark:text-neutral-300">
          {q}
        </button>
      ))}
    </div>
  );
}
