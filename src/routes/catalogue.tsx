import { createFileRoute } from "@tanstack/react-router";
import { Check, Plus, Lock } from "lucide-react";
import { useMemo, useState } from "react";

import { services, categories, type ServiceCategory } from "../lib/services-catalog";
import { useCart } from "../lib/cart-store";
import { gbp } from "../lib/pricing-engine";

export const Route = createFileRoute("/catalogue")({
  head: () => ({
    meta: [
      { title: "Service Catalogue — BidSense" },
      { name: "description", content: "30 BidSense services mapped to ISO clauses. Advisory, transactional AI bidding, high-stakes human & legal, and SaaS partner subscriptions." },
    ],
  }),
  component: Catalogue,
});

function Catalogue() {
  const [active, setActive] = useState<ServiceCategory | "All">("All");
  const filtered = useMemo(
    () => (active === "All" ? services : services.filter((s) => s.category === active)),
    [active],
  );
  const cart = useCart();

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto space-y-6">
      <header className="space-y-1">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Catalogue</div>
        <h1 className="text-3xl font-bold">Service Catalogue</h1>
        <p className="text-muted-foreground">Every service maps to a named ISO management-system clause. Gold pricing indicates a protected subcontractor floor — never discounted.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(["All", ...categories] as const).map((c) => (
          <button key={c} onClick={() => setActive(c)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${active === c ? "bg-gold text-gold-foreground border-gold" : "border-border text-muted-foreground hover:text-foreground"}`}>{c}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((s) => {
          const inCart = cart.ids.includes(s.id);
          return (
            <div key={s.id} className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.category}</div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{s.hil ? "Human-in-loop" : "AI-only"}</span>
              </div>
              <h3 className="font-semibold leading-snug">{s.name}</h3>
              <p className="text-sm text-muted-foreground flex-1">{s.desc}</p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3 text-gold" />
                <span>{s.iso_clause}</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {gbp(s.price)}
                    {s.period ? <span className="text-xs font-normal text-muted-foreground"> /{s.period}</span> : null}
                  </div>
                  {s.floor > 0 ? (
                    <div className="text-[11px] text-gold">Protected floor {gbp(s.floor)}</div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground">AI-only · no floor</div>
                  )}
                </div>
                <button onClick={() => cart.toggle(s.id)} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${inCart ? "bg-gold text-gold-foreground" : "border border-border hover:border-gold hover:text-gold"}`}>
                  {inCart ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {inCart ? "Added" : "Add"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}