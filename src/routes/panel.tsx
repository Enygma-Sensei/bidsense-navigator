import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Users, Upload, Loader as Loader2, CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, Gavel } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { parseAttachment } from "../lib/file-parser";
import { EXPERTS, EXPERT_LABELS, type Expert } from "./api/panel";
import { useCan } from "../lib/rbac";

type PanelKey = Expert | "chair";

const PANEL_KEYS: PanelKey[] = [...EXPERTS, "chair"];
const PANEL_LABELS: Record<PanelKey, string> = { ...EXPERT_LABELS, chair: "Panel Chair — Go/No-Go" };

interface ExpertState {
  status: "idle" | "running" | "done" | "error";
  text: string;
  error?: string;
}

function emptyState(): Record<PanelKey, ExpertState> {
  return Object.fromEntries(PANEL_KEYS.map((k) => [k, { status: "idle", text: "" }])) as Record<PanelKey, ExpertState>;
}

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Panel of Experts — Tender Document Review — BidSense" },
      {
        name: "description",
        content:
          "Upload a tender document and get five specialist AI reviewers plus a chair synthesis. Every claim must cite a verbatim quote from the document — no guesswork propagates.",
      },
      { property: "og:title", content: "Panel of Experts — Tender Document Review" },
      { property: "og:description", content: "Five specialist reviewers plus chair synthesis on your tender document, with mandatory citation." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/panel" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/panel" }],
  }),
  component: Panel,
});

function Panel() {
  const allowed = useCan("run.panel_of_experts");
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("tender-document.txt");
  const [state, setState] = useState<Record<PanelKey, ExpertState>>(emptyState());
  const [running, setRunning] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    setGlobalError(null);
    try {
      const parsed = await parseAttachment(f);
      const flattened =
        parsed.kind === "text"
          ? parsed.text
          : parsed.kind === "spreadsheet"
            ? (parsed.sheets ?? [])
                .map((s) => `# Sheet: ${s.name}\n${s.rows.map((r) => r.join("\t")).join("\n")}`)
                .join("\n\n")
            : parsed.kind === "markdown" || parsed.kind === "json"
              ? parsed.text
              : parsed.kind === "docx"
                ? parsed.text
                : "";
      if (!flattened) {
        setGlobalError("Could not extract text from that file. Try a .docx, .txt, .md, .csv, .xlsx or paste the text.");
        return;
      }
      setText(flattened);
      setFilename(f.name);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Failed to read file");
    }
  }

  async function run() {
    if (!text.trim() || running) return;
    setRunning(true);
    setState(emptyState());
    setGlobalError(null);
    try {
      const res = await fetch("/api/panel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ document: text, filename }),
      });
      if (!res.ok || !res.body) {
        if (res.status === 429) throw new Error("Rate limit hit — try again in a moment.");
        if (res.status === 402) throw new Error("AI credits exhausted. Top up the workspace to continue.");
        throw new Error(`Panel failed (${res.status}).`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const raw of lines) {
          if (!raw.trim()) continue;
          try {
            const evt = JSON.parse(raw) as { type: string; expert?: PanelKey; delta?: string; message?: string };
            const k = evt.expert;
            if (evt.type === "expert_start" && k) {
              setState((s) => ({ ...s, [k]: { status: "running", text: "" } }));
            } else if (evt.type === "expert_delta" && k) {
              setState((s) => ({ ...s, [k]: { status: "running", text: s[k].text + (evt.delta ?? "") } }));
            } else if (evt.type === "expert_end" && k) {
              setState((s) => ({ ...s, [k]: { status: "done", text: s[k].text } }));
            } else if (evt.type === "expert_error" && k) {
              setState((s) => ({ ...s, [k]: { status: "error", text: s[k].text, error: evt.message } }));
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Panel failed");
    } finally {
      setRunning(false);
    }
  }

  if (!allowed) {
    return (
      <div className="px-8 py-16 max-w-xl mx-auto text-center space-y-3">
        <AlertTriangle className="h-6 w-6 mx-auto text-warning" />
        <h1 className="text-xl font-semibold">Panel unavailable for your role</h1>
        <p className="text-sm text-muted-foreground">Ask your admin to grant the panel-of-experts permission.</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto space-y-6">
      <header className="space-y-1">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Anti-Hallucination Review</div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-gold" /> Panel of experts
        </h1>
        <p className="text-muted-foreground text-sm max-w-3xl">
          Upload the tender document and five specialist reviewers — Bid Strategist, Compliance Officer,
          Commercial Analyst, Risk Reviewer, Delivery Lead — read the same source and report back,
          each citing verbatim quotes. A Panel Chair then synthesises a Go / No-Go verdict.
          Any point without evidence is flagged as such — no guesswork propagates.
        </p>
      </header>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded border border-border hover:border-gold hover:text-gold"
          >
            <Upload className="h-3 w-3" /> Upload tender file
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".docx,.txt,.md,.csv,.xlsx,.xls,.json"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="text-xs text-muted-foreground">
            or paste the document content below. Current file: <strong>{filename}</strong> ({text.length.toLocaleString()} chars)
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste ITT / PQQ / RFP text here…"
          className="w-full h-40 rounded border border-border bg-background text-sm p-3 focus:outline-none focus:border-gold"
          disabled={running}
        />
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-muted-foreground max-w-xl">
            Documents over ~60,000 characters are clipped to the top of the file — evaluation criteria
            usually live in the first sections.
          </div>
          <button
            onClick={run}
            disabled={running || !text.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-gold text-gold-foreground font-semibold text-sm disabled:opacity-50"
          >
            {running ? (<><Loader2 className="h-4 w-4 animate-spin" /> Convening panel…</>) : (<><Gavel className="h-4 w-4" /> Convene panel</>)}
          </button>
        </div>
      </div>

      {globalError && (
        <div className="rounded border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      <div className="grid gap-4">
        {PANEL_KEYS.map((k) => {
          const st = state[k];
          const isChair = k === "chair";
          return (
            <div key={k} className={`rounded-lg border p-4 bg-card ${isChair ? "border-gold" : st.status === "running" ? "border-gold/50" : "border-border"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-sm flex items-center gap-2">
                  {isChair ? <Gavel className="h-4 w-4 text-gold" /> : <Users className="h-4 w-4 text-gold" />}
                  {PANEL_LABELS[k]}
                </div>
                <div className="text-xs">
                  {st.status === "idle" && <span className="text-muted-foreground">Waiting</span>}
                  {st.status === "running" && <span className="text-gold inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Streaming</span>}
                  {st.status === "done" && <span className="text-success inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Complete</span>}
                  {st.status === "error" && <span className="text-destructive">Error: {st.error}</span>}
                </div>
              </div>
              {st.text ? (
                <div className="prose prose-sm prose-invert max-w-none text-sm">
                  <ReactMarkdown>{st.text}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No output yet.</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}