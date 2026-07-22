import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, Newspaper, ExternalLink, Radio } from "lucide-react";

import { useCompetitorNews } from "../lib/live-feeds";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "Tender Market & Competitor Radar — BidSense" },
      {
        name: "description",
        content:
          "Live UK tender market intelligence: Contracts Finder, Find a Tender, PPN updates and competitor movements. Refreshes automatically every 30 seconds.",
      },
      { property: "og:title", content: "Tender Market & Competitor Radar — BidSense" },
      { property: "og:description", content: "Live UK tender opportunities and competitor watch." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: News,
});

function News() {
  const { items, lastRefreshed, refresh } = useCompetitorNews();
  return (
    <div className="px-8 py-10 max-w-5xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Live Market Radar</div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-gold" /> Tender market &amp; competitor watch
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Aggregates UK public-sector opportunity feeds (Contracts Finder, Find a Tender),
            Cabinet Office / PPN announcements, and direct competitor movement. Auto-refreshes
            every 30 seconds; a scheduled crawler will replace the in-memory demo feed once Cloud is wired.
          </p>
        </div>
        <div className="text-right space-y-2">
          <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-gold">
            <Radio className="h-3 w-3 animate-pulse" /> Live
          </div>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-border hover:border-gold hover:text-gold"
          >
            <RefreshCw className="h-3 w-3" /> Refresh now
          </button>
          <div className="text-[10px] text-muted-foreground">
            Last update {new Date(lastRefreshed).toLocaleTimeString("en-GB")}
          </div>
        </div>
      </header>

      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.id} className="rounded-lg border border-border bg-card p-4 hover:border-gold/50 transition-colors">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="text-gold">{it.source}</span>
              <span>·</span>
              <time>{new Date(it.ts).toLocaleString("en-GB")}</time>
              {it.framework && <><span>·</span><span>{it.framework}</span></>}
              {it.competitor && <><span>·</span><span className="text-warning">{it.competitor}</span></>}
            </div>
            <div className="mt-1 font-semibold text-sm">{it.headline}</div>
            <p className="mt-1 text-sm text-muted-foreground">{it.summary}</p>
            {it.url && (
              <a
                href={it.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-flex items-center gap-1 text-xs text-gold hover:underline"
              >
                Source <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}