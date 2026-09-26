import { GoogleGenAI } from "@google/genai";

type AnalyzeOperation =
  | { op: "explain"; clauseText: string }
  | { op: "risk"; clauseText: string }
  | { op: "ask"; clauses: { id: string; text: string }[]; question: string }
  | { op: "actionkit"; clauses: { id: string; text: string }[] };

const LEGAL_ADVICE_PATTERNS = [
  "should i sign",
  "should i sue",
  "will i win",
  "legal action",
  "am i liable",
  "can they sue",
  "is this legal",
  "is this enforceable",
];

function isLegalAdviceQuestion(q: string): boolean {
  const lower = q.toLowerCase();
  return LEGAL_ADVICE_PATTERNS.some((p) => lower.includes(p));
}

function getAi(): GoogleGenAI | null {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

async function handleExplain(ai: GoogleGenAI, clauseText: string): Promise<Response> {
  const prompt = `You are a plain-language legal assistant. Explain the following contract clause in simple, clear language that a non-lawyer can understand in 2-3 sentences. Do not give legal advice. Only explain what the clause says.\n\nCLAUSE:\n${clauseText}\n\nRespond with ONLY the plain-language explanation, no preamble.`;
  const response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt });
  const text = response.text ?? "This clause defines specific terms of the agreement.";
  return Response.json({ plainLanguage: text.trim() });
}

async function handleRisk(ai: GoogleGenAI, clauseText: string): Promise<Response> {
  const prompt = `You are a legal document analyst. Assess the risk level of the following contract clause for a typical person signing it.\n\nCLAUSE:\n${clauseText}\n\nRespond with ONLY valid JSON in this exact format (no markdown):\n{"level": "High" or "Medium" or "Low" or null, "reason": "Brief 1-2 sentence explanation, or null if no risk"}`;
  const response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt, config: { responseMimeType: "application/json" } });
  const raw = response.text ?? '{"level":null,"reason":null}';
  return Response.json(JSON.parse(raw));
}

async function handleAsk(ai: GoogleGenAI, clauses: { id: string; text: string }[], question: string): Promise<Response> {
  if (isLegalAdviceQuestion(question)) {
    return Response.json({ answer: null, citationClauseId: null, isLegalAdvice: true });
  }
  const context = clauses.map((c, i) => `[CLAUSE ${String(i + 1)} | ID: ${c.id}]\n${c.text}`).join("\n\n---\n\n");
  const prompt = `You are a legal document assistant. Answer the user's question using ONLY the information in the provided document clauses. Do not speculate or bring in outside knowledge.\n\nDOCUMENT CLAUSES:\n${context}\n\nUSER QUESTION: ${question}\n\nRespond with ONLY valid JSON (no markdown):\n{"answer": "your answer here or null if not found in the document", "citationClauseId": "the clause ID from above that supports your answer, or null"}`;
  const response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt, config: { responseMimeType: "application/json" } });
  const raw = response.text ?? '{"answer":null,"citationClauseId":null}';
  return Response.json({ ...JSON.parse(raw), isLegalAdvice: false });
}

async function handleActionKit(ai: GoogleGenAI, clauses: { id: string; text: string }[]): Promise<Response> {
  const context = clauses.map((c, i) => `[CLAUSE ${String(i + 1)}]\n${c.text}`).join("\n\n---\n\n");
  const prompt = `You are a legal document analyst helping a non-lawyer understand a contract. Analyze these clauses and produce an action kit.\n\nDOCUMENT CLAUSES:\n${context}\n\nRespond with ONLY valid JSON (no markdown):\n{"summary":"2-3 sentence plain-language summary","obligations":["key things the signing party must do"],"importantClauses":["clause topics to pay special attention to"],"lawyerQuestions":["3-5 specific questions to ask a lawyer"]}`;
  const response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt, config: { responseMimeType: "application/json" } });
  const raw = response.text ?? "{}";
  return Response.json(JSON.parse(raw));
}

export async function POST(request: Request): Promise<Response> {
  const ai = getAi();
  if (!ai) {
    return Response.json({ error: "GOOGLE_AI_API_KEY not set" }, { status: 503 });
  }

  let body: AnalyzeOperation;
  try {
    body = (await request.json()) as AnalyzeOperation;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    if (body.op === "explain") return await handleExplain(ai, body.clauseText);
    if (body.op === "risk") return await handleRisk(ai, body.clauseText);
    if (body.op === "ask") return await handleAsk(ai, body.clauses, body.question);
    return await handleActionKit(ai, body.clauses);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
