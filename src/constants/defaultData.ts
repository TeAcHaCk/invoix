import type {
  QuotationDocument,
  StudioProfile,
  IndustryCategory,
  TaxConfig,
  SignatoryRecord,
  WatermarkConfig,
  InvoicePaymentRecord,
} from '../types';
import { INDUSTRY_PRESETS } from './industryPresets';
import { SUPPORTED_CURRENCIES } from './currencies';

export const getTodayFormattedDate = (): string => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const DEFAULT_WATERMARK: WatermarkConfig = {
  enabled: true,
  type: 'text',
  customText: 'CONFIDENTIAL PROPOSAL',
  opacity: 0.05,
  scale: 1.0,
  rotation: -15,
  positionY: 0,
  customImageUrl: '',
};

export const DEFAULT_SIGNATORY: SignatoryRecord = {
  enabled: true,
  signerName: 'Authorized Signatory',
  signerTitle: 'Managing Director',
  signatureDate: getTodayFormattedDate(),
};

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  type: 'none',
  percent: 0,
  label: 'Tax',
  taxNumberLabel: 'Tax ID / GSTIN',
};

export const DEFAULT_INVOICE_PAYMENT: InvoicePaymentRecord = {
  status: 'UNPAID',
  amountReceived: 0,
  paymentDate: '',
  paymentMode: 'Bank Transfer / Online',
  transactionRef: '',
  notes: 'Thank you for your business! Payment is due within standard terms.',
};

export const getSavedStudioProfile = (industry: IndustryCategory = 'creative_agency'): StudioProfile => {
  try {
    const saved = localStorage.getItem('fbf_saved_studio_profile_v2');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading saved business profile', e);
  }

  const preset = INDUSTRY_PRESETS[industry] || INDUSTRY_PRESETS.creative_agency;
  return {
    name: preset.sampleStudio.name,
    tagline: preset.sampleStudio.tagline,
    logoUrl: '',
    logoHeight: 110,
    logoWidth: 280,
    watermarkUrl: '',
    address: preset.sampleStudio.address,
    phoneNumbers: preset.sampleStudio.phoneNumbers,
    email: preset.sampleStudio.email,
    website: preset.sampleStudio.website,
    taxNumberLabel: preset.sampleStudio.taxNumberLabel,
    gstin: preset.sampleStudio.gstin,
    upiId: '',
    paymentLink: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolder: preset.sampleStudio.name,
    authEnabled: false,
  };
};

export const saveStudioProfileToStorage = (studio: StudioProfile): void => {
  try {
    localStorage.setItem('fbf_saved_studio_profile_v2', JSON.stringify(studio));
  } catch (e) {
    console.error('Error saving business profile', e);
  }
};

export const getSavedWatermarkConfig = (): WatermarkConfig => {
  try {
    const saved = localStorage.getItem('fbf_saved_watermark_config_v2');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading saved watermark config', e);
  }
  return DEFAULT_WATERMARK;
};

export const saveWatermarkConfigToStorage = (watermark: WatermarkConfig): void => {
  try {
    localStorage.setItem('fbf_saved_watermark_config_v2', JSON.stringify(watermark));
  } catch (e) {
    console.error('Error saving watermark config', e);
  }
};

