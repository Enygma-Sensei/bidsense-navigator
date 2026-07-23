import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent, useRef, useEffect } from "react";
import { Bot, Send, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { useViewerRole } from "../lib/viewer-role";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Service Concierge Chatbot — BidSense" },
      {
        name: "description",
        content:
          "Ask BidSense's concierge which services fit your tender situation. Grounded in the live service catalogue with confidentiality guardrails that never leak internal costs.",
      },
      { property: "og:title", content: "Service Concierge Chatbot — BidSense" },
      { property: "og:description", content: "AI concierge that recommends BidSense services with strict confidentiality guardrails." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/chat" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/chat" }],
  }),
  component: Chat,
});

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function Chat() {
  const role = useViewerRole((s) => s.role);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, messages: next }),
      });
      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => "");
        if (res.status === 429) throw new Error("Rate limit hit — try again in a moment.");
        if (res.status === 402) throw new Error("AI credits exhausted. Top up the workspace to continue.");
        throw new Error(msg || `Chat failed (${res.status}).`);
      }
      // The UI-message stream from the AI SDK is a series of JSON events on
      // SSE lines. For a minimal render we accumulate assistant text deltas.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistant = "";
      setMessages([...next, { role: "assistant", content: "" }]);
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const raw of lines) {
          const line = raw.startsWith("data:") ? raw.slice(5).trim() : raw.trim();
          if (!line) continue;
          try {
            const evt = JSON.parse(line);
            const delta =
              typeof evt === "string"
                ? evt
                : evt?.type === "text-delta" && typeof evt.delta === "string"
                  ? evt.delta
                  : typeof evt?.textDelta === "string"
                    ? evt.textDelta
                    : "";
            if (delta) {
              assistant += delta;
              setMessages([...next, { role: "assistant", content: assistant }]);
            }
          } catch {
            // Non-JSON keep-alive / event line — ignore.
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-8 py-10 max-w-4xl mx-auto flex flex-col h-[calc(100vh-3rem)]">
      <header className="space-y-1 mb-4">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Service Concierge</div>
        <h1 className="text-3xl font-bold">Which BidSense services do you need?</h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Grounded in the live service catalogue. The concierge respects your role — internal
          costs, subcontractor floor, AI margin and displacement are never disclosed to clients,
          PSLs, or resellers.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-card p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-10">
            Try: <em>&ldquo;I&#39;m bidding for an NHS facilities contract worth £2m, what should I buy first?&rdquo;</em>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className="flex gap-3">
            <div
              className={`h-7 w-7 shrink-0 rounded grid place-items-center ${
                m.role === "user" ? "bg-secondary text-foreground" : "bg-gold text-gold-foreground"
              }`}
            >
              {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0 prose prose-sm prose-invert max-w-none text-sm">
              {m.role === "assistant" ? (
                <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
              ) : (
                <div className="whitespace-pre-wrap">{m.content}</div>
              )}
            </div>
          </div>
        ))}
        {error && <div className="text-sm text-destructive border border-destructive/40 rounded p-2">{error}</div>}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about services, ISO fit, bundle ideas…"
          className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-gold text-gold-foreground font-semibold text-sm disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> Send
        </button>
      </form>
      <div className="text-[10px] text-muted-foreground mt-2">
        Viewing as <strong>{role}</strong>. Change role in the sidebar to test the confidentiality guardrails.
      </div>
    </div>
  );
}