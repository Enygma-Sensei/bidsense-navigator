import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ShieldCheck, Scale } from "lucide-react";

import { isoStandards, legalRefs } from "../lib/iso-standards";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance & ISO HUD — BidSense" },
      { name: "description", content: "The ten ISO management-system standards enforced by BidSense's Integrated Management System, plus GDPR Art 28(2), SI 2018/480, UCTA 1977, and Procurement Act 2023." },
    ],
  }),
  component: Compliance,
});

function Compliance() {
  return (
    <div className="px-8 py-10 max-w-7xl mx-auto space-y-10">
      <header className="space-y-1">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Integrated Management System</div>
        <h1 className="text-3xl font-bold">Compliance & ISO HUD</h1>
        <p className="text-muted-foreground max-w-2xl">BidSense operates a single IMS aligned to the ten ISO management-system standards. Every generative output is attested by the ISO Lead Auditor before it leaves the platform.</p>
      </header>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gold">
          <ShieldCheck className="h-4 w-4" /> ISO Management Standards
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {isoStandards.map((s) => (
            <div key={s.code} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-gold">{s.code}</span>
                <span className="text-sm font-semibold">{s.title}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{s.focus}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gold">
          <Scale className="h-4 w-4" /> Legal Information Center
        </div>
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {legalRefs.map((l) => (
            <LegalItem key={l.title} title={l.title} body={l.body} />
          ))}
        </div>
      </section>
    </div>
  );
}

function LegalItem({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="font-semibold text-sm">{title}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 text-sm text-muted-foreground">{body}</div>}
    </div>
  );
}