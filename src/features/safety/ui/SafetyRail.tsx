import React from "react";

export function SafetyRail({ onNavigateToExplorer }: { onNavigateToExplorer: () => void }) {
  return (
    <div className="p-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl text-center">
      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600 dark:text-amber-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-2xl font-serif text-amber-900 dark:text-amber-100 mb-4">
        I can explain what your document says, but I can&apos;t provide legal advice or tell you what legal action to take.
      </h3>
      <p className="text-amber-700 dark:text-amber-300/80 mb-8 max-w-lg mx-auto">
        Decisions like whether to sign an agreement or initiate a lawsuit require professional legal counsel.
      </p>
      
      <div className="flex justify-center gap-4">
        <button onClick={onNavigateToExplorer} className="px-6 py-3 bg-white dark:bg-neutral-950 border border-amber-200 dark:border-amber-800 rounded-xl font-medium text-amber-900 dark:text-amber-100 hover:bg-amber-50 transition-colors shadow-sm">
          Explore the relevant clause
        </button>
        <button className="px-6 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors shadow-sm">
          Prepare questions for a lawyer
        </button>
      </div>
    </div>
  );
}
