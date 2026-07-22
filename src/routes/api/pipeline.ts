import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";

import { CHAT_MODEL, PERSONAS, STAGES, createLovableAiGatewayProvider, type Stage } from "../../lib/ai-gateway.server";

interface PipelineBody {
  brief?: string;
  bkr?: string;
}

export const Route = createFileRoute("/api/pipeline")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { brief = "", bkr = "" } = (await request.json()) as PipelineBody;
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response(JSON.stringify({ type: "error", message: "Missing LOVABLE_API_KEY" }) + "\n", {
            status: 500,
            headers: { "Content-Type": "application/x-ndjson" },
          });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway(CHAT_MODEL);

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const enc = new TextEncoder();
            const send = (obj: unknown) => controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));

            const outputs: Record<Stage, string> = { proposer: "", challenger: "", actuary: "", auditor: "" };

            const promptFor = (stage: Stage): string => {
              const base = `TENDER BRIEF:\n${brief}\n\nBKR CONTEXT:\n${bkr}\n`;
              if (stage === "proposer") return base + "\nProduce the initial bid draft now.";
              if (stage === "challenger") return base + `\nPROPOSER DRAFT TO REVIEW:\n${outputs.proposer}\n\nRun your grounding verification now.`;
              if (stage === "actuary") return base + `\nPROPOSER DRAFT:\n${outputs.proposer}\n\nCHALLENGER REPORT:\n${outputs.challenger}\n\nProduce your risk metrics now.`;
              return base + `\nCHALLENGER REPORT:\n${outputs.challenger}\n\nACTUARY REPORT:\n${outputs.actuary}\n\nCompile the final audit attestation now.`;
            };

            try {
              for (const stage of STAGES) {
                send({ type: "stage_start", stage });
                const result = streamText({ model, system: PERSONAS[stage], prompt: promptFor(stage) });
                for await (const delta of result.textStream) {
                  outputs[stage] += delta;
                  send({ type: "stage_delta", stage, delta });
                }
                send({ type: "stage_end", stage });
              }
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              send({ type: "error", message });
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
        });
      },
    },
  },
});