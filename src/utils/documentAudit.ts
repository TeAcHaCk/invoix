import type { QuotationDocument } from '../types';

/**
 * Pre-flight checks for a document, run before the user sends it to a client.
 *
 * The motivating problem: the printed views cap how much content they render
 * (see RENDER_LIMITS). A user can tick five deliverables, see four in the PDF,
 * and never notice the fifth was dropped — by then they have emailed a client a
 * proposal missing something they promised.
 *
 * Pure logic, renders nothing. The UI layer decides how to surface the issues.
 */

/**
 * How much content each printed view actually shows.
 *
 * These MUST match the slice() calls in the view components. They live here so
 * the audit and the views cannot drift apart — the views should import these
 * rather than hardcoding the numbers a second time.
 */
export const RENDER_LIMITS = {
  /** ModernProposalView: activeDeliverables.slice(0, 4) */
  deliverables: 4,
  /** ModernProposalView: activeMilestones.slice(0, 4) */
  milestones: 4,
  /** ModernProposalView: m.services.slice(0, 3) */
  servicesPerMilestone: 3,
  /** FormalInvoiceView: termsAndConditions.slice(0, 3) */
  invoiceTerms: 3,
} as const;

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
  // Content the document silently drops. The highest-value check here: it is the
  // only warning before a client receives an incomplete document.
  // ---------------------------------------------------------------------------
  const activeDeliverables = (doc.deliverables || []).filter((d) => d.included);
  if (activeDeliverables.length > RENDER_LIMITS.deliverables) {
    const dropped = activeDeliverables.length - RENDER_LIMITS.deliverables;
    issues.push({
      id: 'deliverables-truncated',
      severity: 'error',
      tab: 'Deliverables',
      message: dropped + ' ' + plural(dropped, 'deliverable', 'deliverables') + ' will not appear in the document.',
      hint: 'Only the first ' + RENDER_LIMITS.deliverables + ' of your ' + activeDeliverables.length + ' ticked deliverables are printed.',
    });
  }

  const activeMilestones = (doc.eventCoverage || []).filter(
    (m) => m.dayTitle || (m.services || []).length
  );
  if (activeMilestones.length > RENDER_LIMITS.milestones) {
    const dropped = activeMilestones.length - RENDER_LIMITS.milestones;
    issues.push({
      id: 'milestones-truncated',
      severity: 'error',
      tab: 'Scope & Phases',
      message: dropped + ' project ' + plural(dropped, 'phase', 'phases') + ' will not appear in the document.',
      hint: 'Only the first ' + RENDER_LIMITS.milestones + ' phases are printed.',
    });
  }

  activeMilestones.slice(0, RENDER_LIMITS.milestones).forEach((m, i) => {
    const count = (m.services || []).filter(Boolean).length;
    if (count > RENDER_LIMITS.servicesPerMilestone) {
      issues.push({
        id: 'milestone-' + i + '-tasks-truncated',
        severity: 'warning',
        tab: 'Scope & Phases',
        message: 'Phase ' + (i + 1) + ' has ' + count + ' tasks but only ' + RENDER_LIMITS.servicesPerMilestone + ' are printed.',
        hint: m.dayTitle || undefined,
      });
    }
  });

  if (isInvoice && (doc.termsAndConditions || []).length > RENDER_LIMITS.invoiceTerms) {
    const dropped = doc.termsAndConditions.length - RENDER_LIMITS.invoiceTerms;
    issues.push({
      id: 'invoice-terms-truncated',
      severity: 'error',
      tab: 'Taxes & Terms',
      message: dropped + ' ' + plural(dropped, 'term', 'terms') + ' will not appear on the invoice.',
      hint: 'Invoices print only the first ' + RENDER_LIMITS.invoiceTerms + ' clauses.',
    });
  }

  // ---------------------------------------------------------------------------
  // Upsells the client will never see on a PDF
  // ---------------------------------------------------------------------------
  const hiddenUpsells = (doc.pricingItems || []).filter((i) => i.isOptional && !i.selected);
  if (hiddenUpsells.length > 0) {
    issues.push({
      id: 'upsells-pdf-hidden',
      severity: 'info',
      tab: 'Pricing & Items',
      message: hiddenUpsells.length + ' optional add-' + plural(hiddenUpsells.length, 'on is', 'ons are') + ' not shown in the PDF.',
      hint: 'Optional add-ons appear only on the interactive client link, not in a downloaded PDF.',
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
