import type { QuotationDocument } from '../types';

/**
 * Pre-flight checks for a document, run before the user sends it to a client.
 * Audits placeholder data, calculations, overflow warnings, and signature readiness.
 * Pure logic, renders nothing. The UI layer decides how to surface the issues.
 */
export type AuditSeverity = 'error' | 'warning' | 'info';

export interface AuditIssue {
  id: string;
  severity: AuditSeverity;
  /** Which editor tab the user should go to. */
  tab: string;
  message: string;
  hint?: string;
}

/** Values shipped as sample data that look real enough to be sent by mistake. */
const PLACEHOLDER_PATTERNS = [/^X{2}-X+$/i, /^e\.g\./i, /^your-/i, /XXXX/];

const looksLikePlaceholder = (value?: string): boolean =>
  Boolean(value && PLACEHOLDER_PATTERNS.some((re) => re.test(value.trim())));

const plural = (n: number, one: string, many: string): string => (n > 1 ? many : one);

export const auditDocument = (doc: QuotationDocument): AuditIssue[] => {
  const issues: AuditIssue[] = [];
  const isInvoice = doc.type === 'INVOICE';

  // ---------------------------------------------------------------------------
  // Length & multi-page overflow checks (Content is fully rendered without hard drops)
  // ---------------------------------------------------------------------------
  const activeDeliverables = (doc.deliverables || []).filter((d) => d.included);
  if (activeDeliverables.length > 8) {
    issues.push({
      id: 'deliverables-multipage',
      severity: 'info',
      tab: 'Deliverables',
      message: `${activeDeliverables.length} deliverables included — will cleanly format across multi-page PDF.`,
      hint: 'All deliverables are included in full with no text truncation.',
    });
  }

  const activeMilestones = (doc.eventCoverage || []).filter(
    (m) => m.dayTitle || (m.services || []).length
  );
  if (activeMilestones.length > 6) {
    issues.push({
      id: 'milestones-multipage',
      severity: 'info',
      tab: 'Scope & Phases',
      message: `${activeMilestones.length} project phases included.`,
      hint: 'All phases and task items are rendered in full.',
    });
  }

  if (isInvoice && (doc.termsAndConditions || []).length > 6) {
    issues.push({
      id: 'invoice-terms-long',
      severity: 'info',
      tab: 'Taxes & Terms',
      message: `${doc.termsAndConditions.length} invoice terms configured.`,
      hint: 'All clauses are printed with full line wrapping.',
    });
  }

  // ---------------------------------------------------------------------------
  // Upsells rendering check
  // ---------------------------------------------------------------------------
  const optionalAddons = (doc.pricingItems || []).filter((i) => i.isOptional && !i.selected);
  if (optionalAddons.length > 0) {
    issues.push({
      id: 'upsells-pdf-included',
      severity: 'info',
      tab: 'Pricing & Items',
      message: `${optionalAddons.length} optional add-${plural(optionalAddons.length, 'on', 'ons')} available.`,
      hint: 'Optional upgrades appear with an "Available Add-on" tag in the PDF and can be toggled on the interactive link.',
    });
  }

  // ---------------------------------------------------------------------------
  // Sample data that would embarrass the sender
  // ---------------------------------------------------------------------------
  if (looksLikePlaceholder(doc.studio?.gstin)) {
    issues.push({
      id: 'placeholder-tax-id',
      severity: 'warning',
      tab: 'Business Profile',
      message: 'Your tax registration number is still the sample value.',
      hint: '"' + doc.studio.gstin + '" will print on the document exactly as shown.',
    });
  }

  // ---------------------------------------------------------------------------
  // An invoice with no way to pay it
  // ---------------------------------------------------------------------------
  if (isInvoice && doc.sectionVisibility?.bankDetails !== false) {
    const hasBank = Boolean(doc.studio?.accountNumber && doc.studio?.bankName);
    const hasUpi = Boolean(doc.studio?.upiId || doc.studio?.paymentLink);
    if (!hasBank && !hasUpi) {
      issues.push({
        id: 'invoice-no-payment-method',
        severity: 'error',
        tab: 'Business Profile',
        message: 'This invoice shows no way to pay it.',
        hint: 'Add bank details or a UPI ID / payment link, or hide the payment section.',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Tax configured but inert
  // ---------------------------------------------------------------------------
  const taxType = doc.taxConfig?.type || doc.taxType;
  const taxPercent = doc.taxConfig?.percent ?? doc.taxPercent ?? 0;
  if (taxType && taxType !== 'none' && taxPercent === 0) {
    issues.push({
      id: 'tax-type-without-rate',
      severity: 'warning',
      tab: 'Taxes & Terms',
      message: 'A tax type is selected but the rate is 0%.',
      hint: 'No tax line will appear. Set a rate, or set the tax type to None.',
    });
  }

  // ---------------------------------------------------------------------------
  // Basics that make a document unusable
  // ---------------------------------------------------------------------------
  if (!(doc.pricingItems || []).some((i) => !i.isOptional || i.selected)) {
    issues.push({
      id: 'no-billable-items',
      severity: 'error',
      tab: 'Pricing & Items',
      message: 'There are no billable line items.',
      hint: 'Every item is either missing or marked as an optional add-on.',
    });
  }

  if (!doc.client?.clientName?.trim() && !doc.client?.nameOfEvent?.trim()) {
    issues.push({
      id: 'no-client',
      severity: 'error',
      tab: 'Client & Details',
      message: 'No client name or project name is set.',
    });
  }

  if (!doc.client?.email?.trim()) {
    issues.push({
      id: 'no-client-email',
      severity: 'info',
      tab: 'Client & Details',
      message: 'No client email — you will have to send the link manually.',
    });
  }

  return issues;
};

/** Convenience for a badge: the count that should block sending. */
export const countBlocking = (issues: AuditIssue[]): number =>
  issues.filter((i) => i.severity === 'error').length;
