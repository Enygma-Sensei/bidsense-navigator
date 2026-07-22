import { createFileRoute } from "@tanstack/react-router";

import { POLICIES } from "../lib/legal-copy";

export const Route = createFileRoute("/legal/")({
  component: LegalIndex,
});

function LegalIndex() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Pick a policy to review. Each one is drafted for a UK B2B SaaS platform and reviewed annually.
      </p>
      <ul className="grid sm:grid-cols-2 gap-3">
        {POLICIES.map((p) => (
          <li key={p.slug} className="rounded border border-border bg-background p-4">
            <div className="text-sm font-semibold">{p.title}</div>
            <div className="text-xs text-muted-foreground mt-1">{p.intro}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
              Last reviewed {p.lastReviewed}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}