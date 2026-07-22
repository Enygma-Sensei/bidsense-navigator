import { create } from "zustand";
import { persist } from "zustand/middleware";

// Roles that will eventually be enforced by real auth + RLS. For now this
// store powers UI-level gating so owner-only internal information is not
// rendered at all when the viewer is a client/PSL/reseller.
export type ViewerRole = "owner" | "reseller" | "psl" | "client";

export const roleLabels: Record<ViewerRole, string> = {
  owner: "Owner",
  reseller: "Reseller",
  psl: "PSL Partner",
  client: "Client",
};

interface ViewerRoleState {
  role: ViewerRole;
  setRole: (role: ViewerRole) => void;
}

export const useViewerRole = create<ViewerRoleState>()(
  persist(
    (set) => ({
      // Default to client so internal information is never the default view.
      role: "client",
      setRole: (role) => set({ role }),
    }),
    { name: "bidsense-viewer-role" },
  ),
);

export function canSeeOwnerFinancials(role: ViewerRole): boolean {
  return role === "owner";
}

export function canSeeSubcontractorFloor(role: ViewerRole): boolean {
  // Only the owner sees the subcontractor floor / cost breakdown; resellers
  // and PSLs see their own pricing surface, clients see only the final price.
  return role === "owner";
}