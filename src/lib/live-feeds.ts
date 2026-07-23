// In-memory pseudo-real-time feeds. Every subscriber gets a shared BroadcastChannel
// message so multiple browser tabs update together, and each feed polls a mock
// generator every 30s. When Cloud is wired, replace the poll with a Supabase
// realtime channel subscription — the component API stays identical.

import { useEffect, useState } from "react";

export interface CompetitorNewsItem {
  id: string;
  ts: string;
  source: string;
  headline: string;
  summary: string;
  competitor?: string;
  framework?: string;
  url?: string;
  /**
   * true = this item was locally generated as a placeholder, not fetched from
   * a live source. The UI must display a "simulated" or "no live feed connected"
   * label whenever this flag is set — §9 #7 of the Known Corrections Ledger
   * prohibits presenting simulated data as live regulatory intelligence.
   */
  simulated?: boolean;
}

const SEED_NEWS: CompetitorNewsItem[] = [
  { id: "n-1", ts: new Date().toISOString(), source: "Contracts Finder", headline: "£4.2m NHS facilities framework — new lot published", summary: "NHS SBS opened a fresh lot under the Estates & Facilities Management framework; deadline in 28 days.", framework: "NHS SBS EFM", url: "https://www.contractsfinder.service.gov.uk/" },
  { id: "n-2", ts: new Date(Date.now() - 3600e3).toISOString(), source: "Find a Tender", headline: "Crown Commercial Service refreshes G-Cloud 14 buyer guidance", summary: "CCS updated evaluation guidance emphasising social value weighting under PPN 06/20; affects existing G-Cloud sellers.", framework: "G-Cloud 14", url: "https://www.find-tender.service.gov.uk/" },
  { id: "n-3", ts: new Date(Date.now() - 2 * 3600e3).toISOString(), source: "UK Gov News", headline: "Procurement Act 2023 — commencement update", summary: "Cabinet Office confirmed additional secondary legislation coming into force this quarter; new transparency notices required.", url: "https://www.gov.uk/" },
  { id: "n-4", ts: new Date(Date.now() - 5 * 3600e3).toISOString(), source: "Competitor watch", headline: "TenderIQ announces AI review add-on at £129/mo", summary: "Competitor priced entry AI review under our SVC-020 tier — monitor and consider re-bundling.", competitor: "TenderIQ" },
];

let cachedNews: CompetitorNewsItem[] = [...SEED_NEWS];
let lastRefreshed = Date.now();
const listeners = new Set<() => void>();

function generateNextItem(): CompetitorNewsItem {
  // §9 #7 — simulated flag required on all locally-generated items.
  // These are placeholder templates. Do NOT remove the simulated flag or
  // present these as live regulatory intelligence — see Known Corrections
  // Ledger §9 #7. Replace with a real Contracts Finder / Find a Tender API
  // call before going live; until then the UI must show a "no live feed"
  // disclaimer whenever simulated: true items are displayed.
  const templates: Omit<CompetitorNewsItem, "id" | "ts" | "simulated">[] = [
    { source: "Contracts Finder (simulated)", headline: "New local authority ITT published", summary: "A council has opened a £850k-£1.4m professional services tender with a 21-day return.", framework: "Local Authority" },
    { source: "Find a Tender (simulated)", headline: "Framework award notice — refreshed supplier list", summary: "An updated supplier list was published on a national framework relevant to compliance advisory.", framework: "Crown Commercial" },
    { source: "Competitor watch (simulated)", headline: "Competitor updated pricing page", summary: "Movement detected on a direct competitor's public pricing — inspect and re-benchmark.", competitor: "MarketScan" },
  ];
  const t = templates[Math.floor(Math.random() * templates.length)];
  return { id: `n-${crypto.randomUUID()}`, ts: new Date().toISOString(), simulated: true, ...t };
}

function refresh() {
  cachedNews = [generateNextItem(), ...cachedNews].slice(0, 40);
  lastRefreshed = Date.now();
  listeners.forEach((l) => l());
}

let intervalHandle: ReturnType<typeof setInterval> | null = null;
function ensureInterval() {
  if (intervalHandle || typeof window === "undefined") return;
  intervalHandle = setInterval(refresh, 30_000);
}

export function useCompetitorNews() {
  const [state, setState] = useState({ items: cachedNews, lastRefreshed });
  useEffect(() => {
    ensureInterval();
    const l = () => setState({ items: cachedNews, lastRefreshed });
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return { ...state, refresh };
}