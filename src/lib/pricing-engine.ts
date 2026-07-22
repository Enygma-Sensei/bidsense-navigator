import type { Service } from "./services-catalog";

export interface BundleCalculation {
  normalTotal: number;
  floorTotal: number;
  aiCostTotal: number;
  marginPool: number;
  discountRate: number;
  discountAmount: number;
  finalPrice: number;
  savings: number;
  savingsPercent: number;
  subcontractorFloorIntact: boolean;
}

export function calculateBundlePrice(selected: Service[]): BundleCalculation {
  const normalTotal = selected.reduce((s, x) => s + x.price, 0);
  const floorTotal = selected.reduce((s, x) => s + x.floor, 0);
  const aiCostTotal = selected.reduce((s, x) => s + x.ai_cost, 0);
  const marginPool = Math.max(0, normalTotal - floorTotal - aiCostTotal);

  const count = selected.length;
  let discountRate = 0;
  if (count >= 8) discountRate = 0.25;
  else if (count >= 6) discountRate = 0.2;
  else if (count >= 4) discountRate = 0.15;
  else if (count >= 2) discountRate = 0.1;

  const discountAmount = marginPool * discountRate;
  const finalPrice = floorTotal + aiCostTotal + (marginPool - discountAmount);
  const savings = normalTotal - finalPrice;
  const savingsPercent = normalTotal > 0 ? (savings / normalTotal) * 100 : 0;

  return {
    normalTotal,
    floorTotal,
    aiCostTotal,
    marginPool,
    discountRate,
    discountAmount,
    finalPrice,
    savings,
    savingsPercent,
    subcontractorFloorIntact: true,
  };
}

export function gbp(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: n >= 100 ? 0 : 2,
  }).format(n);
}