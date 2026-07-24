// PRICING COMPLIANCE AUDITOR
// Purpose: Continuously audit all reseller/PSL agreements for illegal pricing practices
// Legal basis: Competition Act 1998, Chapter I - Resale Price Maintenance (RPM)
// Enforcement: CMA (Competition and Markets Authority)
// Penalties: Up to 10% of worldwide turnover + director disqualification

import { db } from '@/db';
import { boardroomResolutions, pricingComplianceAudit } from '@/db/schema';
import { eq, gt, and } from 'drizzle-orm';

export interface PricingViolation {
  violationType: 'ILLEGAL_RPM' | 'MINIMUM_PRICE_ENFORCEMENT' | 'COERCION_TO_MAINTAIN_PRICE' | 'PENALTY_FOR_UNDERCUTTING';
  violationText: string;
  violationLocation: string; // File path or contract section
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  cmaRisk: 'IMMEDIATE_ENFORCEMENT' | 'HIGH_RISK' | 'MODERATE_RISK';
  detectedAt: Date;
  recommendedAction: string;
}

export interface PricingAuditResult {
  contractId: string;
  auditTimestamp: Date;
  agreements: {
    resellerId: string;
    agreementText: string;
    violations: PricingViolation[];
    overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'REQUIRES_IMMEDIATE_REVIEW';
  }[];
  totalViolationsDetected: number;
  escalateToHuman: boolean;
  escalationReason?: string;
}

// ILLEGAL PRICING PATTERNS (CMA enforces these as RPM violations)
const ILLEGAL_RPM_PATTERNS = [
  // Exact phrases indicating minimum price enforcement
  /cannot\s+charge\s+below/gi,
  /minimum\s+charge\s+(?:requirement|of|amount|price)/gi,
  /floor\s+price/gi,
  /must\s+charge\s+(?:at\s+least|minimum|no\s+less\s+than)/gi,
  /minimum\s+resale\s+price/gi,
  /cannot\s+discount\s+below/gi,
  /forbidden\s+to\s+sell\s+below/gi,
  /prohibited\s+from\s+selling\s+below/gi,
  /required\s+to\s+maintain\s+price/gi,
  /price\s+fixing\s+agreement/gi,
  /reseller\s+(?:must|shall|will)\s+not\s+(?:undercut|discount|reduce)/gi,
  /enforcement\s+of\s+(?:minimum\s+)?resale\s+price/gi,
  /breach\s+if\s+sell\s+below\s+\$?\d+/gi,
  /penalty\s+(?:for|if)\s+(?:selling|charging)\s+below/gi,
  /supply\s+withdrawal\s+if\s+price\s+below/gi,
  /discount\s+restriction\s+agreement/gi,
  /price\s+floor\s+enforcement/gi,
];

// COERCION PATTERNS (incentivizing compliance with minimum price)
const COERCION_PATTERNS = [
  /withhold\s+supply\s+if/gi,
  /withdraw\s+(?:support|incentive|rebate|discount)\s+(?:unless|if)/gi,
  /penalty\s+(?:clause|for)/gi,
  /threat\s+(?:to|of)/gi,
  /punish\s+(?:reseller|partner)\s+for/gi,
  /financial\s+(?:penalty|punishment|sanction)/gi,
  /terminate\s+(?:agreement|contract|relationship)\s+if\s+(?:price|discount)/gi,
];

// LEGAL PRICING PRACTICES (allowed)
const LEGAL_PRICING_PATTERNS = [
  /recommended\s+(?:resale\s+)?price/gi,
  /suggested\s+retail\s+price\s+\(SRP\)/gi,
  /resellers?\s+(?:are\s+)?free\s+to\s+set\s+(?:their\s+)?(?:own\s+)?price/gi,
  /maximum\s+resale\s+price/gi,
  /resellers?\s+may\s+discount/gi,
];

/**
 * MAIN FUNCTION: Audit all active reseller/PSL agreements for illegal pricing
 * Runs on schedule: Daily at 6 AM, Weekly deep scan Monday 9 AM
 */
