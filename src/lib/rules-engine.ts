export interface CartAlert {
  id: string;
  kind: "warning" | "recommendation";
  title: string;
  message: string;
  suggestId?: string;
}

export function evaluateCartRules(ids: string[]): CartAlert[] {
  const has = (x: string) => ids.includes(x);
  const alerts: CartAlert[] = [];

  if (has("premium-red-team") && !has("ai-bid-draft")) {
    alerts.push({
      id: "W-01",
      kind: "warning",
      title: "W-01 — Red Team without AI Bid Draft",
      message:
        "Premium Red Team Review selected without AI Bid Draft. Ensure you have your own high-fidelity draft to upload, otherwise the £812.50 specialist fee is wasted.",
      suggestId: "ai-bid-draft",
    });
  }
  if (has("standstill-interception-brief") && !has("disqualification-defence")) {
    alerts.push({
      id: "W-02",
      kind: "warning",
      title: "W-02 — Standstill without Defence Pack",
      // FIXED: the original copy claimed the £499 brief fee is "fully credited" toward the
      // Disqualification Defence Pack. No such credit exists anywhere in pricing-engine.ts or
      // cart-store.ts — the cart simply sums both prices (£499 + £2,499 = £2,998). Either build
      // the credit logic before shipping this claim, or say what actually happens today.
      message:
        "Standstill Interception Brief is AI-only. To challenge and suspend the procurement, add Disqualification Defence Pack (£2,499) — it uses the same case file, but the £499 brief fee is billed separately, not credited.",
      suggestId: "disqualification-defence",
    });
  }
  if (has("compliance-diary") && !has("evidence-vault")) {
    alerts.push({
      id: "W-03",
      kind: "warning",
      title: "W-03 — Compliance Diary needs Evidence Vault",
      message:
        "Compliance tracking is AI-only. Storing policies browser-side is a prerequisite — add Evidence Vault (£29/month).",
      suggestId: "evidence-vault",
    });
  }

  if (has("evidence-mapping") && !has("ai-win-theme")) {
    alerts.push({
      id: "R-01",
      kind: "recommendation",
      title: "R-01 — Turn gaps into hooks",
      message:
        "Add AI Win-Theme Generator (+£99). Mapping reveals your gaps; Win-Themes turn them into persuasive bid hooks.",
      suggestId: "ai-win-theme",
    });
  }
  if (has("ai-win-theme") && !has("ai-bid-draft")) {
    alerts.push({
      id: "R-02",
      kind: "recommendation",
      title: "R-02 — Structure the full bid",
      message:
        "Add AI Bid Draft (+£199). Win-Themes are only useful if they structure your complete bid.",
      suggestId: "ai-bid-draft",
    });
  }
  if (has("crp-generator") && !has("social-value-narrative")) {
    alerts.push({
      id: "R-05",
      kind: "recommendation",
      title: "R-05 — PPN 06/21 + PPN 06/20",
      message:
        "Add Social Value Narrative (+£99). Carbon Reduction (PPN 06/21) and Social Value (PPN 06/20) are mandatory together on major central gov bids.",
      suggestId: "social-value-narrative",
    });
  }

  return alerts;
}