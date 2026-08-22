import type {
  IndustryCategory,
  ScopeMilestoneItem,
  DeliverableItem,
  CrewMemberItem,
  WhyChooseUsItem,
  PricingItem,
} from '../types';

export interface IndustryPresetDefinition {
  id: IndustryCategory;
  name: string;
  badge: string;
  icon: string;
  tagline: string;
  defaultPackageTitle: string;
  scopeSectionTitle: string; // e.g. "PROJECT PHASES & TIMELINE" or "EVENT COVERAGE & SCHEDULE"
  teamSectionTitle: string;  // e.g. "DEDICATED TEAM & EXPERTS" or "CREW DEPLOYMENT"
  defaultCurrencyCode: string;
  defaultTaxType: 'none' | 'gst' | 'vat' | 'sales_tax';
  defaultTaxPercent: number;
  sampleStudio: {
    name: string;
    tagline: string;
    address: string;
    phoneNumbers: string;
    email: string;
    website: string;
    taxNumberLabel: string;
    gstin: string;
  };
  sampleClient: {
    nameOfEvent: string;
    address: string;
    contactNo: string;
    clientName: string;
    email: string;
  };
  eventCoverage: ScopeMilestoneItem[];
  deliverables: DeliverableItem[];
  crewMembers: CrewMemberItem[];
  whyChooseUs: WhyChooseUsItem[];
  pricingItems: PricingItem[];
  paymentTerms: {
    advancePercent: number;
    afterEventPercent: number;
    balancePercent: number;
    advanceLabel: string;
    afterEventLabel: string;
    balanceLabel: string;
  };
  termsAndConditions: string[];
}

