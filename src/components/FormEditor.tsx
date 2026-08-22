import React, { useState } from 'react';
import type { QuotationDocument, BillType } from '../types';
import { sanitizeContactNumber } from '../utils/formatters';
import { getTodayFormattedDate } from '../constants/defaultData';
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
  Upload,
  Sliders,
  Image as ImageIcon,
} from 'lucide-react';

interface FormEditorProps {
  document: QuotationDocument;
  onChange: (updatedDoc: QuotationDocument) => void;
}

export const FormEditor: React.FC<FormEditorProps> = ({
  document: doc,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<
    'basic' | 'logo' | 'services' | 'coverage' | 'deliverables' | 'pricing' | 'terms' | 'watermark'
  >('basic');
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
          update({
            studio: {
              ...doc.studio,
              logoUrl: trimmedUrl,
            },
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoHeightChange = (height: number) => {
    update({
      studio: {
        ...doc.studio,
        logoHeight: height,
      },
    });
  };

  const handleLogoWidthChange = (width: number) => {
    update({
      studio: {
        ...doc.studio,
        logoWidth: width,
      },
    });
  };

  const handleResetTopLogo = () => {
    update({
      studio: {
        ...doc.studio,
        logoUrl: '/assets/logo.png',
        logoHeight: 130,
        logoWidth: 320,
      },
    });
  };

  const handleBillTypeChange = (type: BillType) => {
    // Generate appropriate prefix if needed
    const currentNo = doc.details.invoiceNo;
    let newNo = currentNo;
    if (type === 'QUOTATION' && currentNo.startsWith('INV-')) {
      newNo = currentNo.replace('INV-', 'QUO-');
    } else if (type === 'INVOICE' && currentNo.startsWith('QUO-')) {
      newNo = currentNo.replace('QUO-', 'INV-');
    }
    update({
      type,
      details: {
        ...doc.details,
        invoiceNo: newNo,
      },
    });
  };

  // Client Bill To updates
  const handleClientChange = (field: keyof typeof doc.client, value: string) => {
    let finalVal = value;
    if (field === 'contactNo') {
      finalVal = sanitizeContactNumber(value);
    }
    update({
      client: {
        ...doc.client,
        [field]: finalVal,
      },
    });
  };

  // Document Details updates
  const handleDetailsChange = (field: keyof typeof doc.details, value: any) => {
    update({
      details: {
        ...doc.details,
        [field]: value,
      },
    });
  };

  // Event Coverage handlers
  const handleAddCoverageDay = () => {
    const nextDayNum = doc.eventCoverage.length + 1;
    const newDay = {
      id: `day-${Date.now()}`,
      dayTitle: `Day ${nextDayNum} - Reception`,
      services: ['Traditional Photography', 'Candid Photography'],
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
    const servicesArray = servicesString
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
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
      newItems[0] = { ...newItems[0], amount: parsed };
    }
    update({ totalInvestment: parsed, pricingItems: newItems });
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
            → QUOTATION
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
            → INVOICE
          </button>
        </div>
      </div>

      {/* Editor Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/40 p-2 gap-1.5 no-scrollbar">
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
          <span>Bill To & Details</span>
        </button>

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
          <span>Top Logo & Size</span>
        </button>

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
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* TOP LOGO QUICK CARD IN BASIC TAB */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            {/* Quick Top Logo Box */}
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                {doc.studio.logoUrl ? (
                  <div className="bg-white/10 p-1.5 rounded-lg border border-slate-700 flex items-center justify-center min-w-[70px] max-h-12">
                    <img
                      src={doc.studio.logoUrl}
                      alt="Logo Preview"
                      className="max-h-9 max-w-[90px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold text-amber-200 uppercase font-['Outfit']">
                    Top Studio Logo
                  </h4>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                    <span>Width: <strong className="text-amber-300 font-mono">{doc.studio.logoWidth || 320}px</strong></span>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('logo')}
                      className="text-amber-400 hover:underline font-semibold"
                    >
                      Make Logo Bigger →
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => logoFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center space-x-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetTopLogo}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded-lg border border-slate-800"
                  title="Reset to default FBF logo"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Section 1: Bill To */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                <User className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-semibold text-amber-200 uppercase font-['Outfit']">
                  Bill To
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Name of Event: <span className="text-slate-400">(Manually Written)</span>
                  </label>
                  <input
                    type="text"
                    value={doc.client.nameOfEvent}
                    onChange={(e) => handleClientChange('nameOfEvent', e.target.value)}
                    placeholder="e.g. Walima or Rohit & Sneha's Wedding"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Address: <span className="text-slate-400">(Manually Written)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={doc.client.address}
                    onChange={(e) => handleClientChange('address', e.target.value)}
                    placeholder="e.g. Vivek Nagar, Bangalore"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Contact No.: <span className="text-amber-400/90">(Only numbers allowed)</span>
                  </label>
                  <input
                    type="text"
                    value={doc.client.contactNo}
                    onChange={(e) => handleClientChange('contactNo', e.target.value)}
                    placeholder="e.g. 9686715683"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Invoice Details */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-semibold text-amber-200 uppercase font-['Outfit']">
                    {doc.type === 'INVOICE' ? 'Invoice Details' : 'Quotation Details'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleDetailsChange(
                      'invoiceNo',
                      `${doc.type === 'INVOICE' ? 'INV' : 'QUO'}-${new Date().getFullYear()}-${Math.floor(
                        100 + Math.random() * 900
                      )}`
                    )
                  }
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate No</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {doc.type === 'INVOICE' ? 'Invoice No.:' : 'Quotation No.:'} <span className="text-slate-400">(Manually Written)</span>
                  </label>
                  <input
                    type="text"
                    value={doc.details.invoiceNo}
                    onChange={(e) => handleDetailsChange('invoiceNo', e.target.value)}
                    placeholder="e.g. QUO-2026-089"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-slate-300 font-medium">
                      {doc.type === 'INVOICE' ? 'Invoice Date:' : 'Quotation Date:'}
                    </label>
                    <span className="text-[10px] text-amber-400">(Auto Present Date)</span>
                  </div>
                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      value={doc.details.invoiceDate}
                      onChange={(e) => handleDetailsChange('invoiceDate', e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleDetailsChange('invoiceDate', getTodayFormattedDate())}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] rounded-lg border border-slate-700"
                    >
                      Today
                    </button>
                  </div>
                </div>
              </div>

              {/* Event Date Mode: Single vs Range */}
              <div className="pt-2 border-t border-slate-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium text-xs">
                    Event Dates Selection:
                  </label>
                  <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleDetailsChange('eventDateMode', 'single')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        doc.details.eventDateMode === 'single'
                          ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Single Date
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDetailsChange('eventDateMode', 'range')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                        doc.details.eventDateMode === 'range'
                          ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Date Range (From - To)
                    </button>
                  </div>
                </div>

                {doc.details.eventDateMode === 'single' ? (
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">
                      Event Date: (e.g. 03/09/2026)
                    </label>
                    <input
                      type="text"
                      value={doc.details.eventDate}
                      onChange={(e) => handleDetailsChange('eventDate', e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">
                        From Date:
                      </label>
                      <input
                        type="text"
                        value={doc.details.eventDateFrom}
                        onChange={(e) => handleDetailsChange('eventDateFrom', e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">
                        To Date:
                      </label>
                      <input
                        type="text"
                        value={doc.details.eventDateTo}
                        onChange={(e) => handleDetailsChange('eventDateTo', e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Package Banner Title */}
              <div className="pt-2 border-t border-slate-800/60">
                <label className="block text-slate-300 font-medium text-xs mb-1">
                  Package Ribbon Banner Text:
                </label>
                <input
                  type="text"
                  value={doc.packageBannerTitle}
                  onChange={(e) => update({ packageBannerTitle: e.target.value })}
                  placeholder="e.g. WALIMA PHOTOGRAPHY & CINEMATOGRAPHY PACKAGE"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-200 uppercase font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB: TOP LOGO & BRANDING */}
        {activeTab === 'logo' && (
          <div className="space-y-5">
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-5 space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-amber-200 uppercase font-['Outfit']">
                    Top Studio Logo & Header Settings
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleResetTopLogo}
                  className="text-[11px] text-slate-400 hover:text-amber-300 underline"
                >
                  Reset to Default Logo
                </button>
              </div>

              {/* Logo Preview Stage */}
              <div className="bg-white/5 border border-slate-700/80 rounded-xl p-6 flex flex-col items-center justify-center space-y-3">
                {doc.studio.logoUrl ? (
                  <div className="bg-white/90 p-4 rounded-lg shadow-md max-w-full flex items-center justify-center">
                    <img
                      src={doc.studio.logoUrl}
                      alt="Top Logo Preview"
                      style={{
                        height: `${doc.studio.logoHeight || 110}px`,
                        maxHeight: '180px',
                      }}
                      className="object-contain transition-all"
                    />
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 text-slate-500" />
                    <p>No logo uploaded</p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-md flex items-center space-x-2 transition-all active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Custom Top Logo (PNG)</span>
                  </button>
                </div>
              </div>

              {/* Logo Width / Scale Slider */}
              <div className="space-y-2 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center space-x-1.5 font-semibold">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Logo Display Width (Scale)</span>
                  </span>
                  <span className="text-amber-300 font-mono font-bold text-sm">
                    {doc.studio.logoWidth || 320} px
                  </span>
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

                {/* Quick Presets for Width */}
                <div className="flex justify-between items-center pt-2 gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-400">Width Presets:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { label: 'Compact', w: 220 },
                      { label: 'Medium', w: 280 },
                      { label: 'Large (Bold)', w: 340 },
                      { label: 'Extra Large', w: 420 },
                    ].map((sz) => (
                      <button
                        key={sz.w}
                        type="button"
                        onClick={() => handleLogoWidthChange(sz.w)}
                        className={`px-2.5 py-1 rounded text-[10.5px] font-medium border transition-all ${
                          (doc.studio.logoWidth || 320) === sz.w
                            ? 'bg-amber-500/20 text-amber-200 border-amber-500/50'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Logo Max Height Slider */}
              <div className="space-y-2 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center space-x-1.5 font-semibold">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Logo Max Height</span>
                  </span>
                  <span className="text-amber-300 font-mono font-bold text-sm">
                    {doc.studio.logoHeight || 130} px
                  </span>
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

              {/* Studio Name & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Studio Brand Name:
                  </label>
                  <input
                    type="text"
                    value={doc.studio.name}
                    onChange={(e) =>
                      update({
                        studio: { ...doc.studio, name: e.target.value },
                      })
                    }
                    placeholder="FUSION BELLS FILMS"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Studio Slogan / Tagline:
                  </label>
                  <input
                    type="text"
                    value={doc.studio.tagline}
                    onChange={(e) =>
                      update({
                        studio: { ...doc.studio, tagline: e.target.value },
                      })
                    }
                    placeholder="REAL MOMENTS, TIMELESS STORIES."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SERVICES MATRIX QUICK BUILDER */}
        {activeTab === 'services' && (
          <ServiceMatrixBuilder document={doc} onChange={onChange} />
        )}

        {/* TAB 3: EVENT COVERAGE LIST */}
        {activeTab === 'coverage' && (
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
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={item.dayTitle}
                      onChange={(e) => handleUpdateCoverageTitle(item.id, e.target.value)}
                      placeholder="e.g. Day 1 - Walima"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-200 font-semibold focus:outline-none focus:border-amber-500"
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

        {/* TAB 4: DELIVERABLES CHECKLIST */}
        {activeTab === 'deliverables' && (
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
                    className="flex-1 bg-transparent border-none text-slate-200 focus:outline-none text-xs"
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

        {/* TAB 5: PRICING & PAYMENT TERMS */}
        {activeTab === 'pricing' && (
          <div className="space-y-5">
            {/* Description & Amount */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
              <h4 className="text-sm font-semibold text-amber-200 uppercase font-['Outfit'] border-b border-slate-800 pb-2">
                Description & Investment
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Package Description:
                  </label>
                  <input
                    type="text"
                    value={doc.pricingItems[0]?.description || ''}
                    onChange={(e) => handlePricingDescriptionChange(0, e.target.value)}
                    placeholder="Complete Package – Walima & Reception Photography & Cinematography"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
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
                    placeholder="49000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-mono text-base font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Booking Confirmation & Payment Terms */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-4">
              <h4 className="text-sm font-semibold text-amber-200 uppercase font-['Outfit'] border-b border-slate-800 pb-2">
                Booking Confirmation & Payment Stage Breakdown
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

        {/* TAB 6: TERMS & CONDITIONS */}
        {activeTab === 'terms' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-amber-200 uppercase font-['Outfit']">
                  Terms & Conditions Clauses
                </h4>
                <p className="text-xs text-slate-400">
                  Preloaded with all 12 photography contract points from your template.
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

        {/* TAB 7: WATERMARK ENGINE */}
        {activeTab === 'watermark' && (
          <WatermarkControls
            config={doc.watermark}
            onChange={(newConfig) => update({ watermark: newConfig })}
          />
        )}
      </div>
    </div>
  );
};
