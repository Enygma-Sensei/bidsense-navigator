import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { Building2, Upload, Undo2 } from "lucide-react";

import { useViewerRole } from "../lib/viewer-role";
import { useResellerBrand } from "../lib/reseller-brand";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "White-label Branding — BidSense" },
      {
        name: "description",
        content: "Reseller white-label controls: brand name, tagline, logo, primary colour, and support contact used across your BidSense tenant.",
      },
      { property: "og:title", content: "White-label Branding — BidSense" },
      { property: "og:description", content: "Reseller white-label branding controls for BidSense." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const role = useViewerRole((r) => r.role);
  const brand = useResellerBrand();
  const fileRef = useRef<HTMLInputElement>(null);

  const canEdit = role === "reseller" || role === "owner";

  return (
    <div className="px-8 py-10 max-w-3xl mx-auto space-y-8">
      <header className="space-y-1">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Reseller Tenant</div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-gold" /> White-label branding
        </h1>
        <p className="text-muted-foreground text-sm">
          Customise how your tenant of BidSense appears to your own clients. The BidSense platform is white-labelled — your brand name, logo and support contact are shown in the sidebar and on generated documents.
        </p>
      </header>

      {!canEdit && (
        <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
          Switch to <strong>Reseller</strong> or <strong>Owner</strong> in the sidebar to edit branding.
        </div>
      )}

      <fieldset disabled={!canEdit} className="space-y-4 disabled:opacity-60">
        <Field label="Brand name">
          <input
            value={brand.brandName}
            onChange={(e) => brand.set({ brandName: e.target.value })}
            placeholder="e.g. Northgate Bid Advisory"
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Tagline">
          <input
            value={brand.tagline}
            onChange={(e) => brand.set({ tagline: e.target.value })}
            placeholder="e.g. Compliant tender intelligence for the North-East"
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Primary brand colour">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={brand.primaryHex}
              onChange={(e) => brand.set({ primaryHex: e.target.value })}
              className="h-10 w-14 rounded border border-border bg-background"
            />
            <input
              value={brand.primaryHex}
              onChange={(e) => brand.set({ primaryHex: e.target.value })}
              className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm font-mono"
            />
          </div>
        </Field>
        <Field label="Logo">
          <div className="flex items-center gap-3">
            <div
              className="h-14 w-14 rounded border border-border grid place-items-center overflow-hidden"
              style={{ background: brand.primaryHex }}
            >
              {brand.logoDataUrl ? (
                <img src={brand.logoDataUrl} alt="Brand logo" className="max-h-full max-w-full" />
              ) : (
                <span className="text-xs text-white/80">No logo</span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => brand.set({ logoDataUrl: String(reader.result) });
                reader.readAsDataURL(f);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded border border-border hover:border-gold hover:text-gold"
            >
              <Upload className="h-3 w-3" /> Upload
            </button>
            {brand.logoDataUrl && (
              <button
                onClick={() => brand.set({ logoDataUrl: null })}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Remove
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">PNG or SVG, max ~200KB. Stored client-side today; per-tenant when Cloud is wired.</p>
        </Field>
        <Field label="Support email">
          <input
            type="email"
            value={brand.supportEmail}
            onChange={(e) => brand.set({ supportEmail: e.target.value })}
            placeholder="[email protected]"
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={brand.hideBidSenseWordmark}
            onChange={(e) => brand.set({ hideBidSenseWordmark: e.target.checked })}
          />
          Hide the &ldquo;BidSense&rdquo; wordmark in my tenant sidebar
        </label>

        <div className="pt-4 flex gap-2">
          <button
            onClick={() => brand.reset()}
            className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded border border-border hover:border-destructive hover:text-destructive"
          >
            <Undo2 className="h-3 w-3" /> Reset to defaults
          </button>
        </div>
      </fieldset>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}