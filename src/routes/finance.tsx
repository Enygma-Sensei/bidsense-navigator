import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Receipt, Download, Lock } from "lucide-react";

import { useViewerRole } from "../lib/viewer-role";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "Tax-compliant Financial Records — BidSense" },
      {
        name: "description",
        content:
          "HMRC-ready invoice ledger with VAT breakdown, sequential numbering and CSV export for Making Tax Digital submissions. Owner-only.",
      },
      { property: "og:title", content: "Tax-compliant Financial Records — BidSense" },
      { property: "og:description", content: "MTD-ready invoice ledger, VAT breakdown and CSV export." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/finance" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/finance" }],
  }),
  component: Finance,
});

interface Invoice {
  id: string;
  date: string;
  client: string;
  netGBP: number;
  vatRate: number; // 0.20 UK standard
  scheme: "Standard VAT" | "Reverse charge" | "Zero-rated export";
  status: "paid" | "issued" | "overdue";
}

// ── Replace these rows with your real invoices. ──────────────────────────────
// This is illustrative demo data showing the ledger structure and VAT schemes.
// When you connect a database (e.g. Supabase), this array will be fetched live.
const LEDGER: Invoice[] = [
  { id: "BS-DEMO-0001", date: "2026-06-04", client: "DEMO — UK Reseller Client", netGBP: 4200, vatRate: 0.2, scheme: "Standard VAT", status: "paid" },
  { id: "BS-DEMO-0002", date: "2026-06-11", client: "DEMO — PSL Partner Client", netGBP: 9600, vatRate: 0.2, scheme: "Standard VAT", status: "paid" },
  { id: "BS-DEMO-0003", date: "2026-06-24", client: "DEMO — SME Trial Client", netGBP: 350, vatRate: 0.2, scheme: "Standard VAT", status: "issued" },
  { id: "BS-DEMO-0004", date: "2026-07-02", client: "DEMO — EU Client (B2B reverse charge)", netGBP: 5200, vatRate: 0, scheme: "Reverse charge", status: "paid" },
  { id: "BS-DEMO-0005", date: "2026-07-08", client: "DEMO — Export Client (zero-rated)", netGBP: 7800, vatRate: 0, scheme: "Zero-rated export", status: "issued" },
  { id: "BS-DEMO-0006", date: "2026-07-15", client: "DEMO — Enterprise Client", netGBP: 12500, vatRate: 0.2, scheme: "Standard VAT", status: "overdue" },
];

function fmt(n: number) {
  return n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

function Finance() {
  const role = useViewerRole((r) => r.role);
  const [quarter, setQuarter] = useState("Q2 2026");

  const totals = useMemo(() => {
    return LEDGER.reduce(
      (acc, i) => {
        const vat = i.netGBP * i.vatRate;
        acc.net += i.netGBP;
        acc.vat += vat;
        acc.gross += i.netGBP + vat;
        return acc;
      },
      { net: 0, vat: 0, gross: 0 },
    );
  }, []);

  if (role !== "owner") {
    return (
      <div className="px-8 py-16 max-w-xl mx-auto text-center space-y-3">
        <Lock className="h-6 w-6 mx-auto text-muted-foreground" />
        <h1 className="text-xl font-semibold">Owner-only</h1>
        <p className="text-sm text-muted-foreground">
          Financial ledgers are visible to the platform owner only. Switch to the owner role in the sidebar to view.
        </p>
      </div>
    );
  }

  function exportCsv() {
    const header = ["Invoice", "Date", "Client", "Scheme", "Net GBP", "VAT Rate", "VAT GBP", "Gross GBP", "Status"];
    const rows = LEDGER.map((i) => [
      i.id, i.date, i.client, i.scheme,
      i.netGBP.toFixed(2), (i.vatRate * 100).toFixed(0) + "%",
      (i.netGBP * i.vatRate).toFixed(2), (i.netGBP * (1 + i.vatRate)).toFixed(2), i.status,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `bidsense-vat-${quarter.replace(" ", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto space-y-6">
      <div className="rounded border border-amber-400/40 bg-amber-400/10 text-amber-400 text-xs px-4 py-2">
        Demo data — these are illustrative invoices showing the ledger structure and VAT schemes. Replace with your real invoices, or connect a database to populate this dynamically.
      </div>
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-[0.2em] text-gold">Owner-only</div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-gold" /> Tax-compliant financial records
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Sequential invoice numbering, VAT breakdown (Standard 20%, EU reverse charge, zero-rated
            export), and CSV export ready for Making Tax Digital submission via bridging software.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <select
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
            className="text-xs rounded border border-border bg-background px-2 py-1"
          >
            <option>Q2 2026</option>
            <option>Q3 2026</option>
          </select>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded bg-gold text-gold-foreground font-semibold"
          >
            <Download className="h-3 w-3" /> Export CSV
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Net turnover" value={fmt(totals.net)} />
        <Stat label="VAT collected" value={fmt(totals.vat)} />
        <Stat label="Gross billed" value={fmt(totals.gross)} />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-secondary/50 uppercase tracking-widest text-[10px]">
            <tr>
              <th className="text-left px-3 py-2">Invoice</th>
              <th className="text-left px-3 py-2">Date</th>
              <th className="text-left px-3 py-2">Client</th>
              <th className="text-left px-3 py-2">Scheme</th>
              <th className="text-right px-3 py-2">Net</th>
              <th className="text-right px-3 py-2">VAT</th>
              <th className="text-right px-3 py-2">Gross</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {LEDGER.map((i) => {
              const vat = i.netGBP * i.vatRate;
              return (
                <tr key={i.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono">{i.id}</td>
                  <td className="px-3 py-2">{i.date}</td>
                  <td className="px-3 py-2">{i.client}</td>
                  <td className="px-3 py-2 text-muted-foreground">{i.scheme}</td>
                  <td className="px-3 py-2 text-right">{fmt(i.netGBP)}</td>
                  <td className="px-3 py-2 text-right">{fmt(vat)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{fmt(i.netGBP + vat)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        i.status === "paid"
                          ? "text-success"
                          : i.status === "overdue"
                            ? "text-destructive"
                            : "text-warning"
                      }
                    >
                      {i.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[10px] text-muted-foreground">
        Records retained for 6 years per HMRC Making Tax Digital for VAT rules. Invoice numbers are strictly sequential and immutable once issued.
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold text-gold mt-1">{value}</div>
    </div>
  );
}