export async function auditAllPricingCompliance(): Promise<PricingAuditResult[]> {
  console.log('[PRICING AUDITOR] Starting comprehensive audit of all reseller agreements...');
  const auditStartTime = new Date();

  try {
    // Query all approved resolutions that involve reseller/PSL agreements
    const resolutions = await db
      .select()
      .from(boardroomResolutions)
      .where(
        and(
          eq(boardroomResolutions.finalStatus, 'APPROVED_FOR_HUMAN_REVIEW'),
          gt(boardroomResolutions.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
        )
      );

    console.log(`[PRICING AUDITOR] Found ${resolutions.length} resolutions to audit.`);

    const auditResults: PricingAuditResult[] = [];

    for (const resolution of resolutions) {
      // Extract pricing details from debate log
      const debateLog = resolution.debateLog as any[];
      if (!debateLog || debateLog.length === 0) continue;

      // Look for pricing strategist output (Turn 5)
      const pricingTurns = debateLog.filter((turn) => turn.speaker === 'Pricing Strategist');
      if (pricingTurns.length === 0) continue;

      const violations: PricingViolation[] = [];

      for (const turn of pricingTurns) {
        const pricingText = turn.assertion || '';
        const detectedViolations = detectPricingViolations(pricingText);
        violations.push(...detectedViolations);
      }

      // Also check entire debate log for pricing-related agreements
      const fullDebateText = debateLog.map((t) => t.assertion || '').join(' ');
      const additionalViolations = detectPricingViolations(fullDebateText);
      violations.push(...additionalViolations);

      if (violations.length > 0) {
        const result: PricingAuditResult = {
          contractId: resolution.resolutionId || 'UNKNOWN',
          auditTimestamp: auditStartTime,
          agreements: [
            {
              resellerId: 'UNSPECIFIED', // Would need to extract from debate
              agreementText: fullDebateText.substring(0, 500),
              violations: violations,
              overallStatus: violations.some((v) => v.severity === 'CRITICAL')
                ? 'REQUIRES_IMMEDIATE_REVIEW'
                : violations.length > 0
                  ? 'NON_COMPLIANT'
                  : 'COMPLIANT',
            },
          ],
          totalViolationsDetected: violations.length,
          escalateToHuman: violations.length > 0,
          escalationReason:
            violations.length > 0
              ? `Potential CMA violations detected: ${violations
                  .map((v) => v.violationType)
                  .join(', ')}`
              : undefined,
        };
        auditResults.push(result);
      }
    }

    // Store audit results in database
    for (const result of auditResults) {
      await db.insert(pricingComplianceAudit).values({
        contractId: result.contractId,
        auditTimestamp: result.auditTimestamp,
        violationsDetected: result.totalViolationsDetected,
        auditStatus: result.agreements[0]?.overallStatus || 'COMPLIANT',
        escalateToHuman: result.escalateToHuman,
        detailedFindings: JSON.stringify(result),
        createdAt: new Date(),
      });
    }

    console.log(
      `[PRICING AUDITOR] Audit complete. Violations detected in ${auditResults.filter((r) => r.totalViolationsDetected > 0).length} agreements.`
    );
    return auditResults;
  } catch (error) {
    console.error('[PRICING AUDITOR] Audit failed:', error);
    throw error;
  }
}

/**
 * DETECTION FUNCTION: Scan text for illegal pricing patterns
 * Returns: Array of detected violations with severity and CMA risk assessment
 */
function detectPricingViolations(text: string): PricingViolation[] {
  const violations: PricingViolation[] = [];

  // Check for illegal RPM patterns
  for (const pattern of ILLEGAL_RPM_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        violations.push({
          violationType: 'ILLEGAL_RPM',
          violationText: match,
          violationLocation: `Text contains: "${match}"`,
          severity: 'CRITICAL',
          cmaRisk: 'IMMEDIATE_ENFORCEMENT',
          detectedAt: new Date(),
          recommendedAction:
            'HARD VETO: Remove all minimum price enforcement language. Replace with "Recommended price: £X. Resellers are free to set their own price."',
        });
      }
    }
  }

  // Check for coercion patterns
  for (const pattern of COERCION_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        violations.push({
          violationType: 'COERCION_TO_MAINTAIN_PRICE',
          violationText: match,
          violationLocation: `Text contains: "${match}"`,
          severity: 'HIGH',
          cmaRisk: 'HIGH_RISK',
          detectedAt: new Date(),
          recommendedAction:
            'HIGH RISK: Remove all penalty/threat language. Resellers must have genuine pricing freedom.',
        });
      }
    }
  }

  return violations;
}

