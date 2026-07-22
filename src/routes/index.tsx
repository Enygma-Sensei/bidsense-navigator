import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Bot, Coins, ScrollText } from "lucide-react";

import { services } from "../lib/services-catalog";
import { gbp } from "../lib/pricing-engine";
import { simulate, presets } from "../lib/simulator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BidSense Dashboard — Compliance-First Tender Command" },
      {
        name: "description",
        content:
          "Command centre for BidSense: adversarial peer-reviewed AI bidding, subcontractor-floor-protected pricing, and ISO-aligned compliance for UK public-sector SMEs.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const base = simulate(presets.Base);
  const svcCount = services.length;
  const humanInLoop = services.filter((s) => s.hil).length;

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto space-y-8">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">
          Compliance HUD // v1
        </div>
        <h1 className="text-4xl font-bold tracking-tight">BidSense Command Centre</h1>
        <p className="text-muted-foreground max-w-2xl">
          UK public-sector tender intelligence for SMEs and PSL partners. Every
          generative output passes the four-agent adversarial peer-review panel
          before it leaves the platform.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="Services in catalogue" value={svcCount.toString()} accent />
        <Stat label="Human-in-the-loop lines" value={humanInLoop.toString()} />
        <Stat label="Base EBITDA (Base preset)" value={gbp(base.ebitda)} accent />
        <Stat label="ISO standards enforced" value="10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NavCard to="/catalogue" icon={ScrollText} title="Service Catalogue" body="30 services mapped to specific ISO clauses. Add to your bundle from any card." />
        <NavCard to="/cart" icon={Coins} title="BYOB Shopping Cart" body="Subcontractor-floor-protected bundle pricing with a 5-tier discount ladder." />
        <NavCard to="/simulator" icon={ShieldCheck} title="Operational Profit Simulator" body="Model EBITDA against SMEs, C2 partners, enterprise transformations and accelerators." />
        <NavCard to="/pipeline" icon={Bot} title="Adversarial Peer-Review Pipeline" body="Proposer → Challenger → Actuary → Auditor. Streamed live via Lovable AI." />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-2 text-2xl font-bold ${accent ? "text-gold" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function NavCard({ to, icon: Icon, title, body }: { to: string; icon: typeof ShieldCheck; title: string; body: string }) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Link to={to as any} className="group rounded-lg border border-border bg-card p-6 hover:border-gold transition-colors block">
      <div className="flex items-start justify-between">
        <Icon className="h-6 w-6 text-gold" />
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-1 transition-all" />
      </div>
      <div className="mt-4 text-lg font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </Link>
  );
}
