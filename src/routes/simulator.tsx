import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { simulate, presets, type SimulatorInputs } from "../lib/simulator";
import { gbp } from "../lib/pricing-engine";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "Operational Profit Simulator — BidSense" },
      { name: "description", content: "Real-time BidSense EBITDA simulator. Model SMEs, C2 partners, enterprise transformations, and SME accelerators against protected subcontractor payouts." },
    ],
  }),
  component: Simulator,
});

function Simulator() {
  const [inputs, setInputs] = useState<SimulatorInputs>(presets.Base);
  const out = useMemo(() => simulate(inputs), [inputs]);

  return (
    <div className="px-8 py-10 max-w-7xl mx-auto space-y-8">
      <header className="space-y-1">
        <div className="text-xs uppercase tracking-[0.2em] text-gold">Financial HUD</div>
        <h1 className="text-3xl font-bold">Operational Profit Simulator</h1>
        <p className="text-muted-foreground text-sm">Live EBITDA calculation. Subcontractor payouts are enforced at the floor — they never absorb bundle discounts.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(presets) as Array<keyof typeof presets>).map((p) => (
          <button key={p} onClick={() => setInputs(presets[p])} className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-gold hover:text-gold transition-colors">{p}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5 rounded-lg border border-border bg-card p-6">
          <SliderRow label="SMEs" help="£800/yr revenue, £75/yr sub-floor, £12/yr AI" min={5} max={200} step={5} value={inputs.smes} onChange={(v) => setInputs({ ...inputs, smes: v })} />
          <SliderRow label="C2 Partners" help="£4,999/mo (£59,988/yr), £1,500/mo sub-floor, £200/mo AI" min={0} max={10} step={1} value={inputs.c2} onChange={(v) => setInputs({ ...inputs, c2: v })} />
          <SliderRow label="Enterprise transformations" help="£12,999 once-off, £8,000 sub-floor, £500 AI" min={0} max={15} step={1} value={inputs.enterprise} onChange={(v) => setInputs({ ...inputs, enterprise: v })} />
          <SliderRow label="SME Accelerators" help="£2,499 once-off, £1,000 sub-floor, £100 AI" min={0} max={50} step={1} value={inputs.accelerators} onChange={(v) => setInputs({ ...inputs, accelerators: v })} />
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-gold/50 bg-card p-6">
            <div className="text-xs uppercase tracking-widest text-gold">EBITDA Net Cash Profit</div>
            <div className="mt-2 text-5xl font-black text-gold">{gbp(out.ebitda)}</div>
            <div className="mt-2 text-sm text-muted-foreground">Harare data-entry income multiplier: <span className="text-foreground font-semibold">{out.incomeMultiplier.toFixed(1)}×</span></div>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 space-y-2 text-sm">
            <MetricRow label="Gross revenue" value={gbp(out.grossRevenue)} />
            <MetricRow label="Subcontractor payouts (protected)" value={gbp(out.subcontractorPayouts)} gold />
            <MetricRow label="AI compute" value={gbp(out.aiCompute)} />
            <MetricRow label="OpEx (tiered)" value={gbp(out.opex)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderRow({ label, help, min, max, step, value, onChange }: { label: string; help: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-lg font-bold text-gold">{value}</div>
      </div>
      <div className="text-[11px] text-muted-foreground">{help}</div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full mt-2 accent-gold" />
    </div>
  );
}

function MetricRow({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={gold ? "text-gold font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}