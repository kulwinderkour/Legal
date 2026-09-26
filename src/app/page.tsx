"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "./workspace-context";
import { segmentClauses } from "@/features/clauses/lib/segment";
import { DEMO_DOCUMENT_TEXT } from "@/shared/demo-document";

function HeroText() {
  return (
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
  );
}

function UploadButtons({ isProcessing, onUploadClick, onTryDemo, onFileChange, fileInputRef }: {
  isProcessing: boolean;
  onUploadClick: () => void;
  onTryDemo: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
      <input type="file" accept=".txt,.pdf,.docx" className="hidden" ref={fileInputRef} aria-label="Upload a legal document" onChange={onFileChange} />
      <button disabled={isProcessing} onClick={onUploadClick} className="w-full sm:w-auto px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-lg disabled:opacity-50">
        {isProcessing ? "Processing..." : "Upload a document"}
      </button>
      <button disabled={isProcessing} onClick={onTryDemo} className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-sm disabled:opacity-50">
        {isProcessing ? "Loading demo..." : "Try demo document"}
      </button>
    </div>
  );
}

async function readFileText(file: File): Promise<string> {
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    const { extractTextFromPdf } = await import("@/shared/lib/extract-pdf");
    return extractTextFromPdf(file);
  }
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => { resolve((e.target?.result as string) ?? ""); };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export default function Home() {
  const router = useRouter();
  const { setDocument } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTryDemo = () => {
    setIsProcessing(true);
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
    setError(null);
    readFileText(file)
      .then((text) => {
        if (!text.trim()) { setError("Could not extract text from this file. Try a .txt file."); setIsProcessing(false); return; }
        const clauses = segmentClauses(text);
        setDocument(file.name, clauses, false);
        router.push("/dashboard");
      })
      .catch(() => { setError("Failed to read the file. Please try again."); setIsProcessing(false); });
  };

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center p-8 bg-neutral-50 dark:bg-neutral-900">
      <h1 className="sr-only">Clause Workspace</h1>
      <div className="max-w-3xl w-full text-center space-y-12">
        <HeroText />
        <UploadButtons isProcessing={isProcessing} onUploadClick={() => { fileInputRef.current?.click(); }} onTryDemo={handleTryDemo} onFileChange={handleFileUpload} fileInputRef={fileInputRef} />
        {error && <p role="alert" className="text-red-600 text-sm mt-2">{error}</p>}
        <div className="pt-16 border-t border-neutral-200 dark:border-neutral-800 mt-16">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Clause provides information about your document, not legal advice.</p>
        </div>
      </div>
    </main>
  );
}
