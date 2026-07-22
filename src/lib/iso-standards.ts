export interface IsoStandard {
  code: string;
  title: string;
  focus: string;
  plain: string;
  example: string;
}

export const isoStandards: IsoStandard[] = [
  { code: "ISO 9001", title: "Quality Management", focus: "Process approach, customer focus, continual improvement.", plain: "The global standard for running a business that consistently delivers what it promises. It asks you to write down how you work, check that it's working, and keep improving.", example: "A buyer asks 'How do you make sure the service you tender for is the same service you deliver?' — ISO 9001 is the evidence that you have a documented process for that." },
  { code: "ISO 14001", title: "Environmental Management", focus: "Life-cycle perspective, environmental aspects, PPN 06/21 alignment.", plain: "The environmental version of ISO 9001 — a documented system for measuring and reducing your environmental impact (energy, waste, emissions).", example: "Public-sector tenders scored under PPN 06/21 (Carbon Reduction Plan) expect this. Without it, you typically lose 5–10% of your evaluation score." },
  { code: "ISO 27001", title: "Information Security (ISMS)", focus: "Annex A controls, cryptography (A.8.24), risk assessment (6.1.2).", plain: "The information-security standard. It proves you protect client data with real controls — access rights, encryption, staff training, incident response — not just a password policy.", example: "Any NHS, MoD or financial-services buyer asking 'How do you protect our data?' expects an ISO 27001 certificate or a mapped equivalent." },
  { code: "ISO 22301", title: "Business Continuity", focus: "Impact analysis, recovery objectives, remediation planning.", plain: "Plans for keeping the business running when something goes wrong — a cyber attack, a fire, a key person leaving.", example: "A local authority contract asks 'What happens if your office is inaccessible on Monday?' — ISO 22301 is your documented answer." },
  { code: "ISO 37001", title: "Anti-Bribery", focus: "Compliance controls, monitoring, s.57-64 PA23 breach detection.", plain: "A management system that shows you actively prevent bribery and corruption — due diligence on suppliers, gifts registers, whistleblower channels.", example: "Under the Procurement Act 2023 (s.57–64), buyers can exclude bidders for corruption findings. ISO 37001 is the defence." },
  { code: "ISO 37301", title: "Compliance Management", focus: "Regulatory change tracking, compliance culture, PPN monitoring.", plain: "The umbrella standard for keeping up with every law and regulation that applies to you, and proving you actually follow them.", example: "When new procurement rules land (like a fresh PPN), ISO 37301 is the system that tells you within days, not months." },
  { code: "ISO 42001", title: "AI Management System", focus: "AI risk assessment (6.1.2), lifecycle governance, evaluation (9.2).", plain: "Brand-new standard (2023) for organisations that use or build AI. It asks: who is accountable, how do you test for bias, how do humans stay in the loop?", example: "If your bid response was drafted by AI, ISO 42001 is what proves you didn't just paste the output — a human reviewed and signed off." },
  { code: "ISO 44001", title: "Collaborative Business Relationships", focus: "Partner tiers (C1/C2/C3), joint governance, reseller controls.", plain: "The standard for managing partners, subcontractors and resellers as a genuine team rather than an arms-length supply chain.", example: "Framework buyers who need consortium bids look for ISO 44001 to prove the lead bidder can actually run the partnership, not just sign contracts." },
  { code: "ISO 45001", title: "Occupational Health & Safety", focus: "Hazard ID, TUPE screening, worker participation.", plain: "The workplace health-and-safety management standard — hazard registers, incident reporting, and worker consultation.", example: "Any contract involving on-site work (construction, facilities, care) treats ISO 45001 as effectively mandatory." },
  { code: "ISO 55001", title: "Asset Management", focus: "Evidence Vault, BKR integrity, lifecycle of policy assets.", plain: "A framework for managing valuable assets — physical or informational — across their whole life, from acquisition to disposal.", example: "BidSense uses this to prove your compliance evidence (certificates, policies, CVs) is authentic, current and traceable in the BKR." },
];

export interface LegalRef {
  title: string;
  body: string;
}

export const legalRefs: LegalRef[] = [
  {
    title: "GDPR Article 28(2) — Sub-processor Disclosure",
    body:
      "All AI sub-processors used by BidSense are disclosed via Data Processing Agreements. Client controllers retain the right to object to any listed sub-processor.",
  },
  {
    title: "SI 2018/480 — ICO Data Fee (Micro-tier)",
    body:
      "BidSense operates the micro-tier data protection fee at £40/year with the Information Commissioner's Office as required by the Data Protection (Charges and Information) Regulations 2018.",
  },
  {
    title: "UCTA 1977 — Liability Cap",
    body:
      "All engagements are governed by an Unfair Contract Terms Act 1977-enforceable liability cap set at 100% of fees paid in the preceding 12 months. No consequential loss liability.",
  },
  {
    title: "Procurement Act 2023",
    body:
      "In force from 24 February 2025. PCR 2015 continues to govern procurements commenced before that date. All standstill briefs cite the applicable regime.",
  },
  {
    title: "Data (Use and Access) Act 2025 (DUAA)",
    body:
      "Royal Assent 19 June 2025; phased in through June 2026 (key tranche in force 5 February 2026). Amends UK GDPR, the DPA 2018 and PECR — new 'recognised legitimate interests' basis, Article 22 replaced by Articles 22A–22D on automated decision-making, ICO restructured into the Information Commission, and PECR fines aligned to UK GDPR levels (up to £17.5m / 4% of global turnover). Directly relevant to any AI-generated compliance status issued without human sign-off.",
  },
];