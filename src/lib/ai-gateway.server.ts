import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

function createRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  let resolveRunId: (value: string | undefined) => void = () => {};
  let resolved = false;
  const ready = new Promise<string | undefined>((r) => {
    resolveRunId = r;
  });
  const publish = (v?: string) => {
    const next = v?.trim() || undefined;
    if (!runId && next) runId = next;
    if (!resolved) {
      resolved = true;
      resolveRunId(runId);
    }
  };
  if (runId) publish(runId);
  return {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      try {
        const res = await fetch(input, { ...init, headers });
        publish(res.headers.get(LOVABLE_AIG_RUN_ID_HEADER) ?? undefined);
        return res;
      } catch (e) {
        publish(undefined);
        throw e;
      }
    },
    getRunId: () => runId,
    waitForRunId: () => (runId ? Promise.resolve(runId) : ready),
  };
}

export function createLovableAiGatewayProvider(lovableApiKey: string, initialRunId?: string) {
  const runIdFetch = createRunIdFetch(initialRunId);
  const provider = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: runIdFetch.fetch,
  });
  return Object.assign(provider, {
    getRunId: runIdFetch.getRunId,
    waitForRunId: runIdFetch.waitForRunId,
  });
}

export function getLovableAiGatewayRunId(request: Request) {
  return request.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
}

export function getLovableAiGatewayResponseHeaders(
  providerHeaders?: HeadersInit,
  init?: HeadersInit,
) {
  const headers = new Headers(init);
  new Headers(providerHeaders).forEach((v, n) => {
    if (n.toLowerCase().startsWith("x-lovable-aig-")) headers.set(n, v);
  });
  return headers;
}

export async function withLovableAiGatewayRunIdHeader(
  response: Response,
  gateway: { getRunId: () => string | undefined; waitForRunId: () => Promise<string | undefined> },
) {
  if (!response.body) {
    const runId = gateway.getRunId();
    const headers = new Headers(response.headers);
    if (runId) headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
  const reader = response.body.getReader();
  const firstChunk = reader.read();
  const runId = await gateway.waitForRunId();
  const headers = new Headers(response.headers);
  if (runId) headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
  const body = new ReadableStream({
    async start(controller) {
      try {
        const first = await firstChunk;
        if (first.done) return controller.close();
        controller.enqueue(first.value);
        while (true) {
          const c = await reader.read();
          if (c.done) break;
          controller.enqueue(c.value);
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
    cancel: (reason?: unknown) => reader.cancel(reason),
  });
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
}

export const CHAT_MODEL = "google/gemini-3.6-flash";

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