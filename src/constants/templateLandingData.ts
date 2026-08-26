import type { IndustryCategory, BillType } from '../types';

export interface TemplateLandingPageData {
  slug: string;
  industryKey: IndustryCategory;
  docType: BillType;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  subtitle: string;
  badge: string;
  targetAudience: string;
  avgDealValue: string;
  estimatedCloseRate: string;
  features: {
    title: string;
    description: string;
    icon: string;
  }[];
  keyMilestones: string[];
  sampleItems: { description: string; qty: number; unit: string; rate: number }[];
  faqs: { question: string; answer: string }[];
}

export const TEMPLATE_LANDING_PAGES: Record<string, TemplateLandingPageData> = {
  'photography-quotation': {
    slug: 'photography-quotation',
    industryKey: 'photography_events',
    docType: 'QUOTATION',
    title: 'Wedding & Event Photography Quotation Template',
    metaTitle: 'Free Photography Quotation Template with E-Sign & Add-ons | Invoix',
    metaDescription: 'Create stunning, high-converting photography quotations and event proposals. Send interactive client links with digital signatures, live package upsells, and payment QR codes.',
    h1: 'Photography Quotation & Proposal Template',
    subtitle: 'Win luxury wedding & commercial shoot bookings with interactive client links, touch-screen e-signatures, and instant upsell packages.',
    badge: 'Photography & Cinematography',
    targetAudience: 'Wedding Photographers, Studio Owners, Cinematographers & Content Creators',
    avgDealValue: '₹75,000 – ₹3,50,000 / $1,500 – $6,000',
    estimatedCloseRate: '78% with Interactive Client Link',
    features: [
      {
        title: 'Interactive Add-on Upsells',
        description: 'Allow couples to toggle Drone Coverage, Same-Day-Edits, or Luxury Photobooks right inside their proposal link.',
        icon: '✨',
      },
      {
        title: 'Digital Touchscreen Signatures',
        description: 'Clients sign your booking agreement directly from their smartphone screen with audit timestamps.',
        icon: '✍️',
      },
      {
        title: 'Instant Advance Payment QR',
        description: 'Display your dynamic UPI or wire transfer details with a scan-to-pay QR code for rapid advance deposit collection.',
        icon: '📱',
      },
      {
        title: 'Multi-Day Schedule Matrix',
        description: 'Present clear Day 1 (Engagement), Day 2 (Sangeet), and Day 3 (Reception) crew & equipment deployment breakdowns.',
        icon: '📅',
      },
    ],
    keyMilestones: [
      'Day 1: Pre-Wedding Couple Shoot & Cinematic Teaser',
      'Day 2: Traditional Ceremony & Multi-Camera 4K Coverage',
      'Day 3: Grand Reception & Live Social Media Highlights',
      'Post-Production: Colour Grading & Premium Canvas Album',
    ],
    sampleItems: [
      { description: 'Full Day 4K Cinematic Video & Traditional Photo Team (4 Crew)', qty: 1, unit: 'event', rate: 120000 },
      { description: 'Drone Aerial 4K Cinematography Package', qty: 1, unit: 'session', rate: 25000 },
      { description: 'Handcrafted Premium Leather Flush Mount Album (40 Pages)', qty: 2, unit: 'books', rate: 30000 },
    ],
    faqs: [
      {
        question: 'How do clients accept and sign my photography quotation?',
        answer: 'You generate a private link or send it over WhatsApp. Your client opens the interactive link, selects any optional add-ons (like drone coverage or albums), and signs directly on their phone screen.',
      },
      {
        question: 'Can I export a clean A4 PDF for formal corporate shoots?',
        answer: 'Yes. With one click, Invoix renders pixel-perfect multi-page A4 PDFs with crisp vector text, your logo, terms of service, and payment milestones.',
      },
    ],
  },

  'web-development-proposal': {
    slug: 'web-development-proposal',
    industryKey: 'software_tech',
    docType: 'QUOTATION',
    title: 'Software & Web Development SOW Proposal Template',
    metaTitle: 'Software & Web Development SOW Proposal Template | Invoix',
    metaDescription: 'Free high-converting Scope of Work (SOW) and web development quotation template. Features milestone payment stages, digital contract sign-off, and tech stack breakdowns.',
    h1: 'Web & Software Development Proposal Template',
    subtitle: 'Close enterprise software, SaaS, and web projects with structured phase milestones, transparent sprint estimates, and legal digital signatures.',
    badge: 'Tech & Software Engineering',
    targetAudience: 'Freelance Developers, Tech Agencies, SaaS Consultancies & Dev Studios',
    avgDealValue: '₹1,50,000 – ₹12,00,000 / $3,000 – $25,000',
    estimatedCloseRate: '82% faster SOW approvals',
    features: [
      {
        title: 'Phase-by-Phase SOW Milestones',
        description: 'Structure clear stages from Discovery & Architecture to Sprint Delivery, QA Testing, and Cloud Deployment.',
        icon: '💻',
      },
      {
        title: 'Milestone Escrow Payment Terms',
        description: 'Set 30% Discovery Advance, 40% Beta Release, and 30% Production Handover payment checkpoints.',
        icon: '🛡️',
      },
      {
        title: 'Optional SLA & Maintenance Add-ons',
        description: 'Offer monthly DevOps support, security monitoring, and post-launch maintenance retainers directly in the proposal.',
        icon: '⚙️',
      },
      {
        title: 'Client View Tracking Notifications',
        description: 'Get notified the exact second your client opens the technical SOW, so you can follow up at peak intent.',
        icon: '🔔',
      },
    ],
    keyMilestones: [
      'Sprint 1: Architecture, UI/UX Wireframing & Database Schema',
      'Sprint 2: Core Backend API & Frontend Dashboard Integration',
      'Sprint 3: Payment Gateway, Security Hardening & End-to-End QA',
      'Sprint 4: Cloud CI/CD Deployment & Knowledge Transfer',
    ],
    sampleItems: [
      { description: 'Full-Stack Web App Development (React 19 / Node / Postgres)', qty: 1, unit: 'project', rate: 250000 },
      { description: 'Custom API Integrations & Razorpay/Stripe Gateway', qty: 1, unit: 'module', rate: 45000 },
      { description: 'Dedicated DevOps Setup (Docker, CI/CD, AWS Serverless)', qty: 1, unit: 'setup', rate: 35000 },
    ],
    faqs: [
      {
        question: 'Can I specify custom milestone percentages and due dates?',
        answer: 'Yes. Invoix lets you configure 3-stage or custom milestone percentages with specific milestone labels and balance settlement terms.',
      },
      {
        question: 'Are digital approvals tracked with timestamp audit trails?',
        answer: 'Yes. Every client acceptance records the signatory name, handwritten signature data, and cryptographic timestamp for contract integrity.',
      },
    ],
  },

  'creative-agency-proposal': {
    slug: 'creative-agency-proposal',
    industryKey: 'creative_agency',
    docType: 'QUOTATION',
    title: 'Brand Identity & Creative Agency Proposal Template',
    metaTitle: 'Creative Agency & Brand Identity Proposal Template | Invoix',
    metaDescription: 'Stunning brand design, UI/UX, and creative agency quotation template. Win high-ticket branding retainers with interactive scope presentations and digital contract signing.',
    h1: 'Creative Agency & Branding Proposal Template',
    subtitle: 'Dazzle ambitious brands with luxury typography, interactive deliverable checklists, and instant touch-screen approvals.',
    badge: 'Design & Marketing Agency',
    targetAudience: 'Design Studios, Branding Agencies, UI/UX Designers & Growth Marketers',
    avgDealValue: '₹80,000 – ₹5,00,000 / $2,000 – $10,000',
    estimatedCloseRate: '85% higher client conversion',
    features: [
      {
        title: 'Editorial Typography Suite',
        description: 'Choose from 15 curated Google Fonts (Playfair Display, Syne, Space Grotesk, Cinzel) to match your agency aesthetic.',
        icon: '🎨',
      },
      {
        title: 'Deliverable Scope Cards',
        description: 'Break down Brand Guidelines, Logo Suites, 3D Assets, and Social Media Kits with clear checklist indicators.',
        icon: '📐',
      },
      {
        title: 'Assigned Team Allocation',
        description: 'Highlight your Lead Art Directors, Brand Strategists, and Copywriters with dedicated role badges on Page 2.',
        icon: '👥',
      },
      {
        title: 'Custom Brand Accent Colors',
        description: 'Select your agency’s exact brand HEX color with real-time gradient accents on document headers and totals.',
        icon: '🌈',
      },
    ],
    keyMilestones: [
      'Phase 1: Brand Strategy, Market Positioning & Moodboarding',
      'Phase 2: Visual Identity Systems, Typography & Color Palette',
      'Phase 3: Design System, Component Library & Collateral Mockups',
      'Phase 4: Comprehensive Brand Guidelines & Final Asset Delivery',
    ],
    sampleItems: [
      { description: 'Complete Brand Identity & Visual Design System', qty: 1, unit: 'package', rate: 150000 },
      { description: 'Custom UI/UX Design System (Figma, 25+ Screens)', qty: 1, unit: 'system', rate: 95000 },
      { description: 'Motion Design Guidelines & 3D Social Brand Kit', qty: 1, unit: 'kit', rate: 40000 },
    ],
    faqs: [
      {
        question: 'Can I remove Invoix branding from client links?',
        answer: 'Yes. On Invoix Pro and Agency plans, client links and PDF exports are 100% white-label with your own studio logo and custom colors.',
      },
      {
        question: 'Does the proposal support multi-page layout automatically?',
        answer: 'Yes. Invoix dynamically manages Page 1 (Summary & Pricing) and Page 2 (Team, Guarantees, Terms & Signatures) without awkward content overlap.',
      },
    ],
  },

  'consulting-agreement': {
    slug: 'consulting-agreement',
    industryKey: 'consulting',
    docType: 'QUOTATION',
    title: 'Business & Management Consulting Proposal Template',
    metaTitle: 'Management & Business Consulting Proposal Template | Invoix',
    metaDescription: 'Professional management consulting quotation and advisory agreement template. Formal terms of engagement, hourly/retainer pricing tables, and legal e-signatures.',
    h1: 'Management Consulting Proposal & SOW Template',
    subtitle: 'Present executive advisory scopes, diagnostic roadmaps, and retainer agreements with corporate polish and frictionless digital sign-off.',
    badge: 'Management & Advisory',
    targetAudience: 'Strategy Consultants, Fractional CXOs, Financial Advisors & HR Firms',
    avgDealValue: '₹1,00,000 – ₹8,00,000 / $2,500 – $15,000',
    estimatedCloseRate: '80% faster executive sign-off',
    features: [
      {
        title: 'Executive Summary Format',
        description: 'Structured corporate layout designed for C-suite readability with clear objective definitions.',
        icon: '📊',
      },
      {
        title: 'Retainer & Hourly Models',
        description: 'Support for fixed advisory retainers, diagnostic audit fees, or blended hourly rate cards.',
        icon: '💼',
      },
      {
        title: 'Confidentiality & NDA Terms',
        description: 'Pre-populated engagement clauses, non-disclosure agreements, and IP ownership protections.',
        icon: '🔒',
      },
      {
        title: 'Crisp Vector PDF Export',
        description: 'Generate high-resolution vector PDFs with selectable text suitable for enterprise procurement departments.',
        icon: '📄',
      },
    ],
    keyMilestones: [
      'Diagnostic Phase: Comprehensive Operational & Financial Audit',
      'Strategy Formulation: Strategic Roadmap & KPI Architecture',
      'Execution Oversight: Weekly Leadership Coaching & Governance',
      'Impact Evaluation: Performance Benchmarks & Final Report',
    ],
    sampleItems: [
      { description: 'Strategic Business Diagnostic & Operational Review', qty: 1, unit: 'audit', rate: 120000 },
      { description: 'Quarterly Executive Advisory & Governance Retainer', qty: 3, unit: 'months', rate: 75000 },
    ],
    faqs: [
      {
        question: 'Is this template compliant with corporate procurement processes?',
        answer: 'Yes. Invoix includes standard Purchase Order (PO) fields, GSTIN/Tax ID identifiers, structured terms, and formal signatory blocks.',
      },
    ],
  },

  'gst-invoice': {
    slug: 'gst-invoice',
    industryKey: 'general_business',
    docType: 'INVOICE',
    title: 'GST Tax Invoice & Commercial Billing Template',
    metaTitle: 'Free GST Tax Invoice Generator & Commercial Billing Template | Invoix',
    metaDescription: 'Generate GST-compliant tax invoices with automatic HSN/SAC breakdowns, CGST/SGST/IGST calculations, UPI QR codes, and instant payment settlement status.',
    h1: 'GST Tax Invoice & Commercial Billing Template',
    subtitle: 'Create compliant GST tax invoices in seconds with automated tax calculations, payment due trackers, and UPI scan-to-pay QR codes.',
    badge: 'Tax & Compliance Invoicing',
    targetAudience: 'Indian Businesses, Freelancers, Traders, Service Providers & MSMEs',
    avgDealValue: 'Universal B2B / B2C Invoicing',
    estimatedCloseRate: 'Faster Payment Settlements',
    features: [
      {
        title: '100% GST & Tax Compliant',
        description: 'Support for CGST+SGST (Intra-state) and IGST (Inter-state) with full HSN/SAC summary breakdowns.',
        icon: '🇮🇳',
      },
      {
        title: 'Scan-to-Pay UPI QR Code',
        description: 'Embeds your dynamic UPI ID (PhonePe, GPay, Paytm) directly on the invoice for zero-fee instant settlements.',
        icon: '⚡',
      },
      {
        title: 'Payment Status & Due Dates',
        description: 'Track Payment Pending, Partially Paid, Paid in Full, and Overdue statuses with clear balance calculations.',
        icon: '💳',
      },
      {
        title: 'Bank & Remittance Details',
        description: 'Clear IFSC, Account Number, Bank Name, and Wire Instructions on every invoice footer.',
        icon: '🏦',
      },
    ],
    keyMilestones: [
      'Itemized Service / Product Billing with Tax Rate Tagging',
      'Automatic Subtotal, Discount & GST Calculation',
      'Dynamic UPI QR Code Generation',
      'Settlement Tracking (UTR / Cheque Ref Recording)',
    ],
    sampleItems: [
      { description: 'Digital Marketing & Content Strategy Services (SAC 998311)', qty: 1, unit: 'month', rate: 50000 },
      { description: 'Performance Ad Campaign Management & Optimization', qty: 1, unit: 'month', rate: 25000 },
    ],
    faqs: [
      {
        question: 'Does Invoix calculate CGST, SGST, and IGST automatically?',
        answer: 'Yes. You can select GST rate presets (0%, 5%, 12%, 18%, 28%) and Invoix computes the exact subtotal, tax amount, and grand total.',
      },
      {
        question: 'Can I mark invoices as partially paid or record transaction IDs?',
        answer: 'Yes. Invoix includes a full Invoice Settlement card where you can log advance amounts received, balance remaining, payment mode, and UTR/cheque numbers.',
      },
    ],
  },
};
