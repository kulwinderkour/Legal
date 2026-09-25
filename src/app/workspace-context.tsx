"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";
import type { Clause } from "@/features/clauses/model/clause";

interface WorkspaceState {
  documentName: string | null;
  clauses: Clause[];
  isDemoMode: boolean;
  setDocument: (name: string, clauses: Clause[], isDemoMode?: boolean) => void;
  clearDocument: () => void;
}

const WorkspaceContext = createContext<WorkspaceState | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const setDocument = (name: string, newClauses: Clause[], demoMode = false) => {
    setDocumentName(name);
    setClauses(newClauses);
    setIsDemoMode(demoMode);
  };

  const clearDocument = () => {
    setDocumentName(null);
    setClauses([]);
    setIsDemoMode(false);
  };

  return (
    <WorkspaceContext.Provider
      value={{ documentName, clauses, isDemoMode, setDocument, clearDocument }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
