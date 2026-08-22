import React, { useState } from 'react';
import type { QuotationDocument, BillType, CrewMemberItem, WhyChooseUsItem, PricingItem } from '../types';
import { sanitizeContactNumber } from '../utils/formatters';
import { getTodayFormattedDate, saveStudioProfileToStorage, saveWatermarkConfigToStorage } from '../constants/defaultData';
import { ServiceMatrixBuilder } from './ServiceMatrixBuilder';
import { WatermarkControls } from './WatermarkControls';
import { trimTransparentImage } from '../utils/imageTrim';
import {
  FileText,
  User,
  Calendar,
  Layers,
  CheckSquare,
  DollarSign,
  ShieldCheck,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  Camera,
  Users,
  Receipt,
  CreditCard,
  Building2,
  HeartHandshake,
} from 'lucide-react';

interface FormEditorProps {
  document: QuotationDocument;
  onChange: (doc: QuotationDocument) => void;
}

export const FormEditor: React.FC<FormEditorProps> = ({
  document: doc,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<string>('basic');

  const logoFileInputRef = React.useRef<HTMLInputElement>(null);

  const update = (partial: Partial<QuotationDocument>) => {
    onChange({ ...doc, ...partial });
  };

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

  const handleLogoHeightChange = (height: number) => {
    const updatedStudio = {
      ...doc.studio,
      logoHeight: height,
    };
    saveStudioProfileToStorage(updatedStudio);
    update({ studio: updatedStudio });
  };

  const handleLogoWidthChange = (width: number) => {
    const updatedStudio = {
      ...doc.studio,
      logoWidth: width,
    };
    saveStudioProfileToStorage(updatedStudio);
    update({ studio: updatedStudio });
  };

  const handleResetTopLogo = () => {
    const updatedStudio = {
      ...doc.studio,
      logoUrl: '/assets/logo.png',
      logoHeight: 130,
      logoWidth: 320,
    };
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

    if (type === 'INVOICE' && (activeTab === 'coverage' || activeTab === 'crew' || activeTab === 'why')) {
      setActiveTab('invoice-items');
    }
  };

  // Client handlers
  const handleClientChange = (field: string, value: string) => {
    update({
      client: {
        ...doc.client,
        [field]: value,
      },
    });
  };

  const handleContactNumberChange = (val: string) => {
    const sanitized = sanitizeContactNumber(val);
    update({
      client: {
        ...doc.client,
        contactNo: sanitized,
      },
    });
  };

  // Event coverage handlers
  const handleAddCoverageDay = () => {
    const dayNumber = doc.eventCoverage.length + 1;
    const newDay = {
      id: `day-${Date.now()}`,
      dayTitle: `Day ${dayNumber}`,
      services: ['Traditional Photography', 'Traditional Videography', 'Candid Videography', 'Candid Photography'],
    };
    update({ eventCoverage: [...doc.eventCoverage, newDay] });
  };

  const handleRemoveCoverageDay = (id: string) => {
    update({ eventCoverage: doc.eventCoverage.filter((item) => item.id !== id) });
  };

  const handleUpdateCoverageTitle = (id: string, title: string) => {
    update({
      eventCoverage: doc.eventCoverage.map((item) =>
        item.id === id ? { ...item, dayTitle: title } : item
      ),
    });
  };

  const handleUpdateCoverageServices = (id: string, servicesString: string) => {
    const servicesArray = servicesString.split('\n');
    update({
      eventCoverage: doc.eventCoverage.map((item) =>
        item.id === id ? { ...item, services: servicesArray } : item
      ),
    });
  };

  // Deliverables handlers
  const handleAddDeliverable = () => {
    const newDel = {
      id: `del-${Date.now()}`,
      text: 'Custom Deliverable Item',
      included: true,
    };
    update({ deliverables: [...doc.deliverables, newDel] });
  };

  const handleRemoveDeliverable = (id: string) => {
    update({ deliverables: doc.deliverables.filter((d) => d.id !== id) });
  };

  const handleUpdateDeliverable = (id: string, text: string) => {
    update({
      deliverables: doc.deliverables.map((d) =>
        d.id === id ? { ...d, text } : d
      ),
    });
  };

  // Crew and Roles handlers
  const handleAddCrewMember = () => {
    const newCrew: CrewMemberItem = {
      id: `crew-${Date.now()}`,
      team: 'Assistant Photographer',
      role: 'Capturing candid guest expressions, decor and backup angles.',
      enabled: true,
    };
    update({ crewMembers: [...(doc.crewMembers || []), newCrew] });
  };

  const handleToggleCrew = (id: string) => {
    update({
      crewMembers: (doc.crewMembers || []).map((c) =>
        c.id === id ? { ...c, enabled: !c.enabled } : c
      ),
    });
  };

  const handleUpdateCrew = (id: string, field: 'team' | 'role', value: string) => {
    update({
      crewMembers: (doc.crewMembers || []).map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    });
  };

  const handleRemoveCrew = (id: string) => {
    update({ crewMembers: (doc.crewMembers || []).filter((c) => c.id !== id) });
  };

  // Why Choose Us handlers
  const handleAddWhyItem = () => {
    const newItem: WhyChooseUsItem = {
      id: `why-${Date.now()}`,
      icon: '✨',
      title: 'Premium Quality',
      description: 'Dedicated team ensuring memories you will cherish forever.',
      enabled: true,
    };
    update({ whyChooseUs: [...(doc.whyChooseUs || []), newItem] });
  };

  const handleToggleWhyItem = (id: string) => {
    update({
      whyChooseUs: (doc.whyChooseUs || []).map((w) =>
        w.id === id ? { ...w, enabled: !w.enabled } : w
      ),
    });
  };

  const handleUpdateWhyItem = (id: string, field: 'title' | 'description' | 'icon', value: string) => {
    update({
      whyChooseUs: (doc.whyChooseUs || []).map((w) =>
        w.id === id ? { ...w, [field]: value } : w
      ),
    });
  };

  const handleRemoveWhyItem = (id: string) => {
    update({ whyChooseUs: (doc.whyChooseUs || []).filter((w) => w.id !== id) });
  };

  // Pricing & Payment updates
  const handlePricingDescriptionChange = (index: number, description: string) => {
    const newItems = [...doc.pricingItems];
    newItems[index] = { ...newItems[index], description };
    update({ pricingItems: newItems });
  };

  const handleTotalInvestmentChange = (valStr: string) => {
    const parsed = parseInt(valStr.replace(/[^0-9]/g, ''), 10) || 0;
    const newItems = [...doc.pricingItems];
    if (newItems.length > 0) {
      newItems[0] = { ...newItems[0], amount: parsed, rate: parsed, qty: 1 };
    }
    update({ totalInvestment: parsed, pricingItems: newItems });
  };

  // Itemized Invoice Items handlers
  const handleAddInvoiceItem = () => {
    const newItem: PricingItem = {
      id: `price-${Date.now()}`,
      description: 'Additional Photography / Videography Service',
      qty: 1,
      rate: 10000,
      amount: 10000,
    };
    const newItems = [...doc.pricingItems, newItem];
    const newTotal = newItems.reduce((sum, item) => sum + (item.qty && item.rate ? item.qty * item.rate : item.amount || 0), 0);
    update({ pricingItems: newItems, totalInvestment: newTotal });
  };

  const handleUpdateInvoiceItem = (index: number, field: keyof PricingItem, val: any) => {
    const newItems = [...doc.pricingItems];
    const current = { ...newItems[index], [field]: val };
    if (field === 'qty' || field === 'rate') {
      current.amount = (current.qty || 1) * (current.rate || 0);
    }
    newItems[index] = current;
    const newTotal = newItems.reduce((sum, item) => sum + (item.qty && item.rate ? item.qty * item.rate : item.amount || 0), 0);
    update({ pricingItems: newItems, totalInvestment: newTotal });
  };

  const handleRemoveInvoiceItem = (index: number) => {
    const newItems = doc.pricingItems.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((sum, item) => sum + (item.qty && item.rate ? item.qty * item.rate : item.amount || 0), 0);
    update({ pricingItems: newItems, totalInvestment: newTotal });
  };

  // Terms handlers
  const handleTermChange = (index: number, text: string) => {
    const newTerms = [...doc.termsAndConditions];
    newTerms[index] = text;
    update({ termsAndConditions: newTerms });
  };

  const handleAddTerm = () => {
    update({
      termsAndConditions: [
        ...doc.termsAndConditions,
        'New contractual terms and conditions clause.',
      ],
    });
  };

  const handleRemoveTerm = (index: number) => {
    update({
      termsAndConditions: doc.termsAndConditions.filter((_, idx) => idx !== index),
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-full overflow-hidden">
      {/* Bill Type Selector Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-['Outfit']">
            Choose Bill Type:
          </span>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => handleBillTypeChange('QUOTATION')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              doc.type === 'QUOTATION'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            → QUOTATION (PROPOSAL)
          </button>
          <button
            type="button"
            onClick={() => handleBillTypeChange('INVOICE')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              doc.type === 'INVOICE'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            → TAX INVOICE
          </button>
        </div>
      </div>

      {/* Editor Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/40 p-2 gap-1.5 no-scrollbar">
        {/* Tab: Bill To & Details */}
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'basic'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>{doc.type === 'INVOICE' ? 'Billed To & Invoice' : 'Bill To & Details'}</span>
        </button>

        {/* Tab: Logo & Size */}
        <button
          type="button"
          onClick={() => setActiveTab('logo')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'logo'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Studio Logo & Size</span>
        </button>

        {/* QUOTATION-SPECIFIC TABS */}
        {doc.type === 'QUOTATION' && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'services'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Services Matrix</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('coverage')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'coverage'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Event Coverage</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('deliverables')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'deliverables'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Deliverables</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('crew')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'crew'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Crew & Roles</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('why')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'why'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Why Choose Us</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'pricing'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Pricing & Payment</span>
            </button>
          </>
        )}

        {/* INVOICE-SPECIFIC TABS */}
        {doc.type === 'INVOICE' && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('invoice-items')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'invoice-items'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Line Items & GST</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('invoice-payment')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'invoice-payment'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payment & Status</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('invoice-bank')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === 'invoice-bank'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Bank & QR Pay</span>
            </button>
          </>
        )}

        {/* Common Tabs */}
        <button
          type="button"
          onClick={() => setActiveTab('terms')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'terms'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Terms</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('watermark')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            activeTab === 'watermark'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Watermark</span>
        </button>
      </div>

      {/* Hidden Global Logo File Input */}
      <input
        type="file"
        ref={logoFileInputRef}
        onChange={handleTopLogoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Tab Content Body */}
      <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5 text-left text-xs">
        {/* TAB 1: BASIC BILL TO & DETAILS */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            {/* Bill To Section */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-amber-200 uppercase font-['Outfit'] border-b border-slate-800 pb-2 flex items-center space-x-2">
                <User className="w-4 h-4 text-amber-400" />
                <span>{doc.type === 'INVOICE' ? 'Billed To (Client)' : 'Bill To'}</span>
              </h4>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Name of Event / Client:
                </label>
                <input
                  type="text"
                  value={doc.client.nameOfEvent}
                  onChange={(e) => handleClientChange('nameOfEvent', e.target.value)}
                  placeholder="e.g. Walima / Rahul & Ayesha Wedding"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Address:
                </label>
                <textarea
                  rows={2}
                  value={doc.client.address}
                  onChange={(e) => handleClientChange('address', e.target.value)}
                  placeholder="e.g. Vivek Nagar, Bangalore, Karnataka"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Contact Number (Phone):
                </label>
                <input
                  type="text"
                  value={doc.client.contactNo}
                  onChange={(e) => handleContactNumberChange(e.target.value)}
                  placeholder="e.g. 9686715683"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>
            </div>

            {/* Document Details Section */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-sm font-semibold text-amber-200 uppercase font-['Outfit'] flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>{doc.type === 'INVOICE' ? 'Invoice Details' : 'Quotation Details'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    const year = new Date().getFullYear();
                    const rand = Math.floor(100 + Math.random() * 900);
                    const prefix = doc.type === 'INVOICE' ? 'INV' : 'QUO';
                    update({ details: { ...doc.details, invoiceNo: `${prefix}-${year}-${rand}` } });
                  }}
                  className="text-[11px] text-amber-400 hover:underline flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate No</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {doc.type === 'INVOICE' ? 'Invoice No.:' : 'Quotation No.:'}
                  </label>
                  <input
                    type="text"
                    value={doc.details.invoiceNo}
                    onChange={(e) =>
                      update({ details: { ...doc.details, invoiceNo: e.target.value } })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1 flex items-center justify-between">
                    <span>Date:</span>
                    <span className="text-[10px] text-amber-400">(Auto Present Date)</span>
                  </label>
                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      value={doc.details.invoiceDate}
                      onChange={(e) =>
                        update({ details: { ...doc.details, invoiceDate: e.target.value } })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        update({ details: { ...doc.details, invoiceDate: getTodayFormattedDate() } })
                      }
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded border border-slate-700"
                    >
                      Today
                    </button>
                  </div>
                </div>
              </div>

              {/* Event Dates Single vs Range */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-medium">Event Dates Selection:</label>
                  <div className="flex bg-slate-900 p-0.5 rounded border border-slate-800 text-[10.5px]">
                    <button
                      type="button"
                      onClick={() => update({ details: { ...doc.details, eventDateMode: 'single' } })}
                      className={`px-2 py-0.5 rounded ${
                        doc.details.eventDateMode === 'single'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      Single Date
                    </button>
                    <button
                      type="button"
                      onClick={() => update({ details: { ...doc.details, eventDateMode: 'range' } })}
                      className={`px-2 py-0.5 rounded ${
                        doc.details.eventDateMode === 'range'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      Date Range (From - To)
                    </button>
                  </div>
                </div>

                {doc.details.eventDateMode === 'single' ? (
                  <input
                    type="text"
                    value={doc.details.eventDate}
                    onChange={(e) =>
                      update({ details: { ...doc.details, eventDate: e.target.value } })
                    }
                    placeholder="e.g. 03/09/2026"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={doc.details.eventDateFrom}
                      onChange={(e) =>
                        update({ details: { ...doc.details, eventDateFrom: e.target.value } })
                      }
                      placeholder="From Date (e.g. 03/09/2026)"
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
                    />
                    <input
                      type="text"
                      value={doc.details.eventDateTo}
                      onChange={(e) =>
                        update({ details: { ...doc.details, eventDateTo: e.target.value } })
                      }
                      placeholder="To Date (e.g. 04/09/2026)"
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Package Ribbon Banner */}
              {doc.type === 'QUOTATION' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Package Ribbon Banner Text:
                  </label>
                  <input
                    type="text"
                    value={doc.packageBannerTitle}
                    onChange={(e) => update({ packageBannerTitle: e.target.value })}
                    placeholder="e.g. WEDDING PHOTOGRAPHY & CINEMATOGRAPHY PACKAGE"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-200 font-semibold focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: STUDIO LOGO & SIZE */}
        {activeTab === 'logo' && (
          <div className="space-y-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-sm font-semibold text-amber-200 uppercase font-['Outfit'] flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Studio Header Logo & Display Sizing</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your settings are saved permanently in your browser.
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                  >
                    Upload Logo
                  </button>
                  <button
                    type="button"
                    onClick={handleResetTopLogo}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Logo Preview */}
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-center min-h-[140px]">
                {doc.studio.logoUrl ? (
                  <img
                    src={doc.studio.logoUrl}
                    alt="Logo Preview"
                    style={{
                      width: `${doc.studio.logoWidth || 320}px`,
                      maxHeight: `${doc.studio.logoHeight || 130}px`,
                      objectFit: 'contain',
                    }}
                    className="transition-all"
                  />
                ) : (
                  <span className="text-slate-500">No logo selected</span>
                )}
              </div>

              {/* Width Slider */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-medium">Logo Display Width:</span>
                  <span className="text-amber-300 font-mono font-bold">{doc.studio.logoWidth || 320}px</span>
                </div>
                <input
                  type="range"
                  min="180"
                  max="480"
                  step="10"
                  value={doc.studio.logoWidth || 320}
                  onChange={(e) => handleLogoWidthChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <button type="button" onClick={() => handleLogoWidthChange(220)} className="hover:text-amber-300">Compact (220px)</button>
                  <button type="button" onClick={() => handleLogoWidthChange(280)} className="hover:text-amber-300">Medium (280px)</button>
                  <button type="button" onClick={() => handleLogoWidthChange(340)} className="hover:text-amber-300">Large (340px)</button>
                  <button type="button" onClick={() => handleLogoWidthChange(420)} className="hover:text-amber-300">Extra Large (420px)</button>
                </div>
              </div>

              {/* Height Slider */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-300 font-medium">Logo Max Height:</span>
                  <span className="text-amber-300 font-mono font-bold">{doc.studio.logoHeight || 130}px</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="200"
                  step="5"
                  value={doc.studio.logoHeight || 130}
                  onChange={(e) => handleLogoHeightChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SERVICES MATRIX */}
        {activeTab === 'services' && doc.type === 'QUOTATION' && (
          <ServiceMatrixBuilder document={doc} onChange={onChange} />
        )}

        {/* TAB 4: EVENT COVERAGE */}
        {activeTab === 'coverage' && doc.type === 'QUOTATION' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-amber-200 uppercase font-['Outfit']">
                  Event Coverage Days & Services
                </h4>
                <p className="text-xs text-slate-400">
                  Services covered under each day or event session.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCoverageDay}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Day / Event</span>
              </button>
            </div>

            <div className="space-y-3">
              {doc.eventCoverage.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between space-x-2">
                    <input
                      type="text"
                      value={item.dayTitle}
                      onChange={(e) => handleUpdateCoverageTitle(item.id, e.target.value)}
                      placeholder="e.g. Day 1 - Walima"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-200 font-semibold focus:outline-none focus:border-amber-500 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCoverageDay(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
                      title="Remove Day"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Covered Services (1 per line):
                    </label>
                    <textarea
                      rows={4}
                      value={item.services.join('\n')}
                      onChange={(e) => handleUpdateCoverageServices(item.id, e.target.value)}
                      placeholder="Traditional Photography&#10;Traditional Videography&#10;Candid Videography&#10;Candid Photography"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: DELIVERABLES CHECKLIST */}
        {activeTab === 'deliverables' && doc.type === 'QUOTATION' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-amber-200 uppercase font-['Outfit']">
                  Deliverables Checklist
                </h4>
                <p className="text-xs text-slate-400">
                  Client deliverables listed as bullet points on the quotation.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddDeliverable}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Deliverable</span>
              </button>
            </div>

            <div className="space-y-2">
              {doc.deliverables.map((del) => (
                <div
                  key={del.id}
                  className="flex items-center space-x-2 bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={del.included}
                    onChange={(e) =>
                      update({
                        deliverables: doc.deliverables.map((d) =>
                          d.id === del.id ? { ...d, included: e.target.checked } : d
                        ),
                      })
                    }
                    className="rounded text-amber-500 focus:ring-0 w-4 h-4 bg-slate-900 border-slate-700 accent-amber-400"
                  />
                  <input
                    type="text"
                    value={del.text}
                    onChange={(e) => handleUpdateDeliverable(del.id, e.target.value)}
                    className="flex-1 bg-transparent text-slate-200 border-none focus:outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveDeliverable(del.id)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: CREW AND ROLES AT EVENT (NEW) */}
        {activeTab === 'crew' && doc.type === 'QUOTATION' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-semibold text-amber-200 uppercase font-['Outfit'] flex items-center space-x-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Crew and Role at the Event</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Map each photographer/videographer to their exact on-site role.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doc.includeCrewSection !== false}
                    onChange={(e) => update({ includeCrewSection: e.target.checked })}
                    className="rounded text-amber-500 accent-amber-400"
                  />
                  <span>Show on Proposal</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddCrewMember}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs border border-slate-700"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Role</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {(doc.crewMembers || []).map((crew) => (
                <div
                  key={crew.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="checkbox"
                        checked={crew.enabled}
                        onChange={() => handleToggleCrew(crew.id)}
                        className="rounded text-amber-500 accent-amber-400"
                        title="Enable/Disable role"
                      />
                      <input
                        type="text"
                        value={crew.team}
                        onChange={(e) => handleUpdateCrew(crew.id, 'team', e.target.value)}
                        placeholder="Team Title (e.g. Candid Photographer)"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-200 font-semibold focus:outline-none focus:border-amber-500 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCrew(crew.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      value={crew.role}
                      onChange={(e) => handleUpdateCrew(crew.id, 'role', e.target.value)}
                      placeholder="Role description..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300 focus:outline-none focus:border-amber-500 text-xs leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: WHY CHOOSE US (NEW) */}
        {activeTab === 'why' && doc.type === 'QUOTATION' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-semibold text-amber-200 uppercase font-['Outfit'] flex items-center space-x-2">
                  <HeartHandshake className="w-4 h-4 text-amber-400" />
                  <span>Why Work With Fusion Bells Films?</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Highlight studio value propositions and brand guarantees.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doc.includeWhyChooseUs !== false}
                    onChange={(e) => update({ includeWhyChooseUs: e.target.checked })}
                    className="rounded text-amber-500 accent-amber-400"
                  />
                  <span>Show on Proposal</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddWhyItem}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs border border-slate-700"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Point</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {(doc.whyChooseUs || []).map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={() => handleToggleWhyItem(item.id)}
                        className="rounded text-amber-500 accent-amber-400"
                      />
                      <input
                        type="text"
                        value={item.icon}
                        onChange={(e) => handleUpdateWhyItem(item.id, 'icon', e.target.value)}
                        className="w-10 text-center bg-slate-900 border border-slate-700 rounded-lg py-1 text-sm focus:outline-none"
                      />
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleUpdateWhyItem(item.id, 'title', e.target.value)}
                        placeholder="Feature Title (e.g. Timeless Storytelling)"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-amber-200 font-semibold focus:outline-none focus:border-amber-500 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveWhyItem(item.id)}
                      className="p-1 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) => handleUpdateWhyItem(item.id, 'description', e.target.value)}
                    placeholder="Short description of this value guarantee..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: PRICING & PAYMENT TERMS (QUOTATION MODE) */}
        {activeTab === 'pricing' && doc.type === 'QUOTATION' && (
          <div className="space-y-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-amber-200 uppercase font-['Outfit'] border-b border-slate-800 pb-2 flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>Description & Total Investment</span>
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Package Description:
                  </label>
                  <input
                    type="text"
                    value={doc.pricingItems[0]?.description || ''}
                    onChange={(e) => handlePricingDescriptionChange(0, e.target.value)}
                    placeholder="e.g. Complete Package – Photography & Cinematography"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Total Investment Amount (₹):
                  </label>
                  <input
                    type="text"
                    value={doc.totalInvestment}
                    onChange={(e) => handleTotalInvestmentChange(e.target.value)}
                    placeholder="50000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-mono text-base font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Booking Confirmation & Payment Terms */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
              <h4 className="text-sm font-semibold text-amber-200 uppercase font-['Outfit'] border-b border-slate-800 pb-2">
                Booking Confirmation & Payment Milestone Breakdown
              </h4>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300 font-medium">Stage 1: Advance at booking</span>
                    <span className="text-amber-300 font-mono font-semibold">
                      {doc.paymentTerms.advancePercent}% (₹
                      {Math.round((doc.totalInvestment * doc.paymentTerms.advancePercent) / 100).toLocaleString('en-IN')})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={doc.paymentTerms.advancePercent}
                    onChange={(e) =>
                      update({
                        paymentTerms: {
                          ...doc.paymentTerms,
                          advancePercent: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300 font-medium">Stage 2: After the event</span>
                    <span className="text-amber-300 font-mono font-semibold">
                      {doc.paymentTerms.afterEventPercent}% (₹
                      {Math.round((doc.totalInvestment * doc.paymentTerms.afterEventPercent) / 100).toLocaleString('en-IN')})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="5"
                    value={doc.paymentTerms.afterEventPercent}
                    onChange={(e) =>
                      update({
                        paymentTerms: {
                          ...doc.paymentTerms,
                          afterEventPercent: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300 font-medium">Stage 3: Balance after final delivery</span>
                    <span className="text-amber-300 font-mono font-semibold">
                      {doc.paymentTerms.balancePercent}% (₹
                      {Math.round((doc.totalInvestment * doc.paymentTerms.balancePercent) / 100).toLocaleString('en-IN')})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={doc.paymentTerms.balancePercent}
                    onChange={(e) =>
                      update({
                        paymentTerms: {
                          ...doc.paymentTerms,
                          balancePercent: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INVOICE TAB: LINE ITEMS & GST */}
        {activeTab === 'invoice-items' && doc.type === 'INVOICE' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-amber-200 uppercase font-['Outfit'] flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span>Itemized Invoice Line Items</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Add billable services, quantities, and rates for tax invoicing.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddInvoiceItem}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Line Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {doc.pricingItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between space-x-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleUpdateInvoiceItem(idx, 'description', e.target.value)}
                      placeholder="Service / Package Description"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveInvoiceItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10.5px] text-slate-400 block mb-0.5">Quantity:</label>
                      <input
                        type="number"
                        min="1"
                        value={item.qty || 1}
                        onChange={(e) => handleUpdateInvoiceItem(idx, 'qty', parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] text-slate-400 block mb-0.5">Rate (₹):</label>
                      <input
                        type="number"
                        min="0"
                        value={item.rate || item.amount || 0}
                        onChange={(e) => handleUpdateInvoiceItem(idx, 'rate', parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] text-slate-400 block mb-0.5">Amount (₹):</label>
                      <div className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-2 py-1 text-amber-300 font-mono font-bold text-xs">
                        ₹{((item.qty || 1) * (item.rate || item.amount || 0)).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* GST / Tax Settings */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-amber-200 uppercase tracking-wider font-['Outfit'] border-b border-slate-800 pb-1.5">
                Tax & GST Configuration
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Tax / GST Type:</label>
                  <select
                    value={doc.taxType}
                    onChange={(e) => update({ taxType: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                  >
                    <option value="none">No Tax (Non-GST)</option>
                    <option value="gst">CGST + SGST (9% + 9% = 18%)</option>
                    <option value="igst">IGST (18% Inter-State)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Discount Amount (₹):</label>
                  <input
                    type="number"
                    min="0"
                    value={doc.discount || 0}
                    onChange={(e) => update({ discount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INVOICE TAB: PAYMENT RECEIVED & STATUS */}
        {activeTab === 'invoice-payment' && doc.type === 'INVOICE' && (
          <div className="space-y-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-amber-200 uppercase font-['Outfit'] border-b border-slate-800 pb-2 flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Payment Tracking & Reconciliation</span>
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Payment Status:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        update({
                          invoicePayment: {
                            ...doc.invoicePayment,
                            status: 'UNPAID',
                            amountReceived: 0,
                          },
                        })
                      }
                      className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                        doc.invoicePayment?.status === 'UNPAID'
                          ? 'bg-red-500/20 text-red-300 border-red-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      PAYMENT DUE
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        update({
                          invoicePayment: {
                            ...doc.invoicePayment,
                            status: 'PARTIALLY_PAID',
                          },
                        })
                      }
                      className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                        doc.invoicePayment?.status === 'PARTIALLY_PAID'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      PARTIALLY PAID
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        update({
                          invoicePayment: {
                            ...doc.invoicePayment,
                            status: 'PAID',
                            amountReceived: doc.totalInvestment,
                          },
                        })
                      }
                      className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                        doc.invoicePayment?.status === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      PAID IN FULL
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Amount Received (₹):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={doc.invoicePayment?.amountReceived || 0}
                      onChange={(e) =>
                        update({
                          invoicePayment: {
                            ...doc.invoicePayment,
                            amountReceived: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-emerald-400 font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Payment Date:
                    </label>
                    <input
                      type="text"
                      value={doc.invoicePayment?.paymentDate || ''}
                      onChange={(e) =>
                        update({
                          invoicePayment: {
                            ...doc.invoicePayment,
                            paymentDate: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. 22/08/2026"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Payment Mode:
                    </label>
                    <select
                      value={doc.invoicePayment?.paymentMode || 'UPI'}
                      onChange={(e) =>
                        update({
                          invoicePayment: {
                            ...doc.invoicePayment,
                            paymentMode: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs"
                    >
                      <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                      <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT / IMPS)</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Credit / Debit Card">Credit / Debit Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Txn / Reference ID:
                    </label>
                    <input
                      type="text"
                      value={doc.invoicePayment?.transactionRef || ''}
                      onChange={(e) =>
                        update({
                          invoicePayment: {
                            ...doc.invoicePayment,
                            transactionRef: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g. UPI-928347102938"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INVOICE TAB: BANK & QR PAY */}
        {activeTab === 'invoice-bank' && doc.type === 'INVOICE' && (
          <div className="space-y-4">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-amber-200 uppercase font-['Outfit'] border-b border-slate-800 pb-2 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>Bank Transfer & Direct UPI Payment Settings</span>
              </h4>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">UPI ID (for instant QR code):</label>
                    <input
                      type="text"
                      value={doc.studio.upiId || '8970511524@upi'}
                      onChange={(e) => {
                        const updated = { ...doc.studio, upiId: e.target.value };
                        saveStudioProfileToStorage(updated);
                        update({ studio: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">GSTIN Number:</label>
                    <input
                      type="text"
                      value={doc.studio.gstin || ''}
                      onChange={(e) => {
                        const updated = { ...doc.studio, gstin: e.target.value };
                        saveStudioProfileToStorage(updated);
                        update({ studio: updated });
                      }}
                      placeholder="e.g. 29ABCDE1234F1Z5"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Bank Name:</label>
                    <input
                      type="text"
                      value={doc.studio.bankName || ''}
                      onChange={(e) => {
                        const updated = { ...doc.studio, bankName: e.target.value };
                        saveStudioProfileToStorage(updated);
                        update({ studio: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Account Holder Name:</label>
                    <input
                      type="text"
                      value={doc.studio.accountHolder || ''}
                      onChange={(e) => {
                        const updated = { ...doc.studio, accountHolder: e.target.value };
                        saveStudioProfileToStorage(updated);
                        update({ studio: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Account Number:</label>
                    <input
                      type="text"
                      value={doc.studio.accountNumber || ''}
                      onChange={(e) => {
                        const updated = { ...doc.studio, accountNumber: e.target.value };
                        saveStudioProfileToStorage(updated);
                        update({ studio: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">IFSC Code:</label>
                    <input
                      type="text"
                      value={doc.studio.ifscCode || ''}
                      onChange={(e) => {
                        const updated = { ...doc.studio, ifscCode: e.target.value };
                        saveStudioProfileToStorage(updated);
                        update({ studio: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: TERMS & CONDITIONS */}
        {activeTab === 'terms' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-amber-200 uppercase font-['Outfit']">
                  {doc.type === 'INVOICE' ? 'Invoice Notes & Conditions' : 'Terms & Conditions Clauses'}
                </h4>
                <p className="text-xs text-slate-400">
                  Photography contract, payment rules, and cancellation policies.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddTerm}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Clause</span>
              </button>
            </div>

            <div className="space-y-2">
              {doc.termsAndConditions.map((term, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-2 bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-xs"
                >
                  <span className="text-amber-400 font-mono font-semibold min-w-[20px] pt-1">
                    {index + 1}.
                  </span>
                  <textarea
                    rows={2}
                    value={term}
                    onChange={(e) => handleTermChange(index, e.target.value)}
                    className="flex-1 bg-transparent text-slate-200 border-none focus:outline-none text-xs leading-relaxed"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTerm(index)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: WATERMARK ENGINE */}
        {activeTab === 'watermark' && (
          <WatermarkControls
            config={doc.watermark}
            onChange={(newConfig) => {
              saveWatermarkConfigToStorage(newConfig);
              update({ watermark: newConfig });
            }}
          />
        )}
      </div>
    </div>
  );
};
