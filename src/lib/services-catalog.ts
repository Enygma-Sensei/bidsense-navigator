export type ServiceCategory =
  | "Advisory & Assessment"
  | "Transactional AI & Bid"
  | "High-Stakes Human & Legal"
  | "SaaS & Partner";

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  floor: number;
  ai_cost: number;
  manual_cost: number;
  displacement?: number;
  period?: "month" | "year";
  iso_clause: string;
  desc: string;
  hil: boolean; // human-in-the-loop
}

export const services: Service[] = [
  // Category 1: Advisory & Assessment
  { id: "compliance-baseline", name: "Compliance Baseline Assessment (SVC-001)", category: "Advisory & Assessment", price: 999, floor: 800, ai_cost: 0.5, manual_cost: 4680, displacement: 0.829, iso_clause: "ISO 9001 Clause 8.2", desc: "Establishes the client's compliance posture at T0 against a named regulatory set, creating the baseline BKR record.", hil: true },
  { id: "regulatory-impact", name: "Regulatory Change Assessment (SVC-002)", category: "Advisory & Assessment", price: 499, floor: 300, ai_cost: 0.5, manual_cost: 1032.5, displacement: 0.709, iso_clause: "ISO 37301 Clause 4.1", desc: "Assesses the client impact of a named regulatory change (delta T0→T1) on their bid readiness.", hil: true },
  { id: "gap-analysis", name: "Gap Analysis & Remediation (SVC-003)", category: "Advisory & Assessment", price: 799, floor: 500, ai_cost: 0.5, manual_cost: 2400, displacement: 0.792, iso_clause: "ISO 22301 Clause 8.4", desc: "Prioritised, step-by-step remediation plan against an established baseline.", hil: true },
  { id: "evidence-mapping", name: "Evidence Mapping & BKR Setup (SVC-004)", category: "Advisory & Assessment", price: 99, floor: 0, ai_cost: 0.2, manual_cost: 178.14, displacement: 0.444, iso_clause: "ISO 55001 Clause 7.5", desc: "AI extracts bid requirements and maps them to certificates, policies, CVs in the BKR in 5 minutes.", hil: false },
  { id: "iso-readiness", name: "ISO Readiness Assessment (SVC-005)", category: "Advisory & Assessment", price: 1999, floor: 1500, ai_cost: 1, manual_cost: 6500, displacement: 0.769, iso_clause: "ISO 27001 Clause 9.2", desc: "Client readiness against ISO 27001 / 9001 / 14001 with a pre-audit gap map.", hil: true },

  // Category 2: Transactional AI & Bid
  { id: "ai-win-theme", name: "AI Win-Theme Generator (SVC-010)", category: "Transactional AI & Bid", price: 99, floor: 0, ai_cost: 0.3, manual_cost: 205.95, displacement: 0.52, iso_clause: "ISO/IEC 42001 Clause 6.1", desc: "AI analyses criteria and competitor strengths to generate 3-5 persuasive angles for your bid draft.", hil: false },
  { id: "ai-bid-draft", name: "AI Bid Draft (SVC-011)", category: "Transactional AI & Bid", price: 199, floor: 0, ai_cost: 1.5, manual_cost: 752.5, displacement: 0.98, iso_clause: "ISO/IEC 42001 Clause 8.2", desc: "Generates complete compliant bid answers aligned to win themes in 20 minutes instead of 10 hours.", hil: false },
  { id: "pqq-first-draft", name: "PQQ First Draft + Human Review", category: "Transactional AI & Bid", price: 149, floor: 75.25, ai_cost: 0.5, manual_cost: 301, displacement: 0.769, iso_clause: "ISO 9001 Clause 8.5", desc: "AI drafts SQ/PQQ responses instantly, plus a 1-hour professional bounty-board review (48h SLA).", hil: true },
  { id: "crp-generator", name: "CRP Generator (PPN 06/21)", category: "Transactional AI & Bid", price: 129, floor: 0, ai_cost: 0.4, manual_cost: 1200, iso_clause: "ISO 14001 Clause 8.1", desc: "12-question survey calculates Scope 1/2/3 emissions and outputs a fully compliant Carbon Reduction Plan.", hil: false },
  { id: "social-value-narrative", name: "Social Value Narrative (PPN 06/20)", category: "Transactional AI & Bid", price: 99, floor: 0, ai_cost: 0.3, manual_cost: 263.38, iso_clause: "ISO 14001 Clause 4.3", desc: "Localised, TOMs-compliant Social Value commitments with explicit KPIs for PPN 06/20.", hil: false },
  { id: "ai-tender-response", name: "AI Tender Response (Full ITT)", category: "Transactional AI & Bid", price: 399, floor: 0, ai_cost: 0.2, manual_cost: 937.5, displacement: 0.992, iso_clause: "ISO/IEC 42001 Clause 8.3", desc: "End-to-end ITT writing: compliance matrices, evidence annexes, technical narratives.", hil: false },
  { id: "ai-bid-review", name: "AI Bid Review & Scoring", category: "Transactional AI & Bid", price: 249, floor: 0, ai_cost: 0.14, manual_cost: 328, displacement: 0.99, iso_clause: "ISO/IEC 42001 Clause 9.2", desc: "Simulates evaluator marking against award criteria and returns prioritised fixes across 2 cycles.", hil: false },
  { id: "ai-win-loss", name: "AI Win/Loss Analysis", category: "Transactional AI & Bid", price: 149, floor: 0, ai_cost: 0.14, manual_cost: 246, displacement: 0.985, iso_clause: "ISO/IEC 42001 Clause 10.1", desc: "Turns tender feedback into root-cause rejections and remediation playbooks for the BKR.", hil: false },
  { id: "private-rfp-response", name: "Private-Sector RFP Response", category: "Transactional AI & Bid", price: 499, floor: 0, ai_cost: 1.5, manual_cost: 602, displacement: 0.98, iso_clause: "ISO 9001 Clause 8.2.3", desc: "AI-generated RFP response optimised for private-sector buyers.", hil: false },

  // Category 3: High-Stakes Human & Legal
  { id: "tupe-risk-assessment", name: "TUPE Risk Assessment", category: "High-Stakes Human & Legal", price: 179, floor: 0, ai_cost: 0.5, manual_cost: 375, displacement: 0.987, iso_clause: "ISO 45001 Clause 6.1.2", desc: "AI screens TUPE applicability, extracts ELI schedules, and risk-scores transfer liabilities.", hil: false },
  { id: "standstill-interception-brief", name: "Standstill Interception Brief", category: "High-Stakes Human & Legal", price: 499, floor: 0, ai_cost: 0.5, manual_cost: 1032.5, displacement: 0.99, iso_clause: "ISO 37301 Clause 9.1", desc: "AI-driven scoring audit of bid rejections under s.51 PA23. Identifies procedural scoring breaches for challenge.", hil: false },
  { id: "premium-red-team", name: "Premium Red Team Review", category: "High-Stakes Human & Legal", price: 1299, floor: 812.5, ai_cost: 0, manual_cost: 812.5, displacement: 0, iso_clause: "ISO 9001 Clause 8.6", desc: "Guaranteed 6.5h review by a certified APMP Practitioner. Floor fully protected.", hil: true },
  { id: "disqualification-defence", name: "Disqualification Defence Pack", category: "High-Stakes Human & Legal", price: 2499, floor: 1475, ai_cost: 0.5, manual_cost: 1475, displacement: 0, iso_clause: "ISO 37001 Clause 9.1", desc: "Legal challenge package. Solicitor reviews AI case files on s.57–64 PA23 breaches and issues formal letter.", hil: true },
  { id: "pqq-surgery", name: "PQQ Surgery", category: "High-Stakes Human & Legal", price: 399, floor: 312.5, ai_cost: 0, manual_cost: 312.5, displacement: 0, iso_clause: "ISO 45001 Clause 8.1", desc: "Interactive 90-minute live screen share with an APMP Practitioner on high-risk TUPE and ISO clauses.", hil: true },
  { id: "framework-t1", name: "Framework Support T1 (Simple)", category: "High-Stakes Human & Legal", price: 999, floor: 0, ai_cost: 0.5, manual_cost: 1000, displacement: 0.99, iso_clause: "ISO/IEC 42001 Clause 8.4", desc: "AI-only framework support (G-Cloud) for evidence mapping and automated bid compilation.", hil: false },
  { id: "framework-t2", name: "Framework Support T2 (Standard)", category: "High-Stakes Human & Legal", price: 1999, floor: 301, ai_cost: 0.5, manual_cost: 2000, displacement: 0.95, iso_clause: "ISO 9001 Clause 8.4", desc: "AI framework support plus 4 hours of professional human writer review on standard CCS applications.", hil: true },
  { id: "framework-t3", name: "Framework Support T3 (Complex)", category: "High-Stakes Human & Legal", price: 2999, floor: 601, ai_cost: 0.5, manual_cost: 3000, displacement: 0.9, iso_clause: "ISO 9001 Clause 8.4.2", desc: "T2 plus 1.5 hours of senior consultant strategy on complex multi-lot NHS frameworks.", hil: true },
  { id: "enterprise-strategic-transformation", name: "Enterprise Strategic Transformation", category: "High-Stakes Human & Legal", price: 12999, floor: 8000, ai_cost: 500, manual_cost: 12999, displacement: 0.667, iso_clause: "ISO 44001 Clause 8.2", desc: "Direct Glaxton killer. 4–6 weeks AI processing plus 2 senior consultants (20h each) delivering full readiness registers.", hil: true },
  { id: "enterprise-readiness-accelerator", name: "SME Enterprise Readiness Accelerator", category: "High-Stakes Human & Legal", price: 2499, floor: 1000, ai_cost: 100, manual_cost: 2499, displacement: 0.75, iso_clause: "ISO 37301 Clause 8.2", desc: "SME on-ramp. AI compliance mapping, PPN 06/21 CRP, plus 5 hours of APMP strategist workshop.", hil: true },

  // Category 4: SaaS & Partner
  { id: "compliance-diary", name: "Compliance Diary Subscription", category: "SaaS & Partner", price: 49, floor: 0, ai_cost: 0.05, manual_cost: 49, displacement: 1, period: "month", iso_clause: "ISO 37301 Clause 6.1", desc: "Tracks certificate expirations with automated notifications. Pairs with Compliance Currency Score.", hil: false },
  { id: "evidence-vault", name: "Evidence Vault Subscription", category: "SaaS & Partner", price: 29, floor: 0, ai_cost: 0.03, manual_cost: 29, displacement: 1, period: "month", iso_clause: "ISO 27001 Annex A.8.24", desc: "Client-side encrypted cloud storage via Web Crypto AES-GCM. Key never leaves browser.", hil: false },
  { id: "bid-library", name: "Bid Library Subscription", category: "SaaS & Partner", price: 99, floor: 0, ai_cost: 1.7, manual_cost: 99, displacement: 1, period: "month", iso_clause: "ISO 55001 Clause 4.1", desc: "AI-tagged bid content repository. Replaces Loopio at 96% cheaper.", hil: false },
  { id: "psl-partner-seat", name: "PSL Partner Seat", category: "SaaS & Partner", price: 499, floor: 0, ai_cost: 50, manual_cost: 499, displacement: 1, period: "month", iso_clause: "ISO 44001 Clause 6.1", desc: "Monthly licence per seat for bid consultancies. Floor set to £0 to prevent owner-margin drainage.", hil: false },
  { id: "psl-enterprise-partner-c2", name: "PSL Enterprise Partner (C2)", category: "SaaS & Partner", price: 4999, floor: 1500, ai_cost: 200, manual_cost: 4999, displacement: 0.5, period: "month", iso_clause: "ISO 44001 Clause 10.1", desc: "C2 partner tier. Unlimited seats, named partner manager, 10% VDC referral split, reselling rights.", hil: true },
  // FIXED: price was 1000 with period "year" while the desc promised "£12,000/year" — a 12x
  // internal contradiction (the £1,000/250/41.6 figures look like unannualised monthly inputs
  // left in the price/floor/ai_cost fields). Scaled ×12 to match the stated annual price and
  // preserve the original floor/AI-cost/margin ratios. Confirm the £12,000 anchor against a
  // real PSL conversation before this goes live — it was never independently re-verified.
  { id: "psl-white-label-reseller-c3", name: "PSL White-Label Reseller (C3)", category: "SaaS & Partner", price: 12000, floor: 3000, ai_cost: 499.2, manual_cost: 12000, displacement: 0.75, period: "year", iso_clause: "ISO 44001 Clause 10.3", desc: "C3 white-label license (£12,000/year). Permits reselling to their own SME base.", hil: true },
];

export const categories: ServiceCategory[] = [
  "Advisory & Assessment",
  "Transactional AI & Bid",
  "High-Stakes Human & Legal",
  "SaaS & Partner",
];

export function findService(id: string) {
  return services.find((s) => s.id === id);
}
