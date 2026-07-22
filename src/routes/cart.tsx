import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Lightbulb, ShoppingCart, Trash2, Plus, ArrowRight } from "lucide-react";
import { useMemo } from "react";

import { services, findService } from "../lib/services-catalog";
import { useCart } from "../lib/cart-store";
import { calculateBundlePrice, gbp } from "../lib/pricing-engine";
import { evaluateCartRules } from "../lib/rules-engine";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "BYOB Cart — BidSense" },
      { name: "description", content: "Build-your-own-bundle cart. Subcontractor-floor-protected pricing with a 5-tier bundle discount ladder and reactive warning/recommendation banners." },
    ],
  }),
  component: Cart,
});

function Cart() {
  const cart = useCart();
  const selected = useMemo(
    () => cart.ids.map((id) => findService(id)).filter((s): s is (typeof services)[number] => Boolean(s)),
    [cart.ids],
  );
  const calc = calculateBundlePrice(selected);
  const alerts = evaluateCartRules(cart.ids);

  if (selected.length === 0) {
    return (
      <div className="px-8 py-16 max-w-3xl mx-auto text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-6">
          <ShoppingCart className="h-8 w-8 text-gold" />
        </div>
        <h1 className="text-2xl font-bold">Your bundle is empty</h1>
        <p className="text-muted-foreground mt-2">Add services from the catalogue to see floor-protected bundle pricing, the discount ladder, and live compliance guardrails.</p>
        <Link to="/catalogue" className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gold text-gold-foreground font-semibold text-sm">
          Browse catalogue <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto grid lg:grid-cols-[1fr_360px] gap-8">
      <div className="space-y-6 min-w-0">
        <header className="space-y-1">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Build-Your-Own-Bundle</div>
          <h1 className="text-3xl font-bold">BYOB Cart</h1>
          <p className="text-muted-foreground text-sm">The subcontractor floor is added, never discounted. Bundle discounts apply only to BidSense's AI-margin pool.</p>
        </header>

        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className={`rounded-lg border p-4 flex gap-3 ${a.kind === "warning" ? "border-warning/40 bg-warning/10" : "border-gold/40 bg-gold/10"}`}>
                {a.kind === "warning" ? <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" /> : <Lightbulb className="h-5 w-5 text-gold shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{a.title}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{a.message}</div>
                </div>
                {a.suggestId && !cart.ids.includes(a.suggestId) && (
                  <button onClick={() => cart.add(a.suggestId!)} className="text-xs font-semibold inline-flex items-center gap-1 px-2 py-1 rounded bg-gold text-gold-foreground self-start">
                    <Plus className="h-3 w-3" /> Add
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {selected.map((s) => (
            <div key={s.id} className="p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm leading-snug">{s.name}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{s.iso_clause}</div>
                <div className="mt-2 flex gap-4 text-xs flex-wrap">
                  <span>List {gbp(s.price)}</span>
                  <span className="text-gold">Floor {gbp(s.floor)}</span>
                  <span className="text-muted-foreground">AI {gbp(s.ai_cost)}</span>
                </div>
              </div>
              <button onClick={() => cart.remove(s.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <aside className="lg:sticky lg:top-6 self-start rounded-lg border border-gold/40 bg-card p-6 space-y-4">
        <div className="text-xs uppercase tracking-widest text-gold">Bundle Summary</div>
        <Row label="Normal total" value={gbp(calc.normalTotal)} />
        <Row label="Protected floor" value={gbp(calc.floorTotal)} gold />
        <Row label="AI cost" value={gbp(calc.aiCostTotal)} />
        <Row label="Margin pool" value={gbp(calc.marginPool)} />
        <Row label={`Bundle discount (${(calc.discountRate * 100).toFixed(0)}%)`} value={`− ${gbp(calc.discountAmount)}`} />
        <div className="pt-3 border-t border-border">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Final price</div>
          <div className="text-3xl font-bold text-gold mt-1">{gbp(calc.finalPrice)}</div>
          <div className="text-xs text-muted-foreground mt-1">Client saves {gbp(calc.savings)} ({calc.savingsPercent.toFixed(1)}%)</div>
        </div>
        <div className="text-[11px] text-gold border border-gold/30 rounded p-2 bg-gold/5">✓ Subcontractor floor intact. Discount applied only to margin pool.</div>
        <button onClick={() => cart.clear()} className="w-full text-xs text-muted-foreground hover:text-destructive">Clear cart</button>
      </aside>
    </div>
  );
}

function Row({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={gold ? "text-gold font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}