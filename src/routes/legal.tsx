import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";

import { POLICIES } from "../lib/legal-copy";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal & Trust Centre — BidSense" },
      {
        name: "description",
        content:
          "Privacy Notice, Terms of Service, Data Processing Addendum, Service Level Agreement, and Security & Trust posture — everything a UK tender procurement team needs to onboard BidSense.",
      },
      { property: "og:title", content: "Legal & Trust Centre — BidSense" },
      { property: "og:description", content: "Privacy, DPA, SLA and Security posture for BidSense." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LegalLayout,
});

function LegalLayout() {
  return (
    <div className="px-8 py-10 max-w-5xl mx-auto space-y-6">
      <header className="space-y-1">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Trust Centre</div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-gold" /> Legal &amp; compliance policies
        </h1>
        <p className="text-muted-foreground text-sm max-w-3xl">
          BidSense operates under UK GDPR, the Data Protection Act 2018, PECR, HMRC MTD retention rules,
          and the NCSC Cloud Security Principles. Each policy below is drafted for a UK B2B SaaS posture
          and reviewed annually.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {POLICIES.map((p) => (
          <Link
            key={p.slug}
            to="/legal/$slug"
            params={{ slug: p.slug }}
            className="text-xs px-3 py-1.5 rounded border border-border hover:border-gold hover:text-gold data-[status=active]:bg-gold data-[status=active]:text-gold-foreground data-[status=active]:border-gold"
          >
            {p.title}
          </Link>
        ))}
      </nav>

      <div className="rounded-lg border border-border bg-card p-6">
        <Outlet />
      </div>
    </div>
  );
}