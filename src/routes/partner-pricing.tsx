import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ScrollText, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { services, findService } from "../lib/services-catalog";
import { gbp } from "../lib/pricing-engine";
import {
  PARTNER_MIN_MULTIPLIER,
  computePartnerPrice,
  usePartnerMarkup,
  usePricingAudit,
  type PartnerRole,
} from "../lib/partner-pricing";
import { useViewerRole } from "../lib/viewer-role";

export const Route = createFileRoute("/partner-pricing")({
  head: () => ({
    meta: [
      { title: "Partner Pricing & Audit — BidSense" },
      {
        name: "description",
        content:
          "Reseller and PSL partner pricing calculator with legally-binding minimum multiplier enforcement and owner-visible audit trail.",
      },
      { property: "og:title", content: "Partner Pricing & Audit — BidSense" },
      { property: "og:description", content: "Reseller and PSL pricing floor enforcement with owner audit trail." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnerPricing,
});

function PartnerPricing() {
  const role = useViewerRole((r) => r.role);
  const isOwner = role === "owner";
  const isPartner = role === "reseller" || role === "psl";
  const partnerRole: PartnerRole = role === "psl" ? "psl" : "reseller";
  const multiplier = usePartnerMarkup((s) => s.multiplier);
  const setMultiplier = usePartnerMarkup((s) => s.setMultiplier);
  const audit = usePricingAudit();
  const [note, setNote] = useState("");

  const rows = useMemo(
    () => services.map((s) => ({ s, calc: computePartnerPrice(s, multiplier) })),
    [multiplier],
  );

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto space-y-8">
      <header className="space-y-1">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Partner Pricing</div>
        <h1 className="text-3xl font-bold">Reseller &amp; PSL Pricing Floor</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Partners charge at least <strong>{PARTNER_MIN_MULTIPLIER}×</strong> the owner&#39;s combined direct cost
          (subcontractor floor + AI/infra) <em>and</em> a 10% premium above the owner&#39;s list. This is a
          contractual non-compete floor grounded in UK competition-law guidance on minimum resale pricing.
          You may price above the floor — never below.
        </p>
      </header>

      {isPartner && (
        <section className="rounded-lg border border-gold/40 bg-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-gold" /> Your markup multiplier
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={PARTNER_MIN_MULTIPLIER}
              max={5}
              step={0.05}
              value={multiplier}
              onChange={(e) => setMultiplier(parseFloat(e.target.value))}
              className="flex-1"
              aria-label="Partner markup multiplier"
            />
            <div className="w-24 text-right font-mono text-lg text-gold">
              {multiplier.toFixed(2)}×
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Minimum enforced: {PARTNER_MIN_MULTIPLIER.toFixed(2)}×. The slider clamps below this value.
          </p>
        </section>
      )}

      {!isPartner && !isOwner && (
        <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
          Switch to <strong>Reseller</strong>, <strong>PSL</strong>, or <strong>Owner</strong> in the sidebar to use this page.
        </div>
      )}

      {(isPartner || isOwner) && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Partner price sheet
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2">Service</th>
                  {isOwner && <th className="text-right px-4 py-2">Owner cost</th>}
                  <th className="text-right px-4 py-2">Owner list</th>
                  <th className="text-right px-4 py-2">Min allowed</th>
                  <th className="text-right px-4 py-2">Partner price</th>
                  <th className="text-right px-4 py-2">Effective ×</th>
                  <th className="text-right px-4 py-2">Status</th>
                  {isPartner && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ s, calc }) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-[10px] text-muted-foreground">{s.iso_clause}</div>
                    </td>
                    {isOwner && (
                      <td className="px-4 py-2 text-right font-mono text-xs text-muted-foreground">
                        {gbp(calc.ownerCost)}
                      </td>
                    )}
                    <td className="px-4 py-2 text-right font-mono text-xs">{gbp(calc.ownerList)}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs text-gold">{gbp(calc.minAllowed)}</td>
                    <td className="px-4 py-2 text-right font-mono font-semibold">{gbp(calc.partnerPrice)}</td>
                    <td className="px-4 py-2 text-right font-mono text-xs">
                      {calc.multiplierApplied.toFixed(2)}×
                    </td>
                    <td className="px-4 py-2 text-right">
                      {calc.compliant ? (
                        <span className="text-[10px] font-semibold text-gold">COMPLIANT</span>
                      ) : (
                        <span className="text-[10px] font-semibold text-destructive inline-flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> BREACH
                        </span>
                      )}
                    </td>
                    {isPartner && (
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() =>
                            audit.record({
                              actor: partnerRole,
                              actorName: partnerRole === "psl" ? "PSL Partner" : "Reseller",
                              serviceId: s.id,
                              serviceName: s.name,
                              ownerCost: calc.ownerCost,
                              ownerList: calc.ownerList,
                              minAllowed: calc.minAllowed,
                              partnerPrice: calc.partnerPrice,
                              multiplierApplied: calc.multiplierApplied,
                              compliant: calc.compliant,
                              note: note || undefined,
                            })
                          }
                          className="text-[11px] font-semibold px-2 py-1 rounded border border-border hover:border-gold hover:text-gold"
                        >
                          Record
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {isPartner && (
            <div className="flex items-center gap-2 text-xs">
              <label className="text-muted-foreground">Audit note:</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional context for the owner (e.g. framework, client, agreement ID)"
                className="flex-1 rounded border border-border bg-background px-2 py-1"
              />
            </div>
          )}
        </section>
      )}

      {isOwner && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground inline-flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-gold" /> Owner audit trail
            </h2>
            <button
              onClick={() => audit.clear()}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Clear log
            </button>
          </div>
          {audit.entries.length === 0 ? (
            <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground text-center">
              No partner pricing decisions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gold/40 bg-card">
              <table className="w-full text-xs">
                <thead className="bg-secondary/50 uppercase tracking-widest text-[10px] text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">Timestamp</th>
                    <th className="text-left px-3 py-2">Actor</th>
                    <th className="text-left px-3 py-2">Service</th>
                    <th className="text-right px-3 py-2">Partner price</th>
                    <th className="text-right px-3 py-2">Min allowed</th>
                    <th className="text-right px-3 py-2">Effective ×</th>
                    <th className="text-right px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {audit.entries.map((e) => {
                    const svc = findService(e.serviceId);
                    return (
                      <tr key={e.id}>
                        <td className="px-3 py-2 font-mono text-[10px]">{new Date(e.ts).toLocaleString("en-GB")}</td>
                        <td className="px-3 py-2">{e.actorName}</td>
                        <td className="px-3 py-2">{svc?.name ?? e.serviceName}</td>
                        <td className="px-3 py-2 text-right font-mono">{gbp(e.partnerPrice)}</td>
                        <td className="px-3 py-2 text-right font-mono">{gbp(e.minAllowed)}</td>
                        <td className="px-3 py-2 text-right font-mono">{e.multiplierApplied.toFixed(2)}×</td>
                        <td className="px-3 py-2 text-right">
                          {e.compliant ? (
                            <span className="text-[10px] font-semibold text-gold">OK</span>
                          ) : (
                            <span className="text-[10px] font-semibold text-destructive">BREACH</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{e.note ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}