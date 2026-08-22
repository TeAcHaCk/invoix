import React, { useState } from 'react';
import {
  DEFAULT_SERVICES,
  DEFAULT_EVENT_TYPES,
  DEFAULT_ADDITIONAL_SERVICES,
} from '../constants/defaultData';
import { Camera, Film, Video, Sparkles, Plus, Check, Wand2 } from 'lucide-react';
import type { QuotationDocument } from '../types';

interface ServiceMatrixBuilderProps {
  document: QuotationDocument;
  onChange: (updatedDoc: QuotationDocument) => void;
}

export const ServiceMatrixBuilder: React.FC<ServiceMatrixBuilderProps> = ({
  document: doc,
  onChange,
}) => {
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'Traditional Photography',
    'Traditional Videography',
    'Candid Videography',
    'Candid Photography',
  ]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['Walima']);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [customEventInput, setCustomEventInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const toggleService = (serviceName: string) => {
    if (selectedServices.includes(serviceName)) {
      setSelectedServices(selectedServices.filter((s) => s !== serviceName));
    } else {
      setSelectedServices([...selectedServices, serviceName]);
    }
  };

  const toggleEvent = (eventName: string) => {
    if (selectedEvents.includes(eventName)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== eventName));
    } else {
      setSelectedEvents([...selectedEvents, eventName]);
    }
  };

  const toggleAddon = (addonName: string) => {
    if (selectedAddons.includes(addonName)) {
      setSelectedAddons(selectedAddons.filter((a) => a !== addonName));
    } else {
      setSelectedAddons([...selectedAddons, addonName]);
    }
  };

  const handleAddCustomEvent = () => {
    if (customEventInput.trim()) {
      const eventName = customEventInput.trim();
      if (!selectedEvents.includes(eventName)) {
        setSelectedEvents([...selectedEvents, eventName]);
      }
      setCustomEventInput('');
      setShowCustomInput(false);
    }
  };

  // Smart Package Generator: Apply current selection to the document
  const applyPackageToDocument = () => {
    const eventNameJoined = selectedEvents.length > 0 ? selectedEvents.join(' & ') : 'Wedding';
    const isCinematic = selectedServices.some((s) => s.toLowerCase().includes('cinematic') || s.toLowerCase().includes('video'));
    const isPhoto = selectedServices.some((s) => s.toLowerCase().includes('photo'));
    
    let packageSuffix = 'PACKAGE';
    if (isPhoto && isCinematic) {
      packageSuffix = 'PHOTOGRAPHY & CINEMATOGRAPHY PACKAGE';
    } else if (isPhoto) {
      packageSuffix = 'PHOTOGRAPHY PACKAGE';
    } else if (isCinematic) {
      packageSuffix = 'CINEMATOGRAPHY PACKAGE';
    }

    const packageBanner = `${eventNameJoined.toUpperCase()} ${packageSuffix}`;

    // Construct event coverage
    const allCoveredServices = [...selectedServices, ...selectedAddons];
    const newCoverage = selectedEvents.map((ev, index) => ({
      id: `day-${index + 1}`,
      dayTitle: `Day ${index + 1} - ${ev}`,
      services: allCoveredServices,
    }));

    // Construct deliverables
    const defaultDeliverables = [
      { id: 'del-1', text: 'Event Teaser (60-90 seconds 4K)', included: true },
      {
        id: 'del-2',
        text: `Professionally Edited High Resolution Photographs (${selectedEvents.length > 1 ? '200+' : '100'} pics)`,
        included: true,
      },
      { id: 'del-3', text: 'Cinematic Highlight Films (3-5 mins)', included: isCinematic },
      { id: 'del-4', text: 'We will provide all the traditional full length video', included: selectedServices.includes('Traditional Videography') },
    ];

    if (selectedAddons.includes('Drone')) {
      defaultDeliverables.push({
        id: 'del-drone',
        text: '4K Drone Aerial Shots & Cinematic Perspectives',
        included: true,
      });
    }

    if (selectedAddons.includes('LED Wall')) {
      defaultDeliverables.push({
        id: 'del-led',
        text: 'Live LED Wall Live Feed & Switcher Setup',
        included: true,
      });
    }

    if (selectedAddons.includes('Live Streaming')) {
      defaultDeliverables.push({
        id: 'del-live',
        text: 'Full HD Multi-Cam Live Webcast on YouTube / Private Link',
        included: true,
      });
    }

    if (selectedAddons.includes('Luxury Album')) {
      defaultDeliverables.push({
        id: 'del-album',
        text: '1x Premium Matte Finish Hardcover Photobook Album (40 Pages)',
        included: true,
      });
    }

    // Update pricing description
    const newPricingDescription = `Complete Package – ${eventNameJoined} Photography & Cinematography`;

    onChange({
      ...doc,
      client: {
        ...doc.client,
        nameOfEvent: doc.client.nameOfEvent || eventNameJoined,
      },
      packageBannerTitle: packageBanner,
      eventCoverage: newCoverage,
      deliverables: defaultDeliverables,
      pricingItems: [
        {
          id: 'price-1',
          description: newPricingDescription,
          amount: doc.totalInvestment || 49000,
        },
      ],
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-semibold text-amber-200 font-['Outfit']">
            Wedding Photography & Services Builder
          </h3>
        </div>
        <button
          type="button"
          onClick={applyPackageToDocument}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs rounded-lg shadow-md transition-all active:scale-95"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Apply to Quotation</span>
        </button>
      </div>

      {/* 1. Main Photography / Cinematography Services */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 font-['Outfit']">
          Forms → Services Main
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {DEFAULT_SERVICES.map((svc) => {
            const isSelected = selectedServices.includes(svc.name);
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => toggleService(svc.name)}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition-all text-left ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-100 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {svc.category === 'Traditional' && <Camera className="w-4 h-4 text-amber-400" />}
                  {svc.category === 'Candid' && <Sparkles className="w-4 h-4 text-amber-400" />}
                  {svc.category === 'Cinematic' && <Film className="w-4 h-4 text-amber-400" />}
                  <div>
                    <span className="font-semibold text-amber-300 mr-1.5">[{svc.category}]</span>
                    <span>{svc.name.replace(svc.category + ' ', '')}</span>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                    isSelected
                      ? 'bg-amber-400 border-amber-400 text-slate-950'
                      : 'border-slate-700'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Events Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 font-['Outfit']">
            Events → Occasion Types
          </label>
          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center space-x-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add Custom Event</span>
          </button>
        </div>

        {showCustomInput && (
          <div className="flex items-center space-x-2 mb-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
            <input
              type="text"
              placeholder="e.g. Sangeet & Cocktail Night"
              value={customEventInput}
              onChange={(e) => setCustomEventInput(e.target.value)}
              className="flex-1 bg-transparent text-xs text-slate-200 outline-none placeholder-slate-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCustomEvent();
              }}
            />
            <button
              type="button"
              onClick={handleAddCustomEvent}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded"
            >
              Add
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {DEFAULT_EVENT_TYPES.map((ev) => {
            const isSelected = selectedEvents.includes(ev);
            return (
              <button
                key={ev}
                type="button"
                onClick={() => toggleEvent(ev)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span>{ev}</span>
                {isSelected && <Check className="w-3 h-3 text-amber-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Additional Events / Gear */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 font-['Outfit']">
          Additional Gear & Services →
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DEFAULT_ADDITIONAL_SERVICES.map((addon) => {
            const isSelected = selectedAddons.includes(addon.name);
            return (
              <button
                key={addon.id}
                type="button"
                onClick={() => toggleAddon(addon.name)}
                className={`flex items-center justify-between p-2 rounded-lg border text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Video className="w-3.5 h-3.5 text-amber-400" />
                  <span>{addon.name}</span>
                </div>
                <div
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                    isSelected
                      ? 'bg-amber-400 border-amber-400 text-slate-950'
                      : 'border-slate-700'
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
