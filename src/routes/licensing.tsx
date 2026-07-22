import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Users, Clock, ShieldAlert } from "lucide-react";

import { useViewerRole } from "../lib/viewer-role";

export const Route = createFileRoute("/licensing")({
  head: () => ({
    meta: [
      { title: "Licensing & Seats — BidSense" },
      {
        name: "description",
        content:
          "Seat allocation, expiry reminders and free-trial windows for BidSense tenants. Owners see every tenant; resellers and PSLs see only their own.",
      },
      { property: "og:title", content: "Licensing & Seats — BidSense" },
      { property: "og:description", content: "Seat limits, expiry reminders and trial periods for BidSense tenants." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Licensing,
});

interface Tenant {
  id: string;
  name: string;
  plan: "Trial" | "Growth" | "Scale" | "Enterprise";
  seats: { used: number; limit: number };
  renewsOn: string; // ISO
  trialEndsOn?: string;
  owner: "owner" | "reseller" | "psl";
}

const DEMO_TENANTS: Tenant[] = [
  { id: "t-001", name: "BidSense Direct (owner)", plan: "Enterprise", seats: { used: 6, limit: 25 }, renewsOn: iso(365), owner: "owner" },
  { id: "t-002", name: "Northgate Bid Advisory", plan: "Growth", seats: { used: 4, limit: 5 }, renewsOn: iso(42), owner: "reseller" },
  { id: "t-003", name: "Merseyside Compliance PSL", plan: "Scale", seats: { used: 9, limit: 10 }, renewsOn: iso(11), owner: "psl" },
  { id: "t-004", name: "Cardiff SME Trial", plan: "Trial", seats: { used: 2, limit: 3 }, renewsOn: iso(90), trialEndsOn: iso(9), owner: "reseller" },
  { id: "t-005", name: "London SocialCare Group", plan: "Scale", seats: { used: 10, limit: 10 }, renewsOn: iso(-3), owner: "reseller" },
];

function iso(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86400e3).toISOString();
}
function daysUntil(s: string): number {
  return Math.ceil((new Date(s).getTime() - Date.now()) / 86400e3);
}

function Licensing() {
  const role = useViewerRole((r) => r.role);
  const [tenants, setTenants] = useState<Tenant[]>(DEMO_TENANTS);

  const visible = role === "owner" ? tenants : tenants.filter((t) => t.owner === role);

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto space-y-6">
      <header className="space-y-1">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Tenant Licensing</div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <KeyRound className="h-6 w-6 text-gold" /> Seats, expiry &amp; trials
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Every reseller and PSL tenant is capped by seat count and a renewal date. Trials expire on a fixed
          window commensurate with SaaS norms (14 days by default). Owners see the whole estate; partners
          see only their own tenants.
        </p>
      </header>

      <div className="grid gap-3">
        {visible.map((t) => {
          const dLeft = daysUntil(t.renewsOn);
          const trialLeft = t.trialEndsOn ? daysUntil(t.trialEndsOn) : undefined;
          const seatPct = Math.round((t.seats.used / t.seats.limit) * 100);
          const overRenewal = dLeft < 0;
          const nearRenewal = dLeft >= 0 && dLeft <= 14;
          const trialExpiringSoon = trialLeft !== undefined && trialLeft <= 7;
          const seatFull = t.seats.used >= t.seats.limit;
          return (
            <div key={t.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {t.plan} · owned by {t.owner}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className={overRenewal ? "text-destructive" : nearRenewal ? "text-warning" : "text-muted-foreground"}>
                    <Clock className="inline h-3 w-3 mr-1" />
                    {overRenewal
                      ? `Renewal overdue by ${Math.abs(dLeft)}d`
                      : `Renews in ${dLeft}d`}
                  </div>
                  {trialLeft !== undefined && (
                    <div className={trialLeft <= 3 ? "text-destructive" : trialLeft <= 7 ? "text-warning" : "text-muted-foreground"}>
                      Trial ends in {trialLeft}d
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> Seats</span>
                  <span>{t.seats.used} / {t.seats.limit} ({seatPct}%)</span>
                </div>
                <div className="mt-1 h-2 rounded bg-secondary overflow-hidden">
                  <div
                    className={`h-full ${seatFull ? "bg-destructive" : seatPct >= 80 ? "bg-warning" : "bg-gold"}`}
                    style={{ width: `${Math.min(100, seatPct)}%` }}
                  />
                </div>
                {(seatFull || nearRenewal || trialExpiringSoon || overRenewal) && (
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                    {seatFull && <Badge tone="destructive">Seat limit reached — new invites blocked</Badge>}
                    {overRenewal && <Badge tone="destructive">Renewal overdue — hard-lock in 7d</Badge>}
                    {!overRenewal && nearRenewal && <Badge tone="warning">Renewal reminder emailed</Badge>}
                    {trialExpiringSoon && <Badge tone="warning">Trial expiring — convert to paid</Badge>}
                  </div>
                )}
                {role === "owner" && (
                  <div className="mt-3 flex gap-2 text-xs">
                    <button
                      onClick={() =>
                        setTenants((prev) =>
                          prev.map((x) => (x.id === t.id ? { ...x, seats: { ...x.seats, limit: x.seats.limit + 5 } } : x)),
                        )
                      }
                      className="px-2 py-1 rounded border border-border hover:border-gold hover:text-gold"
                    >
                      +5 seats
                    </button>
                    <button
                      onClick={() =>
                        setTenants((prev) =>
                          prev.map((x) => (x.id === t.id ? { ...x, renewsOn: iso(365) } : x)),
                        )
                      }
                      className="px-2 py-1 rounded border border-border hover:border-gold hover:text-gold"
                    >
                      Renew 12 months
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground text-center">
            <ShieldAlert className="h-4 w-4 inline mr-1" /> No tenants visible for role &ldquo;{role}&rdquo;.
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ tone, children }: { tone: "warning" | "destructive"; children: React.ReactNode }) {
  const cls =
    tone === "destructive"
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : "border-warning/40 bg-warning/10 text-warning";
  return <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 ${cls}`}>{children}</span>;
}