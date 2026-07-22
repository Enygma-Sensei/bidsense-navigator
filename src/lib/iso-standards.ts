export interface IsoStandard {
  code: string;
  title: string;
  focus: string;
}

export const isoStandards: IsoStandard[] = [
  { code: "ISO 9001", title: "Quality Management", focus: "Process approach, customer focus, continual improvement." },
  { code: "ISO 14001", title: "Environmental Management", focus: "Life-cycle perspective, environmental aspects, PPN 06/21 alignment." },
  { code: "ISO 27001", title: "Information Security (ISMS)", focus: "Annex A controls, cryptography (A.8.24), risk assessment (6.1.2)." },
  { code: "ISO 22301", title: "Business Continuity", focus: "Impact analysis, recovery objectives, remediation planning." },
  { code: "ISO 37001", title: "Anti-Bribery", focus: "Compliance controls, monitoring, s.57-64 PA23 breach detection." },
  { code: "ISO 37301", title: "Compliance Management", focus: "Regulatory change tracking, compliance culture, PPN monitoring." },
  { code: "ISO 42001", title: "AI Management System", focus: "AI risk assessment (6.1.2), lifecycle governance, evaluation (9.2)." },
  { code: "ISO 44001", title: "Collaborative Business Relationships", focus: "Partner tiers (C1/C2/C3), joint governance, reseller controls." },
  { code: "ISO 45001", title: "Occupational Health & Safety", focus: "Hazard ID, TUPE screening, worker participation." },
  { code: "ISO 55001", title: "Asset Management", focus: "Evidence Vault, BKR integrity, lifecycle of policy assets." },
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