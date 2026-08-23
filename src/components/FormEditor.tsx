import React, { useState } from 'react';
import type {
  QuotationDocument,
  BillType,
  IndustryCategory,
  PricingItem,
  ScopeMilestoneItem,
  DeliverableItem,
} from '../types';
import { sanitizeContactNumber } from '../utils/formatters';
import {
  saveStudioProfileToStorage,
  saveWatermarkConfigToStorage,
  createDocumentFromPreset,
} from '../constants/defaultData';
import { SUPPORTED_CURRENCIES } from '../constants/currencies';
import { IndustryPresetSelector } from './IndustryPresetSelector';
import { WatermarkControls } from './WatermarkControls';
import { AdBanner } from './AdBanner';
import { trimTransparentImage } from '../utils/imageTrim';
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
} from 'lucide-react';

interface FormEditorProps {
  document: QuotationDocument;
  onChange: (doc: QuotationDocument) => void;
}

export const FormEditor: React.FC<FormEditorProps> = ({
  document: doc,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<string>('industry');
  const logoFileInputRef = React.useRef<HTMLInputElement>(null);

  const update = (partial: Partial<QuotationDocument>) => {
    onChange({ ...doc, ...partial });
  };

  const handleSelectIndustryPreset = (industry: IndustryCategory) => {
    if (
      window.confirm(
        `Load default template for "${industry.replace('_', ' ').toUpperCase()}"? This will populate sample scope, deliverables, and terms.`
      )
    ) {
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
    }
  };

  // Logo Upload with transparent whitespace cropping
  const handleTopLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const rawUrl = event.target.result as string;
          const trimmedUrl = await trimTransparentImage(rawUrl);
          const updatedStudio = {
            ...doc.studio,
            logoUrl: trimmedUrl,
          };
          saveStudioProfileToStorage(updatedStudio);
          update({ studio: updatedStudio });
        }
      };
      reader.readAsDataURL(file);
    }
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

  // Terms handlers
  const handleAddTerm = () => {
    update({ termsAndConditions: [...doc.termsAndConditions, 'New commercial term or policy clause.'] });
  };

  const handleTermChange = (idx: number, val: string) => {
    const next = [...doc.termsAndConditions];
    next[idx] = val;
    update({ termsAndConditions: next });
  };

  const handleRemoveTerm = (idx: number) => {
    update({ termsAndConditions: doc.termsAndConditions.filter((_, i) => i !== idx) });
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
    { name: 'Plus Jakarta Sans (Modern Clean)', value: 'Plus Jakarta Sans' },
    { name: 'Outfit (Bold & Tech)', value: 'Outfit' },
    { name: 'Inter (Minimalist Corporate)', value: 'Inter' },
    { name: 'Playfair Display (Luxury Serif)', value: 'Playfair Display' },
    { name: 'Space Grotesk (Design Studio)', value: 'Space Grotesk' },
  ];

  return (
    <div className="glass rounded-3xl p-4 sm:p-5 flex flex-col h-full shadow-2xl border border-slate-800/80 font-['Plus_Jakarta_Sans',sans-serif] glow-amber">
      {/* Tab Navigation with glowing active pills */}
      <div className="flex overflow-x-auto space-x-1.5 pb-3 mb-3.5 border-b border-slate-800/70 no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center space-x-2 transition-all cursor-pointer ${
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

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs no-scrollbar">
        {/* ========================================================= */}
        {/* TAB 1: INDUSTRY PRESETS & DOCUMENT STYLE                  */}
        {/* ========================================================= */}
        {activeTab === 'industry' && (
          <div className="space-y-4 animate-fadeIn">
            <IndustryPresetSelector
              currentIndustry={doc.industry}
              onSelectIndustry={handleSelectIndustryPreset}
            />

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
                onChange={(e) => update({ fontFamily: e.target.value })}
                className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
              >
                {fontOptions.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Type Switcher */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block font-['Outfit'] flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Document Mode</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleBillTypeChange('QUOTATION')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    doc.type === 'QUOTATION'
                      ? 'bg-amber-500/15 border-amber-500/80 text-amber-200 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <p className="font-bold text-xs font-['Outfit']">Proposal & Quotation</p>
                  <p className="text-[10px] text-slate-400 mt-1">High-converting multi-page client proposal with scope & milestones</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleBillTypeChange('INVOICE')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    doc.type === 'INVOICE'
                      ? 'bg-blue-500/15 border-blue-500/80 text-blue-200 shadow-md shadow-blue-500/10'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <p className="font-bold text-xs font-['Outfit']">Tax & Payment Invoice</p>
                  <p className="text-[10px] text-slate-400 mt-1">Single-page formal commercial invoice with dynamic payment QR</p>
                </button>
              </div>
            </div>

            {/* Proposal Theme Switcher */}
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
            {/* Logo Upload */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block font-['Outfit']">
                Company Brand Logo
              </label>
              <div className="flex items-center space-x-3">
                {doc.studio.logoUrl ? (
                  <div className="p-2 bg-white rounded-xl border border-slate-700 shadow-sm">
                    <img src={doc.studio.logoUrl} alt="Logo" className="h-10 max-w-[140px] object-contain" />
                  </div>
                ) : (
                  <div className="w-20 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-[10px]">
                    No Logo
                  </div>
                )}
                <div className="flex-1 space-x-2">
                  <input
                    type="file"
                    ref={logoFileInputRef}
                    accept="image/*"
                    onChange={handleTopLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Upload Logo (PNG/SVG)
                  </button>
                  {doc.studio.logoUrl && (
                    <button
                      type="button"
                      onClick={() => update({ studio: { ...doc.studio, logoUrl: '' } })}
                      className="px-2.5 py-2 text-slate-400 hover:text-red-400 rounded-xl text-xs cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
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
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
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
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CLIENT & DOCUMENT DETAILS                          */}
        {/* ========================================================= */}
        {activeTab === 'client' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Document Reference Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
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
                  {doc.type === 'INVOICE' ? 'Payment Due Date' : 'Quotation Validity'}
                </label>
                <input
                  type="text"
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
          <div className="space-y-4 animate-fadeIn">
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
          <div className="space-y-4 animate-fadeIn">
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
                    <label className="flex items-center space-x-2 cursor-pointer text-[11px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={Boolean(item.isOptional)}
                        onChange={(e) => handlePricingItemChange(item.id, 'isOptional', e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                      />
                      <span>Optional Upsell Add-on (Client can tick on interactive proposal)</span>
                    </label>
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
        {/* TAB 6: DELIVERABLES & VALUE PROPOSITIONS                  */}
        {/* ========================================================= */}
        {activeTab === 'deliverables' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Deliverables Checklist */}
            <div className="space-y-3">
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
                    className="flex items-center space-x-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5"
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
                      className="flex-1 bg-slate-900/90 border border-slate-700/70 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                    />
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleMoveDeliverable(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-amber-300 disabled:opacity-30 disabled:hover:text-slate-400 rounded cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDeliverable(idx, 'down')}
                        disabled={idx === doc.deliverables.length - 1}
                        className="p-1 text-slate-400 hover:text-amber-300 disabled:opacity-30 disabled:hover:text-slate-400 rounded cursor-pointer"
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
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: TAXES & MILESTONE PAYMENT TERMS                    */}
        {/* ========================================================= */}
        {activeTab === 'tax-payment' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Tax Settings */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
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
                        },
                      })
                    }
                    className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 input-premium"
                  >
                    <option value="none">No Tax / 0% Tax</option>
                    <option value="gst">India GST (CGST + SGST)</option>
                    <option value="igst">India IGST (Inter-State)</option>
                    <option value="vat">VAT (UK / EU / UAE)</option>
                    <option value="sales_tax">US / Canada Sales Tax</option>
                    <option value="custom">Custom Tax</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={doc.taxConfig?.percent ?? doc.taxPercent ?? 0}
                    onChange={(e) => {
                      const pct = Number(e.target.value);
                      update({
                        taxPercent: pct,
                        taxConfig: { ...doc.taxConfig, percent: pct },
                      });
                    }}
                    className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono input-premium"
                  />
                </div>
              </div>
            </div>

            {/* Milestone Payment Structure */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block font-['Outfit']">
                Milestone Payment Structure (%)
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Advance Deposit %</label>
                  <input
                    type="number"
                    value={doc.paymentTerms?.advancePercent || 30}
                    onChange={(e) =>
                      update({
                        paymentTerms: {
                          ...doc.paymentTerms,
                          advancePercent: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-2.5 py-2 text-xs text-slate-100 font-mono text-center input-premium"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Interim Phase %</label>
                  <input
                    type="number"
                    value={doc.paymentTerms?.afterEventPercent || 40}
                    onChange={(e) =>
                      update({
                        paymentTerms: {
                          ...doc.paymentTerms,
                          afterEventPercent: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-2.5 py-2 text-xs text-slate-100 font-mono text-center input-premium"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Final Handover %</label>
                  <input
                    type="number"
                    value={doc.paymentTerms?.balancePercent || 30}
                    onChange={(e) =>
                      update({
                        paymentTerms: {
                          ...doc.paymentTerms,
                          balancePercent: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl px-2.5 py-2 text-xs text-slate-100 font-mono text-center input-premium"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: TERMS, WATERMARK & E-SIGNATURE                     */}
        {/* ========================================================= */}
        {activeTab === 'watermark-terms' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Watermark Controls */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
              <WatermarkControls
                config={doc.watermark}
                onChange={(w) => {
                  saveWatermarkConfigToStorage(w);
                  update({ watermark: w });
                }}
              />
            </div>

            {/* Terms & Conditions */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block font-['Outfit']">
                  Contract Terms & Policy Clauses
                </label>
                <button
                  type="button"
                  onClick={handleAddTerm}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  + Add Clause
                </button>
              </div>

              <div className="space-y-2">
                {doc.termsAndConditions.map((term, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={term}
                      onChange={(e) => handleTermChange(idx, e.target.value)}
                      className="flex-1 bg-slate-900/90 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-200 input-premium"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(idx)}
                      className="p-2 text-slate-500 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Free-tier AdSense Placement (Auto-hidden for Pro users) */}
        <div className="pt-6 border-t border-slate-800/80">
          <AdBanner format="rectangle" />
        </div>
      </div>
    </div>
  );
};