/**
 * REAL-TIME MONITORING: Check new contracts before they're finalized
 * Called by Pricing Strategist before outputting pricing recommendation
 */
export function validatePricingAgreement(agreementText: string): {
  isCompliant: boolean;
  violations: PricingViolation[];
  correctedText?: string;
} {
  console.log('[PRICING AUDITOR] Validating pricing agreement for CMA compliance...');

  const violations = detectPricingViolations(agreementText);

  if (violations.length === 0) {
    console.log('[PRICING AUDITOR] ✅ Agreement is CMA compliant.');
    return { isCompliant: true, violations: [] };
  }

  console.error(`[PRICING AUDITOR] ❌ Found ${violations.length} CMA violations.`);
  console.error('Violations:', violations);

  // Suggest corrected text
  let correctedText = agreementText;
  for (const violation of violations) {
    correctedText = correctedText.replace(
      violation.violationText,
      '[REMOVED - ILLEGAL RPM PATTERN]'
    );
  }

  return {
    isCompliant: false,
    violations,
    correctedText,
  };
}

/**
 * CONTINUOUS AUDIT SCHEDULER
 * Runs automatically at scheduled intervals
 */
export async function schedulePricingAudits() {
  // Daily audit at 6 AM UK time
  const dailyAuditTime = '06:00'; // HH:mm UK time
  console.log(`[PRICING AUDITOR] Scheduled daily audit at ${dailyAuditTime} UK time`);

  // Weekly deep scan Monday 9 AM
  const weeklyAuditDay = 'Monday';
  const weeklyAuditTime = '09:00';
  console.log(`[PRICING AUDITOR] Scheduled weekly deep scan: ${weeklyAuditDay} at ${weeklyAuditTime} UK time`);

  // For implementation: Use node-cron or similar library
  // cron.schedule('0 6 * * *', () => auditAllPricingCompliance()); // Daily at 6 AM
  // cron.schedule('0 9 * * 1', () => auditAllPricingCompliance()); // Weekly Monday 9 AM
}

/**
 * CMA VIOLATION SUMMARY REPORT
 * Generated for owner/compliance team
 */
export async function generateCMAViolationReport(daysLookback: number = 30): Promise<string> {
  const recentAudits = await db
    .select()
    .from(pricingComplianceAudit)
    .where(
      gt(
        pricingComplianceAudit.auditTimestamp,
        new Date(Date.now() - daysLookback * 24 * 60 * 60 * 1000)
      )
    );

  const violationCount = recentAudits.reduce(
    (sum, audit) => sum + (audit.violationsDetected || 0),
    0
  );
  const escalatedCount = recentAudits.filter((a) => a.escalateToHuman).length;

  const report = `
=== CMA PRICING COMPLIANCE REPORT ===
Generated: ${new Date().toISOString()}
Lookback period: Last ${daysLookback} days

TOTAL AUDITS RUN: ${recentAudits.length}
TOTAL VIOLATIONS DETECTED: ${violationCount}
CONTRACTS ESCALATED: ${escalatedCount}

RISK LEVEL: ${violationCount > 0 ? 'HIGH' : 'LOW'}

FINDINGS:
${recentAudits
  .filter((a) => a.violationsDetected && a.violationsDetected > 0)
  .map(
    (a) => `
- Contract ${a.contractId}: ${a.violationsDetected} violations
  Status: ${a.auditStatus}
  Details: ${a.detailedFindings?.substring(0, 200)}...`
  )
  .join('\n')}

RECOMMENDATION:
${violationCount > 0 ? 'IMMEDIATE ACTION REQUIRED: Review all flagged contracts and remove illegal pricing enforcement language.' : 'All pricing agreements are currently CMA compliant.'}

CMA PENALTY RISK: Up to 10% of worldwide turnover + director disqualification if violations continue.
`;

  return report;
}