export const INDUSTRY_PRESETS: Record<IndustryCategory, IndustryPresetDefinition> = {
  creative_agency: {
    id: 'creative_agency',
    name: 'Creative & Digital Agency',
    badge: 'Design & Marketing',
    icon: '🎨',
    tagline: 'Brand Identity, UI/UX, Motion Design & Web Development',
    defaultPackageTitle: 'END-TO-END BRAND IDENTITY & HIGH-CONVERTING WEB PLATFORM',
    scopeSectionTitle: 'PROJECT PHASES & SOW MILESTONES',
    teamSectionTitle: 'ASSIGNED CREATIVE DIRECTORS & SPECIALISTS',
    defaultCurrencyCode: 'USD',
    defaultTaxType: 'sales_tax',
    defaultTaxPercent: 0,
    sampleStudio: {
      name: 'NEXUS CREATIVE STUDIO',
      tagline: 'TRANSFORMING AMBITIOUS BRANDS THROUGH DIGITAL CRAFT',
      address: 'Suite 402, 548 Market St, San Francisco, CA 94104',
      phoneNumbers: '+1 (415) 890-3240',
      email: 'hello@nexuscreativestudio.com',
      website: 'nexuscreativestudio.com',
      taxNumberLabel: 'EIN / Tax ID',
      gstin: 'XX-XXXXXXX',
    },
    sampleClient: {
      nameOfEvent: 'Acme SaaS Platform Redesign & Brand Identity',
      address: '742 Evergreen Terrace, Austin, TX 78701',
      contactNo: '+1 (512) 440-9921',
      clientName: 'Sarah Jenkins (VP of Marketing)',
      email: 'sarah@acmecloud.io',
    },
    eventCoverage: [
      {
        id: 'phase-1',
        dayTitle: 'Phase 1: Discovery, Brand Strategy & Architecture',
        services: [
          'Stakeholder Interviews & Market Positioning Analysis',
          'User Journey Mapping & Information Architecture',
          'Design Moodboards & Visual Direction Proposals',
        ],
      },
      {
        id: 'phase-2',
        dayTitle: 'Phase 2: High-Fidelity UI/UX & Interactive Prototyping',
        services: [
          'Desktop & Mobile Responsive Design in Figma (24+ Key Screens)',
          'Design System & Reusable Component Library',
          'Interactive Clickable Prototype for User Testing',
        ],
      },
      {
        id: 'phase-3',
        dayTitle: 'Phase 3: Production Development, CMS & QA Launch',
        services: [
          'Modern React/Next.js Frontend Build with Tailwind CSS',
          'Headless CMS Integration for Marketing Content',
          'Lighthouse Performance Optimization (>95 Score) & SEO Setup',
        ],
      },
    ],
    deliverables: [
      { id: 'd-1', text: 'Complete Figma Design System (Typography, Colors, 40+ UI Components)', included: true },
      { id: 'd-2', text: 'Production-Ready Modern Responsive Web Application Source Code', included: true },
      { id: 'd-3', text: 'Full Vector Brand Assets Pack (.SVG, .AI, .PNG, .PDF Guidelines)', included: true },
      { id: 'd-4', text: '30 Days Post-Launch Warranty & Bug-Fixing Support', included: true },
      { id: 'd-5', text: 'Custom 3D Product Illustrations & Lottie Micro-Animations', included: true },
    ],
    crewMembers: [
      { id: 'c-1', team: 'Creative Director', role: 'Leads visual design strategy, creative direction, and brand guidelines.', enabled: true },
      { id: 'c-2', team: 'Lead UI/UX Designer', role: 'Architects user flows, wireframes, component design systems, and responsive layouts.', enabled: true },
      { id: 'c-3', team: 'Senior Frontend Engineer', role: 'Develops pixel-perfect, accessible, ultra-fast web interfaces and animations.', enabled: true },
      { id: 'c-4', team: 'Dedicated Project Manager', role: 'Oversees weekly sprint deliverables, client feedback loops, and milestone QA.', enabled: true },
    ],
    whyChooseUs: [
      { id: 'w-1', icon: '💎', title: 'World-Class Aesthetic Craft', description: 'Award-winning design philosophy engineered for conversion and maximum perceived value.', enabled: true },
      { id: 'w-2', icon: '⚡', title: 'Agile 2-Week Sprints', description: 'Transparent weekly video walkthroughs and live Figma staging links to keep you aligned.', enabled: true },
      { id: 'w-3', icon: '🔒', title: '100% IP & Asset Ownership', description: 'Upon final milestone completion, full source code and intellectual property transfer to your company.', enabled: true },
      { id: 'w-4', icon: '🚀', title: 'Obsession with Performance', description: 'Sub-second load times, structured schema data, and mobile-first responsive architecture.', enabled: true },
    ],
    pricingItems: [
      { id: 'p-1', description: 'Brand Identity & Visual Design System', amount: 3500, qty: 1, unit: 'fixed', rate: 3500, selected: true },
      { id: 'p-2', description: 'UI/UX Design for Web App (20+ Screens)', amount: 4800, qty: 60, unit: 'hrs', rate: 80, selected: true },
      { id: 'p-3', description: 'Frontend Development & CMS Integration', amount: 5600, qty: 70, unit: 'hrs', rate: 80, selected: true },
      { id: 'p-4', description: 'Optional: Interactive 3D Spline Asset Animation (Add-on)', amount: 1200, qty: 1, unit: 'fixed', rate: 1200, isOptional: true, selected: false },
      { id: 'p-5', description: 'Optional: 3-Month Monthly Maintenance & Growth Retainer', amount: 2400, qty: 3, unit: 'months', rate: 800, isOptional: true, selected: false },
    ],
    paymentTerms: {
      advancePercent: 40,
      afterEventPercent: 30,
      balancePercent: 30,
      advanceLabel: '40% Project Kickoff Deposit',
      afterEventLabel: '30% Upon UI/UX Prototype Approval',
      balanceLabel: '30% Final Delivery & Production Handover',
    },
    termsAndConditions: [
      'This proposal remains valid for 30 calendar days from the date of issuance.',
      'Project kickoff begins within 3 business days following receipt of the initial 40% deposit.',
      'Scope includes up to 2 comprehensive rounds of design revisions per milestone phase.',
      'All source files, code repositories, and vector assets will be transferred upon final invoice settlement.',
      'Additional scope requests outside this agreement will be estimated separately at our standard hourly rate ($85/hr).',
    ],
  },

  software_tech: {
    id: 'software_tech',
    name: 'Software & Freelance Tech',
    badge: 'Engineering & SaaS',
    icon: '💻',
    tagline: 'Custom Software, Full-Stack SaaS & API Infrastructure',
    defaultPackageTitle: 'ENTERPRISE FULL-STACK SOFTWARE ENGINEERING & CLOUD ARCHITECTURE',
    scopeSectionTitle: 'SPRINTS & DEVELOPMENT ROADMAP',
    teamSectionTitle: 'ENGINEERING TEAM & TECH STACK',
    defaultCurrencyCode: 'USD',
    defaultTaxType: 'none',
    defaultTaxPercent: 0,
    sampleStudio: {
      name: 'SYNAPSE TECH LABS',
      tagline: 'ROBUST, SCALABLE FULL-STACK SOFTWARE & CLOUD SYSTEMS',
      address: '100 King St W, Toronto, ON M5X 1A9, Canada',
      phoneNumbers: '+1 (647) 912-7740',
      email: 'contact@synapsetechlabs.com',
      website: 'synapsetechlabs.com',
      taxNumberLabel: 'Business No',
      gstin: 'BN-883920199',
    },
    sampleClient: {
      nameOfEvent: 'B2B Logistics Management Portal & Real-Time Tracking',
      address: '88 Commerce Valley Dr, Markham, ON',
      contactNo: '+1 (416) 555-0199',
      clientName: 'David Zhang (CTO)',
      email: 'dzhang@logixfleet.com',
    },
    eventCoverage: [
      {
        id: 'sprint-1',
        dayTitle: 'Sprint 1-2: Architecture, Database Schema & Auth',
        services: [
          'PostgreSQL / Supabase Multi-Tenant Schema Design & Security Rules',
          'Next.js 15 App Router Backend API Integration & Role-Based Access Control',
          'CI/CD Pipeline Setup via GitHub Actions & Vercel/AWS Staging Environments',
        ],
      },
      {
        id: 'sprint-2',
        dayTitle: 'Sprint 3-4: Core Business Logic & Real-Time Dashboard',
        services: [
          'Live WebSockets GPS Fleet Location Streaming & Mapbox Integration',
          'Automated PDF Invoice Generation & Stripe Billing Webhook Integration',
          'Role-based permissions for Admins, Dispatchers, and Drivers',
        ],
      },
      {
        id: 'sprint-3',
        dayTitle: 'Sprint 5: End-to-End Testing, Security Audit & Cloud Deployment',
        services: [
          'Automated Playwright & Vitest Integration Test Suites',
          'Load Testing (Up to 10,000 concurrent API requests/min)',
          'Production AWS/Cloudflare Zero-Downtime Deployment & Documentation',
        ],
      },
    ],
    deliverables: [
      { id: 'sd-1', text: 'Clean, fully documented TypeScript / React / Node.js Git Repository', included: true },
      { id: 'sd-2', text: 'Automated CI/CD Deployment to Production Cloud Environment', included: true },
      { id: 'sd-3', text: 'Interactive OpenAPI / Swagger Documentation for all Backend Endpoints', included: true },
      { id: 'sd-4', text: '60 Days Complimentary Server Monitoring & Post-Launch Bug Resolution', included: true },
    ],
    crewMembers: [
      { id: 'sc-1', team: 'Lead Solutions Architect', role: 'Designs high-availability cloud infrastructure and database topologies.', enabled: true },
      { id: 'sc-2', team: 'Senior Full-Stack Engineer', role: 'Builds secure API microservices, frontend UI, and real-time data synchronizers.', enabled: true },
      { id: 'sc-3', team: 'DevOps & Security Specialist', role: 'Configures containerized pipelines, secrets management, and automated test runners.', enabled: true },
    ],
    whyChooseUs: [
      { id: 'sw-1', icon: '🛡️', title: 'Enterprise-Grade Security', description: 'OWASP top 10 compliance, row-level security, encrypted secrets, and token authorization.', enabled: true },
      { id: 'sw-2', icon: '⚡', title: 'Modular Clean Architecture', description: 'Type-safe TypeScript codebase structured for effortless maintainability and developer onboarding.', enabled: true },
      { id: 'sw-3', icon: '🧪', title: 'Automated Test Coverage', description: 'Comprehensive unit, integration, and regression suites to guarantee zero production regressions.', enabled: true },
    ],
    pricingItems: [
      { id: 'sp-1', description: 'System Architecture & Database Schema Design', amount: 2500, qty: 1, unit: 'fixed', rate: 2500, selected: true },
      { id: 'sp-2', description: 'Full-Stack Development (Sprint 1 to 4)', amount: 9600, qty: 120, unit: 'hrs', rate: 80, selected: true },
      { id: 'sp-3', description: 'Automated Testing, Security Audit & Cloud Launch', amount: 2400, qty: 30, unit: 'hrs', rate: 80, selected: true },
      { id: 'sp-4', description: 'Optional: Native iOS & Android React Native Mobile Wrapper', amount: 3500, qty: 1, unit: 'fixed', rate: 3500, isOptional: true, selected: false },
    ],
    paymentTerms: {
      advancePercent: 30,
      afterEventPercent: 40,
      balancePercent: 30,
      advanceLabel: '30% Upfront Development Deposit',
      afterEventLabel: '40% Upon Staging Environment Demo',
      balanceLabel: '30% Final Production Code Handover',
    },
    termsAndConditions: [
      'Source code is hosted on client-owned private GitHub repository throughout development.',
      'Deployment credentials and environment secrets remain confidential under mutual NDA.',
      'Payment terms are Net 7 from milestone acceptance.',
      'Includes 60 calendar days of post-release bug fixing for all outlined specifications.',
    ],
  },

  consulting: {
    id: 'consulting',
    name: 'Consulting & Professional Services',
    badge: 'Strategy & Advisory',
    icon: '📊',
    tagline: 'Management Consulting, Financial Advisory & Corporate Strategy',
    defaultPackageTitle: 'STRATEGIC BUSINESS EXPANSION & OPERATIONAL EXCELLENCE ADVISORY',
    scopeSectionTitle: 'ENGAGEMENT PHASES & DELIVERABLES',
    teamSectionTitle: 'KEY CONSULTANTS & ADVISORY PARTNERS',
    defaultCurrencyCode: 'GBP',
    defaultTaxType: 'vat',
    defaultTaxPercent: 20,
    sampleStudio: {
      name: 'VANGUARD STRATEGY GROUP',
      tagline: 'DATA-DRIVEN STRATEGIC ADVISORY FOR HIGH-GROWTH ENTERPRISES',
      address: '30 St Mary Axe (The Gherkin), London EC3A 8EP, United Kingdom',
      phoneNumbers: '+44 20 7946 0912',
      email: 'advisory@vanguardstrategy.co.uk',
      website: 'vanguardstrategy.co.uk',
      taxNumberLabel: 'VAT Reg No',
      gstin: 'GB 992 8412 55',
    },
    sampleClient: {
      nameOfEvent: 'European Market Expansion & Operational Optimization Advisory',
      address: '22 Bishopsgate, London EC2N 4BQ',
      contactNo: '+44 20 7123 4567',
      clientName: 'Alexander Sterling (Managing Director)',
      email: 'a.sterling@sterlingholdings.com',
    },
    eventCoverage: [
      {
        id: 'cp-1',
        dayTitle: 'Phase 1: Operational Diagnostic & Financial Benchmarking',
        services: [
          'Comprehensive Cost Structure & Unit Economics Audit',
          'Competitor Moat & Regulatory Framework Analysis across UK & EU',
          'Executive Leadership Alignment Workshops',
        ],
      },
      {
        id: 'cp-2',
        dayTitle: 'Phase 2: Strategic Roadmap & Go-To-Market Formulation',
        services: [
          'Channel Partner Acquisition Strategy & Commercial Terms Modeling',
          'Operating Margin Improvement & Automation Recommendations',
          '5-Year Capital Allocation & Cashflow Projection Models',
        ],
      },
      {
        id: 'cp-3',
        dayTitle: 'Phase 3: Implementation Oversight & Board Presentation',
        services: [
          'Executive Board Deck & Investor-Ready Memorandum Preparation',
          'Bi-Weekly Execution SteerCo Leadership Sessions',
          'KPI Dashboard Setup & Management Training',
        ],
      },
    ],
    deliverables: [
      { id: 'cd-1', text: 'Full 60-Page Comprehensive Strategic Expansion Report (.PDF & Executive Summary)', included: true },
      { id: 'cd-2', text: 'Dynamic Excel Financial Model with Scenario Sensitivity Controls (DCF, ROI, LTV/CAC)', included: true },
      { id: 'cd-3', text: 'Ready-to-Present High-Impact Board Presentation Deck (PowerPoint & Keynote)', included: true },
      { id: 'cd-4', text: '6x Dedicated 1-on-1 Strategic Advisory Sessions with Senior Partner', included: true },
    ],
    crewMembers: [
      { id: 'cc-1', team: 'Managing Partner', role: 'Oversees strategic thesis, board-level recommendations, and transaction structure.', enabled: true },
      { id: 'cc-2', team: 'Principal Financial Modeler', role: 'Constructs complex econometric models, valuation multiples, and cash forecasting.', enabled: true },
      { id: 'cc-3', team: 'Senior Operations Analyst', role: 'Conducts process mining, supply-chain diagnostics, and KPI instrumentation.', enabled: true },
    ],
    whyChooseUs: [
      { id: 'cw-1', icon: '🏛️', title: 'Proven Tier-1 Advisory Heritage', description: 'Over £120M in client enterprise value created across European technology and industrials.', enabled: true },
      { id: 'cw-2', icon: '📈', title: 'Actionable, Not Theoretical', description: 'We deliver concrete implementation schedules with measurable margin enhancement KPIs.', enabled: true },
      { id: 'cw-3', icon: '🤝', title: 'High-Touch Senior Partner Access', description: 'Direct access to senior partners with no bait-and-switch junior staff substitution.', enabled: true },
    ],
    pricingItems: [
      { id: 'cp-item-1', description: 'Strategic Diagnostic & Market Feasibility Study', amount: 4500, qty: 1, unit: 'fixed', rate: 4500, selected: true },
      { id: 'cp-item-2', description: 'Financial Modeling & Capital Structure Blueprint', amount: 3800, qty: 1, unit: 'fixed', rate: 3800, selected: true },
      { id: 'cp-item-3', description: 'Board Presentation Preparation & Advisory Workshops', amount: 2200, qty: 1, unit: 'fixed', rate: 2200, selected: true },
      { id: 'cp-item-4', description: 'Optional: 6-Month Retained Advisory Retainer (20 hrs/mo)', amount: 6000, qty: 6, unit: 'months', rate: 1000, isOptional: true, selected: false },
    ],
    paymentTerms: {
      advancePercent: 50,
      afterEventPercent: 30,
      balancePercent: 20,
      advanceLabel: '50% Engagement Retainer upon Signing',
      afterEventLabel: '30% Interim Findings & Model Submission',
      balanceLabel: '20% Final Board Presentation & Sign-off',
    },
    termsAndConditions: [
      'Engagement initiates immediately upon execution of engagement letter and initial retainer.',
      'All commercial insights and strategic reports remain strictly confidential.',
      'Invoices are subject to UK VAT at the prevailing rate of 20%.',
      'Travel and out-of-pocket expenses beyond Greater London are billed at cost with prior approval.',
    ],
  },

  construction: {
    id: 'construction',
    name: 'Construction & Interior Design',
    badge: 'Architecture & Trades',
    icon: '🏗️',
    tagline: 'Architectural Design, Turnkey Interior Fitouts & General Contracting',
    defaultPackageTitle: 'TURNKEY LUXURY INTERIOR DESIGN & ARCHITECTURAL EXECUTION',
    scopeSectionTitle: 'EXECUTION STAGES & SITE PROGRESS',
    teamSectionTitle: 'PROJECT ARCHITECTS & SITE SUPERVISION',
    defaultCurrencyCode: 'INR',
    defaultTaxType: 'gst',
    defaultTaxPercent: 18,
    sampleStudio: {
      name: 'AURA INTERIORS & BUILDERS',
      tagline: 'PREMIUM ARCHITECTURAL LIVING & TURNKEY EXECUTION',
      address: '14/B, 100ft Road, Indiranagar, Bangalore, Karnataka - 560038',
      phoneNumbers: '+91 98450 12345, +91 80 4123 9876',
      email: 'projects@aurainteriors.in',
      website: 'aurainteriors.in',
      taxNumberLabel: 'GSTIN',
      gstin: '29AABCA1234F1Z9',
    },
    sampleClient: {
      nameOfEvent: 'Luxury 4BHK Villa Turnkey Interior & Woodwork',
      address: 'Villa 18, Prestige Golfshire, Nandi Hills Road, Bangalore',
      contactNo: '+91 98860 55432',
      clientName: 'Dr. Rajesh Nair & Dr. Meera Nair',
      email: 'rajesh.nair@healthcorp.in',
    },
    eventCoverage: [
      {
        id: 'stage-1',
        dayTitle: 'Stage 1: 3D Architectural Visuals, Electrical & Civil Layout',
        services: [
          'Detailed Room-by-Room 3D Photorealistic Renderings (3ds Max / V-Ray)',
          'Complete Electrical, False Ceiling, Plumbing & HVAC Layout Schematics',
          'Material Moodboard & Premium Veneer / Stone Sampling Approval',
        ],
      },
      {
        id: 'stage-2',
        dayTitle: 'Stage 2: Factory Modular Woodwork & On-Site Civil Framing',
        services: [
          'Anti-Termite Marine BWP Grade Plywood Kitchen & Wardrobe Fabrication',
          'Designer Gypsum False Ceiling with Concealed Warm COB Magnetic Track Lighting',
          'Italian Marble Floor Polishing & Premium Acrylic Wall Paneling',
        ],
      },
      {
        id: 'stage-3',
        dayTitle: 'Stage 3: Hardware Fitting, PU Painting & Deep Cleaning Handover',
        services: [
          'Installation of Blum / Hettich Soft-Close Drawers & German Hardware',
          'Asian Paints Royale Luxury PU Finish Paint on All Internal Walls',
          'Complete Deep Chemical Cleaning, Snag List Rectification & Key Handover',
        ],
      },
    ],
    deliverables: [
      { id: 'bd-1', text: 'Full 3D Render Views & 2D Detailed Architectural Drawing Blueprint Set', included: true },
      { id: 'bd-2', text: 'Complete Factory-Finished Modular Kitchen with Quartz Countertop & Soft-Close Units', included: true },
      { id: 'bd-3', text: 'Master, Guest & Kids Bedroom Floor-to-Ceiling Wardrobes with Lacquered Glass', included: true },
      { id: 'bd-4', text: 'Designer False Ceiling with Complete Warm-White Architectural Lighting Fixtures', included: true },
      { id: 'bd-5', text: '10-Year Comprehensive Warranty Certificate on All Marine BWP Woodwork', included: true },
    ],
    crewMembers: [
      { id: 'bc-1', team: 'Lead Interior Architect', role: 'Space planning, 3D visualization, material palette selection, and client styling sessions.', enabled: true },
      { id: 'bc-2', team: 'Site Project Engineer', role: 'Full-time daily on-site supervision, civil alignment check, and subcontractor coordination.', enabled: true },
      { id: 'bc-3', team: 'Quality & Finishing Auditor', role: 'Rigorous 40-point snag checklist inspection before final deep cleaning handover.', enabled: true },
    ],
    whyChooseUs: [
      { id: 'bw-1', icon: '🏆', title: '10-Year Material Warranty', description: 'We use genuine IS:710 Marine Grade BWP plywood with tamper-proof factory serial tags.', enabled: true },
      { id: 'bw-2', icon: '⏱️', title: 'Guaranteed 45-Day Move-In', description: 'Zero project delay penalty clause written directly into our commercial agreement.', enabled: true },
      { id: 'bw-3', icon: '📱', title: 'Daily WhatsApp Site Updates', description: 'High-res photos and video progress logs posted every evening by the site supervisor.', enabled: true },
    ],
    pricingItems: [
      { id: 'bp-1', description: 'Modular Kitchen (BWP Ply + Acrylic Finish + Quartz Top)', amount: 280000, qty: 1, unit: 'units', rate: 280000, selected: true },
      { id: 'bp-2', description: 'Floor-to-Ceiling Master Wardrobes (PU Finish + Loft)', amount: 240000, qty: 160, unit: 'sq ft', rate: 1500, selected: true },
      { id: 'bp-3', description: 'Designer False Ceiling & Electrical Lighting Grid', amount: 95000, qty: 950, unit: 'sq ft', rate: 100, selected: true },
      { id: 'bp-4', description: 'Living Room TV Unit & Fluted Charcoal Wall Cladding', amount: 85000, qty: 1, unit: 'fixed', rate: 85000, selected: true },
      { id: 'bp-5', description: 'Optional: Smart Home Automation System (Curtains + Lights)', amount: 65000, qty: 1, unit: 'fixed', rate: 65000, isOptional: true, selected: false },
    ],
    paymentTerms: {
      advancePercent: 40,
      afterEventPercent: 40,
      balancePercent: 20,
      advanceLabel: '40% Booking & 3D Drawing Sign-off',
      afterEventLabel: '40% Factory Material Dispatch to Site',
      balanceLabel: '20% Final Hardware Fitting & Key Handover',
    },
    termsAndConditions: [
      'Quote valid for 15 days due to raw material and copper price fluctuations.',
      'Site readiness (power and water supply) is required prior to civil and electrical work.',
      'Any structural alterations or additional carpentry requested will be estimated before execution.',
      'Payments to be released according to milestone stages prior to material dispatch.',
    ],
  },

  photography_events: {
    id: 'photography_events',
    name: 'Photography & Event Production',
    badge: 'Cinematography & Events',
    icon: '📸',
    tagline: 'Real Moments, Timeless Stories & Wedding Films',
    defaultPackageTitle: 'GRAND WEDDING PHOTOGRAPHY & CINEMATOGRAPHY PACKAGE',
    scopeSectionTitle: 'EVENT SCHEDULE & DAY-WISE COVERAGE',
    teamSectionTitle: 'CREW DEPLOYMENT & CAMERAS',
    defaultCurrencyCode: 'INR',
    defaultTaxType: 'none',
    defaultTaxPercent: 0,
    sampleStudio: {
      name: 'LUMIÈRE CINEMA & VISUALS',
      tagline: 'REAL MOMENTS, TIMELESS STORIES.',
      address: 'Indiranagar, Bangalore, Karnataka - 560038',
      phoneNumbers: '+91 98765 43210, +91 87654 32109',
      email: 'contact@lumierecinema.com',
      website: 'lumierecinema.com',
      taxNumberLabel: 'GSTIN',
      gstin: '29ABCDE1234F1Z5',
    },
    sampleClient: {
      nameOfEvent: 'Walima & Grand Wedding Reception',
      address: 'Vivek Nagar, Bangalore, Karnataka',
      contactNo: '9876543210',
      clientName: 'Mohammed & Family',
      email: 'client@example.com',
    },
    eventCoverage: [
      {
        id: 'day-1',
        dayTitle: 'Day 1 - Walima / Main Wedding Reception',
        services: [
          'Traditional Photography (Stage & Family Group Portraits)',
          'Traditional Full HD Videography (Complete Rituals Coverage)',
          'Candid Photography (Couple Portraits & Emotion Angles)',
          'Candid 4K Cinematography (Teaser & Highlight Cinema)',
        ],
      },
    ],
    deliverables: [
      { id: 'pd-1', text: 'Cinematic Event Teaser (60-90 seconds in 4K resolution)', included: true },
      { id: 'pd-2', text: '200+ Professionally Color-Graded High-Resolution Photographs', included: true },
      { id: 'pd-3', text: 'Full Length Traditional Event Coverage Film with Chapter Navigation', included: true },
      { id: 'pd-4', text: 'Luxury Photobook Album (40 Pages Velvet Touch Matte)', included: false },
      { id: 'pd-5', text: 'All RAW Unedited Footage & High-Res Stills on 128GB High-Speed Drive', included: true },
    ],
    crewMembers: [
      { id: 'pc-1', team: 'Candid Photographer', role: 'Capturing portraits and moments of the couple, immediate family & friends in creative angles.', enabled: true },
      { id: 'pc-2', team: 'Candid Videographer', role: 'Capturing cinematic B-roll, interviews, and moments for the teaser and highlight film.', enabled: true },
      { id: 'pc-3', team: 'Traditional Photographer', role: 'Capturing comprehensive stage coverage, family group photos, and guest portraits.', enabled: true },
      { id: 'pc-4', team: 'Traditional Videographer', role: 'Full continuous coverage of rituals and ceremonies for the archive film.', enabled: true },
      { id: 'pc-5', team: 'Drone Pilot', role: 'Capturing breathtaking 4K aerial cinematic drone views of the venue and grand entries.', enabled: false },
    ],
    whyChooseUs: [
      { id: 'pw-1', icon: '✨', title: 'Timeless Storytelling', description: 'Every photograph and film is crafted to capture genuine emotions and unforgettable memories.', enabled: true },
      { id: 'pw-2', icon: '📸', title: 'Sony FX3 Cinema Rigs', description: 'Top-tier cinema cameras, prime G-Master lenses, and studio lighting for magazine-grade quality.', enabled: true },
      { id: 'pw-3', icon: '⏱️', title: 'Guaranteed 25-Day Delivery', description: 'Your edited memories delivered promptly on cloud gallery without quality compromise.', enabled: true },
      { id: 'pw-4', icon: '🤝', title: 'Friendly & Stress-Free Team', description: 'Experienced directors who make the couple feel natural and confident on their big day.', enabled: true },
    ],
    pricingItems: [
      { id: 'pp-1', description: 'Full Day Walima Coverage (Candid + Traditional Photo & Video)', amount: 65000, qty: 1, unit: 'fixed', rate: 65000, selected: true },
      { id: 'pp-2', description: 'Optional: 4K Drone Aerial Cinematic Package (Add-on)', amount: 10000, qty: 1, unit: 'fixed', rate: 10000, isOptional: true, selected: false },
      { id: 'pp-3', description: 'Optional: Premium 40-Page Layflat Photobook Album', amount: 12000, qty: 1, unit: 'units', rate: 12000, isOptional: true, selected: false },
      { id: 'pp-4', description: 'Optional: 3x Instagram Vertical Reels Package', amount: 6000, qty: 1, unit: 'fixed', rate: 6000, isOptional: true, selected: false },
    ],
    paymentTerms: {
      advancePercent: 30,
      afterEventPercent: 50,
      balancePercent: 20,
      advanceLabel: '30% Advance at Booking Confirmation',
      afterEventLabel: '50% On the Day of the Event',
      balanceLabel: '20% Upon Delivery of Final Edited Deliverables',
    },
    termsAndConditions: [
      'Booking is officially confirmed only upon receipt of the 30% advance deposit.',
      'Outstation travel, stay, and food expenses for the crew to be arranged by the client.',
      'Initial raw photos preview link delivered within 5 working days post-event.',
      'Final edited video deliverables and album print within 25–35 working days from photo selection.',
    ],
  },

  general_business: {
    id: 'general_business',
    name: 'General B2B & Trading',
    badge: 'Commercial & Sales',
    icon: '📦',
    tagline: 'Wholesale Distribution, Commercial Supply & Equipment Rental',
    defaultPackageTitle: 'COMMERCIAL SUPPLY & CONTRACT EXECUTION AGREEMENT',
    scopeSectionTitle: 'SUPPLY PHASES & DISPATCH SCHEDULE',
    teamSectionTitle: 'ACCOUNT REPRESENTATIVES & LOGISTICS',
    defaultCurrencyCode: 'USD',
    defaultTaxType: 'vat',
    defaultTaxPercent: 10,
    sampleStudio: {
      name: 'APEX COMMERCIAL ENTERPRISES',
      tagline: 'PREMIUM COMMERCIAL EQUIPMENT & WHOLESALE SUPPLY',
      address: 'Industrial Zone 4, Building B, Dubai, UAE',
      phoneNumbers: '+971 4 398 2200',
      email: 'sales@apexcommercial.ae',
      website: 'apexcommercial.ae',
      taxNumberLabel: 'TRN / VAT',
      gstin: 'TRN-100293849100003',
    },
    sampleClient: {
      nameOfEvent: 'Quarterly Office Infrastructure & Workstation Supply',
      address: 'Tower 2, Business Bay, Dubai',
      contactNo: '+971 50 123 4567',
      clientName: 'Kareem Mansoor (Procurement Head)',
      email: 'kmansoor@gulfholding.com',
    },
    eventCoverage: [
      {
        id: 'batch-1',
        dayTitle: 'Batch 1: Warehouse Quality Audit & Export Packaging',
        services: [
          'Pre-shipment 100% Quality Inspection and Serial Number Logging',
          'Heavy-Duty Foam Cushioning & Palletized Shrink Wrap Packaging',
          'Customs Documentation & Commercial Invoice Clearance',
        ],
      },
      {
        id: 'batch-2',
        dayTitle: 'Batch 2: Site Delivery, Assembly & Operational Testing',
        services: [
          'Direct Doorstep Delivery via Dedicated Freight Truck',
          'On-Site Hardware Assembly & Ergonomic Adjustment by Certified Technicians',
          'Final Acceptance Testing & Sign-off with Procurement Officer',
        ],
      },
    ],
    deliverables: [
      { id: 'gd-1', text: 'All items brand new in original manufacturer packaging with warranty seals', included: true },
      { id: 'gd-2', text: 'Official Commercial Delivery Note & Signed Bill of Lading', included: true },
      { id: 'gd-3', text: '3-Year Comprehensive On-Site Replacement Warranty on Major Components', included: true },
    ],
    crewMembers: [
      { id: 'gc-1', team: 'Corporate Account Executive', role: 'Direct point of contact for pricing, purchase order processing, and SLA oversight.', enabled: true },
      { id: 'gc-2', team: 'Logistics & Dispatch Manager', role: 'Coordinates freight routing, warehouse packing, and express delivery.', enabled: true },
    ],
    whyChooseUs: [
      { id: 'gw-1', icon: '🛡️', title: 'Direct Manufacturer Certified', description: 'Authorized distributor guaranteeing 100% genuine products with full serial traceability.', enabled: true },
      { id: 'gw-2', icon: '⚡', title: '48-Hour Rapid Replacement', description: 'Defective units swapped with new stock within 48 hours under our enterprise SLA.', enabled: true },
    ],
    pricingItems: [
      { id: 'gp-1', description: 'Ergonomic Mesh Executive Workstation Chairs', amount: 4800, qty: 24, unit: 'units', rate: 200, selected: true },
      { id: 'gp-2', description: 'Motorized Dual-Motor Height Adjustable Standing Desks', amount: 8400, qty: 24, unit: 'units', rate: 350, selected: true },
      { id: 'gp-3', description: 'On-Site Delivery, Assembly & Packaging Removal', amount: 600, qty: 1, unit: 'fixed', rate: 600, selected: true },
      { id: 'gp-4', description: 'Optional: Annual Preventive Maintenance & Ergonomic Audit', amount: 1200, qty: 1, unit: 'fixed', rate: 1200, isOptional: true, selected: false },
    ],
    paymentTerms: {
      advancePercent: 50,
      afterEventPercent: 30,
      balancePercent: 20,
      advanceLabel: '50% Upon Purchase Order Confirmation',
      afterEventLabel: '30% Upon Material Dispatch from Warehouse',
      balanceLabel: '20% Net 15 Days Following Site Handover',
    },
    termsAndConditions: [
      'Quotation prices are valid for 20 business days from quote date.',
      'Delivery timeline is 7–10 business days following advance receipt.',
      'Warranty covers manufacturing defects under standard operating conditions.',
      'Late payments beyond credit term will incur a 1.5% monthly interest fee.',
    ],
  },
};
