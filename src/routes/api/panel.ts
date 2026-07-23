import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";

import { getModel } from "../../lib/ai-gateway.server";

// Panel of experts — each agent works on the SAME tender document with a
// distinct role, and every claim MUST cite a verbatim excerpt from the
// SOURCE_DOCUMENT block. If evidence is absent, the expert must say so
// explicitly. This is the anti-hallucination contract for document review.

export type Expert =
  | "bid_strategist"
  | "compliance_officer"
  | "commercial_analyst"
  | "risk_reviewer"
  | "delivery_lead";

export const EXPERTS: Expert[] = [
  "bid_strategist",
  "compliance_officer",
  "commercial_analyst",
  "risk_reviewer",
  "delivery_lead",
];

export const EXPERT_LABELS: Record<Expert, string> = {
  bid_strategist: "Bid Strategist",
  compliance_officer: "Compliance Officer",
  commercial_analyst: "Commercial Analyst",
  risk_reviewer: "Risk Reviewer",
  delivery_lead: "Delivery Lead",
};

const ANTI_HALLUCINATION = `EVIDENCE PROTOCOL — MANDATORY:
1. Every factual claim MUST be followed by an inline citation of the form: (source: "<short verbatim quote of ≤ 15 words from SOURCE_DOCUMENT>")
2. If the document does not contain evidence for a point you would normally raise, state exactly: "Not evidenced in the supplied document." — do NOT fill the gap with plausible-sounding content.
3. If the entire document is off-topic or empty, output only: "Insufficient evidence to review."
4. Do not invent regulation clauses, price figures, dates, framework names, or scoring weights that are not in the document.
5. Distinguish OBSERVATIONS (with citations) from RECOMMENDATIONS (labelled clearly). Recommendations may be your judgment, but must be grounded in the cited observations.`;

const EXPERT_PROMPTS: Record<Expert, string> = {
  bid_strategist: `You are the Bid Strategist on a UK tendering consultancy team. You read tender documents to identify win themes, evaluation criteria weightings, mandatory requirements, and the client's true priorities. Structure your output as: 1) Win themes, 2) Evaluation criteria & weightings, 3) Mandatory pass/fail requirements, 4) Recommended positioning. Keep it under 400 words.`,
  compliance_officer: `You are the Compliance Officer. You extract ISO, Cyber Essentials, GDPR, Modern Slavery Act, PPN, and framework-specific compliance obligations from the document. Structure as: 1) Explicit compliance obligations (with clause references from the document), 2) Implied obligations, 3) Gaps we must close before bidding. Keep it under 400 words.`,
  commercial_analyst: `You are the Commercial Analyst. You extract budget, contract length, payment terms, volume assumptions, and any pricing constraints from the document. Structure as: 1) Budget & contract shape, 2) Payment mechanics, 3) Commercial risks, 4) Pricing questions to raise. Never invent prices. Keep it under 400 words.`,
  risk_reviewer: `You are the Risk Reviewer. You identify delivery, reputational, legal, and technical risks the document explicitly or implicitly raises, and score each Low / Medium / High. Structure as a table: Risk | Evidence | Impact | Likelihood | Mitigation. Keep it under 400 words.`,
  delivery_lead: `You are the Delivery Lead. You extract mobilisation timescales, key deliverables, resource assumptions, and dependencies. Structure as: 1) Deliverables list, 2) Timeline milestones, 3) Resource profile, 4) Dependencies on the client. Keep it under 400 words.`,
};

interface PanelBody {
  document?: string;
  filename?: string;
  experts?: Expert[];
}

function safeExpertList(input: Expert[] | undefined): Expert[] {
  if (!Array.isArray(input) || input.length === 0) return EXPERTS;
  return input.filter((e): e is Expert => EXPERTS.includes(e));
}

export const Route = createFileRoute("/api/panel")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let model;
        try {
          model = getModel();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "AI provider not configured";
          return new Response(msg, { status: 500 });
        }

        let body: PanelBody = {};
        try {
          body = (await request.json()) as PanelBody;
        } catch {
          return new Response("Invalid JSON body", { status: 400 });
        }
        const doc = (body.document ?? "").trim();
        if (!doc) return new Response("document is required", { status: 400 });
        // Cap the document to keep the context window sane; slice from the top
        // where the ITT/PQQ evaluation criteria typically live.
        const clipped = doc.slice(0, 60_000);
        const filename = body.filename ?? "tender-document";
        const experts = safeExpertList(body.experts);

        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const send = (obj: unknown) =>
              controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
            send({ type: "panel_start", experts, filename });
            for (const expert of experts) {
              send({ type: "expert_start", expert });
              const sys = `You are one of five experts reviewing the SOURCE_DOCUMENT below.\n\n${EXPERT_PROMPTS[expert]}\n\n${ANTI_HALLUCINATION}\n\nSOURCE_DOCUMENT (filename: ${filename}):\n"""\n${clipped}\n"""`;
              try {
                const result = streamText({
                  model,
                  system: sys,
                  prompt: `Produce your review now. Cite verbatim from SOURCE_DOCUMENT.`,
                });
                for await (const delta of result.textStream) {
                  send({ type: "expert_delta", expert, delta });
                }
                send({ type: "expert_end", expert });
              } catch (err) {
                send({
                  type: "expert_error",
                  expert,
                  message: err instanceof Error ? err.message : "Expert failed",
                });
              }
            }
            // Chair synthesis — ties observations together, without adding new
            // facts. If experts couldn't evidence something, chair must not.
            send({ type: "expert_start", expert: "chair" });
            try {
              const chairSys = `You are the Panel Chair. Synthesise the five expert reviews above into a single Go / No-Go recommendation for the bid team. Cite ONLY evidence already raised by the experts (do not read the document afresh). Structure: 1) Go / No-Go verdict, 2) Top 3 win factors, 3) Top 3 blockers, 4) Immediate next actions.\n\n${ANTI_HALLUCINATION}`;
              const result = streamText({
                model,
                system: chairSys,
                prompt: `Synthesise now.`,
              });
              for await (const delta of result.textStream) {
                send({ type: "expert_delta", expert: "chair", delta });
              }
              send({ type: "expert_end", expert: "chair" });
            } catch (err) {
              send({
                type: "expert_error",
                expert: "chair",
                message: err instanceof Error ? err.message : "Chair synthesis failed",
              });
            }
            send({ type: "panel_end" });
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "application/x-ndjson",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
