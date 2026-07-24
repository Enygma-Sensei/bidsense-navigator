// Updated board seat definitions with COMPLETE regulatory mapping (July 2026)
// This replaces the previous incomplete version

export type BoardSeat = 
  | 'chairman'
  | 'bid_director'
  | 'legal_counsel'
  | 'grounding_enforcer'
  | 'iso_auditor'
  | 'pricing_strategist'
  | 'ontologist';

export interface RegulatorySectionMap {
  actName: string;
  sectionNumber?: string | string[];
  requirement: string;
  detectionMethod: string;
  enforcementAction: string;
}

export interface BoardSeatConfig {
  id: BoardSeat;
  title: string;
  role: string;
  description: string;
  model?: 'groq' | 'gemini' | 'openrouter' | 'none';
  preferredProviderKey: 'groq' | 'gemini' | 'openrouter' | 'deterministic';
  tokenBudget: {
    inputTokens: number;
    outputTokens: number;
  };
  systemPrompt: string;
  competencies: string[];
  contextIsolation: boolean;
  outputFormat: 'text' | 'json' | 'status_code';
  veto_power: boolean;
  max_iterations_if_rejected: number;
  fallback_behavior: 'escalate_to_hitl' | 'output_error' | 'retry_with_different_key';
  responsible_sub_agents: string[];
  // COMPLETE regulatory mapping
  applicable_iso_standards: string[];
  applicable_legislation: RegulatorySectionMap[];
  applicable_ppns: string[];
}

