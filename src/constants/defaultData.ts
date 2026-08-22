import type {
  QuotationDocument,
  StudioProfile,
  CrewMemberItem,
  WhyChooseUsItem,
  InvoicePaymentRecord,
} from '../types';

export const DEFAULT_STUDIO: StudioProfile = {
  name: 'FUSION BELLS FILMS',
  tagline: 'REAL MOMENTS, TIMELESS STORIES.',
  logoUrl: '/assets/logo.png',
  logoHeight: 130,
  logoWidth: 320,
  watermarkUrl: '/assets/watermark.png',
  address: 'Hosakerehalli, Bangalore, Karnataka',
  phoneNumbers: '8970511524, 7411687671',
  email: 'info@fusionbellsfilms.com',
  website: 'fusionbellsfilms.com',
  gstin: '29ABCDE1234F1Z5',
  upiId: '8970511524@upi',
  bankName: 'HDFC Bank',
  accountNumber: '50200088991122',
  ifscCode: 'HDFC0001234',
  accountHolder: 'FUSION BELLS FILMS',
  authEnabled: true,
  adminUsername: 'fusionbells',
  adminPassword: 'fbf@2026',
};

export const DEFAULT_CREW_MEMBERS: CrewMemberItem[] = [
  {
    id: 'crew-1',
    team: 'Candid Photographer',
    role: 'Capturing portraits and moments of the couple, immediate family & friends in creative angles.',
    enabled: true,
  },
  {
    id: 'crew-2',
    team: 'Candid Videographer',
    role: 'Capturing portraits, interviews and moments of the couple, immediate family & friends in creative angles for the teaser and highlight film.',
    enabled: true,
  },
  {
    id: 'crew-3',
    team: 'Traditional Photographer',
    role: 'Capturing the entire coverage of the events such as rituals in detail and group photos on stage.',
    enabled: true,
  },
  {
    id: 'crew-4',
    team: 'Traditional Videographer',
    role: 'Capturing the entire coverage of the events such as rituals in detail and group photos on stage for the coverage film.',
    enabled: true,
  },
  {
    id: 'crew-5',
    team: 'Drone Pilot',
    role: 'Capturing breathtaking 4K aerial cinematic drone views of the venue, rituals and grand entries.',
    enabled: false,
  },
];

export const DEFAULT_WHY_CHOOSE_US: WhyChooseUsItem[] = [
  {
    id: 'why-1',
    icon: '✨',
    title: 'Timeless Storytelling',
    description: 'Every photograph and film is crafted to capture genuine emotions and unforgettable memories.',
    enabled: true,
  },
  {
    id: 'why-2',
    icon: '📸',
    title: 'Professional Photography & Films',
    description: "From candid moments to cinematic wedding films, we deliver high-quality visuals you'll cherish forever.",
    enabled: true,
  },
  {
    id: 'why-3',
    icon: '❤️',
    title: 'Personalized Experience',
    description: 'We take the time to understand your vision and ensure every detail reflects your unique story.',
    enabled: true,
  },
  {
    id: 'why-4',
    icon: '🎥',
    title: 'Complete Wedding Coverage',
    description: 'Pre-Wedding • Engagement • Haldi • Mehendi • Wedding • Reception • Destination Weddings',
    enabled: true,
  },
  {
    id: 'why-5',
    icon: '⏱️',
    title: 'Reliable & Timely Delivery',
    description: 'Your memories are carefully edited and delivered on time without compromising quality.',
    enabled: true,
  },
  {
    id: 'why-6',
    icon: '🤝',
    title: 'Friendly & Professional Team',
    description: 'Our experienced team makes you feel comfortable, ensuring natural expressions and stress-free photography throughout your special day.',
    enabled: true,
  },
];

export const DEFAULT_INVOICE_PAYMENT: InvoicePaymentRecord = {
  status: 'UNPAID',
  amountReceived: 0,
  paymentDate: '',
  paymentMode: 'UPI / Bank Transfer',
  transactionRef: '',
  notes: 'Thank you for your business!',
};

export const DEFAULT_SERVICES = [
  { id: 'trad-photo', category: 'Traditional', name: 'Traditional Photography', defaultDeliverable: 'Traditional High-Res Photo Coverage' },
  { id: 'trad-video', category: 'Traditional', name: 'Traditional Videography', defaultDeliverable: 'Traditional Full Length Video' },
  { id: 'candid-photo', category: 'Candid', name: 'Candid Photography', defaultDeliverable: 'Professionally Edited High Resolution Candid Photographs' },
  { id: 'candid-video', category: 'Candid', name: 'Candid Videography', defaultDeliverable: 'Candid Cinema Coverage' },
  { id: 'cinematic-films', category: 'Cinematic', name: 'Cinematic Films', defaultDeliverable: 'Cinematic Highlight Films & Teaser' },
];

export const DEFAULT_EVENT_TYPES = [
  'Walima',
  'Wedding Reception',
  'Pre Wedding',
  'Engagement',
  'Baby Shower',
  'Birthday',
  'House Ceremony',
  'Haldi',
  'Mehendi',
  'Sangeet',
  'Muhurtham',
];

export const DEFAULT_ADDITIONAL_SERVICES = [
  { id: 'drone', name: 'Drone', label: 'Drone (Aerial 4K Shoot)', deliverable: '4K Drone Aerial Footage' },
  { id: 'led-wall', name: 'LED Wall', label: 'LED Wall (Live Display Setup)', deliverable: 'Live LED Wall Projection' },
  { id: 'live-stream', name: 'Live Streaming', label: 'Live Streaming (YouTube/FB Webcast)', deliverable: 'Full HD Multi-Cam Live Stream' },
  { id: 'album', name: 'Luxury Album', label: 'Luxury Photobook Album (40 Pages)', deliverable: 'Premium Matte Leather Hardcover Photobook Album' },
  { id: 'reels', name: 'Reels Package', label: 'Instagram Reels & Shorts', deliverable: '3x Same-day Vertical Reels for Instagram' },
];

