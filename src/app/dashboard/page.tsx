"use client";

import React, { useState, useEffect } from "react";
import { useWorkspace } from "../workspace-context";
import { ClauseExplorer } from "@/features/clauses/ui/ClauseExplorer";
import { RiskRadar } from "@/features/risk/ui/RiskRadar";
import { AskDocument } from "@/features/qa/ui/AskDocument";
import { ActionKitView } from "@/features/actions/ui/ActionKit";
import { CompareView } from "@/features/compare/ui/Compare";
import { useRouter } from "next/navigation";
import { LocalProvider } from "@/shared/providers/local-provider";

export default function DashboardPage() {
  const { documentName, clauses, isDemoMode } = useWorkspace();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "explorer" | "risk" | "ask" | "compare" | "action">("overview");

  // Shared provider instance
  const [provider] = useState(() => new LocalProvider());
  
  // Computed stats for overview
  const pageCount = Math.max(1, Math.ceil(clauses.reduce((acc, c) => acc + c.text.length, 0) / 2500));
  const [importantCount, setImportantCount] = useState(0);
  const [obligationCount, setObligationCount] = useState(0);

  useEffect(() => {
    if (!documentName) {
      router.push("/");
    }
  }, [documentName, router]);

  useEffect(() => {
    if (clauses.length > 0) {
      // Pre-calculate stats
      let highRisk = 0;
      Promise.all(clauses.map(c => provider.assessRisk(c))).then(assessments => {
        assessments.forEach(a => { if (a && a.level === "High") highRisk++; });
        setImportantCount(highRisk);
      });
      
      provider.generateActionKit(clauses).then(kit => {
        setObligationCount(kit.obligations.length);
      });
    }
  }, [clauses, provider]);

  if (!documentName) return null;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "explorer", label: "Explorer" },
    { id: "risk", label: "Risk Radar" },
    { id: "ask", label: "Ask" },
    { id: "compare", label: "Compare" },
    { id: "action", label: "Action Kit" },
  ] as const;

  return (
    <div className="flex flex-col h-screen bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
      <header className="flex-none bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-6">
          <h1 className="font-serif font-bold text-xl tracking-tight text-neutral-900 dark:text-white">CLAUSE</h1>
          <div className="h-6 w-px bg-neutral-300 dark:bg-neutral-700"></div>
          <h2 className="text-sm font-medium text-neutral-600 dark:text-neutral-300 flex items-center gap-3">
            {documentName}
            {isDemoMode && (
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs rounded-full border border-amber-200 dark:border-amber-800/50">
                Demo Mode: Fictional Document
              </span>
            )}
          </h2>
        </div>
      </header>
      
      <div className="flex-none bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 px-6 overflow-x-auto scrollbar-hide">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); }}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-neutral-900 dark:border-white text-neutral-900 dark:text-white"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="flex-1 overflow-hidden relative">
        {activeTab === "overview" && (
          <div className="h-full overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto space-y-8">
              <div>
                <h2 className="text-3xl font-serif text-neutral-900 dark:text-white mb-2">Document Overview</h2>
                <p className="text-neutral-600 dark:text-neutral-400">High-level insights extracted from your document.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard title="Pages" value={pageCount.toString()} subtitle="Estimated length" />
                <SummaryCard title="Clauses" value={clauses.length.toString()} subtitle="Identified segments" />
                <SummaryCard title="Potentially Important" value={importantCount.toString()} subtitle="High priority items" />
                <SummaryCard title="Obligations" value={obligationCount.toString()} subtitle="Action items found" />
              </div>
              
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 mt-8 text-center space-y-4">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-white">Ready to review?</h3>
                <p className="text-neutral-600 dark:text-neutral-400">Start by exploring the clauses in plain language or jumping straight to the risk radar.</p>
                <div className="flex justify-center gap-4 pt-4">
                  <button onClick={() => { setActiveTab("explorer"); }} className="px-6 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg font-medium hover:bg-neutral-800 transition-colors">
                    Open Explorer
                  </button>
                  <button onClick={() => { setActiveTab("risk"); }} className="px-6 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg font-medium hover:bg-neutral-200 transition-colors">
                    View Risks
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "explorer" && <ClauseExplorer clauses={clauses} provider={provider} />}
        {activeTab === "risk" && <RiskRadar clauses={clauses} provider={provider} onNavigateToClause={(id) => { setActiveTab("explorer"); window.location.hash = `#clause-${id}`; }} />}
        {activeTab === "ask" && <AskDocument clauses={clauses} provider={provider} onNavigateToClause={(id) => { setActiveTab("explorer"); window.location.hash = `#clause-${id}`; }} />}
        {activeTab === "compare" && <CompareView clauses={clauses} />}
        {activeTab === "action" && <ActionKitView clauses={clauses} provider={provider} />}
      </main>
    </div>
  );
}

function SummaryCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="bg-white dark:bg-neutral-950 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
      <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">{title}</h3>
      <div className="text-4xl font-light text-neutral-900 dark:text-white mb-2">{value}</div>
      <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-auto">{subtitle}</p>
    </div>
  );
}