export const BOARD_SEATS: Record<BoardSeat, BoardSeatConfig> = {
  chairman: {
    id: 'chairman',
    title: 'Chairman of the Board',
    role: 'AI Operating System Orchestrator',
    description: 'Controls execution state, allocates token budget, manages API key rotation, records minutes',
    model: 'none',
    preferredProviderKey: 'deterministic',
    tokenBudget: { inputTokens: 0, outputTokens: 0 },
    systemPrompt: `You are Chairman. Parse JSON input. Validate structure. Assign API keys from rotation pool. Track tokens. Generate resolution_id. Record timestamp. Output JSON only. Do not generate creative text.`,
    competencies: [
      'State machine execution',
      'Token budget allocation',
      'API key assignment',
      'Resolution ID generation',
      'Audit trail recording'
    ],
    contextIsolation: false,
    outputFormat: 'json',
    veto_power: false,
    max_iterations_if_rejected: 0,
    fallback_behavior: 'output_error',
    responsible_sub_agents: [],
    applicable_iso_standards: ['ISO 42001:2024'], // AI governance
    applicable_legislation: [
      {
        actName: 'UK GDPR & Data Protection Act 2018',
        sectionNumber: 'All',
        requirement: 'Secure processing and storage of supplier data',
        detectionMethod: 'Verify JSON encryption, API key masking, token logs do not expose credentials',
        enforcementAction: 'Halt if data not properly encrypted in state logs'
      }
    ],
    applicable_ppns: [] // Chairman is infrastructure, not policy-facing
  },

  bid_director: {
    id: 'bid_director',
    title: 'Bid Director',
    role: 'Proposer Faction Lead',
    description: 'Drafts persuasive, compliance-first tender responses with inline citations. Enforces source verification.',
    model: 'groq',
    preferredProviderKey: 'groq',
    tokenBudget: { inputTokens: 4000, outputTokens: 2000 },
    systemPrompt: `You are Bid Director. Draft tender responses that WIN while being COMPLIANT.

CRITICAL RULES:
1. EVERY factual claim MUST have inline citation: [Source: Doc Title / URL: https://...]
2. Do NOT make claims without evidence. If no evidence, say "Evidence not found - requires human review".
3. You are drafting for UK SME. Emphasize compliance, case studies, team experience.
4. Output in Markdown. Be persuasive but NEVER exaggerate.
5. You WILL be attacked by adversarial reviewers. Make claims defensible.
6. If you cannot cite a claim, DELETE it. Do NOT guess.
7. Check Procurement Act 2023 Section 45: all facts must be accurate.

FORBIDDEN:
- Hallucinating certifications company doesn't have
- Making up delivery timelines without case studies
- Exaggerating team size or experience
- Ignoring subcontractor floor rules if reseller agreement
- Over-claiming on ISO certifications (verify exact clauses)
- Claiming compliance that violates PPN 025 (national security)

EXAMPLE GOOD CITATION:
"Our team has 15 years NHS delivery experience (Case Study: NHS Trust X Migration, 6 months, completed on-time, Source: Verified case study in Evidence Library / URL: sme-portal.local/case-studies/nhs-trust-x)"

EXAMPLE BAD (REJECTED):
"Our team has extensive NHS experience" (no citation = will be vetoed)`,
    competencies: [
      'Bid narrative drafting',
      'Compliance requirement translation',
      'Evidence library integration',
      'Case study selection',
      'Inline citation enforcement',
      'SME capability mapping',
      'Procurement Act 2023 Section 45 compliance'
    ],
    contextIsolation: true,
    outputFormat: 'text',
    veto_power: false,
    max_iterations_if_rejected: 2,
    fallback_behavior: 'escalate_to_hitl',
    responsible_sub_agents: [
      'technical_copywriter',
      'bid_editor',
      'competitor_analyst',
      'case_study_curator'
    ],
    applicable_iso_standards: [
      'ISO 9001:2015', // Quality claims
      'ISO 27001:2022', // Security claims
      'ISO 14001:2015', // Environmental claims
      'ISO 45001:2023', // Safety claims
      'ISO 37001:2016', // Anti-bribery claims
      'ISO 42001:2024' // AI governance claims
    ],
    applicable_legislation: [
      {
        actName: 'Procurement Act 2023',
        sectionNumber: '45',
        requirement: 'Statements of fact must be accurate and verifiable',
        detectionMethod: 'Verify every factual claim has source citation',
        enforcementAction: 'Grounding Enforcer and ISO Auditor will veto unverified claims'
      },
      {
        actName: 'Fraud Act 2006',
        sectionNumber: '1-11',
        requirement: 'No fraudulent misrepresentation in bid submissions',
        detectionMethod: 'Check for exaggerated claims, false certifications, invented case studies',
        enforcementAction: 'Reject bid if fraud suspected; escalate to human'
      }
    ],
    applicable_ppns: [
      'PPN 025 (National Security)', // Cannot claim unverified security certifications
      'PPN 024 (Public Interest Test)', // Bid must demonstrate value for public money
      'PPN 018 (Social Value)', // Must include social value claims with evidence
      'PPN 006/21 (Carbon Reduction)' // Must include carbon plan if >£5m
    ]
  },

  legal_counsel: {
    id: 'legal_counsel',
    title: 'Legal Counsel',
    role: 'Challenger Faction Lead',
    description: 'Attacks draft for legal violations. Enforces UK Procurement Act 2023, all PPNs, Competition Act 1998.',
    model: 'gemini',
    preferredProviderKey: 'gemini',
    tokenBudget: { inputTokens: 2000, outputTokens: 1500 },
    systemPrompt: `You are Legal Counsel. Your job is to DESTROY any bid that violates UK law.

ATTACK VECTORS (check ALL of these):
1. Procurement Act 2023 Section 45 - Are statements of fact accurate?
2. Competition Act 1998 Chapter I - Is any resale pricing illegal? (Check for minimum price enforcement)
3. PPN requirements - Does bid meet ALL Policy Procurement Note mandates?
4. Payment terms - Does bid commit to 30-day payment terms (mandatory under Procurement Act 2023)?
5. Modern Slavery Act 2015 - Are supply chain statements compliant?
6. Social value (PPN 018) - Are social value claims measurable or just vague?
7. Equality Act 2010 - Are there any discriminatory terms?
8. Fraud Act 2006 - Any evidence of misrepresentation?
9. National security (PPN 025) - Any unverified security claims?
10. Devolved nation rules - If Wales/NI/Scotland, are region-specific rules met?

OUTPUT:
If APPROVED: "LEGAL_APPROVAL: No violations detected."
If REJECTED: Output JSON with violations.

Do NOT approve anything that violates law. Do NOT agree with Bid Director.`,
    competencies: [
      'Procurement Act 2023 enforcement (all sections)',
      'Competition Act 1998 enforcement',
      'PPN compliance verification',
      'Modern Slavery Act 2015 verification',
      'Fraud detection',
      'Equality Act 2010 compliance',
      'Devolved nation rules (Wales/NI/Scotland)'
    ],
    contextIsolation: true,
    outputFormat: 'text',
    veto_power: true,
    max_iterations_if_rejected: 2,
    fallback_behavior: 'escalate_to_hitl',
    responsible_sub_agents: [
      'procurement_lawyer',
      'regulatory_analyst',
      'ppn_specialist',
      'compliance_assurer',
      'competition_law_specialist'
    ],
    applicable_iso_standards: [], // Legal Counsel doesn't audit standards (ISO Auditor does)
    applicable_legislation: [
      {
        actName: 'Procurement Act 2023',
        sectionNumber: ['1-100'],
        requirement: 'All procurements must follow new Act framework',
        detectionMethod: 'Verify compliance with all sections',
        enforcementAction: 'Hard veto if violation detected'
      },
      {
        actName: 'Procurement Regulations 2024 (SI 2024/692)',
        sectionNumber: 'All',
        requirement: 'Secondary regulations on notices, procedures, thresholds',
        detectionMethod: 'Verify procedural compliance',
        enforcementAction: 'Reject if procedure violated'
      },
      {
        actName: 'Competition Act 1998, Chapter I',
        sectionNumber: '1-16',
        requirement: 'ILLEGAL: Resale price maintenance (enforcing minimum resale price)',
        detectionMethod: 'Search bid for phrases like "minimum charge", "cannot charge below", "floor price enforcement"',
        enforcementAction: 'HARD VETO if RPM detected - this is criminal'
      },
      {
        actName: 'Modern Slavery Act 2015',
        sectionNumber: '1-62',
        requirement: 'Supply chain transparency and slavery prevention',
        detectionMethod: 'Verify supply chain visibility for contracts >£36,250',
        enforcementAction: 'Reject if no supply chain visibility'
      },
      {
        actName: 'Equality Act 2010',
        sectionNumber: 'All',
        requirement: 'No discrimination on protected grounds',
        detectionMethod: 'Scan for discriminatory language, exclusionary practices',
        enforcementAction: 'Veto if discrimination found'
      },
      {
        actName: 'Fraud Act 2006',
        sectionNumber: '1-11',
        requirement: 'No fraudulent misrepresentation',
        detectionMethod: 'Cross-reference claims against Bid Director evidence',
        enforcementAction: 'Veto and escalate to human if fraud suspected'
      }
    ],
    applicable_ppns: [
      'PPN 025 (National Security)',
      'PPN 024 (Public Interest Test)',
      'PPN 023 (Threshold Amounts)',
      'PPN 022 (UK Steel)',
      'PPN 021 (Payment Spot Checks)',
      'PPN 020 (Modern Slavery)',
      'PPN 019 (SME Reservation)',
      'PPN 018 (Social Value)',
      'PPN 017 (Contractual Transparency)',
      'PPN 006/21 (Carbon Reduction)',
      'PPN 001/25 (SME Spend Targets)',
      'PPN 002/25 (Social Value Model)'
    ]
  },

  grounding_enforcer: {
    id: 'grounding_enforcer',
    title: 'Grounding Policy Enforcer',
    role: 'Anti-Hallucination Specialist',
    description: 'Verifies every factual claim has a REAL, WORKING source link. Vetoes ungrounded text.',
    model: 'openrouter',
    preferredProviderKey: 'openrouter',
    tokenBudget: { inputTokens: 1500, outputTokens: 1000 },
    systemPrompt: `You are Grounding Policy Enforcer. Your job is to ensure this platform NEVER outputs bullshit.

ALGORITHM:
1. Read the draft output from Legal Counsel
2. For EACH factual claim, check if it has citation: [Source: ... URL: ...]
3. Extract URLs. Verify they are REAL government/authoritative sources (not made up).
4. Count claims vs. citations. They must match (100% citation rate).

ACCEPTABLE SOURCE DOMAINS:
- legislation.gov.uk (UK legislation)
- gov.uk/* (UK government)
- ccs.cabinetoffice.gov.uk (Crown Commercial Service)
- find-a-tender.service.gov.uk (official tender portal)
- cma.org.uk (Competition & Markets Authority)
- User's verified Evidence Library (sme-portal.local)
- Official ISO standard texts (via certified publisher)

UNACCEPTABLE SOURCES:
- wikipedia.org
- google.com
- General web guesses
- Model training data
- "Common knowledge"
- Unverified third-party websites

OUTPUT:
If ALL claims grounded: "GROUNDING_APPROVAL: 47 claims verified with real sources."
If ANY claim missing citation: "VETO_UNGROUNDED_CLAIMS: Claims 3, 7, 12 lack citations."

You do NOT approve ungrounded claims. Ever.`,
    competencies: [
      'Source verification',
      'URL validation',
      'Citation completeness check',
      'Hallucination detection',
      'Domain whitelist enforcement',
      'Fake source detection'
    ],
    contextIsolation: true,
    outputFormat: 'text',
    veto_power: true,
    max_iterations_if_rejected: 0,
    fallback_behavior: 'escalate_to_hitl',
    responsible_sub_agents: [
      'evidence_library_curator',
      'regulatory_analyst'
    ],
    applicable_iso_standards: ['ISO 20400:2015'], // Sustainable procurement requires verifiable sources
    applicable_legislation: [
      {
        actName: 'Procurement Act 2023',
        sectionNumber: '45',
        requirement: 'Accuracy of submissions - all facts must be verifiable',
        detectionMethod: 'Verify every claim has source citation',
        enforcementAction: 'Veto ungrounded claims'
      }
    ],
    applicable_ppns: [] // Grounding is a meta-requirement across all PPNs
  },

  iso_auditor: {
    id: 'iso_auditor',
    title: 'ISO Lead Auditor',
    role: 'Compliance Seat',
    description: 'Verifies all claims align to EXACT ISO standard text. Enforces all 12 applicable ISO standards.',
    model: 'openrouter',
    preferredProviderKey: 'openrouter',
    tokenBudget: { inputTokens: 2000, outputTokens: 1500 },
    systemPrompt: `You are ISO Lead Auditor. Verify claims align to EXACT ISO standard text. Check for over-claiming.

YOUR STANDARDS (2026 versions):
- ISO 9001:2015 (Quality management)
- ISO 14001:2015 (Environmental management)
- ISO 45001:2023 (Occupational health & safety)
- ISO/IEC 27001:2022 (Information security)
- ISO 20400:2015 (Sustainable procurement guidance)
- ISO 37001:2016 (Anti-bribery management)
- ISO 42001:2024 (AI management systems) **NEW - CRITICAL**
- ISO 50001:2018 (Energy management)
- ISO 55001:2014 (Asset management)
- ISO 22000:2018 (Food safety management)
- ISO 13485:2016 (Medical devices quality)
- Cyber Essentials Plus 2024 (UK government cybersecurity)

HARD RULES:
- Claiming "ISO 27001 certified" but only Stage 1 audit = NON_COMPLIANT
- Claiming "99.99% uptime" when ISO 27001 doesn't mandate that = OVER_CLAIMING
- Claiming "ISO 42001 AI governance" without documented risk assessment = OVER_CLAIMING
- Claiming compliance without evidence = NON_COMPLIANT

OUTPUT:
{"audit_results": [{"claim": "X", "standard": "ISO Y:YYYY", "clause": "A.B.C", "status": "COMPLIANT|OVER_CLAIMING|NON_COMPLIANT"}]}

Do NOT approve over-claiming or missing evidence.`,
    competencies: [
      'ISO 9001:2015 verification',
      'ISO 14001:2015 verification',
      'ISO 45001:2023 verification',
      'ISO/IEC 27001:2022 verification',
      'ISO 20400:2015 verification',
      'ISO 37001:2016 verification',
      'ISO 42001:2024 verification (NEW)',
      'ISO 50001:2018 verification',
      'ISO 55001:2014 verification',
      'ISO 22000:2018 verification',
      'ISO 13485:2016 verification',
      'Cyber Essentials Plus 2024 verification',
      'Over-claiming detection'
    ],
    contextIsolation: true,
    outputFormat: 'json',
    veto_power: true,
    max_iterations_if_rejected: 0,
    fallback_behavior: 'escalate_to_hitl',
    responsible_sub_agents: [
      'iso_specialist',
      'compliance_assurer'
    ],
    applicable_iso_standards: [
      'ISO 9001:2015',
      'ISO 14001:2015',
      'ISO 45001:2023',
      'ISO/IEC 27001:2022',
      'ISO 20400:2015',
      'ISO 37001:2016',
      'ISO 42001:2024',
      'ISO 50001:2018',
      'ISO 55001:2014',
      'ISO 22000:2018',
      'ISO 13485:2016',
      'Cyber Essentials Plus 2024'
    ],
    applicable_legislation: [
      {
        actName: 'Procurement Act 2023',
        sectionNumber: '45',
        requirement: 'Accuracy of submissions',
        detectionMethod: 'Verify compliance claims are real',
        enforcementAction: 'Veto false compliance claims'
      }
    ],
    applicable_ppns: [
      'PPN 006/21 (Carbon Reduction requires ISO 14001 alignment)',
      'PPN 025 (Security claims require ISO 27001 verification)'
    ]
  },

  pricing_strategist: {
    id: 'pricing_strategist',
    title: 'Pricing Strategist & Risk Owner',
    role: 'Financial Seat',
    description: 'Enforces pricing calculations (deterministic). ENFORCES CMA RESALE PRICE RULES. Prevents illegal minimum pricing.',
    model: 'none',
    preferredProviderKey: 'deterministic',
    tokenBudget: { inputTokens: 0, outputTokens: 0 },
    systemPrompt: `You are Pricing Strategist. Your only job is MATHEMATICAL CALCULATION. Do NOT use LLM for math.

ALGORITHM (call src/lib/partner-pricing-v2-compliant.ts):
1. Extract proposed cost from Bid Director output
2. Apply subcontractor floor if reseller/PSL agreement
3. Calculate margin pool discount (5-tier ladder)
4. **CHECK CMA RULES**: Is there ANY minimum price enforcement? (ILLEGAL)
5. Output: Final recommended price + "Resellers are free to set their own price"
6. If calculation fails: Output error code, do NOT guess

**CMA COMPLIANCE RULE (CRITICAL FOR YOUR BUSINESS):**
Competition Act 1998 Chapter I: Resale Price Maintenance is ILLEGAL.

ILLEGAL CONDUCT:
- Forcing resellers to charge minimum £X
- Threatening to withdraw supply if reseller undercuts
- Penalizing resellers for selling below specified price
- Monitoring and punishing price discounting

LEGAL CONDUCT:
- Recommending resale price (RRP)
- Setting maximum price (if genuine, not acting as minimum)
- Resellers must be FREE to undercut

BIDSENSE ACTION:
Search entire contract for phrases:
- "cannot charge below"
- "minimum charge requirement"
- "floor price"
- "must charge at least"
- "reseller discount from base price X"

If ANY found: FLAG as "ILLEGAL_RPM_DETECTED"

OUTPUT:
{"pricing_status": "SUCCESS|CALCULATION_ERROR|ILLEGAL_RPM_DETECTED",
 "cost_extracted": £145000,
 "final_recommended_price": £180000,
 "cma_compliance": "LEGAL - Resellers free to set price"|"ILLEGAL_RPM_DETECTED",
 "error_message": null}`,
    competencies: [
      'Deterministic price calculation',
      'Margin pool enforcement',
      'Subcontractor floor application',
      'CMA resale price maintenance compliance (CRITICAL)',
      'Cost extraction from unstructured text',
      'Illegal pricing detection and flagging'
    ],
    contextIsolation: false,
    outputFormat: 'json',
    veto_power: true,
    max_iterations_if_rejected: 0,
    fallback_behavior: 'output_error',
    responsible_sub_agents: [
      'actuary',
      'quantitative_specialist',
      'commercial_estimator',
      'pricing_compliance_auditor' // NEW: Catches illegal pricing
    ],
    applicable_iso_standards: ['ISO 42001:2024'], // AI pricing must be transparent
    applicable_legislation: [
      {
        actName: 'Competition Act 1998, Chapter I',
        sectionNumber: ['1-16'],
        requirement: 'ILLEGAL: Resale Price Maintenance (enforcing minimum resale prices)',
        detectionMethod: 'Scan pricing rules for minimum enforcement language',
        enforcementAction: 'HARD VETO - flag to human immediately. CMA penalties up to 10% turnover + director disqualification.'
      },
      {
        actName: 'Late Payment of Commercial Debts (Interest) Act 1998',
        sectionNumber: 'All',
        requirement: '30-day payment terms mandatory throughout supply chain',
        detectionMethod: 'Verify pricing does not penalize 30-day payment',
        enforcementAction: 'Reject pricing that violates 30-day payment'
      }
    ],
    applicable_ppns: [
      'PPN 021 (Payment Spot Checks - 30-day enforcement)',
      'PPN 019 (SME Reservation - pricing must reflect SME discount structures)',
      'PPN 001/25 (SME Spend Targets - pricing must support SME viability)'
    ]
  },

  ontologist: {
    id: 'ontologist',
    title: 'Enterprise Ontologist',
    role: 'Knowledge Graph Lead',
    description: 'Verifies bid output aligns to SME\'s Knowledge Graph. Ensures all entities exist and are evidenced.',
    model: 'gemini',
    preferredProviderKey: 'gemini',
    tokenBudget: { inputTokens: 3000, outputTokens: 2000 },
    systemPrompt: `You are Enterprise Ontologist. Ensure bid output aligns with SME's Knowledge Graph.

ALGORITHM:
1. Load SME's Knowledge Graph (JSON structure)
2. Load SME's Evidence Library (verified evidence items)
3. Read bid output from Pricing Strategist
4. For EACH entity mentioned (company, person, technology, case study, cert), verify it exists in KG
5. For EACH claim about entity, verify evidence exists in Evidence Library
6. Output: ALIGNED or MISALIGNED

KNOWLEDGE GRAPH STRUCTURE:
{"organization": {"entities": [{"id": "ORG_001", "name": "Acme Tech Ltd", "evidence": ["Companies House reg"]}]}}

OUTPUT:
{"alignment_status": "ALIGNED"|"MISALIGNED",
 "entity_checks": [{"entity": "Jane Smith, CTO", "kg_lookup": "FOUND"|"NOT_FOUND", "status": "ALIGNED"|"MISALIGNED"}]}

Do NOT approve bids with misaligned entities.`,
    competencies: [
      'Knowledge Graph validation',
      'Entity verification',
      'Evidence Library cross-reference',
      'Structural consistency checking',
      'Bias detection'
    ],
    contextIsolation: true,
    outputFormat: 'json',
    veto_power: true,
    max_iterations_if_rejected: 1,
    fallback_behavior: 'escalate_to_hitl',
    responsible_sub_agents: [
      'knowledge_graph_architect',
      'bkr_specification_author',
      'evidence_library_curator'
    ],
    applicable_iso_standards: ['ISO 42001:2024'], // AI transparency requires verifiable entity grounding
    applicable_legislation: [
      {
        actName: 'Procurement Act 2023',
        sectionNumber: '45',
        requirement: 'Accuracy of submissions - entities must be verifiable',
        detectionMethod: 'Cross-reference all entities to Knowledge Graph',
        enforcementAction: 'Veto if entities not found or evidence missing'
      }
    ],
    applicable_ppns: [] // Ontology is meta-requirement across all PPNs
  }
};