export const createDocumentFromPreset = (
  industry: IndustryCategory = 'creative_agency',
  billType: 'QUOTATION' | 'INVOICE' = 'QUOTATION'
): QuotationDocument => {
  const preset = INDUSTRY_PRESETS[industry] || INDUSTRY_PRESETS.creative_agency;
  const currency =
    SUPPORTED_CURRENCIES.find((c) => c.code === preset.defaultCurrencyCode) || SUPPORTED_CURRENCIES[0];

  const year = new Date().getFullYear();
  const randNum = Math.floor(100 + Math.random() * 900);
  const docNo = billType === 'INVOICE' ? `INV-${year}-${randNum}` : `QUO-${year}-${randNum}`;

  const totalInv = preset.pricingItems
    .filter((i) => !i.isOptional || i.selected)
    .reduce((sum, item) => sum + (item.qty && item.rate ? item.qty * item.rate : item.amount || 0), 0);

  return {
    id: 'doc_' + Date.now(),
    type: billType,
    industry: preset.id,
    theme: industry === 'photography_events' || industry === 'construction' ? 'creative' : 'modern',
    currency,
    client: {
      nameOfEvent: preset.sampleClient.nameOfEvent,
      address: preset.sampleClient.address,
      contactNo: preset.sampleClient.contactNo,
      clientName: preset.sampleClient.clientName,
      email: preset.sampleClient.email,
    },
    details: {
      invoiceNo: docNo,
      invoiceDate: getTodayFormattedDate(),
      eventDateMode: 'single',
      eventDate: getTodayFormattedDate(),
      eventDateFrom: getTodayFormattedDate(),
      eventDateTo: getTodayFormattedDate(),
      dueDate: getTodayFormattedDate(),
      validUntilDate: '30 Days from issue date',
      poNumber: `PO-${year}-${randNum}`,
    },
    packageBannerTitle: preset.defaultPackageTitle,
    eventCoverage: JSON.parse(JSON.stringify(preset.eventCoverage)),
    deliverables: JSON.parse(JSON.stringify(preset.deliverables)),
    crewMembers: JSON.parse(JSON.stringify(preset.crewMembers)),
    whyChooseUs: JSON.parse(JSON.stringify(preset.whyChooseUs)),
    includeCrewSection: preset.crewMembers.length > 0,
    includeWhyChooseUs: preset.whyChooseUs.length > 0,
    includeScopeSection: preset.eventCoverage.length > 0,
    pricingItems: JSON.parse(JSON.stringify(preset.pricingItems)),
    totalInvestment: totalInv,
    discount: 0,
    taxConfig: {
      type: preset.defaultTaxType,
      percent: preset.defaultTaxPercent,
      label: preset.defaultTaxType === 'gst' ? 'GST' : preset.defaultTaxType === 'vat' ? 'VAT' : 'Tax',
      taxNumberLabel: preset.sampleStudio.taxNumberLabel,
    },
    taxPercent: preset.defaultTaxPercent,
    taxType: preset.defaultTaxType,
    paymentTerms: {
      advancePercent: preset.paymentTerms.advancePercent,
      afterEventPercent: preset.paymentTerms.afterEventPercent,
      balancePercent: preset.paymentTerms.balancePercent,
      isCustomAmounts: false,
      paymentMilestoneLabels: {
        advanceLabel: preset.paymentTerms.advanceLabel,
        afterEventLabel: preset.paymentTerms.afterEventLabel,
        balanceLabel: preset.paymentTerms.balanceLabel,
      },
      advanceReceived: 0,
      advancePaidDate: '',
      paymentMode: 'Bank Wire / Online',
    },
    invoicePayment: DEFAULT_INVOICE_PAYMENT,
    termsAndConditions: [...preset.termsAndConditions],
    footerNote: `Thank you for choosing ${preset.sampleStudio.name}. We look forward to delivering excellence.`,
    signatory: {
      ...DEFAULT_SIGNATORY,
      signerName: `${preset.sampleStudio.name} Authorized Signatory`,
    },
    watermark: getSavedWatermarkConfig(),
    studio: {
      ...getSavedStudioProfile(industry),
      name: preset.sampleStudio.name,
      tagline: preset.sampleStudio.tagline,
      address: preset.sampleStudio.address,
      phoneNumbers: preset.sampleStudio.phoneNumbers,
      email: preset.sampleStudio.email,
      website: preset.sampleStudio.website,
      taxNumberLabel: preset.sampleStudio.taxNumberLabel,
      gstin: preset.sampleStudio.gstin,
    },
    updatedAt: new Date().toISOString(),
  };
};

export const getDefaultDocument = (): QuotationDocument => {
  return createDocumentFromPreset('creative_agency', 'QUOTATION');
};
