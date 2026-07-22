// Central role → permission matrix. Every internal surface consults this
// module instead of hard-coding `role === "owner"` checks. When Cloud auth
// lands, replace `useViewerRole` with the real session and this matrix stays
// authoritative. Nothing internal is visible to `client` by default —
// permissions are additive, never inherited.

import { useViewerRole, type ViewerRole } from "./viewer-role";

export type Permission =
  // Financial internals
  | "view.subcontractor_floor"
  | "view.ai_infra_cost"
  | "view.margin_pool"
  | "view.manual_comparator"
  | "view.displacement_ratio"
  | "view.owner_take"
  | "view.vat_ledger"
  | "view.migration_bundle"
  // Partner surfaces
  | "view.partner_markup"
  | "edit.partner_markup"
  | "view.partner_audit_trail"
  | "view.branding_settings"
  | "edit.branding_settings"
  // Tenant / licensing
  | "view.all_tenants"
  | "view.own_tenants"
  | "edit.tenant_seats"
  // Operational
  | "view.internal_prompts"
  | "view.chat_internal_costs"
  | "run.panel_of_experts"
  | "run.adversarial_pipeline"
  // Content
  | "view.client_price"
  | "view.service_catalog";

const MATRIX: Record<ViewerRole, ReadonlySet<Permission>> = {
  owner: new Set<Permission>([
    "view.subcontractor_floor",
    "view.ai_infra_cost",
    "view.margin_pool",
    "view.manual_comparator",
    "view.displacement_ratio",
    "view.owner_take",
    "view.vat_ledger",
    "view.migration_bundle",
    "view.partner_markup",
    "view.partner_audit_trail",
    "view.branding_settings",
    "edit.branding_settings",
    "view.all_tenants",
    "edit.tenant_seats",
    "view.internal_prompts",
    "view.chat_internal_costs",
    "run.panel_of_experts",
    "run.adversarial_pipeline",
    "view.client_price",
    "view.service_catalog",
  ]),
  reseller: new Set<Permission>([
    "view.partner_markup",
    "edit.partner_markup",
    "view.branding_settings",
    "edit.branding_settings",
    "view.own_tenants",
    "run.panel_of_experts",
    "run.adversarial_pipeline",
    "view.client_price",
    "view.service_catalog",
  ]),
  psl: new Set<Permission>([
    "view.partner_markup",
    "edit.partner_markup",
    "view.own_tenants",
    "run.panel_of_experts",
    "run.adversarial_pipeline",
    "view.client_price",
    "view.service_catalog",
  ]),
  client: new Set<Permission>([
    "run.panel_of_experts",
    "run.adversarial_pipeline",
    "view.client_price",
    "view.service_catalog",
  ]),
};

// Anything a client MUST NOT see, ever — kept explicit so a future refactor
// cannot silently regress. This is the "strict protocol" the user asked for.
export const CLIENT_FORBIDDEN: readonly Permission[] = [
  "view.subcontractor_floor",
  "view.ai_infra_cost",
  "view.margin_pool",
  "view.manual_comparator",
  "view.displacement_ratio",
  "view.owner_take",
  "view.vat_ledger",
  "view.migration_bundle",
  "view.partner_markup",
  "view.partner_audit_trail",
  "view.internal_prompts",
  "view.chat_internal_costs",
  "view.all_tenants",
  "view.own_tenants",
  "edit.partner_markup",
  "edit.branding_settings",
  "edit.tenant_seats",
];

export function can(role: ViewerRole, permission: Permission): boolean {
  return MATRIX[role].has(permission);
}

export function permissionsFor(role: ViewerRole): Permission[] {
  return [...MATRIX[role]].sort();
}

export function useCan(permission: Permission): boolean {
  const role = useViewerRole((s) => s.role);
  return can(role, permission);
}

export const ALL_PERMISSIONS: readonly Permission[] = [
  "view.subcontractor_floor",
  "view.ai_infra_cost",
  "view.margin_pool",
  "view.manual_comparator",
  "view.displacement_ratio",
  "view.owner_take",
  "view.vat_ledger",
  "view.migration_bundle",
  "view.partner_markup",
  "edit.partner_markup",
  "view.partner_audit_trail",
  "view.branding_settings",
  "edit.branding_settings",
  "view.all_tenants",
  "view.own_tenants",
  "edit.tenant_seats",
  "view.internal_prompts",
  "view.chat_internal_costs",
  "run.panel_of_experts",
  "run.adversarial_pipeline",
  "view.client_price",
  "view.service_catalog",
] as const;

export const PERMISSION_LABELS: Record<Permission, string> = {
  "view.subcontractor_floor": "See subcontractor floor prices",
  "view.ai_infra_cost": "See AI / infrastructure cost per service",
  "view.margin_pool": "See platform margin pool",
  "view.manual_comparator": "See manual-labour comparator cost",
  "view.displacement_ratio": "See AI displacement ratio",
  "view.owner_take": "See owner take per service",
  "view.vat_ledger": "See VAT / financial ledger",
  "view.migration_bundle": "Download migration bundle",
  "view.partner_markup": "See partner markup",
  "edit.partner_markup": "Edit partner markup",
  "view.partner_audit_trail": "See partner-pricing audit trail",
  "view.branding_settings": "See white-label branding",
  "edit.branding_settings": "Edit white-label branding",
  "view.all_tenants": "See every tenant on the platform",
  "view.own_tenants": "See only own tenants",
  "edit.tenant_seats": "Edit tenant seat counts",
  "view.internal_prompts": "See internal AI prompts",
  "view.chat_internal_costs": "Chatbot may cite internal costs",
  "run.panel_of_experts": "Run panel-of-experts review",
  "run.adversarial_pipeline": "Run adversarial pipeline",
  "view.client_price": "See client-facing price",
  "view.service_catalog": "See service catalog",
};