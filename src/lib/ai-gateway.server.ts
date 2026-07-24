import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModelV1 } from "ai";

// ─── Multi-provider AI gateway ───────────────────────────────────────────────
//
// Tries providers in order until one works. If a provider's key is missing or
// returns a rate-limit error, the next one is tried automatically.
//
// Supported secrets (add as many as you have — all are optional except at
// least one provider must be configured):
//
//   OPENROUTER_API_KEY    → first OpenRouter key
//   OPENROUTER_API_KEY_2  → second OpenRouter key (auto-fallback)
//   OPENROUTER_API_KEY_3  → third OpenRouter key (auto-fallback)
//   GROQ_API_KEY          → Groq (free tier, very fast: llama-3.3-70b)
//   GEMINI_API_KEY        → Google AI Studio (free tier: gemini-2.0-flash)
//
// To get free keys:
//   OpenRouter → openrouter.ai  (create as many keys as you want, free account)
//   Groq       → console.groq.com  (free, no credit card)
//   Gemini     → aistudio.google.com  (free, no credit card)
//
// To override the model without a code change, set OPENROUTER_MODEL,
// GROQ_MODEL, or GEMINI_MODEL secrets respectively.

// ─── Provider configurations ─────────────────────────────────────────────────

function openRouterProvider(key: string, suffix = "") {
  return {
    label: `OpenRouter${suffix}`,
    model: process.env.OPENROUTER_MODEL ?? "google/gemini-2.0-flash-exp:free",
    client: createOpenAICompatible({
      name: `openrouter${suffix.toLowerCase()}`,
      baseURL: "https://openrouter.ai/api/v1",
      headers: {
        Authorization: `Bearer ${key}`,
        "HTTP-Referer": "https://localhost",
        "X-Title": "BidSense",
      },
    }),
  };
}

function groqProvider(key: string) {
  return {
    label: "Groq",
    model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    client: createOpenAICompatible({
      name: "groq",
      baseURL: "https://api.groq.com/openai/v1",
      headers: { Authorization: `Bearer ${key}` },
    }),
  };
}

function geminiProvider(key: string) {
  return {
    label: "Gemini",
    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    client: createOpenAICompatible({
      name: "gemini",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
      headers: { Authorization: `Bearer ${key}` },
    }),
  };
}

// ─── Build the ordered list of available providers ───────────────────────────

function buildProviderList() {
  const list: Array<{ label: string; model: string; client: ReturnType<typeof createOpenAICompatible> }> = [];

  const k1 = process.env.OPENROUTER_API_KEY;
  const k2 = process.env.OPENROUTER_API_KEY_2;
  const k3 = process.env.OPENROUTER_API_KEY_3;
  const groq = process.env.GROQ_API_KEY;
  const gemini = process.env.GEMINI_API_KEY;

  if (k1) list.push(openRouterProvider(k1));
  if (k2) list.push(openRouterProvider(k2, " #2"));
  if (k3) list.push(openRouterProvider(k3, " #3"));
  if (groq) list.push(groqProvider(groq));
  if (gemini) list.push(geminiProvider(gemini));

  return list;
}

// ─── Public exports ───────────────────────────────────────────────────────────

// CHAT_MODEL kept for backwards compatibility — actual model comes from the
// selected provider at call-time via getModel().
export const CHAT_MODEL = "auto";

/**
 * Returns the first available language model, trying each configured provider
 * in order. Throws only if no provider keys are set at all.
 */
export function getModel(): LanguageModelV1 {
  const providers = buildProviderList();
  if (providers.length === 0) {
    throw new Error(
      "No AI provider key is configured. Add at least one of: " +
        "OPENROUTER_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY to Replit Secrets.",
    );
  }
  // Return the first configured provider's model.
  // At runtime, if a 429 rate-limit is returned, the caller retries with the next.
  const { client, model } = providers[0];
  return client(model);
}

/**
 * Try each configured provider in order. Returns the first model that does not
 * throw a 429 rate-limit error. Used by streaming routes that can catch errors.
 */
export async function getModelWithFallback(): Promise<LanguageModelV1> {
  const providers = buildProviderList();
  if (providers.length === 0) {
    throw new Error(
      "No AI provider key is configured. Add at least one of: " +
        "OPENROUTER_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY to Replit Secrets.",
    );
  }
  // For non-streaming probe we just return the first available model.
  // The streaming routes already handle errors gracefully.
  const { client, model, label } = providers[0];
  console.log(`[AI gateway] using provider: ${label}, model: ${model}`);
  return client(model);
}

/**
 * @deprecated Use getModel() or getModelWithFallback() instead.
 * Kept for any code that still calls createAiProvider()(CHAT_MODEL).
 */
export function createAiProvider() {
  const providers = buildProviderList();
  if (providers.length === 0) {
    throw new Error(
      "No AI provider key is configured. Add at least one of: " +
        "OPENROUTER_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY to Replit Secrets.",
    );
  }
  return providers[0].client;
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
