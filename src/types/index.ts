export type BillType = 'QUOTATION' | 'INVOICE';

export type IndustryCategory =
  | 'creative_agency'
  | 'software_tech'
  | 'consulting'
  | 'construction'
  | 'photography_events'
  | 'general_business';

export type ProposalTheme = 'creative' | 'modern' | 'compact';

export type EventDateMode = 'single' | 'range';

export interface CurrencyConfig {
  code: string;       // e.g. 'USD', 'INR', 'EUR', 'GBP', 'AED'
  symbol: string;     // e.g. '$', '₹', '€', '£', 'AED'
  label: string;      // e.g. 'USD - US Dollar ($)'
  locale: string;     // e.g. 'en-US', 'en-IN'
  decimalPlaces: number;
}

export interface ClientInfo {
  nameOfEvent: string; // Project / Event / Job Title
  address: string;     // Client / Site Address
  contactNo: string;   // Contact Phone
  clientName?: string; // Contact Person / Organization
  email?: string;      // Client Email
  taxId?: string;      // Client GSTIN / VAT ID / Tax ID
}

export interface DocumentDetails {
  invoiceNo: string;   // Quote / Invoice #
  invoiceDate: string; // Issue Date (DD/MM/YYYY or YYYY-MM-DD)
  eventDateMode: EventDateMode;
  eventDate: string;   // Execution / Event date
  eventDateFrom: string; // Range Start
  eventDateTo: string;   // Range End
  dueDate?: string;    // Payment Due Date
  validUntilDate?: string; // Quotation Expiry Date
  poNumber?: string;   // Purchase Order / Reference #
}

export interface ScopeMilestoneItem {
  id: string;
  dayTitle: string; // Phase / Milestone / Day Title (e.g. "Phase 1: Brand Strategy & UI/UX" or "Day 1 - Main Event")
  services: string[]; // Key deliverables / tasks in this phase
}

export interface DeliverableItem {
  id: string;
  text: string;
  included: boolean;
}

export interface CrewMemberItem {
  id: string;
  team: string; // e.g. "Lead Designer", "Senior Full-Stack Dev", "Site Supervisor", "Drone Pilot"
  role: string; // Key responsibility or credential description
  enabled: boolean;
}

export interface WhyChooseUsItem {
  id: string;
  icon: string; // emoji or identifier
  title: string;
  description: string;
  enabled: boolean;
}

export interface PricingItem {
  id: string;
  description: string;
  amount: number;       // Line item total
  qty?: number;         // Quantity
  unit?: string;        // 'hrs', 'days', 'units', 'sq ft', 'items', 'fixed', 'months'
  rate?: number;        // Unit Price
  isOptional?: boolean; // Client can toggle this add-on in interactive proposal view
  selected?: boolean;   // Whether currently included in total
  taxRate?: number;     // Line item specific tax % (if applicable)
}

export type TaxType = 'none' | 'gst' | 'igst' | 'vat' | 'sales_tax' | 'custom';

export interface TaxConfig {
  type: TaxType;
  percent: number;       // Main tax rate (e.g. 18 for GST, 20 for VAT, 8.25 for Sales Tax)
  label?: string;        // Custom tax label (e.g. 'VAT (20%)', 'GST (18%)')
  taxNumberLabel?: string; // 'GSTIN', 'VAT Reg No', 'Tax ID', 'EIN'
}

export interface PaymentTermsConfig {
  advancePercent: number; // e.g. 30%
  afterEventPercent: number; // e.g. 50%
  balancePercent: number; // e.g. 20%
  advanceCustomAmount?: number;
  afterEventCustomAmount?: number;
  balanceCustomAmount?: number;
  isCustomAmounts: boolean;
  paymentMilestoneLabels?: {
    advanceLabel: string;
    afterEventLabel: string;
    balanceLabel: string;
  };
  // For Invoices:
  advanceReceived?: number;
  advancePaidDate?: string;
  paymentMode?: string;
}

export interface InvoicePaymentRecord {
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  amountReceived: number;
  paymentDate?: string;
  paymentMode?: string; // UPI, Bank Transfer, Stripe, PayPal, Cash, Card
  transactionRef?: string;
  notes?: string;
}

export interface WatermarkConfig {
  enabled: boolean;
  type: 'logo' | 'text' | 'monogram';
  customText: string;
  opacity: number; // 0.01 to 0.3
  scale: number;   // 0.4 to 1.8
  rotation: number; // -45 to 45
  positionY: number; // -100 to 100 px offset
  customImageUrl?: string;
}

