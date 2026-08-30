import React, { useState } from 'react';
import type {
  QuotationDocument,
  BillType,
  IndustryCategory,
  PricingItem,
  ScopeMilestoneItem,
  DeliverableItem,
  CrewMemberItem,
  WhyChooseUsItem,
  SignatoryRecord,
  CustomTemplatePreset,
  SectionVisibilityConfig,
  SectionTitlesConfig,
} from '../types';
import { sanitizeContactNumber } from '../utils/formatters';
import {
  saveStudioProfileToStorage,
  saveWatermarkConfigToStorage,
  createDocumentFromPreset,
} from '../constants/defaultData';
import {
  fetchCustomTemplates,
  saveCustomTemplate,
  deleteCustomTemplate,
  pushLocalTemplatesToCloud,
} from '../services/templateService';
import {
  getCustomTemplates,
  createTemplateFromDocument,
} from '../utils/customTemplateStorage';
import { SUPPORTED_CURRENCIES } from '../constants/currencies';
import { IndustryPresetSelector } from './IndustryPresetSelector';
import { WatermarkControls } from './WatermarkControls';
import { AdBanner } from './AdBanner';
import { processLogoFile } from '../utils/imageTrim';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isPaidPlan } from '../utils/planLimits';
import { uploadIfDataUrl, deleteAsset, isStoredAssetUrl } from '../services/storageService';
import {
  User,
  Layers,
  CheckSquare,
  DollarSign,
  Plus,
  Trash2,
  Building2,
  Globe,
  CreditCard,
  PenTool,
  Briefcase,
  Sparkles,
  CheckCircle2,
  FileCheck2,
  Palette,
  Type,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  Award,
  FileText,
  FileSignature,
  Lock,
  LayoutTemplate,
  Sliders,
  X,
  Check,
  Save,
  Eye,
  EyeOff,
  Upload,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

interface FormEditorProps {
  document: QuotationDocument;
  onChange: (doc: QuotationDocument) => void;
  onOpenUpgrade?: (plan?: 'pro' | 'agency') => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenHealth?: () => void;
}

export const FormEditor: React.FC<FormEditorProps> = ({
  document: doc,
  onChange,
  onOpenUpgrade,
  activeTab: externalTab,
  onTabChange,
  onOpenHealth,
}) => {
  const { user, profile } = useAuth();
  const { toast, confirm } = useToast();
  const isPro = isPaidPlan(profile);
  const [internalTab, setInternalTab] = useState<string>('industry');
  const activeTab = externalTab ?? internalTab;
  const setActiveTab = onTabChange ?? setInternalTab;
  const [customTemplates, setCustomTemplates] = useState<CustomTemplatePreset[]>(() => getCustomTemplates());
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [templateDescInput, setTemplateDescInput] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const logoFileInputRef = React.useRef<HTMLInputElement>(null);
  const signatureFileInputRef = React.useRef<HTMLInputElement>(null);
  const tabsContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkTabScroll = React.useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const hasScrollLeft = el.scrollLeft > 4;
    const hasScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setCanScrollLeft(hasScrollLeft);
    setCanScrollRight(hasScrollRight);
  }, []);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -220 : 220,
        behavior: 'smooth',
      });
    }
  };

  React.useEffect(() => {
    checkTabScroll();
    const el = tabsContainerRef.current;
    if (!el) return;
    const handleResize = () => checkTabScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkTabScroll]);

  React.useEffect(() => {
    if (tabsContainerRef.current) {
      const activeEl = tabsContainerRef.current.querySelector(`[data-tab-id="${activeTab}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      }
    }
    checkTabScroll();
  }, [activeTab, checkTabScroll]);

  React.useEffect(() => {
    let active = true;
    if (user?.id) {
      pushLocalTemplatesToCloud(user.id).catch(() => {});
    }
    fetchCustomTemplates(user?.id).then((tmplList) => {
      if (active) setCustomTemplates(tmplList);
    });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const update = (partial: Partial<QuotationDocument>) => {
    onChange({ ...doc, ...partial });
  };

  const handleApplyCustomTemplate = (tmpl: CustomTemplatePreset) => {
    update({
      customTemplateId: tmpl.id,
      industry: tmpl.industry,
      theme: tmpl.theme,
      accentColor: tmpl.accentColor,
      fontFamily: tmpl.fontFamily,
      sectionVisibility: tmpl.sectionVisibility,
      sectionTitles: tmpl.sectionTitles,
      includeScopeSection: tmpl.sectionVisibility?.scope ?? true,
      includeCrewSection: tmpl.sectionVisibility?.crew ?? true,
      includeWhyChooseUs: tmpl.sectionVisibility?.whyChooseUs ?? true,
    });
  };

  const handleDeleteCustomTemplate = async (id: string) => {
    await deleteCustomTemplate(id, user?.id);
    const updated = await fetchCustomTemplates(user?.id);
    setCustomTemplates(updated);
    if (doc.customTemplateId === id) {
      update({ customTemplateId: undefined });
    }
  };

  const handleSaveCurrentAsTemplate = async () => {
    if (!templateNameInput.trim()) {
      toast.warning('Please enter a name for your custom template.');
      return;
    }
    const newTmpl = createTemplateFromDocument(doc, templateNameInput.trim(), templateDescInput.trim());
    const res = await saveCustomTemplate(newTmpl, user?.id);
    const updated = await fetchCustomTemplates(user?.id);
    setCustomTemplates(updated);
    update({ customTemplateId: newTmpl.id });
    setIsSaveTemplateModalOpen(false);
    setTemplateNameInput('');
    setTemplateDescInput('');

    /*
      A local-only save must not report plain success.

      Console-warning it and still showing "Saved!" is the exact pattern behind
      the missing-on-second-device reports: the user is told their template is
      stored, learns days later it only ever existed in one browser, and loses it
      when that browser is cleared.
    */
    if (!res.isCloud) {
      toast.warning(
        res.error || `Saved "${newTmpl.name}" on this device only — it will not appear elsewhere.`
      );
      return;
    }

    toast.success(`Saved "${newTmpl.name}" to your templates on all devices.`);
  };

  const currentVisibility: SectionVisibilityConfig = {
    banner: doc.sectionVisibility?.banner ?? true,
    scope: doc.sectionVisibility?.scope ?? doc.includeScopeSection ?? true,
    deliverables: doc.sectionVisibility?.deliverables ?? true,
    crew: doc.sectionVisibility?.crew ?? doc.includeCrewSection ?? true,
    whyChooseUs: doc.sectionVisibility?.whyChooseUs ?? doc.includeWhyChooseUs ?? true,
    pricingTable: doc.sectionVisibility?.pricingTable ?? true,
    paymentMilestones: doc.sectionVisibility?.paymentMilestones ?? true,
    bankDetails: doc.sectionVisibility?.bankDetails ?? true,
    terms: doc.sectionVisibility?.terms ?? true,
    signatory: doc.sectionVisibility?.signatory ?? true,
  };

  const toggleSectionVisibility = (key: keyof SectionVisibilityConfig) => {
    const updated = {
      ...currentVisibility,
      [key]: !currentVisibility[key],
    };
    update({
      sectionVisibility: updated,
      includeScopeSection: updated.scope,
      includeCrewSection: updated.crew,
      includeWhyChooseUs: updated.whyChooseUs,
    });
  };

  const handleSectionTitleChange = (key: keyof SectionTitlesConfig, val: string) => {
    update({
      sectionTitles: {
        ...doc.sectionTitles,
        [key]: val,
      },
    });
  };

  const handleSelectIndustryPreset = async (industry: IndustryCategory) => {
    const ok = await confirm({
      title: 'Switch Industry Preset',
      message: `Load default template for "${industry.replace('_', ' ').toUpperCase()}"? This will populate sample scope, deliverables, and terms.`,
      confirmText: 'Load Preset',
      variant: 'warning',
    });
    if (ok) {
      const newDoc = createDocumentFromPreset(industry, doc.type);
      // Preserve current studio custom logo & colors if any
      if (doc.studio.logoUrl) {
        newDoc.studio.logoUrl = doc.studio.logoUrl;
      }
      if (doc.accentColor) {
        newDoc.accentColor = doc.accentColor;
      }
      if (doc.fontFamily) {
        newDoc.fontFamily = doc.fontFamily;
      }
      onChange(newDoc);
      toast.success(`Loaded ${industry.replace('_', ' ')} template`);
    }
  };

  // Logo Upload with automatic optimization, Supabase Storage integration & quota protection
  const handleTopLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingLogo(true);
      try {
        const res = await processLogoFile(file);
        if (res.success && res.dataUrl) {
          // Clean up old Supabase storage asset if present
          if (doc.studio.logoUrl && isStoredAssetUrl(doc.studio.logoUrl)) {
            deleteAsset(doc.studio.logoUrl).catch(() => {});
          }

          // Upload to Supabase Storage or fallback to base64 if offline/unauthenticated
          const storedUrl = await uploadIfDataUrl(res.dataUrl, 'logo', profile?.id);

          const updatedStudio = {
            ...doc.studio,
            logoUrl: storedUrl || res.dataUrl,
          };
          saveStudioProfileToStorage(updatedStudio);
          update({ studio: updatedStudio });
          toast.success('Logo updated successfully!');
        } else if (res.error) {
          toast.error(res.error);
        }
      } finally {
        setIsUploadingLogo(false);
        if (logoFileInputRef.current) {
          logoFileInputRef.current.value = '';
        }
      }
    }
  };

  const handleRemoveTopLogo = () => {
    if (doc.studio.logoUrl && isStoredAssetUrl(doc.studio.logoUrl)) {
      deleteAsset(doc.studio.logoUrl).catch(() => {});
    }
    const updatedStudio = { ...doc.studio, logoUrl: '' };
    saveStudioProfileToStorage(updatedStudio);
    update({ studio: updatedStudio });
  };

  const handleBillTypeChange = (type: BillType) => {
    const currentNo = doc.details.invoiceNo;
    let newNo = currentNo;
    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);

    if (type === 'INVOICE' && (!currentNo || currentNo.startsWith('QUO-'))) {
      newNo = `INV-${year}-${rand}`;
    } else if (type === 'QUOTATION' && (!currentNo || currentNo.startsWith('INV-'))) {
      newNo = `QUO-${year}-${rand}`;
    }

    update({
      type,
      details: {
        ...doc.details,
        invoiceNo: newNo,
      },
    });
  };

  // Client info handlers
  const handleClientChange = (field: string, value: string) => {
    update({
      client: {
        ...doc.client,
        [field]: value,
      },
    });
  };

  // Document details handlers
  const handleDetailsChange = (field: string, value: any) => {
    update({
      details: {
        ...doc.details,
        [field]: value,
      },
    });
  };

  // Pricing item handlers
  const handleAddPricingItem = () => {
    const newItem: PricingItem = {
      id: `price-${Date.now()}`,
      description: 'New Service Item / Deliverable',
      qty: 1,
      unit: 'units',
      rate: 0,
      amount: 0,
      selected: true,
      isOptional: false,
    };
    const updated = [...doc.pricingItems, newItem];
    const total = updated
      .filter((i) => !i.isOptional || i.selected)
      .reduce((sum, item) => sum + (item.qty && item.rate ? item.qty * item.rate : item.amount || 0), 0);
    update({ pricingItems: updated, totalInvestment: total });
  };

  const handlePricingItemChange = (id: string, field: keyof PricingItem, val: any) => {
    const updated = doc.pricingItems.map((item) => {
      if (item.id === id) {
        const next = { ...item, [field]: val };
        if (field === 'qty' || field === 'rate') {
          const q = field === 'qty' ? Number(val) : item.qty || 1;
          const r = field === 'rate' ? Number(val) : item.rate || 0;
          next.amount = q * r;
        }
        return next;
      }
      return item;
    });

    const total = updated
      .filter((i) => !i.isOptional || i.selected)
      .reduce((sum, item) => sum + (item.qty && item.rate ? item.qty * item.rate : item.amount || 0), 0);
    update({ pricingItems: updated, totalInvestment: total });
  };

  const handleRemovePricingItem = (id: string) => {
    const updated = doc.pricingItems.filter((i) => i.id !== id);
    const total = updated
      .filter((i) => !i.isOptional || i.selected)
      .reduce((sum, item) => sum + (item.qty && item.rate ? item.qty * item.rate : item.amount || 0), 0);
    update({ pricingItems: updated, totalInvestment: total });
  };

  const handleMovePricingItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= doc.pricingItems.length) return;
    const items = [...doc.pricingItems];
    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;
    update({ pricingItems: items });
  };

  // Scope / Milestone Handlers
  const handleAddScopePhase = () => {
    const num = doc.eventCoverage.length + 1;
    const newPhase: ScopeMilestoneItem = {
      id: `phase-${Date.now()}`,
      dayTitle: `Phase ${num}: Project Milestone`,
      services: ['Task & Deliverable Description 1', 'Task & Deliverable Description 2'],
    };
    update({ eventCoverage: [...doc.eventCoverage, newPhase] });
  };

  const handleRemoveScopePhase = (id: string) => {
    update({ eventCoverage: doc.eventCoverage.filter((p) => p.id !== id) });
  };

  const handleScopeTitleChange = (id: string, newTitle: string) => {
    update({
      eventCoverage: doc.eventCoverage.map((p) => (p.id === id ? { ...p, dayTitle: newTitle } : p)),
    });
  };

  const handleScopeTasksChange = (id: string, tasksStr: string) => {
    const tasks = tasksStr.split('\n').filter((t) => t.trim().length > 0);
    update({
      eventCoverage: doc.eventCoverage.map((p) => (p.id === id ? { ...p, services: tasks } : p)),
    });
  };

  const handleMoveScopePhase = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= doc.eventCoverage.length) return;
    const phases = [...doc.eventCoverage];
    const temp = phases[index];
    phases[index] = phases[targetIdx];
    phases[targetIdx] = temp;
    update({ eventCoverage: phases });
  };

  // Deliverables Handlers
  const handleAddDeliverable = () => {
    const newDel: DeliverableItem = {
      id: `del-${Date.now()}`,
      text: 'New Deliverable or Specification',
      included: true,
    };
    update({ deliverables: [...doc.deliverables, newDel] });
  };

  const handleDeliverableTextChange = (id: string, text: string) => {
    update({
      deliverables: doc.deliverables.map((d) => (d.id === id ? { ...d, text } : d)),
    });
  };

  const handleToggleDeliverable = (id: string) => {
    update({
      deliverables: doc.deliverables.map((d) => (d.id === id ? { ...d, included: !d.included } : d)),
    });
  };

  const handleRemoveDeliverable = (id: string) => {
    update({ deliverables: doc.deliverables.filter((d) => d.id !== id) });
  };

  const handleMoveDeliverable = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= doc.deliverables.length) return;
    const dels = [...doc.deliverables];
    const temp = dels[index];
    dels[index] = dels[targetIdx];
    dels[targetIdx] = temp;
    update({ deliverables: dels });
  };

  // Crew / Assigned Specialists handlers
  const handleToggleCrewSection = () => {
    update({ includeCrewSection: !doc.includeCrewSection });
  };

  const handleAddCrewMember = () => {
    const newMember: CrewMemberItem = {
      id: `crew-${Date.now()}`,
      team: 'Specialist Role / Team Member',
      role: 'Key responsibility, qualifications, and domain expertise description.',
      enabled: true,
    };
    update({ crewMembers: [...(doc.crewMembers || []), newMember] });
  };

  const handleCrewMemberChange = (id: string, field: keyof CrewMemberItem, val: any) => {
    const updated = (doc.crewMembers || []).map((c) => (c.id === id ? { ...c, [field]: val } : c));
    update({ crewMembers: updated });
  };

  const handleRemoveCrewMember = (id: string) => {
    update({ crewMembers: (doc.crewMembers || []).filter((c) => c.id !== id) });
  };

  const handleMoveCrewMember = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const list = [...(doc.crewMembers || [])];
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    update({ crewMembers: list });
  };

  // Why Partner With Us / Commitments handlers
  const handleToggleWhyChooseUs = () => {
    update({ includeWhyChooseUs: !doc.includeWhyChooseUs });
  };

  const handleAddWhyChooseUs = () => {
    const newItem: WhyChooseUsItem = {
      id: `why-${Date.now()}`,
      icon: '🛡️',
      title: 'Quality Commitment Title',
      description: 'Detailed description of your service standard, speed, or guarantee.',
      enabled: true,
    };
    update({ whyChooseUs: [...(doc.whyChooseUs || []), newItem] });
  };

  const handleWhyChooseUsChange = (id: string, field: keyof WhyChooseUsItem, val: any) => {
    const updated = (doc.whyChooseUs || []).map((w) => (w.id === id ? { ...w, [field]: val } : w));
    update({ whyChooseUs: updated });
  };

  const handleRemoveWhyChooseUs = (id: string) => {
    update({ whyChooseUs: (doc.whyChooseUs || []).filter((w) => w.id !== id) });
  };

  const handleMoveWhyChooseUs = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const list = [...(doc.whyChooseUs || [])];
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    update({ whyChooseUs: list });
  };

  // Terms handlers with Reordering & Preset Add
  const handleAddTerm = (customText?: string) => {
    const newTerm = customText || 'New commercial term or policy clause.';
    update({ termsAndConditions: [...doc.termsAndConditions, newTerm] });
  };

  const handleTermChange = (idx: number, val: string) => {
    const next = [...doc.termsAndConditions];
    next[idx] = val;
    update({ termsAndConditions: next });
  };

  const handleRemoveTerm = (idx: number) => {
    update({ termsAndConditions: doc.termsAndConditions.filter((_, i) => i !== idx) });
  };

  const handleMoveTerm = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const list = [...doc.termsAndConditions];
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    update({ termsAndConditions: list });
  };

  // Signatory handlers
  const handleSignatoryChange = (field: keyof SignatoryRecord, val: any) => {
    update({
      signatory: {
        ...(doc.signatory || { enabled: true, signerName: '', signerTitle: '' }),
        [field]: val,
      },
    });
  };

  const handleSignatorySignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingSignature(true);
      try {
        const res = await processLogoFile(file);
        if (res.success && res.dataUrl) {
          if (doc.signatory?.signatureDataUrl && isStoredAssetUrl(doc.signatory.signatureDataUrl)) {
            deleteAsset(doc.signatory.signatureDataUrl).catch(() => {});
          }

          const storedUrl = await uploadIfDataUrl(res.dataUrl, 'signature', profile?.id);
          handleSignatoryChange('signatureDataUrl', storedUrl || res.dataUrl);
          toast.success('Signature uploaded successfully!');
        } else if (res.error) {
          toast.error(res.error);
        }
      } finally {
        setIsUploadingSignature(false);
        if (signatureFileInputRef.current) {
          signatureFileInputRef.current.value = '';
        }
      }
    }
  };

  const handleRemoveSignatorySignature = () => {
    if (doc.signatory?.signatureDataUrl && isStoredAssetUrl(doc.signatory.signatureDataUrl)) {
      deleteAsset(doc.signatory.signatureDataUrl).catch(() => {});
    }
    handleSignatoryChange('signatureDataUrl', undefined);
  };

  const tabs = [
    { id: 'industry', label: 'Preset & Style', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: 'business', label: 'Business Profile', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'client', label: 'Client & Details', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'scope', label: 'Scope & Phases', icon: <Layers className="w-3.5 h-3.5" />, badge: doc.eventCoverage?.length },
    { id: 'pricing', label: 'Pricing & Items', icon: <DollarSign className="w-3.5 h-3.5" />, badge: doc.pricingItems?.length },
    { id: 'deliverables', label: 'Deliverables', icon: <CheckSquare className="w-3.5 h-3.5" />, badge: doc.deliverables?.length },
    { id: 'tax-payment', label: 'Taxes & Terms', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { id: 'watermark-terms', label: 'Contract & Sign', icon: <PenTool className="w-3.5 h-3.5" /> },
  ];

  const colorPalettes = [
    { name: 'Golden Amber', hex: '#f59e0b', bgClass: 'bg-amber-500' },
    { name: 'Royal Indigo', hex: '#6366f1', bgClass: 'bg-indigo-500' },
    { name: 'Emerald Mint', hex: '#10b981', bgClass: 'bg-emerald-500' },
    { name: 'Crimson Rose', hex: '#f43f5e', bgClass: 'bg-rose-500' },
    { name: 'Cyber Cyan', hex: '#06b6d4', bgClass: 'bg-cyan-500' },
    { name: 'Deep Violet', hex: '#8b5cf6', bgClass: 'bg-violet-500' },
    { name: 'Midnight Slate', hex: '#334155', bgClass: 'bg-slate-700' },
  ];

  const fontOptions = [
    { name: 'Plus Jakarta Sans (Modern Clean SaaS)', value: 'Plus Jakarta Sans', pro: false },
    { name: 'Outfit (Bold & Modern Tech)', value: 'Outfit', pro: false },
    { name: 'Inter (Minimalist Corporate)', value: 'Inter', pro: false },
    { name: 'Montserrat (Geometric Modern)', value: 'Montserrat', pro: false },
    { name: 'Poppins (Friendly Creative)', value: 'Poppins', pro: false },
    { name: 'DM Sans (Sleek Minimalist)', value: 'DM Sans', pro: false },
    { name: 'Manrope (European Modern FinTech)', value: 'Manrope', pro: false },
    { name: 'Raleway (Refined Sans)', value: 'Raleway', pro: false },
    { name: 'Playfair Display (Luxury Editorial Serif)', value: 'Playfair Display', pro: true },
    { name: 'Space Grotesk (Design Studio & Tech)', value: 'Space Grotesk', pro: true },
    { name: 'Cinzel (Royal Luxury & Roman Serif)', value: 'Cinzel', pro: true },
    { name: 'Cormorant Garamond (Classic Fine Serif)', value: 'Cormorant Garamond', pro: true },
    { name: 'Lora (Contemporary Book Serif)', value: 'Lora', pro: true },
    { name: 'Syne (Avant-Garde Art & Fashion)', value: 'Syne', pro: true },
    { name: 'Merriweather (Warm Literary Serif)', value: 'Merriweather', pro: true },
  ];

  return (
    <div className="glass rounded-3xl p-4 sm:p-5 flex flex-col h-full min-h-0 shadow-2xl border border-slate-800/80 font-['Plus_Jakarta_Sans',sans-serif] glow-amber overflow-hidden">
      {/* Tab Navigation with glowing active pills and dedicated slide controls */}
      <div className="shrink-0 flex items-center space-x-1.5 mb-3.5 pb-2 border-b border-slate-800/70">
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            className="shrink-0 p-2 rounded-xl bg-slate-900/90 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 hover:border-amber-500 shadow-md shadow-black/40 transition-all cursor-pointer"
            title="Scroll left"
            aria-label="Scroll tabs left"
          >
            <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        )}

        {/* Tabs Scroll Container */}
        <div
          ref={tabsContainerRef}
          onScroll={checkTabScroll}
          className="flex-1 min-w-0 flex overflow-x-auto space-x-1.5 py-0.5 no-scrollbar scroll-smooth"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25 font-bold scale-[1.02]'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/40'
                }`}
              >
                <span className={isActive ? 'text-slate-950' : 'text-slate-400'}>{tab.icon}</span>
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            className="shrink-0 p-2 rounded-xl bg-slate-900/90 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 hover:border-amber-500 shadow-md shadow-black/40 transition-all cursor-pointer animate-pulse hover:animate-none"
            title="Scroll right (more options available)"
            aria-label="Scroll tabs right"
          >
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        )}

        {/* Health Check Button */}
        {onOpenHealth && (
          <button
            type="button"
            onClick={onOpenHealth}
            className="px-2.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer shrink-0 ml-1"
            title="Pre-flight Document Health Inspector"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Health</span>
          </button>
        )}
      </div>

      {/* Typst-Style Document Outline & Status Bar */}
      <div className="shrink-0 flex items-center justify-between px-3 py-1.5 mb-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-[11px] text-slate-400">
        <div className="flex items-center space-x-2.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`flex items-center space-x-1 cursor-pointer transition-colors ${
              doc.studio.name ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400/80 hover:text-amber-300'
            }`}
            title="Jump to Business Branding"
          >
            <span className="text-[9px]">{doc.studio.name ? '●' : '○'}</span>
            <span className="font-semibold truncate max-w-[90px]">{doc.studio.name || 'Branding'}</span>
          </button>
          <span className="text-slate-700">›</span>
          <button
            type="button"
            onClick={() => setActiveTab('client')}
            className={`flex items-center space-x-1 cursor-pointer transition-colors ${
              doc.client.clientName || doc.client.nameOfEvent ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-400'
            }`}
            title="Jump to Client Details"
          >
            <span className="text-[9px]">{doc.client.clientName || doc.client.nameOfEvent ? '●' : '○'}</span>
            <span className="font-medium truncate max-w-[100px]">{doc.client.clientName || doc.client.nameOfEvent || 'Client'}</span>
          </button>
          <span className="text-slate-700">›</span>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className="flex items-center space-x-1 text-amber-400 hover:text-amber-300 cursor-pointer font-mono font-bold transition-colors"
            title="Jump to Pricing & Items"
          >
            <span>{doc.currency.symbol}{doc.totalInvestment ? doc.totalInvestment.toLocaleString() : '0'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 shrink-0 ml-2 text-[10px] text-slate-500">
          <span className="hidden sm:inline">
            {doc.pricingItems?.length || 0} items • {doc.eventCoverage?.length || 0} phases
          </span>

          <button
            type="button"
            onClick={() => {
              const nextType = doc.type === 'QUOTATION' ? 'INVOICE' : 'QUOTATION';
              handleBillTypeChange(nextType);
            }}
            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 hover:text-amber-200 font-mono text-[9.5px] cursor-pointer transition-colors"
            title={`Click to switch to ${doc.type === 'QUOTATION' ? 'INVOICE' : 'QUOTATION'} mode`}
          >
            <span className="font-bold">{doc.type}</span>
            <span className="text-[8px] text-slate-400">⇄</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 text-xs no-scrollbar">
        {/* ========================================================= */}
        {/* TAB 1: INDUSTRY PRESETS & DOCUMENT STYLE                  */}
        {/* ========================================================= */}
        {activeTab === 'industry' && (
          <div className="space-y-4 animate-fadeIn">
            {/* 1. Document Mode Switcher (Prominently at the top) */}
            <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-lg shadow-amber-500/5">
              <label className="text-xs font-bold text-slate-100 uppercase tracking-wider block font-['Outfit'] flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Document Mode</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleBillTypeChange('QUOTATION')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    doc.type === 'QUOTATION'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <p className="font-bold text-xs font-['Outfit'] flex items-center justify-between">
                    <span>Proposal & Quotation</span>
                    {doc.type === 'QUOTATION' && <span className="text-[10px] text-amber-400 font-bold">● Active</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">High-converting multi-page client proposal with scope & milestones</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleBillTypeChange('INVOICE')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    doc.type === 'INVOICE'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-200 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/50'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <p className="font-bold text-xs font-['Outfit'] flex items-center justify-between">
                    <span>Tax & Payment Invoice</span>
                    {doc.type === 'INVOICE' && <span className="text-[10px] text-blue-400 font-bold">● Active</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Single-page formal commercial invoice with dynamic payment QR</p>
                </button>
              </div>
            </div>

            {/* 2. Proposal Design Theme Switcher (If Quotation) */}
            {doc.type === 'QUOTATION' && (
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block font-['Outfit'] flex items-center space-x-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Proposal Design Theme</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => update({ theme: 'modern' })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      doc.theme === 'modern'
                        ? 'bg-amber-500/15 border-amber-500/80 text-amber-200 shadow-md shadow-amber-500/10'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <p className="font-bold text-xs font-['Outfit']">Modern B2B Corporate</p>
                    <p className="text-[10px] text-slate-400 mt-1">Clean typography, structured itemized tables & dual sign-off</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => update({ theme: 'creative' })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      doc.theme === 'creative'
                        ? 'bg-amber-500/15 border-amber-500/80 text-amber-200 shadow-md shadow-amber-500/10'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <p className="font-bold text-xs font-['Outfit']">Creative & Luxury Studio</p>
                    <p className="text-[10px] text-slate-400 mt-1">Gold accents, visual phase blocks, and editorial typography</p>
                  </button>
                </div>
              </div>
            )}

            {/* 3. Industry Preset Selector */}
            <IndustryPresetSelector
              currentIndustry={doc.industry}
              onSelectIndustry={handleSelectIndustryPreset}
              customTemplates={customTemplates}
              activeCustomTemplateId={doc.customTemplateId}
              onSelectCustomTemplate={handleApplyCustomTemplate}
              onDeleteCustomTemplate={handleDeleteCustomTemplate}
              onOpenCreateTemplate={() => setIsSaveTemplateModalOpen(true)}
            />

            {/* Modular Section Organizer & Custom Titles */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block font-['Outfit'] flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modular Section Organizer & Titles</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsSaveTemplateModalOpen(true)}
                  className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3 h-3" />
                  <span>Save as Template</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                Toggle visibility and rename section titles to match your tailored business workflow.
              </p>

              <div className="space-y-2">
                {/* 1. Client & Project Banner */}
                <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <LayoutTemplate className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-semibold text-slate-200">Client & Project Info Banner</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('client')}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer flex items-center space-x-1"
                        title="Jump to Client Editor"
                      >
                        <span>Edit</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSectionVisibility('banner')}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          currentVisibility.banner ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'
                        }`}
                        title={currentVisibility.banner ? 'Hide section' : 'Show section'}
                      >
                        {currentVisibility.banner ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Scope & Milestones */}
                <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-semibold text-slate-200">Scope of Work & Milestones</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('scope')}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer flex items-center space-x-1"
                        title="Jump to Scope & Milestones Editor"
                      >
                        <span>Edit</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSectionVisibility('scope')}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          currentVisibility.scope ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'
                        }`}
                        title={currentVisibility.scope ? 'Hide section' : 'Show section'}
                      >
                        {currentVisibility.scope ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {currentVisibility.scope && (
                    <input
                      type="text"
                      placeholder="Custom Scope Title (e.g. Project Phases & SOW)"
                      value={doc.sectionTitles?.scopeTitle || ''}
                      onChange={(e) => handleSectionTitleChange('scopeTitle', e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>

                {/* 3. Deliverables Checklist */}
                <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-semibold text-slate-200">Deliverables & Specifications</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('deliverables')}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer flex items-center space-x-1"
                        title="Jump to Deliverables Editor"
                      >
                        <span>Edit</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSectionVisibility('deliverables')}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          currentVisibility.deliverables ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'
                        }`}
                        title={currentVisibility.deliverables ? 'Hide section' : 'Show section'}
                      >
                        {currentVisibility.deliverables ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {currentVisibility.deliverables && (
                    <input
                      type="text"
                      placeholder="Custom Deliverables Title (e.g. Included Final Assets)"
                      value={doc.sectionTitles?.deliverablesTitle || ''}
                      onChange={(e) => handleSectionTitleChange('deliverablesTitle', e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>

                {/* 4. Assigned Specialists / Team */}
                <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Award className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-xs font-semibold text-slate-200">Assigned Specialists & Crew</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('deliverables')}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer flex items-center space-x-1"
                        title="Jump to Team & Crew Editor"
                      >
                        <span>Edit</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSectionVisibility('crew')}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          currentVisibility.crew ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'
                        }`}
                        title={currentVisibility.crew ? 'Hide section' : 'Show section'}
                      >
                        {currentVisibility.crew ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {currentVisibility.crew && (
                    <input
                      type="text"
                      placeholder="Custom Team Title (e.g. Lead Engineers & Key Personnel)"
                      value={doc.sectionTitles?.crewTitle || ''}
                      onChange={(e) => handleSectionTitleChange('crewTitle', e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>

                {/* 5. Why Partner With Us */}
                <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs font-semibold text-slate-200">Why Choose Us & Guarantees</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('deliverables')}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer flex items-center space-x-1"
                        title="Jump to Guarantees & Why Choose Us"
                      >
                        <span>Edit</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSectionVisibility('whyChooseUs')}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          currentVisibility.whyChooseUs ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'
                        }`}
                        title={currentVisibility.whyChooseUs ? 'Hide section' : 'Show section'}
                      >
                        {currentVisibility.whyChooseUs ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {currentVisibility.whyChooseUs && (
                    <input
                      type="text"
                      placeholder="Custom Commitments Title (e.g. Our Safety & Quality Standards)"
                      value={doc.sectionTitles?.whyChooseUsTitle || ''}
                      onChange={(e) => handleSectionTitleChange('whyChooseUsTitle', e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>

                {/* 6. Pricing Schedule */}
                <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-semibold text-slate-200">Itemized Commercial Investment</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('pricing')}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer flex items-center space-x-1"
                        title="Jump to Pricing & Line Items Editor"
                      >
                        <span>Edit</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSectionVisibility('pricingTable')}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          currentVisibility.pricingTable ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'
                        }`}
                        title={currentVisibility.pricingTable ? 'Hide section' : 'Show section'}
                      >
                        {currentVisibility.pricingTable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {currentVisibility.pricingTable && (
                    <input
                      type="text"
                      placeholder="Custom Pricing Title (e.g. Commercial Fee Structure)"
                      value={doc.sectionTitles?.pricingTitle || ''}
                      onChange={(e) => handleSectionTitleChange('pricingTitle', e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>

                {/* 7. Milestone Payment Terms */}
                <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-semibold text-slate-200">Milestone Payment Schedule</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('tax-payment')}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer flex items-center space-x-1"
                        title="Jump to Payment Terms Editor"
                      >
                        <span>Edit</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSectionVisibility('paymentMilestones')}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          currentVisibility.paymentMilestones ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'
                        }`}
                        title={currentVisibility.paymentMilestones ? 'Hide section' : 'Show section'}
                      >
                        {currentVisibility.paymentMilestones ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 8. Bank Account & Payment QR */}
                <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-xs font-semibold text-slate-200">Bank Details & Payment QR Code</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('tax-payment')}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer flex items-center space-x-1"
                        title="Jump to Bank Details & QR Editor"
                      >
                        <span>Edit</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSectionVisibility('bankDetails')}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          currentVisibility.bankDetails ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'
                        }`}
                        title={currentVisibility.bankDetails ? 'Hide section' : 'Show section'}
                      >
                        {currentVisibility.bankDetails ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 9. Terms & SLA */}
                <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-semibold text-slate-200">Commercial Terms & Conditions</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('tax-payment')}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer flex items-center space-x-1"
                        title="Jump to Commercial Terms Editor"
                      >
                        <span>Edit</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSectionVisibility('terms')}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          currentVisibility.terms ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'
                        }`}
                        title={currentVisibility.terms ? 'Hide section' : 'Show section'}
                      >
                        {currentVisibility.terms ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {currentVisibility.terms && (
                    <input
                      type="text"
                      placeholder="Custom Terms Title (e.g. SLA Clauses & Acceptance Agreement)"
                      value={doc.sectionTitles?.termsTitle || ''}
                      onChange={(e) => handleSectionTitleChange('termsTitle', e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>

                {/* 10. Signatory Block */}
                <div className="p-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileSignature className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-200">Authorized Signatory & Approval Block</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('watermark-terms')}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer flex items-center space-x-1"
                      title="Jump to Signatory & Approval Editor"
                    >
                      <span>Edit</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSectionVisibility('signatory')}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        currentVisibility.signatory ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'
                      }`}
                      title={currentVisibility.signatory ? 'Hide section' : 'Show section'}
                    >
                      {currentVisibility.signatory ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Accent Color Engine */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block font-['Outfit'] flex items-center space-x-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Brand Accent Palette & Color</span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                {colorPalettes.map((pal) => {
                  const isSelected = (doc.accentColor || '#f59e0b').toLowerCase() === pal.hex.toLowerCase();
                  return (
                    <button
                      key={pal.hex}
                      type="button"
                      onClick={() => update({ accentColor: pal.hex })}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-slate-900 text-slate-100 shadow-md ring-1 ring-amber-400/40'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${pal.bgClass} shadow-sm`} />
                      <span className="text-[11px]">{pal.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Hex Color Picker */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="color"
                  value={doc.accentColor || '#f59e0b'}
                  onChange={(e) => update({ accentColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  placeholder="#f59e0b"
                  value={doc.accentColor || '#f59e0b'}
                  onChange={(e) => update({ accentColor: e.target.value })}
                  className="w-32 bg-slate-900/90 border border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono input-premium"
                />
                <span className="text-[11px] text-slate-400">Custom Accent Color</span>
              </div>
            </div>

            {/* Typography Engine */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block font-['Outfit'] flex items-center space-x-1.5">
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <span>Proposal Typography & Font Family</span>
              </label>
              <select
                value={doc.fontFamily || 'Plus Jakarta Sans'}
                onChange={(e) => {
                  const val = e.target.value;
                  const opt = fontOptions.find((f) => f.value === val);
                  if (opt?.pro && !isPro && onOpenUpgrade) {
                    onOpenUpgrade('pro');
                    return;
                  }
                  update({ fontFamily: val });
                }}
                className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
              >
                {fontOptions.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.name} {f.pro && !isPro ? '🔒 [PRO]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Global Currency Picker */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5 font-['Outfit']">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>Base Currency</span>
              </label>
              <select
                value={doc.currency.code}
                onChange={(e) => {
                  const curr = SUPPORTED_CURRENCIES.find((c) => c.code === e.target.value);
                  if (curr) update({ currency: curr });
                }}
                className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: BUSINESS & BRANDING PROFILE                        */}
        {/* ========================================================= */}
        {activeTab === 'business' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Logo Upload & Size Controls */}
            <div id="editor-section-branding" className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block font-['Outfit']">
                  Company Brand Logo
                </label>
                {doc.studio.logoUrl && (
                  <span className="text-[11px] text-amber-400 font-mono font-semibold">
                    {doc.studio.logoWidth || 260}px × {doc.studio.logoHeight || 90}px
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {doc.studio.logoUrl ? (
                  <div className="p-2 bg-white rounded-xl border border-slate-700 shadow-sm flex items-center justify-center min-w-[90px] max-w-[160px]">
                    <img 
                      src={doc.studio.logoUrl} 
                      alt="Logo" 
                      style={{
                        maxHeight: '44px',
                        maxWidth: '130px',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-20 h-11 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-[10px]">
                    No Logo
                  </div>
                )}
                <div className="flex-1 space-x-2">
                  <input
                    type="file"
                    ref={logoFileInputRef}
                    accept="image/png,image/svg+xml,image/jpeg,image/webp,.png,.svg,.jpg,.jpeg,.webp"
                    onChange={handleTopLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center space-x-1.5"
                  >
                    {isUploadingLogo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploadingLogo ? 'Uploading...' : doc.studio.logoUrl ? 'Change Logo' : 'Upload Logo (PNG/SVG)'}</span>
                  </button>
                  {doc.studio.logoUrl && !isUploadingLogo && (
                    <button
                      type="button"
                      onClick={handleRemoveTopLogo}
                      className="px-2.5 py-2 text-slate-400 hover:text-red-400 rounded-xl text-xs cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Logo Width & Height Adjustment Controls */}
              {doc.studio.logoUrl && (
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Width Slider */}
                    <div className="space-y-1 bg-slate-900/60 border border-slate-800/60 rounded-xl p-2.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Logo Width</span>
                        <span className="font-mono text-amber-300 font-bold">{doc.studio.logoWidth || 260}px</span>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="400"
                        step="10"
                        value={doc.studio.logoWidth || 260}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = { ...doc.studio, logoWidth: val };
                          saveStudioProfileToStorage(updated);
                          update({ studio: updated });
                        }}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>

                    {/* Height Slider */}
                    <div className="space-y-1 bg-slate-900/60 border border-slate-800/60 rounded-xl p-2.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Max Height</span>
                        <span className="font-mono text-amber-300 font-bold">{doc.studio.logoHeight || 90}px</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="160"
                        step="5"
                        value={doc.studio.logoHeight || 90}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = { ...doc.studio, logoHeight: val };
                          saveStudioProfileToStorage(updated);
                          update({ studio: updated });
                        }}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  </div>

                  {/* Size Quick Presets */}
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Size Presets:</span>
                    {[
                      { label: 'Compact', w: 160, h: 60 },
                      { label: 'Standard', w: 260, h: 90 },
                      { label: 'Large', w: 340, h: 125 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          const updated = { ...doc.studio, logoWidth: p.w, logoHeight: p.h };
                          saveStudioProfileToStorage(updated);
                          update({ studio: updated });
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
                          (doc.studio.logoWidth || 260) === p.w && (doc.studio.logoHeight || 90) === p.h
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Company Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Company / Studio Name</label>
                <input
                  type="text"
                  value={doc.studio.name}
                  onChange={(e) => update({ studio: { ...doc.studio, name: e.target.value } })}
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-bold input-premium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Brand Tagline</label>
                <input
                  type="text"
                  value={doc.studio.tagline}
                  onChange={(e) => update({ studio: { ...doc.studio, tagline: e.target.value } })}
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Business Address</label>
                <textarea
                  rows={2}
                  value={doc.studio.address}
                  onChange={(e) => update({ studio: { ...doc.studio, address: e.target.value } })}
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Phone / WhatsApp</label>
                <input
                  type="text"
                  value={doc.studio.phoneNumbers}
                  onChange={(e) => update({ studio: { ...doc.studio, phoneNumbers: e.target.value } })}
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={doc.studio.email}
                  onChange={(e) => update({ studio: { ...doc.studio, email: e.target.value } })}
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Website URL</label>
                <input
                  type="text"
                  value={doc.studio.website}
                  onChange={(e) => update({ studio: { ...doc.studio, website: e.target.value } })}
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Tax Registration ({doc.studio.taxNumberLabel || 'GSTIN/VAT/EIN'})
                </label>
                <input
                  type="text"
                  value={doc.studio.gstin || ''}
                  onChange={(e) => update({ studio: { ...doc.studio, gstin: e.target.value } })}
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                />
              </div>
            </div>

            {/* Banking & UPI / Payment Link */}
            <div id="editor-section-bank" className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block font-['Outfit'] flex items-center space-x-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>Payment & Banking Details</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={doc.studio.bankName || ''}
                    onChange={(e) => update({ studio: { ...doc.studio, bankName: e.target.value } })}
                    className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Account Number</label>
                  <input
                    type="text"
                    value={doc.studio.accountNumber || ''}
                    onChange={(e) => update({ studio: { ...doc.studio, accountNumber: e.target.value } })}
                    className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono input-premium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">IFSC / SWIFT / Routing</label>
                  <input
                    type="text"
                    value={doc.studio.ifscCode || ''}
                    onChange={(e) => update({ studio: { ...doc.studio, ifscCode: e.target.value } })}
                    className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono input-premium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Beneficiary Name</label>
                  <input
                    type="text"
                    value={doc.studio.accountHolder || ''}
                    onChange={(e) => update({ studio: { ...doc.studio, accountHolder: e.target.value } })}
                    className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-emerald-400 block mb-1 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>UPI ID or Payment Link (Auto-generates dynamic QR code on Invoices)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. username@upi or https://buy.stripe.com/xxx"
                    value={doc.studio.upiId || doc.studio.paymentLink || ''}
                    onChange={(e) => update({ studio: { ...doc.studio, upiId: e.target.value, paymentLink: e.target.value } })}
                    className="w-full bg-slate-900/90 border border-emerald-500/40 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-400 font-mono input-premium"
                  />
                </div>
              </div>
            </div>

            {/* 1-Click Save as Default Business Profile */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-slate-200 font-['Outfit']">Save as Permanent Business Defaults</p>
                <p className="text-[11px] text-slate-400">Auto-applies your logo, name, and bank info to all new documents</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  saveStudioProfileToStorage(doc.studio);
                  toast.success('Business profile saved as default for new documents!');
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Defaults</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CLIENT & DOCUMENT DETAILS                          */}
        {/* ========================================================= */}
        {activeTab === 'client' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Document Reference Info */}
            <div id="editor-section-client" className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  {doc.type === 'INVOICE' ? 'Invoice Number' : 'Quotation Reference'}
                </label>
                <input
                  type="text"
                  value={doc.details.invoiceNo}
                  onChange={(e) => handleDetailsChange('invoiceNo', e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono font-bold input-premium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Date of Issue</label>
                <input
                  type="text"
                  value={doc.details.invoiceDate}
                  onChange={(e) => handleDetailsChange('invoiceDate', e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  {doc.type === 'INVOICE' ? 'Payment Due Date' : 'Validity / Expiry Date'}
                </label>
                <input
                  type="text"
                  placeholder={doc.type === 'INVOICE' ? 'e.g. Due on Receipt or 2026-09-30' : 'e.g. 30 Days from issue or 2026-09-30'}
                  value={doc.type === 'INVOICE' ? doc.details.dueDate || '' : doc.details.validUntilDate || ''}
                  onChange={(e) =>
                    handleDetailsChange(doc.type === 'INVOICE' ? 'dueDate' : 'validUntilDate', e.target.value)
                  }
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Package / Project Title Banner
                </label>
                <input
                  type="text"
                  value={doc.packageBannerTitle}
                  onChange={(e) => update({ packageBannerTitle: e.target.value })}
                  placeholder="e.g. END-TO-END DIGITAL PLATFORM & MARKETING SUITE"
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-bold uppercase focus:outline-none focus:border-amber-500 input-premium"
                />
              </div>
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Project / Engagement Name
                </label>
                <input
                  type="text"
                  value={doc.client.nameOfEvent}
                  onChange={(e) => handleClientChange('nameOfEvent', e.target.value)}
                  placeholder="e.g. Acme SaaS Redesign or Villa Turnkey Interior"
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-semibold input-premium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Client Contact Person
                </label>
                <input
                  type="text"
                  value={doc.client.clientName || ''}
                  onChange={(e) => handleClientChange('clientName', e.target.value)}
                  placeholder="e.g. Sarah Jenkins (VP of Marketing)"
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Contact Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={doc.client.contactNo}
                  onChange={(e) => handleClientChange('contactNo', sanitizeContactNumber(e.target.value))}
                  placeholder="e.g. +1 (512) 440-9921"
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Client Email</label>
                <input
                  type="email"
                  value={doc.client.email || ''}
                  onChange={(e) => handleClientChange('email', e.target.value)}
                  placeholder="e.g. client@company.com"
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Client Tax ID / GSTIN</label>
                <input
                  type="text"
                  value={doc.client.taxId || ''}
                  onChange={(e) => handleClientChange('taxId', e.target.value)}
                  placeholder="e.g. VAT / GSTIN / Tax ID"
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Client Address / Site Location</label>
                <input
                  type="text"
                  value={doc.client.address}
                  onChange={(e) => handleClientChange('address', e.target.value)}
                  placeholder="e.g. 742 Evergreen Terrace, Austin, TX"
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: SCOPE & PROJECT PHASES                             */}
        {/* ========================================================= */}
        {activeTab === 'scope' && (
          <div id="editor-section-scope" className="space-y-4 animate-fadeIn">
            {/* Inline Section Title & Visibility Control */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex-1 w-full">
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Custom Scope Heading on Proposal
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scope of Work, Project Phases & Milestones"
                  value={doc.sectionTitles?.scopeTitle || ''}
                  onChange={(e) => handleSectionTitleChange('scopeTitle', e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex items-center space-x-2 shrink-0 sm:pt-4">
                <button
                  type="button"
                  onClick={() => toggleSectionVisibility('scope')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    currentVisibility.scope
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                  title={currentVisibility.scope ? 'Section is visible on proposal' : 'Section is hidden on proposal'}
                >
                  {currentVisibility.scope ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{currentVisibility.scope ? 'Visible' : 'Hidden'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5 font-['Outfit']">
                <Layers className="w-3.5 h-3.5" />
                <span>Scope of Work, Milestones & Phases</span>
              </label>
              <button
                type="button"
                onClick={handleAddScopePhase}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Phase</span>
              </button>
            </div>

            <div className="space-y-3">
              {doc.eventCoverage.map((phase, idx) => (
                <div key={phase.id || idx} className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={phase.dayTitle}
                      onChange={(e) => handleScopeTitleChange(phase.id, e.target.value)}
                      className="bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2 text-xs text-amber-300 font-bold flex-1 mr-2 focus:outline-none focus:border-amber-500 input-premium font-['Outfit']"
                    />
                    <div className="flex items-center space-x-1">
                      {/* Reordering Controls */}
                      <button
                        type="button"
                        onClick={() => handleMoveScopePhase(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 text-slate-400 hover:text-amber-300 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveScopePhase(idx, 'down')}
                        disabled={idx === doc.eventCoverage.length - 1}
                        className="p-1.5 text-slate-400 hover:text-amber-300 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveScopePhase(phase.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                        title="Remove Phase"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Key Deliverables & Tasks (1 per line)
                    </label>
                    <textarea
                      rows={3}
                      value={phase.services.join('\n')}
                      onChange={(e) => handleScopeTasksChange(phase.id, e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono leading-relaxed input-premium"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: ITEMIZED PRICING & SCOPE ADD-ONS                   */}
        {/* ========================================================= */}
        {activeTab === 'pricing' && (
          <div id="editor-section-pricing" className="space-y-4 animate-fadeIn">
            {/* Inline Section Title & Visibility Control */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex-1 w-full">
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Custom Pricing Table Heading on Proposal
                </label>
                <input
                  type="text"
                  placeholder="e.g. Itemized Commercial Investment & Fee Structure"
                  value={doc.sectionTitles?.pricingTitle || ''}
                  onChange={(e) => handleSectionTitleChange('pricingTitle', e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex items-center space-x-2 shrink-0 sm:pt-4">
                <button
                  type="button"
                  onClick={() => toggleSectionVisibility('pricingTable')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    currentVisibility.pricingTable
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                  title={currentVisibility.pricingTable ? 'Section is visible on proposal' : 'Section is hidden on proposal'}
                >
                  {currentVisibility.pricingTable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{currentVisibility.pricingTable ? 'Visible' : 'Hidden'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5 font-['Outfit']">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Itemized Pricing Schedule ({doc.currency.symbol})</span>
              </label>
              <button
                type="button"
                onClick={handleAddPricingItem}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {doc.pricingItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 transition-all hover:border-slate-700"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Item Description"
                      value={item.description}
                      onChange={(e) => handlePricingItemChange(item.id, 'description', e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-medium input-premium"
                    />
                    <div className="flex items-center space-x-1 shrink-0">
                      {/* Reorder Buttons */}
                      <button
                        type="button"
                        onClick={() => handleMovePricingItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 text-slate-400 hover:text-amber-300 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMovePricingItem(idx, 'down')}
                        disabled={idx === doc.pricingItems.length - 1}
                        className="p-1.5 text-slate-400 hover:text-amber-300 disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePricingItem(item.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Qty</label>
                      <input
                        type="number"
                        value={item.qty || 1}
                        onChange={(e) => handlePricingItemChange(item.id, 'qty', e.target.value)}
                        className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono text-center input-premium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Unit</label>
                      <input
                        type="text"
                        placeholder="hrs/units"
                        value={item.unit || 'units'}
                        onChange={(e) => handlePricingItemChange(item.id, 'unit', e.target.value)}
                        className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 text-center input-premium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Rate ({doc.currency.symbol})</label>
                      <input
                        type="number"
                        value={item.rate || 0}
                        onChange={(e) => handlePricingItemChange(item.id, 'rate', e.target.value)}
                        className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono text-right input-premium"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Total</label>
                      <div className="w-full bg-slate-800/80 border border-slate-700/70 rounded-xl px-2 py-1.5 text-xs text-amber-300 font-mono font-bold text-right">
                        {(item.qty && item.rate ? item.qty * item.rate : item.amount || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isPro && onOpenUpgrade) {
                          onOpenUpgrade('pro');
                          return;
                        }
                        handlePricingItemChange(item.id, 'isOptional', !item.isOptional);
                      }}
                      className="flex items-center space-x-2 cursor-pointer text-[11px] text-slate-300 hover:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(item.isOptional)}
                        readOnly
                        className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 pointer-events-none"
                      />
                      <span>Optional Upsell Add-on (Client can tick on interactive proposal)</span>
                      {!isPro && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> PRO
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Discount & Totals */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Discount Amount ({doc.currency.symbol})
                </label>
                <input
                  type="number"
                  value={doc.discount || 0}
                  onChange={(e) => update({ discount: Number(e.target.value) })}
                  className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono input-premium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Calculated Net Total
                </label>
                <div className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-amber-400 font-bold font-mono">
                  {doc.currency.symbol} {Math.max(0, doc.totalInvestment - (doc.discount || 0)).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: DELIVERABLES, TEAM & VALUE PROPOSITIONS            */}
        {/* ========================================================= */}
        {activeTab === 'deliverables' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Inline Deliverables Heading & Visibility */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex-1 w-full">
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Custom Deliverables Heading on Proposal
                </label>
                <input
                  type="text"
                  placeholder="e.g. Included Deliverables & Specifications"
                  value={doc.sectionTitles?.deliverablesTitle || ''}
                  onChange={(e) => handleSectionTitleChange('deliverablesTitle', e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex items-center space-x-2 shrink-0 sm:pt-4">
                <button
                  type="button"
                  onClick={() => toggleSectionVisibility('deliverables')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    currentVisibility.deliverables
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                  title={currentVisibility.deliverables ? 'Section is visible on proposal' : 'Section is hidden on proposal'}
                >
                  {currentVisibility.deliverables ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{currentVisibility.deliverables ? 'Visible' : 'Hidden'}</span>
                </button>
              </div>
            </div>

            {/* 1. Deliverables Checklist */}
            <div id="editor-section-deliverables" className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5 font-['Outfit']">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Deliverables Checklist</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddDeliverable}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Deliverable</span>
                </button>
              </div>

              <div className="space-y-2">
                {doc.deliverables.map((del, idx) => (
                  <div
                    key={del.id}
                    className="flex items-center space-x-2.5 bg-slate-900/90 border border-slate-700/70 rounded-xl p-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={del.included}
                      onChange={() => handleToggleDeliverable(del.id)}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={del.text}
                      onChange={(e) => handleDeliverableTextChange(del.id, e.target.value)}
                      className="flex-1 bg-slate-950/80 border border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                    />
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleMoveDeliverable(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-amber-300 disabled:opacity-30 rounded cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDeliverable(idx, 'down')}
                        disabled={idx === doc.deliverables.length - 1}
                        className="p-1 text-slate-400 hover:text-amber-300 disabled:opacity-30 rounded cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliverable(del.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 cursor-pointer"
                        title="Remove Deliverable"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Assigned Specialists & Key Personnel */}
            <div id="editor-section-crew" className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider font-['Outfit']">
                    Assigned Specialists & Team
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleToggleCrewSection}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      doc.includeCrewSection
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {doc.includeCrewSection ? 'Section Enabled' : 'Disabled'}
                  </button>
                  {doc.includeCrewSection && (
                    <button
                      type="button"
                      onClick={handleAddCrewMember}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      + Add Specialist
                    </button>
                  )}
                </div>
              </div>

              {doc.includeCrewSection && (
                <div className="space-y-2.5 pt-1">
                  <input
                    type="text"
                    placeholder="Custom Team Title on Proposal (e.g. Lead Engineers & Key Personnel)"
                    value={doc.sectionTitles?.crewTitle || ''}
                    onChange={(e) => handleSectionTitleChange('crewTitle', e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  {(doc.crewMembers || []).map((crew, idx) => (
                    <div
                      key={crew.id}
                      className="bg-slate-900/90 border border-slate-700/70 rounded-xl p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={crew.team}
                          onChange={(e) => handleCrewMemberChange(crew.id, 'team', e.target.value)}
                          placeholder="Role (e.g. Senior Full-Stack Engineer)"
                          className="flex-1 bg-slate-950/80 border border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-amber-200 font-bold focus:outline-none focus:border-amber-500 mr-2"
                        />
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleMoveCrewMember(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-amber-300 disabled:opacity-30 rounded cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveCrewMember(idx, 'down')}
                            disabled={idx === (doc.crewMembers?.length || 1) - 1}
                            className="p-1 text-slate-400 hover:text-amber-300 disabled:opacity-30 rounded cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCrewMember(crew.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={crew.role}
                        onChange={(e) => handleCrewMemberChange(crew.id, 'role', e.target.value)}
                        placeholder="Description of responsibilities and qualifications..."
                        className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Quality Commitments & Why Partner With Us */}
            <div id="editor-section-why-choose-us" className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider font-['Outfit']">
                    Quality Commitments & Guarantees
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleToggleWhyChooseUs}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      doc.includeWhyChooseUs
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {doc.includeWhyChooseUs ? 'Section Enabled' : 'Disabled'}
                  </button>
                  {doc.includeWhyChooseUs && (
                    <button
                      type="button"
                      onClick={handleAddWhyChooseUs}
                      className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      + Add Commitment
                    </button>
                  )}
                </div>
              </div>

              {doc.includeWhyChooseUs && (
                <div className="space-y-2.5 pt-1">
                  <input
                    type="text"
                    placeholder="Custom Guarantees Title on Proposal (e.g. Why Choose Us & Quality Standards)"
                    value={doc.sectionTitles?.whyChooseUsTitle || ''}
                    onChange={(e) => handleSectionTitleChange('whyChooseUsTitle', e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  {(doc.whyChooseUs || []).map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-slate-900/90 border border-slate-700/70 rounded-xl p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 mr-2">
                          <input
                            type="text"
                            value={item.icon ?? ''}
                            onChange={(e) => handleWhyChooseUsChange(item.id, 'icon', e.target.value)}
                            placeholder="🛡️"
                            className="w-10 bg-slate-950/80 border border-slate-700/70 rounded-xl py-1.5 text-center text-sm focus:outline-none focus:border-amber-500"
                            title="Emoji / Icon (Leave empty if no icon desired)"
                          />
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleWhyChooseUsChange(item.id, 'title', e.target.value)}
                            placeholder="Title (e.g. Enterprise-Grade Security)"
                            className="flex-1 bg-slate-950/80 border border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleMoveWhyChooseUs(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-amber-300 disabled:opacity-30 rounded cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveWhyChooseUs(idx, 'down')}
                            disabled={idx === (doc.whyChooseUs?.length || 1) - 1}
                            className="p-1 text-slate-400 hover:text-amber-300 disabled:opacity-30 rounded cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveWhyChooseUs(item.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleWhyChooseUsChange(item.id, 'description', e.target.value)}
                        placeholder="Detailed description of commitment..."
                        className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: TAXES & MILESTONE PAYMENT TERMS                    */}
        {/* ========================================================= */}
        {activeTab === 'tax-payment' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Tax Settings */}
            <div id="editor-section-tax" className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block font-['Outfit']">
                Tax Engine & Rates
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Tax Type</label>
                  <select
                    value={doc.taxConfig?.type || doc.taxType || 'none'}
                    onChange={(e) =>
                      update({
                        taxType: e.target.value as any,
                        taxConfig: {
                          ...doc.taxConfig,
                          type: e.target.value as any,
                          percent: e.target.value === 'none' ? 0 : doc.taxConfig?.percent || 18,
                        },
                      })
                    }
                    className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                  >
                    <option value="none">No Tax / Tax Exempt</option>
                    <option value="gst">GST (Goods & Services Tax)</option>
                    <option value="vat">VAT (Value Added Tax)</option>
                    <option value="sales_tax">Sales Tax</option>
                    <option value="custom">Custom Tax Label</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Tax Percentage (%)</label>
                  <input
                    type="number"
                    value={doc.taxConfig?.percent || doc.taxPercent || 0}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      update({
                        taxPercent: p,
                        taxConfig: { ...doc.taxConfig, percent: p, type: doc.taxConfig?.type || 'gst' },
                      });
                    }}
                    className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono input-premium"
                  />
                </div>
              </div>
            </div>

            {/* Payment Milestone Structure for Proposals VS Payment Tracking for Invoices */}
            {doc.type === 'INVOICE' ? (
              <div id="editor-section-payment-milestones" className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider font-['Outfit']">
                      Invoice Payment Status & Settlement
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Currency: {doc.currency.code}
                  </span>
                </div>

                {/* Status Switcher Buttons */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                    Payment Status
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'UNPAID', label: 'Payment Pending', color: 'text-blue-400 border-blue-500/40 bg-blue-500/10' },
                      { id: 'PARTIALLY_PAID', label: 'Partially Paid', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
                      { id: 'PAID', label: 'Paid in Full', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
                      { id: 'OVERDUE', label: 'Overdue', color: 'text-red-400 border-red-500/40 bg-red-500/10' },
                    ].map((st) => {
                      const isSelected = (doc.invoicePayment?.status || 'UNPAID') === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() =>
                            update({
                              invoicePayment: {
                                ...(doc.invoicePayment || { amountReceived: 0 }),
                                status: st.id as any,
                              },
                            })
                          }
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                            isSelected
                              ? `${st.color} shadow-md`
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                          }`}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Payment Due Date */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Payment Due Date
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Due on Receipt, 2026-09-30, or +15 Days"
                      value={doc.details.dueDate || ''}
                      onChange={(e) => handleDetailsChange('dueDate', e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                    />
                  </div>

                  {/* Amount Received */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-semibold text-slate-300">
                        Amount Paid / Received
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const total = doc.totalInvestment || 0;
                          update({
                            invoicePayment: {
                              ...(doc.invoicePayment || {}),
                              status: 'PAID',
                              amountReceived: total,
                            },
                            paymentTerms: {
                              ...doc.paymentTerms,
                              advanceReceived: total,
                            },
                          });
                        }}
                        className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                      >
                        Mark 100% Paid
                      </button>
                    </div>
                    <input
                      type="number"
                      placeholder="0"
                      value={doc.invoicePayment?.amountReceived ?? doc.paymentTerms?.advanceReceived ?? ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        update({
                          invoicePayment: {
                            ...(doc.invoicePayment || { status: 'UNPAID' }),
                            amountReceived: val,
                            status: val > 0 ? (val >= (doc.totalInvestment || 0) ? 'PAID' : 'PARTIALLY_PAID') : 'UNPAID',
                          },
                          paymentTerms: {
                            ...doc.paymentTerms,
                            advanceReceived: val,
                          },
                        });
                      }}
                      className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500 input-premium"
                    />
                  </div>

                  {/* Payment Mode */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={doc.invoicePayment?.paymentMode || 'Bank Transfer / Wire'}
                      onChange={(e) =>
                        update({
                          invoicePayment: {
                            ...(doc.invoicePayment || { status: 'UNPAID', amountReceived: 0 }),
                            paymentMode: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                    >
                      <option value="Bank Transfer / Wire">Bank Transfer / Wire Remittance</option>
                      <option value="UPI / Instant Pay">UPI / Instant QR</option>
                      <option value="Credit / Debit Card">Credit / Debit Card (Stripe)</option>
                      <option value="PayPal / Online">PayPal / Online Gateway</option>
                      <option value="Cash / Cheque">Cash / Cheque</option>
                    </select>
                  </div>

                  {/* Transaction Ref / Notes */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Payment / Transaction Reference #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UTR-98234812 or Chq #40921"
                      value={doc.invoicePayment?.transactionRef || ''}
                      onChange={(e) =>
                        update({
                          invoicePayment: {
                            ...(doc.invoicePayment || { status: 'UNPAID', amountReceived: 0 }),
                            transactionRef: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500 input-premium"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div id="editor-section-payment-milestones" className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block font-['Outfit']">
                  Milestone Payment Tranches
                </label>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Advance %</label>
                    <input
                      type="number"
                      value={doc.paymentTerms.advancePercent}
                      onChange={(e) =>
                        update({
                          paymentTerms: { ...doc.paymentTerms, advancePercent: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-2.5 py-2 text-xs text-slate-100 font-mono text-center input-premium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Interim %</label>
                    <input
                      type="number"
                      value={doc.paymentTerms.afterEventPercent}
                      onChange={(e) =>
                        update({
                          paymentTerms: { ...doc.paymentTerms, afterEventPercent: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-2.5 py-2 text-xs text-slate-100 font-mono text-center input-premium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Handover %</label>
                    <input
                      type="number"
                      value={doc.paymentTerms.balancePercent}
                      onChange={(e) =>
                        update({
                          paymentTerms: { ...doc.paymentTerms, balancePercent: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-2.5 py-2 text-xs text-slate-100 font-mono text-center input-premium"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: TERMS, WATERMARK & E-SIGNATURE                     */}
        {/* ========================================================= */}
        {activeTab === 'watermark-terms' && (
          <div className="space-y-5 animate-fadeIn">
            {/* 1. Watermark Controls (Guarded for Pro users) */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
              <WatermarkControls
                config={doc.watermark}
                onOpenUpgrade={onOpenUpgrade}
                onChange={(w) => {
                  saveWatermarkConfigToStorage(w);
                  update({ watermark: w });
                }}
              />
            </div>

            {/* 2. Terms of Engagement & Policy Clauses */}
            <div id="editor-section-terms" className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider font-['Outfit']">
                    Commercial Terms & Policy Clauses ({doc.termsAndConditions.length})
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddTerm()}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  + Add Clause
                </button>
              </div>

              {/* Inline Custom Terms Heading & Visibility */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
                <div className="flex-1 w-full">
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Custom Terms & Conditions Heading on Proposal
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Terms of Engagement & Acceptance Criteria"
                    value={doc.sectionTitles?.termsTitle || ''}
                    onChange={(e) => handleSectionTitleChange('termsTitle', e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex items-center space-x-2 shrink-0 sm:pt-3">
                  <button
                    type="button"
                    onClick={() => toggleSectionVisibility('terms')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer ${
                      currentVisibility.terms
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                    title={currentVisibility.terms ? 'Section is visible on proposal' : 'Section is hidden on proposal'}
                  >
                    {currentVisibility.terms ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{currentVisibility.terms ? 'Visible' : 'Hidden'}</span>
                  </button>
                </div>
              </div>

              {/* 1-Click Quick Clause Presets */}
              <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Quick Insert Standard Clauses:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddTerm('All custom source code and deliverable intellectual property transfer to client upon final milestone clearance.')}
                    className="text-[10.5px] px-2 py-1 bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    + IP & NDA Protection
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTerm('Invoices are payable within 15 calendar days from milestone sign-off and issue date.')}
                    className="text-[10.5px] px-2 py-1 bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    + Net 15 Terms
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTerm('Includes up to 2 rounds of design and scope iterations prior to staging sign-off.')}
                    className="text-[10.5px] px-2 py-1 bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    + 2 Scope Revisions
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTerm('This quotation and bundled service pricing remain valid for 30 calendar days from issue.')}
                    className="text-[10.5px] px-2 py-1 bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    + 30-Day Validity
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddTerm('Includes 60 calendar days of post-release bug fixing and technical warranty for all outlined specifications.')}
                    className="text-[10.5px] px-2 py-1 bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    + 60-Day Warranty
                  </button>
                </div>
              </div>

              {/* Clause List with Reordering */}
              <div className="space-y-2">
                {doc.termsAndConditions.map((term, idx) => (
                  <div key={idx} className="flex items-center space-x-2 bg-slate-900/90 border border-slate-700/70 rounded-xl p-2">
                    <span className="text-[11px] font-mono text-slate-500 w-5 text-center">{idx + 1}.</span>
                    <input
                      type="text"
                      value={term}
                      onChange={(e) => handleTermChange(idx, e.target.value)}
                      className="flex-1 bg-slate-950/80 border border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 input-premium"
                    />
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleMoveTerm(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-amber-300 disabled:opacity-30 rounded cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveTerm(idx, 'down')}
                        disabled={idx === doc.termsAndConditions.length - 1}
                        className="p-1 text-slate-400 hover:text-amber-300 disabled:opacity-30 rounded cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveTerm(idx)}
                        className="p-1.5 text-slate-500 hover:text-red-400 cursor-pointer"
                        title="Delete Clause"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Formal Signatory & Approval Sign-Off Block */}
            <div id="editor-section-signatory" className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileSignature className="w-3.5 h-3.5 text-amber-400" />
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider font-['Outfit']">
                    Authorized Signatory & Approval Block
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => handleSignatoryChange('enabled', !doc.signatory?.enabled)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    doc.signatory?.enabled !== false
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {doc.signatory?.enabled !== false ? 'Sign-Off Enabled' : 'Disabled'}
                </button>
              </div>

              {doc.signatory?.enabled !== false && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Issuer Signatory Name
                    </label>
                    <input
                      type="text"
                      value={doc.signatory?.signerName || ''}
                      onChange={(e) => handleSignatoryChange('signerName', e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Signatory Designation / Title
                    </label>
                    <input
                      type="text"
                      value={doc.signatory?.signerTitle || ''}
                      onChange={(e) => handleSignatoryChange('signerTitle', e.target.value)}
                      placeholder="e.g. Managing Director / Partner"
                      className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Issue / Sign Date
                    </label>
                    <input
                      type="text"
                      value={doc.signatory?.signatureDate || doc.details.invoiceDate}
                      onChange={(e) => handleSignatoryChange('signatureDate', e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono input-premium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Client Approver Name
                    </label>
                    <input
                      type="text"
                      value={doc.client.clientName || ''}
                      onChange={(e) => handleClientChange('clientName', e.target.value)}
                      placeholder="e.g. David Zhang (CTO)"
                      className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                    />
                  </div>

                  {/* Creator / Issuer Signature Image Upload */}
                  <div className="sm:col-span-2 pt-2 border-t border-slate-800/80">
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                      Issuer Digital Signature / Company Stamp (Optional)
                    </label>
                    <div className="flex items-center space-x-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                      {doc.signatory?.signatureDataUrl ? (
                        <div className="p-2 bg-white rounded-lg border border-slate-700 flex items-center justify-center min-w-[80px] max-w-[140px] shadow-sm">
                          <img
                            src={doc.signatory.signatureDataUrl}
                            alt="Signature"
                            className="max-h-9 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-9 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-[10px]">
                          No Signature
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          ref={signatureFileInputRef}
                          accept="image/png,image/svg+xml,image/jpeg,image/webp,.png,.svg,.jpg,.jpeg,.webp"
                          onChange={handleSignatorySignatureUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => signatureFileInputRef.current?.click()}
                          disabled={isUploadingSignature}
                          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center space-x-1.5"
                        >
                          {isUploadingSignature ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>{isUploadingSignature ? 'Uploading...' : doc.signatory?.signatureDataUrl ? 'Change Signature' : 'Upload Signature / Stamp'}</span>
                        </button>
                        {doc.signatory?.signatureDataUrl && !isUploadingSignature && (
                          <button
                            type="button"
                            onClick={handleRemoveSignatorySignature}
                            className="px-2 py-1.5 text-slate-400 hover:text-red-400 text-xs cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Free-tier AdSense Placement (Auto-hidden for Pro users) */}
        <div className="pt-6 border-t border-slate-800/80">
          <AdBanner format="rectangle" />
        </div>
      </div>

      {/* Save as Custom Template Modal */}
      {isSaveTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <LayoutTemplate className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100 font-['Outfit']">
                  Save as Custom Template Preset
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveTemplateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Save your current colors, typography, visible sections, custom titles, and sample content into your private template library for instant reuse.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Studio Retainer 2026"
                  value={templateNameInput}
                  onChange={(e) => setTemplateNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 input-premium"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Minimalist layout with milestones and custom SLA"
                  value={templateDescInput}
                  onChange={(e) => setTemplateDescInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 input-premium"
                />
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Accent Color:</span>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: doc.accentColor || '#f59e0b' }}
                    />
                    <span className="font-mono text-slate-200">{doc.accentColor || '#f59e0b'}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Font Family:</span>
                  <span className="text-slate-200">{doc.fontFamily || 'Plus Jakarta Sans'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Industry Workflow:</span>
                  <span className="text-slate-200 capitalize">{doc.industry.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSaveTemplateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCurrentAsTemplate}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Save to My Templates</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
