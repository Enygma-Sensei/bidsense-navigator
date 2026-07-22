import { createFileRoute } from "@tanstack/react-router";
import { Check, Plus, Lock, ChevronDown, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { services, categories, findService, type Service, type ServiceCategory } from "../lib/services-catalog";
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

  const suggestions = useMemo(() => {
    if (cart.ids.length === 0) return [] as Service[];
    const selected = new Set(cart.ids);
    const scored = new Map<string, number>();
    for (const id of cart.ids) {
      const svc = findService(id);
      if (!svc?.suggests) continue;
      for (const sid of svc.suggests) {
        if (selected.has(sid)) continue;
        scored.set(sid, (scored.get(sid) ?? 0) + 1);
      }
    }
    return [...scored.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id]) => findService(id))
      .filter((s): s is Service => Boolean(s));
  }, [cart.ids]);

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

      {suggestions.length > 0 && (
        <section className="rounded-lg border border-gold/40 bg-gold/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gold">
            <Sparkles className="h-4 w-4" /> Recommended alongside your selections
          </div>
          <p className="text-xs text-muted-foreground">Clients who pick what you've chosen usually add these to cover the same bid end-to-end.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => cart.add(s.id)}
                className="flex items-start justify-between gap-3 text-left rounded-md border border-border bg-card px-3 py-2 hover:border-gold transition-colors"
              >
                <div>
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.plain ?? s.desc}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold">{gbp(s.price)}{s.period ? <span className="text-[10px] font-normal text-muted-foreground">/{s.period}</span> : null}</div>
                  <div className="text-[10px] text-gold flex items-center gap-1 justify-end"><Plus className="h-3 w-3" /> Add</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((s) => {
          const inCart = cart.ids.includes(s.id);
          return <ServiceCard key={s.id} s={s} inCart={inCart} onToggle={() => cart.toggle(s.id)} />;
        })}
      </div>
    </div>
  );
}

function ServiceCard({ s, inCart, onToggle }: { s: Service; inCart: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.category}</div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{s.hil ? "Human-in-loop" : "AI-only"}</span>
      </div>
      <h3 className="font-semibold leading-snug">{s.name}</h3>
      <p className="text-sm text-muted-foreground flex-1">{s.plain ?? s.desc}</p>

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between text-[11px] text-muted-foreground hover:text-foreground border-t border-border pt-2"
        aria-expanded={open}
      >
        <span>{open ? "Hide details" : "Show example & technical detail"}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-2 text-xs">
          {s.example && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-gold mb-0.5">Example</div>
              <p className="text-muted-foreground">{s.example}</p>
            </div>
          )}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-gold mb-0.5">Technical detail</div>
            <p className="text-muted-foreground">{s.desc}</p>
          </div>
        </div>
      )}

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
        <button onClick={onToggle} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${inCart ? "bg-gold text-gold-foreground" : "border border-border hover:border-gold hover:text-gold"}`}>
          {inCart ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {inCart ? "Added" : "Add"}
        </button>
      </div>
    </div>
  );
}