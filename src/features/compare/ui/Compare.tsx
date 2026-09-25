import React, { useState } from "react";
import type { Clause } from "@/features/clauses/model/clause";

export function CompareView({ clauses: _clauses }: { clauses: Clause[] }) {
  const [showCompare, setShowCompare] = useState(false);
  
  if (!showCompare) {
    return <ComparePrompt onCompare={() => { setShowCompare(true); }} />;
  }

  return (
    <div className="h-full flex flex-col">
      <CompareHeader />
      <div className="flex-1 overflow-y-auto p-8 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-4xl mx-auto space-y-4 pb-32">
          <CompareItem title="Clause 2. Monthly Rent" orig="The Tenant agrees to pay a monthly rent of ₹25,000. Rent is due on or before the 5th day of each calendar month." rev="The Tenant agrees to pay a monthly rent of ₹28,000. Rent is due on or before the 5th day of each calendar month." />
          <CompareItem title="Clause 3. Security Deposit" orig="The Tenant shall pay a security deposit of ₹50,000 prior to moving in." rev="The Tenant shall pay a security deposit of ₹56,000 prior to moving in." />
          <CompareItem title="Clause 6. Termination" orig="Either party may terminate this agreement prior to its expiration by providing a 60 days' written notice to the other party." rev="Either party may terminate this agreement prior to its expiration by providing a 90 days' written notice to the other party." />
          <div className="p-4 text-center text-sm text-neutral-500">All other clauses remain unchanged.</div>
        </div>
      </div>
    </div>
  );
}

function ComparePrompt({ onCompare }: { onCompare: () => void }) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
        </div>
        <h2 className="text-2xl font-serif text-neutral-900 dark:text-white mb-4">Compare Documents</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          Select another document to compare against the current Residential Rental Agreement.
        </p>
        <button onClick={onCompare} className="px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-medium hover:bg-neutral-800 transition-colors shadow-sm w-full">
          Compare with &quot;Renewal Version&quot;
        </button>
      </div>
    </div>
  );
}

function CompareHeader() {
  return (
    <div className="flex-none p-6 border-b border-neutral-200 dark:border-neutral-800 flex gap-4">
      <div className="flex-1 p-3 bg-neutral-100 dark:bg-neutral-900 rounded-lg text-sm text-center font-medium">Original: Residential Rental Agreement</div>
      <div className="flex-1 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 rounded-lg text-sm text-center font-medium border border-blue-200 dark:border-blue-800">
        Comparing: Residential Rental Agreement — Renewal
      </div>
    </div>
  );
}

function CompareItem({ title, orig, rev }: { title: string, orig: string, rev: string }) {
  return (
    <div className="p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
      <div className="text-sm font-bold text-neutral-500 mb-2">{title}</div>
      <div className="font-serif leading-relaxed line-through text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded mb-2">{orig}</div>
      <div className="font-serif leading-relaxed text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">{rev}</div>
    </div>
  );
}
