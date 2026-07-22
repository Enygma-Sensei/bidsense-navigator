import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";

import {
  createLovableAiGatewayProvider,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "../../lib/ai-gateway.server";
import { services } from "../../lib/services-catalog";

type Role = "owner" | "reseller" | "psl" | "client";

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

// Guardrail: strip every internal field before the model ever sees the
// catalog. Owners get full visibility; everyone else sees only what a
// buyer would legitimately see on a public price sheet. This is the
// confidentiality contract — the model cannot leak what it never received.
function catalogForRole(role: Role) {
  if (role === "owner") {
    return services.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      price: s.price,
      floor: s.floor,
      ai_cost: s.ai_cost,
      manual_cost: s.manual_cost,
      displacement: s.displacement,
      iso_clause: s.iso_clause,
      desc: s.desc,
      plain: s.plain,
      example: s.example,
      hil: s.hil,
      suggests: s.suggests,
    }));
  }
  return services.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    price: s.price,
    iso_clause: s.iso_clause,
    plain: s.plain ?? s.desc,
    example: s.example,
    suggests: s.suggests,
  }));
}

function systemPrompt(role: Role): string {
  const base = `You are BidSense's service-selection concierge. Help the user choose the right BidSense services for their tender situation. Always ground recommendations in the SERVICE_CATALOG JSON below. When you recommend a service, cite its id and price. Never invent services, prices, or ISO clauses that are not in the catalog. Keep answers concise and plain-English. If the user's question is unrelated to BidSense services, tender compliance, or bid strategy, briefly say so and steer them back.`;
  const confidentiality =
    role === "owner"
      ? `You are speaking to the platform OWNER. You MAY discuss internal figures: subcontractor floor, AI cost, manual comparator, displacement, and margin pool.`
      : `You are speaking to a ${role.toUpperCase()}. You MUST NOT disclose or reason about: subcontractor floor prices, AI/infra costs, manual-labour comparator costs, displacement ratios, margin pool, or any internal cost breakdown. If asked, respond: "That's internal BidSense information I can't share. I can walk you through the client-facing price and value instead." Never speculate about the owner's economics.`;
  return `${base}\n\n${confidentiality}`;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        let payload: { messages?: IncomingMessage[]; role?: Role } = {};
        try {
          payload = (await request.json()) as typeof payload;
        } catch {
          return new Response("Invalid JSON body", { status: 400 });
        }

        const role: Role = (["owner", "reseller", "psl", "client"] as const).includes(
          payload.role as Role,
        )
          ? (payload.role as Role)
          : "client";

        const history = Array.isArray(payload.messages) ? payload.messages : [];
        const cleaned = history
          .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
          .slice(-20);

        const initialRunId = getLovableAiGatewayRunId(request);
        const gateway = createLovableAiGatewayProvider(key, initialRunId);

        const catalog = catalogForRole(role);
        const sys = `${systemPrompt(role)}\n\nSERVICE_CATALOG:\n${JSON.stringify(catalog)}`;

        try {
          const result = streamText({
            model: gateway("google/gemini-3.6-flash"),
            system: sys,
            messages: cleaned.map((m) => ({ role: m.role, content: m.content })),
          });

          const response = result.toUIMessageStreamResponse();
          // Attach any cache header and forwarded gateway ids after stream creation
          response.headers.set("Cache-Control", "no-store");
          return withLovableAiGatewayRunIdHeader(response, gateway);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Chat failed";
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});