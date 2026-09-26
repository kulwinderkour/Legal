"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWorkspace } from "../workspace-context";
import { ClauseExplorer } from "@/features/clauses";
import { RiskRadar } from "@/features/risk";
import { AskDocument } from "@/features/qa";
import { ActionKitView } from "@/features/actions";
import { CompareView } from "@/features/compare";
import { useRouter } from "next/navigation";
import { LocalProvider } from "@/shared/providers/local-provider";
import { GeminiProvider } from "@/shared/providers/gemini-provider";
import type { AnalysisProvider } from "@/shared/providers/analysis-provider";
import type { Clause } from "@/features/clauses";

type TabId = "overview" | "explorer" | "risk" | "ask" | "compare" | "action";

const tabs = [
  { id: "overview" as TabId, label: "Overview" },
  { id: "explorer" as TabId, label: "Explorer" },
  { id: "risk" as TabId, label: "Risk Radar" },
  { id: "ask" as TabId, label: "Ask" },
  { id: "compare" as TabId, label: "Compare" },
  { id: "action" as TabId, label: "Action Kit" },
];

function SummaryCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="bg-white dark:bg-neutral-950 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
      <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">{title}</h3>
      <div className="text-4xl font-light text-neutral-900 dark:text-white mb-2" aria-label={`${title}: ${value}`}>{value}</div>
      <p className="text-xs text-neutral-500 mt-auto">{subtitle}</p>
    </div>
  );
}

function AiBanner({ isAiEnabled }: { isAiEnabled: boolean }) {
  if (isAiEnabled) {
    return (
      <div className="flex items-center gap-3 px-5 py-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-xl" role="status" aria-label="AI status: OpenAI GPT-4o Mini active">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">GPT-4o Mini — Active</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">All analysis powered by OpenAI GPT-4o Mini. Answers grounded strictly in your document.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl" role="status" aria-label="AI status: running in offline mode">
      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Offline Mode — Add OpenAI API Key to Enable AI</p>
        <p className="text-xs text-amber-600 dark:text-amber-400">Set <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">OPENAI_API_KEY</code> in <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.env.local</code> and restart</p>
      </div>
    </div>
  );
}

function OverviewPanel({ clauses, importantCount, obligationCount, statsLoaded, isAiEnabled, onNavigate }: {
  clauses: Clause[]; importantCount: number; obligationCount: number; statsLoaded: boolean; isAiEnabled: boolean; onNavigate: (tab: TabId) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(clauses.reduce((acc, c) => acc + c.text.length, 0) / 2500));
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-serif text-neutral-900 dark:text-white mb-2">Document Overview</h2>
        <p className="text-neutral-600 dark:text-neutral-400">High-level insights extracted from your document by AI.</p>
      </div>
      <AiBanner isAiEnabled={isAiEnabled} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard title="Pages" value={pageCount.toString()} subtitle="Estimated length" />
        <SummaryCard title="Clauses" value={clauses.length.toString()} subtitle="Identified segments" />
        <SummaryCard title="High Risk" value={statsLoaded ? importantCount.toString() : "…"} subtitle="Clauses needing attention" />
        <SummaryCard title="Obligations" value={statsLoaded ? obligationCount.toString() : "…"} subtitle="Action items found" />
      </div>
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center space-y-4">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-white">Ready to review?</h3>
        <p className="text-neutral-600 dark:text-neutral-400">Explore clauses in plain language or jump straight to the risk radar.</p>
        <div className="flex justify-center gap-4 pt-4">
          <button onClick={() => { onNavigate("explorer"); }} className="px-6 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg font-medium hover:bg-neutral-800 transition-colors">Open Explorer</button>
          <button onClick={() => { onNavigate("risk"); }} className="px-6 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg font-medium hover:bg-neutral-200 transition-colors">View Risk Radar</button>
        </div>
      </div>
    </div>
  );
}

function DashboardHeader({ documentName, isDemoMode, isAiEnabled }: { documentName: string; isDemoMode: boolean; isAiEnabled: boolean }) {
  return (
    <header className="flex-none bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between z-10">
      <div className="flex items-center gap-6">
        <span className="font-serif font-bold text-xl tracking-tight text-neutral-900 dark:text-white" aria-label="Clause application">CLAUSE</span>
        <div className="h-6 w-px bg-neutral-300 dark:bg-neutral-700" aria-hidden="true" />
        <h1 className="text-sm font-medium text-neutral-600 dark:text-neutral-300 flex items-center gap-3">
          {documentName}
          {isDemoMode && <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs rounded-full border border-amber-200 dark:border-amber-800/50">Demo</span>}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {isAiEnabled ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full border border-emerald-200 dark:border-emerald-800/50" aria-label="Powered by OpenAI GPT-4o Mini">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            GPT-4o Mini
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-xs rounded-full border border-neutral-200 dark:border-neutral-700" aria-label="Offline mode — add OpenAI key">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" aria-hidden="true" />
            Offline Mode
          </div>
        )}
      </div>
    </header>
  );
}

