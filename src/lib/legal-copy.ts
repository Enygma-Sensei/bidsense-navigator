// Legal & policy copy centralised so the /legal pages render consistent
// language. These are opinionated defaults derived from typical UK SaaS
// posture (UK GDPR / DPA 2018, PECR, Consumer Rights Act 2015, Modern
// Slavery Act, ICO guidance, ISO 27001 Annex A themes, ENISA SME
// baseline). Owners should have a solicitor review before publication.

export interface PolicyDoc {
  slug: "privacy" | "terms" | "dpa" | "sla" | "security";
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
  lastReviewed: string;
}

export const POLICIES: PolicyDoc[] = [
  {
    slug: "privacy",
    title: "Privacy Notice",
    intro:
      "How BidSense collects, uses, retains and shares personal data. Written for UK GDPR / Data Protection Act 2018 compliance and ICO transparency guidance.",
    lastReviewed: "2026-07-22",
    sections: [
      { heading: "Controller", body: "BidSense (the platform owner) is the data controller for account holders. Where clients bring their own end-user data into the platform, they are the controller and BidSense acts as processor under the DPA schedule." },
      { heading: "What we collect", body: "Account details (name, email, org), authentication metadata, billing details processed by Stripe, uploaded tender documents, generated bid drafts, usage telemetry (page views, feature interactions, request latencies)." },
      { heading: "Lawful bases", body: "Contract (delivery of the service), legitimate interests (security monitoring, fraud prevention, product improvement), legal obligation (financial records under HMRC MTD), and consent for optional marketing communications." },
      { heading: "Retention", body: "Account data: for the life of the contract plus 24 months. Uploaded documents: 12 months by default, exportable and deletable earlier on request. Financial records: 6 years to satisfy HMRC MTD retention." },
      { heading: "Sharing", body: "Sub-processors listed in our sub-processor register (Stripe for payments, Supabase for database & auth, the Lovable AI Gateway for model inference). We do not sell personal data." },
      { heading: "Your rights", body: "Access, rectification, erasure, restriction, portability, objection, and complaint to the ICO (ico.org.uk). Contact privacy@bidsense.example to exercise a right; we respond within one calendar month." },
      { heading: "International transfers", body: "Where a sub-processor is outside the UK, transfers are protected by the UK Addendum to the EU SCCs and/or an adequacy decision." },
      { heading: "Contact", body: "privacy@bidsense.example — the platform owner acts as Data Protection Point of Contact and appoints a DPO when the ICO threshold is met." },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Service",
    intro:
      "The contract between the customer and BidSense. Governs account use, licensing, payment, acceptable use and limitation of liability. Consumer Rights Act 2015 applies where the customer is a consumer.",
    lastReviewed: "2026-07-22",
    sections: [
      { heading: "Licence", body: "BidSense grants a non-exclusive, non-transferable licence to use the platform for the number of seats purchased. Seat limits are enforced (see Licensing)." },
      { heading: "Acceptable use", body: "No misuse of AI outputs, no re-selling raw outputs as your own certified opinion without human review, no attempt to circumvent role-based access controls, no upload of unlawful content." },
      { heading: "Fees & renewals", body: "Fees per the Order Form, VAT added where applicable. Renewals auto-continue unless cancelled 30 days before renewal date." },
      { heading: "Trials", body: "Trial periods run for 14 days by default. Trial content is retained for 30 days after trial end unless converted to a paid plan." },
      { heading: "IP", body: "You keep IP in your uploads and generated bids; BidSense keeps IP in the platform, models, prompts and derived aggregate analytics." },
      { heading: "Warranties", body: "Provided 'as is' beyond the SLA. AI outputs are decision support, not certified legal or financial advice — always subject to human review." },
      { heading: "Liability", body: "Liability capped at fees paid in the preceding 12 months, save for statutory liabilities that cannot be excluded (death/personal injury, fraud, breach of implied terms in consumer contracts)." },
      { heading: "Termination", body: "Either party may terminate for material breach with 30 days' cure. On termination you may export your data for 60 days; after that it is securely deleted." },
      { heading: "Governing law", body: "England and Wales; exclusive jurisdiction of the English courts." },
    ],
  },
  {
    slug: "dpa",
    title: "Data Processing Addendum",
    intro:
      "The Article 28 DPA supplement that governs BidSense's role as a processor of Client personal data. Incorporates the UK Addendum to the EU Standard Contractual Clauses for restricted transfers.",
    lastReviewed: "2026-07-22",
    sections: [
      { heading: "Subject matter", body: "Provision of tender-intelligence services (document parsing, bid drafting, compliance mapping)." },
      { heading: "Duration", body: "For the term of the main Terms of Service, plus the export window described therein." },
      { heading: "Nature and purpose", body: "Storage, hosting, model inference, analytics and support related to the services." },
      { heading: "Categories of data", body: "Contact identifiers of Client's staff and third-party contacts, uploaded tender documents which may contain incidental personal data." },
      { heading: "Processor obligations", body: "Only act on documented Controller instructions, ensure staff are under confidentiality, apply appropriate technical & organisational measures (see Security), engage sub-processors only under equivalent obligations with prior notice, assist with data subject rights and breach notification, delete/return data on termination." },
      { heading: "Sub-processors", body: "Current sub-processors listed in our Sub-Processor Register. Controllers are notified of additions with 14 days' objection window." },
      { heading: "Breach notification", body: "Processor notifies Controller without undue delay and in any event within 24 hours of confirming a personal data breach." },
      { heading: "International transfers", body: "Where restricted transfers occur, the parties are deemed to have entered into the UK IDTA / UK Addendum to the EU SCCs (Module 2 or 3 as applicable)." },
    ],
  },
  {
    slug: "sla",
    title: "Service Level Agreement",
    intro:
      "BidSense's committed availability, response and remediation targets. Applies to paid tenants; trials are on a best-effort basis.",
    lastReviewed: "2026-07-22",
    sections: [
      { heading: "Uptime target", body: "99.9% monthly availability of the core platform. Excludes scheduled maintenance (advertised 5 business days in advance) and force majeure." },
      { heading: "Support hours", body: "09:00–18:00 UK business days for standard support; enterprise plans include 24/7 P1 response." },
      { heading: "Severity levels", body: "P1 total outage: response 30 min, restore target 4h. P2 major degradation: response 2h, restore target 1 business day. P3 minor: response 1 business day, restore target 5 business days." },
      { heading: "Service credits", body: "Below 99.9% uptime: 10% monthly fee credit. Below 99.0%: 25%. Below 95.0%: 50%. Credits capped at 50% of the affected month's fees and are the sole remedy for missed uptime." },
      { heading: "Reporting", body: "Monthly availability report published in the customer portal; incident post-mortems for any P1 within 5 business days." },
    ],
  },
  {
    slug: "security",
    title: "Security & Trust",
    intro:
      "Technical and organisational measures BidSense operates. Aligned with ISO 27001 Annex A themes, Cyber Essentials Plus, and the NCSC Cloud Security Principles.",
    lastReviewed: "2026-07-22",
    sections: [
      { heading: "Access control", body: "Role-based access control (Owner / Reseller / PSL / Client) enforced at UI, API and database (RLS) layers. Least-privilege service accounts. MFA required for administrative access." },
      { heading: "Encryption", body: "TLS 1.2+ in transit, AES-256 at rest, per-tenant key isolation on sensitive columns where practical." },
      { heading: "Secrets", body: "No secrets in the client bundle. LOVABLE_API_KEY and Stripe keys held in server-side secret storage; rotated on personnel change." },
      { heading: "Logging & monitoring", body: "Structured application logs, error reporting, gateway request IDs (X-Lovable-AIG-Run-ID) propagated for traceability. Alerting on error rates, latency, and auth anomalies." },
      { heading: "Vulnerability management", body: "Dependency scanning on every build, quarterly external penetration test, annual ISO 27001 surveillance. Patch SLA: critical 24h, high 7d." },
      { heading: "Business continuity", body: "Daily encrypted backups, cross-region replication for the primary database, tested recovery procedures with an RTO of 4h and RPO of 15 min." },
      { heading: "Incident response", body: "Named on-call rota; 24h Controller notification for personal data breaches; ICO notification within 72h when the breach meets the risk threshold; customer post-mortem within 5 business days." },
      { heading: "Sub-processor register", body: "Stripe (payments), Supabase (auth, storage, database), Lovable AI Gateway (model inference), Cloudflare (edge runtime)." },
    ],
  },
];

export function findPolicy(slug: string): PolicyDoc | undefined {
  return POLICIES.find((p) => p.slug === slug);
}