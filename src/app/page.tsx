"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "./workspace-context";
import { segmentClauses } from "@/features/clauses/lib/segment";
import { DEMO_DOCUMENT_TEXT } from "@/shared/demo-document";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

export default function Home() {
  const router = useRouter();
  const { setDocument } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTryDemo = () => {
    setIsProcessing(true);
    // Simulate processing delay for demo UX
    setTimeout(() => {
      const clauses = segmentClauses(DEMO_DOCUMENT_TEXT);
      setDocument("Residential Rental Agreement", clauses, true);
      router.push("/dashboard");
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const clauses = segmentClauses(text);
      setDocument(file.name, clauses, false);
      router.push("/dashboard");
    };
    reader.readAsText(file); // Naive text upload support for demo
  };

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center p-8 bg-neutral-50 dark:bg-neutral-900"
    >
      <h1 className="sr-only">Clause Workspace</h1>
      
      <div className="max-w-3xl w-full text-center space-y-12">
        <div className="space-y-6">
          <div className="inline-block px-4 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 font-semibold text-sm mb-4 tracking-widest">
            CLAUSE
          </div>
          <h2 className="text-5xl font-serif text-neutral-900 dark:text-white tracking-tight leading-tight">
            Understand your documents.<br />
            <span className="text-neutral-500">Before you sign.</span>
          </h2>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Clause helps you understand, compare and act on legal documents — with every answer grounded in the document itself.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <input
            type="file"
            accept=".txt,.pdf,.docx"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-lg disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "Upload a document"}
          </button>
          
          <button
            disabled={isProcessing}
            onClick={handleTryDemo}
            className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isProcessing ? "Loading demo..." : "Try demo document"}
          </button>
        </div>

        <div className="pt-16 border-t border-neutral-200 dark:border-neutral-800 mt-16">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Clause provides information about your document, not legal advice.
          </p>
        </div>
      </div>
    </main>
  );
}