export const DEFAULT_DELIVERABLES_PRESETS = [
  'Event Teaser (60-90 seconds 4K)',
  'Professionally Edited High Resolution Photographs (200+ pics)',
  'Cinematic Highlight Films (3-5 mins)',
  'We will provide all the traditional full length video',
  'All Raw & Edited High-Res Photos on Cloud Drive / Pendrive',
  '1x Luxury Hardcover Photobook Album (40 Pages)',
];

export const DEFAULT_TERMS_AND_CONDITIONS = [
  '30% of the payment will be considered as the booking fee and should be paid within 7 days after soft booking.',
  'The remaining payment should be completed as mutually agreed before or on the last day of the event.',
  'Post-production and editing will begin only after full payment is cleared.',
  'Each event coverage duration is standard 7-8 hours. Additional hours will be charged separately.',
  'Client should provide a Hard Disk or SSD (preferably 2TB) for complete high-resolution data backup after the event.',
  'Albums will be delivered approximately within 30 days after the client completes photo selection.',
  'Event Cancellation Policy: More than 1 month before event = 50% advance refund; Within 1 month = No refund.',
  'Travel, food, accommodation, and outstation logistics outside Bangalore will be provided by the client or billed separately.',
  'Fusion Bells Films retains the right to use selected photos and videos for portfolio, website, and social media showcase.',
  'Quoted prices and packages are valid for 30 days from the quotation date.',
];

export const getTodayFormattedDate = (): string => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const DEFAULT_WATERMARK = {
  enabled: true,
  type: 'monogram' as const,
  customText: 'FBF',
  opacity: 0.08,
  scale: 1.1,
  rotation: 0,
  positionY: 25,
  customImageUrl: '/assets/watermark.png',
};

export const getSavedStudioProfile = (): StudioProfile => {
  try {
    const saved = localStorage.getItem('fbf_saved_studio_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_STUDIO, ...parsed };
    }
  } catch (e) {
    console.error('Error reading saved studio profile', e);
  }
  return DEFAULT_STUDIO;
};

export const saveStudioProfileToStorage = (studio: StudioProfile): void => {
  try {
    localStorage.setItem('fbf_saved_studio_profile', JSON.stringify(studio));
  } catch (e) {
    console.error('Error saving studio profile', e);
  }
};

export const getSavedWatermarkConfig = () => {
  try {
    const saved = localStorage.getItem('fbf_saved_watermark_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_WATERMARK, ...parsed };
    }
  } catch (e) {
    console.error('Error reading saved watermark config', e);
  }
  return DEFAULT_WATERMARK;
};

export const saveWatermarkConfigToStorage = (watermark: any): void => {
  try {
    localStorage.setItem('fbf_saved_watermark_config', JSON.stringify(watermark));
  } catch (e) {
    console.error('Error saving watermark config', e);
  }
};

export const getDefaultDocument = (): QuotationDocument => ({
  id: 'doc_' + Date.now(),
  type: 'QUOTATION',
  client: {
    nameOfEvent: '',
    address: '',
    contactNo: '',
    clientName: '',
    email: '',
  },
  details: {
    invoiceNo: `QUO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    invoiceDate: getTodayFormattedDate(),
    eventDateMode: 'single',
    eventDate: getTodayFormattedDate(),
    eventDateFrom: getTodayFormattedDate(),
    eventDateTo: getTodayFormattedDate(),
    dueDate: getTodayFormattedDate(),
    validUntilDate: '30 Days from quote date',
  },
  packageBannerTitle: '',
  eventCoverage: [
    {
      id: 'day-1',
      dayTitle: 'Day 1',
      services: [
        'Traditional Photography',
        'Traditional Videography',
        'Candid Videography',
        'Candid Photography',
      ],
    },
  ],
  deliverables: [
    { id: 'del-1', text: 'Event Teaser (60-90 seconds 4K)', included: true },
    { id: 'del-2', text: 'Professionally Edited High Resolution Photographs (200+ pics)', included: true },
    { id: 'del-3', text: 'Cinematic Highlight Films (3-5 mins)', included: true },
    { id: 'del-4', text: 'We will provide all the traditional full length video', included: true },
  ],
  crewMembers: DEFAULT_CREW_MEMBERS,
  whyChooseUs: DEFAULT_WHY_CHOOSE_US,
  includeCrewSection: true,
  includeWhyChooseUs: true,
  pricingItems: [
    {
      id: 'price-1',
      description: 'Complete Photography & Cinematography Package',
      amount: 0,
      qty: 1,
      rate: 0,
    },
  ],
  totalInvestment: 0,
  discount: 0,
  taxPercent: 0,
  taxType: 'none',
  paymentTerms: {
    advancePercent: 30,
    afterEventPercent: 50,
    balancePercent: 20,
    isCustomAmounts: false,
    advanceReceived: 0,
    advancePaidDate: '',
    paymentMode: 'UPI / Bank Transfer',
  },
  invoicePayment: DEFAULT_INVOICE_PAYMENT,
  termsAndConditions: DEFAULT_TERMS_AND_CONDITIONS,
  footerNote: 'Thank you for choosing Fusion Bells Films to capture your special moments.',
  watermark: getSavedWatermarkConfig(),
  studio: getSavedStudioProfile(),
  updatedAt: new Date().toISOString(),
});
