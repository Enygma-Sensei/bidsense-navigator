import { createFileRoute, notFound } from "@tanstack/react-router";

import { findPolicy, POLICIES } from "../lib/legal-copy";

export const Route = createFileRoute("/legal/$slug")({
  loader: ({ params }) => {
    const p = findPolicy(params.slug);
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    return {
      meta: [
        { title: `${loaderData.title} — BidSense` },
        { name: "description", content: loaderData.intro },
        { property: "og:title", content: `${loaderData.title} — BidSense` },
        { property: "og:description", content: loaderData.intro },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/legal/${loaderData.slug}` },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: `/legal/${loaderData.slug}` }],
    };
  },
  notFoundComponent: () => <div className="text-sm">Policy not found.</div>,
  errorComponent: ({ error }) => <div className="text-sm text-destructive">{error.message}</div>,
  component: PolicyPage,
});

function PolicyPage() {
  const policy = Route.useLoaderData();
  return (
    <article className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{policy.title}</h2>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
          Last reviewed {policy.lastReviewed}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{policy.intro}</p>
      <div className="space-y-4">
        {policy.sections.map((s: { heading: string; body: string }) => (
          <section key={s.heading}>
            <h3 className="text-sm font-semibold text-gold">{s.heading}</h3>
            <p className="text-sm mt-1 leading-relaxed whitespace-pre-line">{s.body}</p>
          </section>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground pt-4 border-t border-border">
        Available policies: {POLICIES.map((p) => p.title).join(" · ")}
      </div>
    </article>
  );
}