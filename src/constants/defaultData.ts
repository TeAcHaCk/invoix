import type { QuotationDocument, StudioProfile } from '../types';

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
  upiId: '8970511524@upi',
  bankName: 'HDFC Bank',
  accountNumber: '50200088991122',
  ifscCode: 'HDFC0001234',
  accountHolder: 'FUSION BELLS FILMS',
  authEnabled: true,
  adminUsername: 'fusionbells',
  adminPassword: 'fbf@2026',
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
  'Event Teaser',
  'Professionally Edited High Resolution Photographs 100 pics',
  'Cinematic Highlight Films',
  'We will provide all the traditional full length video',
  'All Raw & Edited High-Res Photos on Cloud Drive / Pendrive',
  '1x Luxury Hardcover Photobook Album (40 Pages)',
];

export const DEFAULT_TERMS_AND_CONDITIONS = [
  'The booking will be confirmed only after receiving the agreed advance payment.',
  'The advance amount is non-refundable in case of cancellation.',
  'Any additional requirements requested after confirmation may be charged separately.',
  'The remaining payment should be cleared as mutually agreed before/on the wedding day.',
  'We reserve the right to use selected photographs/videos for our portfolio, website and social media, unless the client specifically requests otherwise.',
  'Any change in date is subject to our availability.',
  'The quotation is valid for the agreed date and package only and is subject to availability.',
  'Additional hours or additional events will be charged separately.',
  'Edited photographs and videos will be delivered within the agreed timeline.',
  'Travel and accommodation charges, if applicable, will be additional.',
  'Raw/unedited files will not be included unless specifically agreed.',
  'The final number of photographs/videos depends on the coverage and event schedule.',
];

export const getTodayFormattedDate = (): string => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
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
    validUntilDate: '15 Days from quote date',
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
  pricingItems: [
    {
      id: 'price-1',
      description: 'Complete Photography & Cinematography Package',
      amount: 0,
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
  termsAndConditions: DEFAULT_TERMS_AND_CONDITIONS,
  footerNote: 'Thank you for choosing Fusion Bells Films to capture your special moments.',
  watermark: {
    enabled: true,
    type: 'monogram',
    customText: 'FBF',
    opacity: 0.08,
    scale: 1.1,
    rotation: 0,
    positionY: 25,
    customImageUrl: '/assets/watermark.png',
  },
  studio: DEFAULT_STUDIO,
  updatedAt: new Date().toISOString(),
});
