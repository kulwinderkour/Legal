import OpenAI from "openai";

type AnalyzeOperation =
  | { op: "explain"; clauseText: string }
  | { op: "risk"; clauseText: string }
  | { op: "ask"; clauses: { id: string; text: string }[]; question: string }
  | { op: "actionkit"; clauses: { id: string; text: string }[] }
  | { op: "compare"; docAClauses: { id: string; text: string }[]; docBClauses: { id: string; text: string }[]; docAName?: string; docBName?: string }
  | { op: "inconsistencies"; clauses: { id: string; text: string }[] };

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
      {
        role: "system",
        content:
          "You are an informational legal document assistant. Explain contract clauses simply for non-lawyers. Never give legal advice. Return JSON with: {\"plainLanguage\": \"2-3 clear sentences\", \"whyItMatters\": \"1 sentence on practical significance\", \"category\": \"e.g. Payment, Termination, Liability, Confidentiality, Dispute, Rights, Other\", \"lawyerQuestion\": \"1 relevant question to ask a lawyer about this clause\"}.",
      },
      { role: "user", content: `Explain this clause:\n\n${clauseText}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 350,
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw);
    return Response.json({
      plainLanguage: parsed.plainLanguage || "This clause defines specific terms of the agreement.",
      whyItMatters: parsed.whyItMatters || "Sets enforceable conditions between the parties.",
      category: parsed.category || "General",
      lawyerQuestion: parsed.lawyerQuestion || "Does this clause protect my interests adequately?",
    });
  } catch {
    return Response.json({ plainLanguage: raw });
  }
}

async function handleRisk(ai: OpenAI, clauseText: string): Promise<Response> {
  const completion = await ai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a legal document analyst. Assess clause risk/concern level for a typical person signing it. Respond ONLY with valid JSON: {\"level\": \"High\" | \"Medium\" | \"Low\" | null, \"reason\": \"1-2 sentence explanation of the concern\", \"evidenceQuote\": \"exact short excerpt from clause backing this\"}",
      },
      { role: "user", content: `Assess the concern level of this clause:\n\n${clauseText}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 200,
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
      {
        role: "system",
        content:
          "Answer questions using ONLY the provided document clauses. Do not speculate. Distinguish what the document states from assumptions. Respond ONLY with valid JSON: {\"answer\": \"concise answer or null if not found\", \"citationClauseId\": \"the clause ID or null\", \"citationQuote\": \"verbatim quote from the clause supporting the answer\", \"uncertainty\": \"any ambiguity or note if information is partial\", \"suggestedFollowUp\": \"a logical next question to ask\", \"confidence\": \"High\" | \"Medium\" | \"Low\"}",
      },
      { role: "user", content: `DOCUMENT CLAUSES:\n${context}\n\nQUESTION: ${question}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 400,
  });
  const raw = completion.choices[0]?.message?.content ?? '{"answer":null,"citationClauseId":null}';
  return Response.json({ ...JSON.parse(raw), isLegalAdvice: false });
}

async function handleActionKit(ai: OpenAI, clauses: { id: string; text: string }[]): Promise<Response> {
  const context = clauses.map((c, i) => `[CLAUSE ${String(i + 1)} | ID: ${c.id}]\n${c.text}`).join("\n\n---\n\n");
  const prompt = `Analyze these contract clauses and produce a structured legal intelligence kit for non-lawyers.
Respond with JSON matching:
{
  "summary": "2-3 sentence plain language executive summary",
  "metadata": {
    "docType": "e.g. Residential Rental Agreement, Employment Agreement, NDA",
    "parties": ["Party A", "Party B"],
    "effectiveDate": "e.g. 1st of upcoming month or Not specified",
    "duration": "e.g. 12 months",
    "governingLaw": "e.g. Jurisdiction specified or Not specified",
    "keyTakeaway": "1 punchy sentence of what the user needs to watch out for"
  },
  "obligations": [
    {
      "id": "ob-1",
      "party": "Tenant / Employee / Service Provider",
      "obligation": "Clear plain-language summary of what they must do",
      "timing": "When it must be done",
      "consequence": "Consequence if breached (or None stated)",
      "clauseQuote": "Short verbatim quote"
    }
  ],
  "rights": [
    {
      "id": "rt-1",
      "party": "Tenant / Employee / etc",
      "right": "Plain-language right granted (e.g. refund, notice)",
      "conditions": "Conditions to exercise",
      "clauseQuote": "Short verbatim quote"
    }
  ],
  "inconsistencies": [
    {
      "id": "inc-1",
      "title": "Title of conflict or ambiguity",
      "description": "Explanation of contradictory terms, notice mismatches, or vague penalties",
      "severity": "High" | "Medium" | "Low",
      "clauseIds": ["clause-id"],
      "recommendation": "What to clarify before signing"
    }
  ],
  "options": {
    "negotiationPoints": [
      {
        "topic": "Topic (e.g. Notice Period or Penalty)",
        "proposedChange": "Recommended alternative language or counter-proposal",
        "reason": "Why this protects the user"
      }
    ],
    "clarifications": ["Specific questions to email the other party before signing"],
    "safeguards": ["Operational precautions to take if signing as-is"],
    "actionMilestones": [
      { "step": 1, "title": "Review Flagged Items", "detail": "Verify high-risk clauses and conflicting terms", "status": "ready" },
      { "step": 2, "title": "Clarify with Counterparty", "detail": "Send written inquiry on ambiguous points", "status": "pending" },
      { "step": 3, "title": "Consult Professional", "detail": "Bring generated dossier to counsel if high risks remain", "status": "pending" },
      { "step": 4, "title": "Execute & Archive", "detail": "Sign final counter-signed version and store securely", "status": "pending" }
    ]
  },
  "importantClauses": ["List of clause topics needing close review"],
  "lawyerQuestions": ["4-6 high-impact questions to ask a legal professional"]
}

DOCUMENT CLAUSES:
${context}`;

  const completion = await ai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "You are a legal document analyst providing calibrated legal assistance and document intelligence. Never give legal advice. Ground every point in the clauses provided.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1800,
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  return Response.json(JSON.parse(raw));
}

async function handleCompare(
  ai: OpenAI,
  docAClauses: { id: string; text: string }[],
  docBClauses: { id: string; text: string }[],
  docAName = "Document A",
  docBName = "Document B"
): Promise<Response> {
  const docAText = docAClauses.map((c, i) => `[${docAName} Clause ${i + 1}]\n${c.text}`).join("\n\n");
  const docBText = docBClauses.map((c, i) => `[${docBName} Clause ${i + 1}]\n${c.text}`).join("\n\n");

  const prompt = `Compare these two legal documents side by side:

--- ${docAName} ---
${docAText}

--- ${docBName} ---
${docBText}

Provide an objective, factual, dimension-by-dimension comparison. Never declare a "winner" or give legal advice.
Respond with JSON matching:
{
  "summary": "2-3 sentence executive comparison of changes",
  "riskVerdict": "Factual summary of whether obligations/risk shifted towards or away from the user",
  "dimensionComparison": [
    {
      "dimension": "Financial Terms (e.g. Rent, Deposit, Fees)",
      "docAValue": "Value in Doc A",
      "docBValue": "Value in Doc B",
      "notes": "Practical difference"
    },
    {
      "dimension": "Duration & Termination",
      "docAValue": "Value in Doc A",
      "docBValue": "Value in Doc B",
      "notes": "Practical difference"
    },
    {
      "dimension": "Obligations & Restrictions",
      "docAValue": "Value in Doc A",
      "docBValue": "Value in Doc B",
      "notes": "Practical difference"
    },
    {
      "dimension": "Liability & Remedies",
      "docAValue": "Value in Doc A",
      "docBValue": "Value in Doc B",
      "notes": "Practical difference"
    }
  ],
  "materialDifferences": [
    {
      "title": "Short title of change",
      "category": "Financial | Termination | Liability | Operations | General",
      "changeType": "modified" | "added" | "removed",
      "docAText": "Original wording or 'None'",
      "docBText": "Revised wording or 'Removed'",
      "impact": "Plain-English explanation of practical effect on user",
      "riskShift": "Increased Risk" | "Reduced Risk" | "Neutral"
    }
  ]
}`;

  const completion = await ai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "You are an expert contract comparison analyst. Be strictly factual, grounded in text, and never declare a winner.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1500,
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  return Response.json(JSON.parse(raw));
}

async function handleInconsistencies(ai: OpenAI, clauses: { id: string; text: string }[]): Promise<Response> {
  const context = clauses.map((c, i) => `[CLAUSE ${String(i + 1)} | ID: ${c.id}]\n${c.text}`).join("\n\n---\n\n");
  const completion = await ai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "Identify internal contradictions, conflicting notice requirements, ambiguous penalty terms, or conflicting liability caps within the document clauses. Respond ONLY with valid JSON: {\"inconsistencies\": [{\"id\": \"inc-1\", \"title\": \"...\", \"description\": \"...\", \"severity\": \"High\"|\"Medium\"|\"Low\", \"clauseIds\": [\"...\"], \"recommendation\": \"...\"}]}",
      },
      { role: "user", content: `DOCUMENT CLAUSES:\n${context}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 800,
  });
  const raw = completion.choices[0]?.message?.content ?? '{"inconsistencies": []}';
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
    if (body.op === "compare") return await handleCompare(ai, body.docAClauses, body.docBClauses, body.docAName, body.docBName);
    if (body.op === "inconsistencies") return await handleInconsistencies(ai, body.clauses);
    return await handleActionKit(ai, body.clauses);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
