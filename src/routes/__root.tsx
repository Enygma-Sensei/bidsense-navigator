import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LineChart,
  ShieldCheck,
  Bot,
  Settings as SettingsIcon,
  BadgePoundSterling,
  MessageCircle,
  Paperclip,
  Newspaper,
  KeyRound,
  Receipt,
  PackageOpen,
  Users,
  ScrollText,
  Lock,
} from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useCart } from "../lib/cart-store";
import { useViewerRole, roleLabels, type ViewerRole } from "../lib/viewer-role";
import { useResellerBrand } from "../lib/reseller-brand";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BidSense Dashboard — Compliance-First Tender Command" },
      {
        name: "description",
        content:
          "Command centre for BidSense: adversarial peer-reviewed AI bidding, subcontractor-floor-protected pricing, and ISO-aligned compliance for UK public-sector SMEs.",
      },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "BidSense Dashboard — Compliance-First Tender Command" },
      {
        property: "og:description",
        content:
          "Command centre for BidSense: adversarial peer-reviewed AI bidding, subcontractor-floor-protected pricing, and ISO-aligned compliance for UK public-sector SMEs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "BidSense Dashboard — Compliance-First Tender Command" },
      { name: "twitter:description", content: "Command centre for BidSense: adversarial peer-reviewed AI bidding, subcontractor-floor-protected pricing, and ISO-aligned compliance for UK public-sector SMEs." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/c901f833-a19d-47e9-aced-38ccea7fcb38" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/c901f833-a19d-47e9-aced-38ccea7fcb38" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}

function AppShell() {
  const count = useCart((s) => s.ids.length);
  const role = useViewerRole((s) => s.role);
  const brand = useResellerBrand();
  const partnerView = role === "reseller" || role === "psl";
  const showBrand = partnerView && (brand.brandName || brand.logoDataUrl);
  const showBidSenseMark = !(partnerView && brand.hideBidSenseWordmark);
  const nav: Array<{
    to: string;
    label: string;
    icon: typeof LayoutDashboard;
    exact?: boolean;
    badge?: number;
  }> = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/catalogue", label: "Service Catalogue", icon: Package },
    { to: "/chat", label: "Service Concierge", icon: MessageCircle },
    { to: "/cart", label: "BYOB Cart", icon: ShoppingCart, badge: count },
    { to: "/simulator", label: "Operational Simulator", icon: LineChart },
    { to: "/compliance", label: "Compliance & ISO HUD", icon: ShieldCheck },
    { to: "/pipeline", label: "Adversarial Pipeline", icon: Bot },
    { to: "/panel", label: "Panel of Experts", icon: Users },
    { to: "/attachments", label: "Tender Attachments", icon: Paperclip },
    { to: "/news", label: "Market Radar", icon: Newspaper },
    { to: "/partner-pricing", label: "Partner Pricing", icon: BadgePoundSterling },
    { to: "/licensing", label: "Licensing & Seats", icon: KeyRound },
    { to: "/finance", label: "Financial Records", icon: Receipt },
    { to: "/migration", label: "Migration Bundle", icon: PackageOpen },
    { to: "/settings", label: "Branding", icon: SettingsIcon },
    { to: "/access", label: "Access Control", icon: Lock },
    { to: "/legal", label: "Legal & Trust", icon: ScrollText },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col">
        <div className="px-5 py-6 border-b border-sidebar-border">
          {showBrand ? (
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-md grid place-items-center overflow-hidden font-black text-white"
                style={{ background: brand.primaryHex }}
              >
                {brand.logoDataUrl ? (
                  <img src={brand.logoDataUrl} alt="" className="max-h-full max-w-full" />
                ) : (
                  (brand.brandName || "B").slice(0, 1).toUpperCase()
                )}
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight text-sidebar-foreground">
                  {brand.brandName || "Your Brand"}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {brand.tagline || "Tender Intelligence"}
                </div>
                {showBidSenseMark && (
                  <div className="text-[9px] text-muted-foreground/70 mt-0.5">
                    powered by BidSense
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gold text-gold-foreground grid place-items-center font-black">
                B
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight text-sidebar-foreground">
                  BidSense
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Tender Intelligence
                </div>
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              to={n.to as any}
              activeOptions={{ exact: !!n.exact }}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground data-[status=active]:font-semibold data-[status=active]:border-l-2 data-[status=active]:border-gold data-[status=active]:pl-[10px]"
            >
              <n.icon className="h-4 w-4" />
              <span className="flex-1">{n.label}</span>
              {n.badge ? (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gold text-gold-foreground">
                  {n.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-sidebar-border text-[10px] text-muted-foreground leading-relaxed">
          Client-side encrypted evidence.<br />
          Adversarial peer review on every bid.
        </div>
        <ViewerRoleSwitcher />
      </aside>
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}

function ViewerRoleSwitcher() {
  const role = useViewerRole((s) => s.role);
  const setRole = useViewerRole((s) => s.setRole);
  const roles: ViewerRole[] = ["client", "reseller", "psl", "owner"];
  return (
    <div className="px-5 py-3 border-t border-sidebar-border">
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
        Viewing as
      </label>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as ViewerRole)}
        className="w-full text-xs bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border rounded px-2 py-1.5"
        aria-label="Switch viewer role"
      >
        {roles.map((r) => (
          <option key={r} value={r}>{roleLabels[r]}</option>
        ))}
      </select>
      {role === "owner" && (
        <div className="mt-2 text-[10px] text-gold leading-snug">
          Internal-only figures are visible. Never share this view with clients.
        </div>
      )}
    </div>
  );
}
