import OpenAI from "openai";

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

function getAi(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

const MODEL = "gpt-4o-mini";

async function handleExplain(ai: OpenAI, clauseText: string): Promise<Response> {
  const completion = await ai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are a plain-language legal assistant. Explain contract clauses simply for non-lawyers. Never give legal advice. Only explain what the clause says." },
      { role: "user", content: `Explain this clause in 2-3 clear sentences:\n\n${clauseText}` },
    ],
    max_tokens: 200,
  });
  const text = completion.choices[0]?.message?.content ?? "This clause defines specific terms of the agreement.";
  return Response.json({ plainLanguage: text.trim() });
}

async function handleRisk(ai: OpenAI, clauseText: string): Promise<Response> {
  const completion = await ai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are a legal document analyst. Assess clause risk for a typical person signing it. Respond ONLY with valid JSON: {\"level\": \"High\" or \"Medium\" or \"Low\" or null, \"reason\": \"1-2 sentence explanation or null\"}" },
      { role: "user", content: `Assess the risk of this clause:\n\n${clauseText}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 150,
  });
  const raw = completion.choices[0]?.message?.content ?? '{"level":null,"reason":null}';
  return Response.json(JSON.parse(raw));
}

async function handleAsk(ai: OpenAI, clauses: { id: string; text: string }[], question: string): Promise<Response> {
  if (isLegalAdviceQuestion(question)) {
    return Response.json({ answer: null, citationClauseId: null, isLegalAdvice: true });
  }
  const context = clauses.map((c, i) => `[CLAUSE ${String(i + 1)} | ID: ${c.id}]\n${c.text}`).join("\n\n---\n\n");
  const completion = await ai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "Answer questions using ONLY the provided document clauses. Do not speculate. Respond ONLY with valid JSON: {\"answer\": \"your answer or null if not found\", \"citationClauseId\": \"the clause ID or null\"}" },
      { role: "user", content: `DOCUMENT CLAUSES:\n${context}\n\nQUESTION: ${question}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 300,
  });
  const raw = completion.choices[0]?.message?.content ?? '{"answer":null,"citationClauseId":null}';
  return Response.json({ ...JSON.parse(raw), isLegalAdvice: false });
}

async function handleActionKit(ai: OpenAI, clauses: { id: string; text: string }[]): Promise<Response> {
  const context = clauses.map((c, i) => `[CLAUSE ${String(i + 1)}]\n${c.text}`).join("\n\n---\n\n");
  const completion = await ai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are a legal document analyst helping non-lawyers understand contracts. Respond ONLY with valid JSON: {\"summary\":\"2-3 sentence plain summary\",\"obligations\":[\"key obligations\"],\"importantClauses\":[\"clause topics to review\"],\"lawyerQuestions\":[\"3-5 questions to ask a lawyer\"]}" },
      { role: "user", content: `Analyze these clauses and produce an action kit:\n\n${context}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 500,
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  return Response.json(JSON.parse(raw));
}

export async function POST(request: Request): Promise<Response> {
  const ai = getAi();
  if (!ai) {
    return Response.json({ error: "OPENAI_API_KEY not set" }, { status: 503 });
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
