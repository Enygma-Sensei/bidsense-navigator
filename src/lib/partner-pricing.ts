import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Service } from "./services-catalog";

// The minimum multiplier a reseller or PSL may charge above the *owner's
// direct combined cost floor* (subcontractor floor + AI/infra cost). This
// is the anti-undercutting floor that every partner agreement is bound
// to under BidSense's non-compete / minimum-pricing clause and is
// grounded in UK competition-law guidance on RPM: a *minimum* resale
// price expressed as a multiplier of the supplier's cost is enforceable
// when it prevents ruinous undercutting and preserves the supplier's
// direct channel. We do NOT set a maximum — partners are free to price
// above the floor.
export const PARTNER_MIN_MULTIPLIER = 2;

// Absolute additional buffer, on top of the multiplier, expressed as a
// per-transaction percentage of the owner's list price. This ensures a
// meaningful cash-margin gap versus the owner's direct sale even on
// very-low-cost AI-only services where 2× a tiny AI cost would still
// undercut the owner's list.
export const PARTNER_MIN_PREMIUM_OVER_LIST = 0.1; // partner floor >= owner list * 1.10

export type PartnerRole = "reseller" | "psl";

export interface PartnerPriceBreakdown {
  ownerCost: number;      // floor + ai_cost — the owner's direct cost
  ownerList: number;      // the owner's public list price
  minAllowed: number;     // enforced floor for this partner
  partnerPrice: number;   // what the partner ends up charging the client
  multiplierApplied: number;
  compliant: boolean;
  breachReason?: string;
}

export function partnerFloor(s: Service): number {
  const costFloor = (s.floor + s.ai_cost) * PARTNER_MIN_MULTIPLIER;
  const premiumFloor = s.price * (1 + PARTNER_MIN_PREMIUM_OVER_LIST);
  return Math.max(costFloor, premiumFloor);
}

export function computePartnerPrice(
  s: Service,
  multiplier: number,
): PartnerPriceBreakdown {
  const ownerCost = s.floor + s.ai_cost;
  const minAllowed = partnerFloor(s);
  const desired = Math.max(ownerCost, ownerCost * multiplier);
  const partnerPrice = Math.max(desired, minAllowed);
  const compliant = partnerPrice >= minAllowed - 0.001;
  return {
    ownerCost,
    ownerList: s.price,
    minAllowed,
    partnerPrice,
    multiplierApplied: ownerCost > 0 ? partnerPrice / ownerCost : 0,
    compliant,
    breachReason: compliant
      ? undefined
      : `Partner price ${partnerPrice.toFixed(2)} is below the enforced floor of ${minAllowed.toFixed(2)}.`,
  };
}

// ---------- Partner markup preference (per-partner, client-side) ----------

interface PartnerMarkupState {
  multiplier: number; // >= PARTNER_MIN_MULTIPLIER
  setMultiplier: (m: number) => void;
}

export const usePartnerMarkup = create<PartnerMarkupState>()(
  persist(
    (set) => ({
      multiplier: PARTNER_MIN_MULTIPLIER,
      setMultiplier: (m) =>
        set({ multiplier: Math.max(PARTNER_MIN_MULTIPLIER, m) }),
    }),
    { name: "bidsense-partner-markup" },
  ),
);

// ---------- Owner-side audit trail of partner pricing decisions ----------

export interface PricingAuditEntry {
  id: string;
  ts: string;             // ISO 8601
  actor: PartnerRole;
  actorName: string;
  serviceId: string;
  serviceName: string;
  ownerCost: number;
  ownerList: number;
  minAllowed: number;
  partnerPrice: number;
  multiplierApplied: number;
  compliant: boolean;
  note?: string;
}

interface PricingAuditState {
  entries: PricingAuditEntry[];
  record: (e: Omit<PricingAuditEntry, "id" | "ts">) => void;
  clear: () => void;
}

export const usePricingAudit = create<PricingAuditState>()(
  persist(
    (set) => ({
      entries: [],
      record: (e) =>
        set((s) => ({
          entries: [
            {
              ...e,
              id: crypto.randomUUID(),
              ts: new Date().toISOString(),
            },
            ...s.entries,
          ].slice(0, 500),
        })),
      clear: () => set({ entries: [] }),
    }),
    { name: "bidsense-pricing-audit" },
  ),
);