// Unit tests for pricing compliance auditor
// Tests that the auditor correctly identifies illegal RPM patterns

import { expect, describe, it } from 'vitest';
import { validatePricingAgreement, detectPricingViolations } from './pricing-compliance-auditor';

describe('Pricing Compliance Auditor', () => {
  describe('Illegal RPM Detection', () => {
    it('should flag: "cannot charge below £X"', () => {
      const text = 'Resellers cannot charge below £150 for this service.';
      const result = validatePricingAgreement(text);
      expect(result.isCompliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].violationType).toBe('ILLEGAL_RPM');
      expect(result.violations[0].severity).toBe('CRITICAL');
    });

    it('should flag: "minimum charge requirement"', () => {
      const text = 'There is a minimum charge requirement of £200 for all resellers.';
      const result = validatePricingAgreement(text);
      expect(result.isCompliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should flag: "floor price"', () => {
      const text = 'The floor price for this contract is £500 and cannot be undercut.';
      const result = validatePricingAgreement(text);
      expect(result.isCompliant).toBe(false);
    });

    it('should flag: "must charge at least £X"', () => {
      const text = 'Resellers must charge at least £300 for services.';
      const result = validatePricingAgreement(text);
      expect(result.isCompliant).toBe(false);
      expect(result.violations[0].cmaRisk).toBe('IMMEDIATE_ENFORCEMENT');
    });
  });

  describe('Coercion Pattern Detection', () => {
    it('should flag: "penalty if selling below"', () => {
      const text = 'Resellers face a penalty if they sell below the agreed price.';
      const result = validatePricingAgreement(text);
      expect(result.isCompliant).toBe(false);
      expect(result.violations[0].violationType).toBe('COERCION_TO_MAINTAIN_PRICE');
      expect(result.violations[0].severity).toBe('HIGH');
    });

    it('should flag: "supply withdrawal if discount"', () => {
      const text = 'We will withdraw supply if resellers offer discounts below our recommended price.';
      const result = validatePricingAgreement(text);
      expect(result.isCompliant).toBe(false);
    });
  });

  describe('Legal Pricing Language', () => {
    it('should ALLOW: "recommended resale price"', () => {
      const text = 'The recommended resale price is £200. Resellers are free to set their own price.';
      const result = validatePricingAgreement(text);
      // Should not have ILLEGAL_RPM violations
      const illegalRPMViolations = result.violations.filter((v) => v.violationType === 'ILLEGAL_RPM');
      expect(illegalRPMViolations.length).toBe(0);
    });

    it('should ALLOW: "resellers are free to set their own price"', () => {
      const text =
        'Our recommended price is £300, but resellers are free to set their own price below this.';
      const result = validatePricingAgreement(text);
      const illegalRPMViolations = result.violations.filter((v) => v.violationType === 'ILLEGAL_RPM');
      expect(illegalRPMViolations.length).toBe(0);
    });

    it('should ALLOW: "maximum resale price" (genuine max, not disguised minimum)', () => {
      const text = 'The maximum resale price is capped at £500 to ensure affordability.';
      const result = validatePricingAgreement(text);
      // This should be compliant (max prices are legal)
      const illegalRPMViolations = result.violations.filter((v) => v.violationType === 'ILLEGAL_RPM');
      expect(illegalRPMViolations.length).toBe(0);
    });
  });

  describe('Mixed Scenarios', () => {
    it('should flag violation even if legal language is present', () => {
      const text =
        'Recommended price is £200. Resellers are free to set their own price, but cannot charge below £150.';
      const result = validatePricingAgreement(text);
      expect(result.isCompliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should not flag violations if purely legal', () => {
      const text =
        'Recommended resale price: £300. Resellers may offer any discount they choose. Maximum price cap: £500 for affordability.';
      const result = validatePricingAgreement(text);
      const illegalViolations = result.violations.filter(
        (v) => v.violationType === 'ILLEGAL_RPM' || v.violationType === 'COERCION_TO_MAINTAIN_PRICE'
      );
      expect(illegalViolations.length).toBe(0);
    });
  });

  describe('Severity and Risk Assessment', () => {
    it('should mark minimum price enforcement as CRITICAL severity', () => {
      const text = 'Resellers cannot charge below £100.';
      const result = validatePricingAgreement(text);
      const criticalViolations = result.violations.filter((v) => v.severity === 'CRITICAL');
      expect(criticalViolations.length).toBeGreaterThan(0);
    });

    it('should mark CMA risk as IMMEDIATE_ENFORCEMENT for RPM', () => {
      const text = 'Minimum charge requirement: £200.';
      const result = validatePricingAgreement(text);
      const immediateRiskViolations = result.violations.filter(
        (v) => v.cmaRisk === 'IMMEDIATE_ENFORCEMENT'
      );
      expect(immediateRiskViolations.length).toBeGreaterThan(0);
    });
  });
});