function TabBar({ activeTab, tabListRef, onSelect, onKeyDown }: { activeTab: TabId; tabListRef: React.RefObject<HTMLDivElement | null>; onSelect: (id: TabId) => void; onKeyDown: (e: React.KeyboardEvent, idx: number) => void }) {
  return (
    <div role="tablist" aria-label="Document analysis tools" ref={tabListRef} className="flex-none bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 px-6 overflow-x-auto">
      <div className="flex space-x-8">
        {tabs.map((tab, idx) => (
          <button key={tab.id} role="tab" data-tab={tab.id} id={`tab-${tab.id}`} aria-selected={activeTab === tab.id} aria-controls={`panel-${tab.id}`} tabIndex={activeTab === tab.id ? 0 : -1} onClick={() => { onSelect(tab.id); }} onKeyDown={(e) => { onKeyDown(e, idx); }}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id ? "border-neutral-900 dark:border-white text-neutral-900 dark:text-white" : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"}`}
          >{tab.label}</button>
        ))}
      </div>
    </div>
  );
}

function useProviderDetection(): [AnalysisProvider, boolean] {
  const [provider, setProvider] = useState<AnalysisProvider>(() => new LocalProvider());
  const [isAiEnabled, setIsAiEnabled] = useState(false);
  useEffect(() => {
    void fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "explain", clauseText: "probe" }) })
      .then((res) => { if (res.ok) { setProvider(new GeminiProvider()); setIsAiEnabled(true); } })
      .catch(() => { /* keep LocalProvider */ });
  }, []);
  return [provider, isAiEnabled];
}

function useOverviewStats(clauses: Clause[], provider: AnalysisProvider): { importantCount: number; obligationCount: number; statsLoaded: boolean } {
  const [importantCount, setImportantCount] = useState(0);
  const [obligationCount, setObligationCount] = useState(0);
  const [statsLoaded, setStatsLoaded] = useState(false);
  useEffect(() => {
    if (clauses.length === 0) return;
    void Promise.all(clauses.map((c) => provider.assessRisk(c))).then((assessments) => { setImportantCount(assessments.filter((a) => a?.level === "High").length); });
    void provider.generateActionKit(clauses).then((kit) => { setObligationCount(kit.obligations.length); setStatsLoaded(true); }).catch(() => { setStatsLoaded(true); });
  }, [clauses, provider]);
  return { importantCount, obligationCount, statsLoaded };
}

export default function DashboardPage() {
  const { documentName, clauses, isDemoMode } = useWorkspace();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const tabListRef = useRef<HTMLDivElement>(null);
  const [provider, isAiEnabled] = useProviderDetection();
  const { importantCount, obligationCount, statsLoaded } = useOverviewStats(clauses, provider);

  useEffect(() => { if (!documentName) { router.push("/"); } }, [documentName, router]);

  const handleTabKeyDown = (e: React.KeyboardEvent, currentIdx: number) => {
    let nextIdx = currentIdx;
    if (e.key === "ArrowRight") nextIdx = (currentIdx + 1) % tabs.length;
    else if (e.key === "ArrowLeft") nextIdx = (currentIdx - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") nextIdx = 0;
    else if (e.key === "End") nextIdx = tabs.length - 1;
    else return;
    e.preventDefault();
    const nextTab = tabs[nextIdx];
    if (nextTab) { setActiveTab(nextTab.id); const el = tabListRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${nextTab.id}"]`); el?.focus(); }
  };

  const navigateTo = (id: string) => { setActiveTab("explorer"); window.location.hash = `#clause-${id}`; };

  if (!documentName) return null;

  return (
    <div className="flex flex-col h-screen bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
      <a href="#dashboard-main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-neutral-900 focus:text-white focus:rounded-lg focus:shadow-lg">Skip to main content</a>
      <DashboardHeader documentName={documentName} isDemoMode={isDemoMode} isAiEnabled={isAiEnabled} />
      <TabBar activeTab={activeTab} tabListRef={tabListRef} onSelect={setActiveTab} onKeyDown={handleTabKeyDown} />
      <main id="dashboard-main" className="flex-1 overflow-hidden relative">
        <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" hidden={activeTab !== "overview"} className="h-full overflow-y-auto p-8">
          <OverviewPanel clauses={clauses} importantCount={importantCount} obligationCount={obligationCount} statsLoaded={statsLoaded} isAiEnabled={isAiEnabled} onNavigate={setActiveTab} />
        </div>
        <div role="tabpanel" id="panel-explorer" aria-labelledby="tab-explorer" hidden={activeTab !== "explorer"} className="h-full">
          {activeTab === "explorer" && <ClauseExplorer clauses={clauses} provider={provider} />}
        </div>
        <div role="tabpanel" id="panel-risk" aria-labelledby="tab-risk" hidden={activeTab !== "risk"} className="h-full">
          {activeTab === "risk" && <RiskRadar clauses={clauses} provider={provider} onNavigateToClause={navigateTo} />}
        </div>
        <div role="tabpanel" id="panel-ask" aria-labelledby="tab-ask" hidden={activeTab !== "ask"} className="h-full overflow-y-auto">
          {activeTab === "ask" && <AskDocument clauses={clauses} provider={provider} onNavigateToClause={navigateTo} />}
        </div>
        <div role="tabpanel" id="panel-compare" aria-labelledby="tab-compare" hidden={activeTab !== "compare"} className="h-full">
          {activeTab === "compare" && <CompareView clauses={clauses} />}
        </div>
        <div role="tabpanel" id="panel-action" aria-labelledby="tab-action" hidden={activeTab !== "action"} className="h-full">
          {activeTab === "action" && <ActionKitView clauses={clauses} provider={provider} />}
        </div>
      </main>
    </div>
  );
}
