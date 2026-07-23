import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bot, Loader as Loader2, ShieldAlert, Scale, ScrollText, CircleCheck as CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { STAGES, STAGE_LABELS, type Stage } from "../lib/ai-gateway.server";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Adversarial Peer-Review Pipeline — BidSense" },
      { name: "description", content: "The BidSense anti-hallucination shield. Proposer → Challenger → Actuary → Auditor. Every AI bid passes the four-agent adversarial pipeline before submission." },
      { property: "og:title", content: "Adversarial Peer-Review Pipeline — BidSense" },
      { property: "og:description", content: "Proposer → Challenger → Actuary → Auditor. Every AI bid passes the four-agent adversarial pipeline before submission." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/pipeline" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/pipeline" }],
  }),
  component: PipelinePage,
});

const STAGE_ICONS: Record<Stage, typeof Bot> = {
  proposer: Bot,
  challenger: ShieldAlert,
  actuary: Scale,
  auditor: ScrollText,
};

interface StageState {
  status: "idle" | "running" | "done" | "error";
  text: string;
}

const emptyStages = (): Record<Stage, StageState> =>
  Object.fromEntries(STAGES.map((s) => [s, { status: "idle", text: "" }])) as Record<Stage, StageState>;

function PipelinePage() {
  const [brief, setBrief] = useState(
    "NHS Digital G-Cloud 14 Lot 2 — Data & Application Solutions. Client is a 12-person SME with ISO 27001 (2022) certification pending, Cyber Essentials Plus current, and a 6-month Azure migration case study for a mid-size NHS trust. Bid due in 14 days.",
  );
  const [bkr, setBkr] = useState(
    "BKR extract:\n- Cyber Essentials Plus cert valid until 2027-03-01.\n- ISO 27001 audit report (Stage 1) dated 2026-05-14, non-conformities: A.8.24 cryptography.\n- Case study: NHS Trust X migration, 6 months, delivered on-time, SC-cleared staff.\n- Team CVs: 3 SC-cleared, 2 DV-cleared engineers.",
  );
  const [stages, setStages] = useState<Record<Stage, StageState>>(emptyStages());
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    setStages(emptyStages());
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, bkr }),
      });
      if (!res.ok || !res.body) throw new Error(`Pipeline error ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const ev = JSON.parse(line) as { type: string; stage?: Stage; delta?: string; message?: string };
            if (ev.type === "stage_start" && ev.stage) {
              setStages((s) => ({ ...s, [ev.stage!]: { status: "running", text: "" } }));
            } else if (ev.type === "stage_delta" && ev.stage) {
              setStages((s) => ({ ...s, [ev.stage!]: { status: "running", text: s[ev.stage!].text + (ev.delta ?? "") } }));
            } else if (ev.type === "stage_end" && ev.stage) {
              setStages((s) => ({ ...s, [ev.stage!]: { status: "done", text: s[ev.stage!].text } }));
            } else if (ev.type === "error") {
              throw new Error(ev.message ?? "Unknown pipeline error");
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStages((s) => {
        const next = { ...s };
        for (const st of STAGES) if (next[st].status === "running") next[st] = { status: "error", text: msg };
        return next;
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto space-y-8">
      <header className="space-y-1">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Anti-Hallucination Shield</div>
        <h1 className="text-3xl font-bold">Adversarial Peer-Review Pipeline</h1>
        <p className="text-muted-foreground max-w-3xl text-sm">Every transactional AI document passes four agents in sequence. The Proposer drafts. The Challenger cross-examines every claim against your BKR. The Actuary scores financial and procedural risk. The Auditor signs or blocks the submission.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Tender Brief" value={brief} onChange={setBrief} disabled={running} />
        <Field label="BKR Context (evidence)" value={bkr} onChange={setBkr} disabled={running} />
      </div>

      <button onClick={run} disabled={running} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gold text-gold-foreground font-semibold text-sm disabled:opacity-60">
        {running ? (<><Loader2 className="h-4 w-4 animate-spin" /> Running peer review…</>) : (<><Bot className="h-4 w-4" /> Run four-agent pipeline</>)}
      </button>

      <div className="space-y-4">
        {STAGES.map((s) => {
          const st = stages[s];
          const Icon = STAGE_ICONS[s];
          return (
            <div key={s} className={`rounded-lg border p-5 bg-card ${st.status === "running" ? "border-gold" : "border-border"}`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-gold" />
                <div className="font-semibold text-sm">{STAGE_LABELS[s]}</div>
                <div className="ml-auto text-xs">
                  {st.status === "idle" && <span className="text-muted-foreground">Idle</span>}
                  {st.status === "running" && <span className="text-gold inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Streaming</span>}
                  {st.status === "done" && <span className="text-success inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Complete</span>}
                  {st.status === "error" && <span className="text-destructive">Error</span>}
                </div>
              </div>
              {st.text ? (
                <div className="prose prose-sm prose-invert max-w-none prose-headings:text-gold text-sm">
                  <ReactMarkdown>{st.text}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Waiting for previous stage…</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <textarea value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="w-full h-40 rounded-md border border-border bg-background text-foreground text-sm p-3 focus:outline-none focus:border-gold disabled:opacity-60" />
    </label>
  );
}