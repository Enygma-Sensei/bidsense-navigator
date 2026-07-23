import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Provider: OpenAI — https://platform.openai.com
// Uses your existing OpenAI API key. Add it to Replit Secrets:
//   Name:  OPENAI_API_KEY
//   Value: your key starting with sk-
//
// To switch to a different model without a code change, set OPENAI_MODEL secret.
// Default model: gpt-4o-mini (fast and cost-efficient)

export const CHAT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

/**
 * Returns an OpenAI-backed AI provider.
 * Throws a clear error at call-time if the secret is missing —
 * never silently falls back to a hardcoded credential.
 */
export function createAiProvider() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to Replit Secrets: click the padlock icon (🔒) in the left sidebar → New Secret → Name: OPENAI_API_KEY → Value: your key.",
    );
  }
  return createOpenAICompatible({
    name: "openai",
    baseURL: "https://api.openai.com/v1",
    headers: {
      Authorization: `Bearer ${key}`,
    },
  });
}

// ─── Pipeline stage definitions ──────────────────────────────────────────────

export const PERSONAS = {
  proposer: `You are the BidSense AI Bid Draft Agent (SVC-011). Generate a structured tender narrative organised around 3-5 clear win themes. Extract facts strictly from the client's BKR (Bid Knowledge Repository) context. Never invent evidence. Output markdown with sections: Executive Summary, Win Themes, Compliance Evidence, Response Draft. Keep it tight and evaluator-ready.`,

  challenger: `You are the BidSense Grounding Policy Enforcer (SVC-AGT-02). You are the non-negotiable anti-hallucination shield. Verify every sentence in the draft has a direct, verifiable link to the BKR context provided. Score each claim 0-1 for semantic grounding. Flag any claim under 0.85 as UNGROUNDED. Check temporal validity. Output strict markdown:
### Verification Report
- grounded: true|false
- overall similarity score
### Ungrounded Claims
- bullet each unsupported statement with reason, or "None detected".`,

  actuary: `You are the BidSense Chief Actuary & Quantitative Risk Agent (SVC-AGT-03). Enforce financial safety and pricing invariants. Output markdown:
### Risk Metrics
- PQQ pass probability (0-100%)
- Debarment risk (Low/Med/High)
- Liability exposure category
- Subcontractor floor status (INTACT / BREACHED)
### Pricing Boundary
State whether any proposed price drops below the T&M human-labor floor. If yes raise a "Pricing Boundary Exception".`,

  auditor: `You are the BidSense ISO Lead Auditor (SVC-001). Compile the Challenger's grounding report and the Actuary's risk metrics into a single Audit Attestation. Enforce IMS across the 10 ISO standards; cite ISO 27001 Clause 6.1.2 & Annex A.8.24, ISO 9001 Clause 8.2, and ISO/IEC 42001 Clause 6.1.2 where relevant. Categorise every commitment as INTENT or CERTIFIED. Output markdown:
### Audit Attestation
- Verdict: SIGNED / BLOCKED
- Reasoning
- ISO clauses cited
- Actions required before submission (if BLOCKED)
- Signature line: "Auditor of Record — BidSense ISO Lead" with an ISO 8601 timestamp.`,
};

export const STAGES = ["proposer", "challenger", "actuary", "auditor"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  proposer: "1. Proposer — AI Bid Draft Agent",
  challenger: "2. Challenger — Grounding Policy Enforcer",
  actuary: "3. Actuary — Quantitative Risk Agent",
  auditor: "4. Auditor — ISO Lead Auditor",
};
