import { create } from "zustand";
import { persist } from "zustand/middleware";

// White-label branding a reseller controls for their own tenant view.
// Persisted client-side today; when Cloud is wired this store's setters
// will call a server function that writes to a per-tenant `reseller_brand`
// row so branding follows the reseller across devices and their own
// clients see it too.
export interface ResellerBrand {
  brandName: string;
  tagline: string;
  logoDataUrl: string | null; // inline data URL uploaded by the reseller
  primaryHex: string;         // hex, e.g. "#c9a24a"
  supportEmail: string;
  hideBidSenseWordmark: boolean;
}

interface ResellerBrandState extends ResellerBrand {
  set: (patch: Partial<ResellerBrand>) => void;
  reset: () => void;
}

const DEFAULT: ResellerBrand = {
  brandName: "",
  tagline: "",
  logoDataUrl: null,
  primaryHex: "#c9a24a",
  supportEmail: "",
  hideBidSenseWordmark: false,
};

export const useResellerBrand = create<ResellerBrandState>()(
  persist(
    (set) => ({
      ...DEFAULT,
      set: (patch) => set(patch),
      reset: () => set(DEFAULT),
    }),
    { name: "bidsense-reseller-brand" },
  ),
);