/**
 * extract-pdf.ts
 * Client-side PDF text extraction using pdfjs-dist (runs in the browser).
 */

export async function extractTextFromPdf(file: File): Promise<string> {
  // Dynamically import pdfjs-dist to avoid SSR issues
  const pdfjsLib = await import("pdfjs-dist");

  // Point the worker at the bundled worker file
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);

  const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(pageText);
  }

  return pageTexts.join("\n\n");
}