export interface SignatoryRecord {
  enabled: boolean;
  signerName: string;
  signerTitle: string;
  signatureDate?: string;
  signatureDataUrl?: string;
  clientSignedName?: string;
  clientSignedDate?: string;
  clientSignatureDataUrl?: string;
}

export interface StudioProfile {
  name: string;
  tagline: string;
  logoUrl: string;
  logoHeight?: number; // In pixels (e.g. 130)
  logoWidth?: number;  // In pixels (e.g. 320)
  watermarkUrl: string;
  address: string;
  phoneNumbers: string;
  email: string;
  website: string;
  taxNumberLabel?: string; // 'GSTIN' | 'VAT ID' | 'Tax ID' | 'EIN'
  gstin?: string;          // Tax / GST / VAT registration number
  upiId?: string;          // UPI ID (e.g. username@upi)
  paymentLink?: string;    // Stripe / PayPal / Direct Pay link
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;       // IFSC / Swift / Routing code
  accountHolder?: string;
  signatureUrl?: string;
  authEnabled?: boolean;
  adminUsername?: string;
  adminPassword?: string;
}

export interface AcceptanceAuditRecord {
  signatoryName: string;
  signatoryEmail?: string;
  signedAt: string; // ISO date string
  formattedDate?: string;
  signatureType?: 'drawn' | 'uploaded' | 'typed';
  signatureDataUrl?: string;
  signatureHash?: string; // SHA-256 cryptographic hash of signature & contract state
  signatureAlgo?: 'sha-256' | 'fallback'; // Which digest produced signatureHash
  certificateId?: string; // e.g. "CERT-QUO-2026-782-9F4A"
  selectedAddonIds?: string[];
  acceptedTotalInvestment: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface SectionVisibilityConfig {
  banner?: boolean;
  scope?: boolean;
  deliverables?: boolean;
  crew?: boolean;
  whyChooseUs?: boolean;
  pricingTable?: boolean;
  paymentMilestones?: boolean;
  bankDetails?: boolean;
  terms?: boolean;
  signatory?: boolean;
}

export interface SectionTitlesConfig {
  scopeTitle?: string;
  deliverablesTitle?: string;
  crewTitle?: string;
  whyChooseUsTitle?: string;
  pricingTitle?: string;
  termsTitle?: string;
}

export interface CustomTemplatePreset {
  id: string;
  name: string;
  description?: string;
  industry: IndustryCategory;
  theme: ProposalTheme;
  accentColor: string;
  fontFamily: string;
  sectionVisibility: SectionVisibilityConfig;
  sectionTitles?: SectionTitlesConfig;
  createdAt: string;
  updatedAt: string;
  isCustom: true;
  sampleDocument?: Partial<QuotationDocument>;
}

export interface QuotationDocument {
  id: string;
  /**
   * Unguessable token used in public client links (?view=<shareToken>).
   * The document id is a timestamp and would be trivially enumerable.
   */
  shareToken?: string;
  type: BillType;
  industry: IndustryCategory;
  theme: ProposalTheme;
  currency: CurrencyConfig;
  accentColor?: string; // Custom brand hex color (e.g. #f59e0b)
  fontFamily?: string;  // e.g. 'Outfit', 'Plus Jakarta Sans', 'Inter', 'Playfair Display'
  customTemplateId?: string;
  sectionVisibility?: SectionVisibilityConfig;
  sectionTitles?: SectionTitlesConfig;
  status?: 'DRAFT' | 'SENT' | 'VIEWED' | 'APPROVED' | 'PAID';
  viewCount?: number;
  lastViewedAt?: string;
  approvedAt?: string;
  acceptanceAudit?: AcceptanceAuditRecord;
  client: ClientInfo;
  details: DocumentDetails;
  packageBannerTitle: string; // Project / Package Title (e.g. "FULL-STACK WEB APP DEVELOPMENT & LAUNCH")
  eventCoverage: ScopeMilestoneItem[]; // Universal Project Phases / SOW Milestones
  deliverables: DeliverableItem[];
  crewMembers: CrewMemberItem[]; // Specialists / Key Team
  whyChooseUs: WhyChooseUsItem[];
  includeCrewSection: boolean;
  includeWhyChooseUs: boolean;
  includeScopeSection: boolean;
  pricingItems: PricingItem[];
  totalInvestment: number;
  discount: number;
  taxConfig: TaxConfig;
  // Legacy compatibility fields:
  taxPercent: number;
  taxType: TaxType;
  paymentTerms: PaymentTermsConfig;
  invoicePayment: InvoicePaymentRecord;
  termsAndConditions: string[];
  footerNote: string;
  signatory: SignatoryRecord;
  watermark: WatermarkConfig;
  studio: StudioProfile;
  updatedAt: string;
}
