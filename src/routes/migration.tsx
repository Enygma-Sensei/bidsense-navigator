import { createFileRoute } from "@tanstack/react-router";
import { Download, PackageOpen, Terminal, Lock } from "lucide-react";

import { useViewerRole } from "../lib/viewer-role";

export const Route = createFileRoute("/migration")({
  head: () => ({
    meta: [
      { title: "Migration Bundle — BidSense" },
      {
        name: "description",
        content:
          "Download a portable BidSense bundle: setup script, environment templates and deployment guide to redeploy the platform on your own infrastructure.",
      },
      { property: "og:title", content: "Migration Bundle — BidSense" },
      { property: "og:description", content: "Portable BidSense deployment bundle with setup script and env templates." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/migration" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/migration" }],
  }),
  component: Migration,
});

const SETUP_SH = `#!/usr/bin/env bash
set -euo pipefail

# BidSense — one-shot setup script
# Usage: ./setup.sh /path/to/target-directory

TARGET="\${1:-./bidsense}"
echo "==> Provisioning BidSense into \$TARGET"
mkdir -p "\$TARGET"
cp -R ./src ./public ./package.json ./bun.lock ./tsconfig.json ./vite.config.ts "\$TARGET/"
cp .env.example "\$TARGET/.env"

cd "\$TARGET"
echo "==> Installing dependencies"
bun install

echo "==> Applying database migrations (Supabase)"
if command -v supabase >/dev/null 2>&1; then
  supabase db push || echo "!! Skipped: no linked Supabase project"
else
  echo "!! Supabase CLI not installed — run 'supabase db push' after linking your project"
fi

echo "==> Building"
bun run build

cat <<EOM

BidSense is ready.
  - Fill in .env with your keys (Supabase, Stripe, OPENAI_API_KEY)
  - Start dev:   bun run dev
  - Start prod:  bun run start
EOM
`;

const ENV_TEMPLATE = `# BidSense environment template
# ----- Supabase -----
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

# ----- AI (OpenAI) -----
OPENAI_API_KEY=
# Optional: override model (default is gpt-4o-mini)
# OPENAI_MODEL=gpt-4o

# ----- Stripe -----
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
VITE_STRIPE_PUBLISHABLE_KEY=

# ----- App -----
APP_BASE_URL=http://localhost:3000
SESSION_SECRET=
`;

const README = `# BidSense migration bundle

Everything you need to redeploy BidSense on your own infrastructure.

## Contents
- setup.sh — one-shot provisioning script
- .env.example — required environment variables
- README.md — this file
- The complete /src and /public trees are included at the root of the bundle.

## Steps
1. Extract the bundle.
2. Run \`./setup.sh /path/to/deploy\`.
3. Fill in .env with Supabase, Stripe and OPENAI_API_KEY values.
4. \`bun run dev\` locally, or \`bun run build && bun run start\` in production.
5. Deploy to any Node/Bun-compatible host (Cloudflare Workers via Wrangler, Vercel, Fly.io).

## Data migration
- Supabase: use \`supabase db dump\` on the source and \`supabase db push\` on the target.
- Stripe: keep the existing account or clone products via the Stripe CLI.
`;

function download(filename: string, content: string, mime = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Migration() {
  const role = useViewerRole((r) => r.role);

  if (role !== "owner") {
    return (
      <div className="px-8 py-16 max-w-xl mx-auto text-center space-y-3">
        <Lock className="h-6 w-6 mx-auto text-muted-foreground" />
        <h1 className="text-xl font-semibold">Owner-only</h1>
        <p className="text-sm text-muted-foreground">Only the platform owner can download the migration bundle.</p>
      </div>
    );
  }

  return (
    <div className="px-8 py-10 max-w-4xl mx-auto space-y-6">
      <header className="space-y-1">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Portability</div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <PackageOpen className="h-6 w-6 text-gold" /> Migration bundle
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Download the setup script, environment template and README you need to redeploy BidSense on your own
          infrastructure. The full source tree can be exported alongside these files from the code panel &rarr; Download.
        </p>
      </header>

      <div className="grid gap-3">
        <Card
          icon={<Terminal className="h-4 w-4 text-gold" />}
          title="setup.sh"
          desc="Provisioning script: installs deps, applies migrations, builds."
          onClick={() => download("setup.sh", SETUP_SH, "application/x-sh")}
        />
        <Card
          icon={<Terminal className="h-4 w-4 text-gold" />}
          title=".env.example"
          desc="All environment variables the app needs, grouped by service."
          onClick={() => download(".env.example", ENV_TEMPLATE)}
        />
        <Card
          icon={<Terminal className="h-4 w-4 text-gold" />}
          title="README.md"
          desc="Deployment guide: contents, steps, and data-migration notes."
          onClick={() => download("README.md", README, "text/markdown")}
        />
      </div>

      <div className="text-[10px] text-muted-foreground">
        Tip: pair these files with a source zip (code panel &rarr; ⋯ &rarr; Download) to have a fully self-contained bundle.
      </div>
    </div>
  );
}

function Card({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg border border-border bg-card p-4 hover:border-gold transition-colors flex items-start justify-between gap-4"
    >
      <div>
        <div className="flex items-center gap-2 font-semibold text-sm">
          {icon} {title}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{desc}</div>
      </div>
      <Download className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}