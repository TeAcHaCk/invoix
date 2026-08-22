export type BillType = 'QUOTATION' | 'INVOICE';

export type EventDateMode = 'single' | 'range';

export interface ClientInfo {
  nameOfEvent: string; // Manually Written
  address: string;     // Manually Written
  contactNo: string;   // Manually Written (numbers only)
  clientName?: string; // Optional Contact Person
  email?: string;      // Optional Email
}

export interface DocumentDetails {
  invoiceNo: string;   // Manually Written / Auto
  invoiceDate: string; // Automatic choose by Present date (DD/MM/YYYY)
  eventDateMode: EventDateMode;
  eventDate: string;   // Single date
  eventDateFrom: string; // Range from
  eventDateTo: string;   // Range to
  dueDate?: string;
  validUntilDate?: string;
}

export interface EventCoverageItem {
  id: string;
  dayTitle: string; // e.g., "Day 1 - Walima"
  services: string[]; // e.g., ["Traditional Photography", "Traditional Videography", "Candid Videography", "Candid Photography"]
}

export interface DeliverableItem {
  id: string;
  text: string;
  included: boolean;
}

export interface PricingItem {
  id: string;
  description: string;
  amount: number;
  qty?: number;
  rate?: number;
}

export interface PaymentTermsConfig {
  advancePercent: number; // e.g. 30
  afterEventPercent: number; // e.g. 50
  balancePercent: number; // e.g. 20
  advanceCustomAmount?: number;
  afterEventCustomAmount?: number;
  balanceCustomAmount?: number;
  isCustomAmounts: boolean;
  // For Invoices:
  advanceReceived?: number;
  advancePaidDate?: string;
  paymentMode?: string;
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
  upiId?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolder?: string;
  signatureUrl?: string;
}

export interface QuotationDocument {
  id: string;
  type: BillType;
  client: ClientInfo;
  details: DocumentDetails;
  packageBannerTitle: string;
  eventCoverage: EventCoverageItem[];
  deliverables: DeliverableItem[];
  pricingItems: PricingItem[];
  totalInvestment: number;
  discount: number;
  taxPercent: number; // 0 for none, 18 for GST
  taxType: 'none' | 'gst' | 'igst';
  paymentTerms: PaymentTermsConfig;
  termsAndConditions: string[];
  footerNote: string;
  watermark: WatermarkConfig;
  studio: StudioProfile;
  updatedAt: string;
}
