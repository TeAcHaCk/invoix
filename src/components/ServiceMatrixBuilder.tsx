import React, { useState } from 'react';
import { Camera, Film, Video, Wand2 } from 'lucide-react';
import type { QuotationDocument } from '../types';

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

    const allCoveredServices = [...selectedServices, ...selectedAddons];
    const newCoverage = selectedEvents.map((ev, index) => ({
      id: `day-${index + 1}`,
      dayTitle: `Day ${index + 1} - ${ev}`,
      services: allCoveredServices,
    }));

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

    selectedAddons.forEach((addonName, idx) => {
      const match = DEFAULT_ADDITIONAL_SERVICES.find((a) => a.name === addonName);
      if (match) {
        defaultDeliverables.push({
          id: `del-addon-${idx}`,
          text: match.deliverable,
          included: true,
        });
      }
    });

    onChange({
      ...doc,
      packageBannerTitle: packageBanner,
      eventCoverage: newCoverage,
      deliverables: defaultDeliverables,
      client: {
        ...doc.client,
        nameOfEvent: eventNameJoined,
      },
    });
  };

  return (
    <div className="space-y-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div>
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-['Outfit'] flex items-center space-x-1.5">
            <Wand2 className="w-3.5 h-3.5" />
            <span>Event & Photography Package Generator</span>
          </h4>
          <p className="text-[11px] text-slate-400">
            Select events and crew services to auto-populate coverage schedule
          </p>
        </div>

        <button
          type="button"
          onClick={applyPackageToDocument}
          className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg shadow transition-all flex items-center space-x-1"
        >
          <Wand2 className="w-3 h-3" />
          <span>Apply to Proposal</span>
        </button>
      </div>

      {/* Services Selection */}
      <div>
        <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
          1. Select Core Photography & Video Services
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DEFAULT_SERVICES.map((svc: { id: string; category: string; name: string; defaultDeliverable: string }) => {
            const isChecked = selectedServices.includes(svc.name);
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => toggleService(svc.name)}
                className={`p-2 rounded-lg border text-left flex items-center space-x-2 transition-all ${
                  isChecked
                    ? 'bg-amber-500/20 border-amber-500/80 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="shrink-0">
                  {svc.category === 'Traditional' ? (
                    <Camera className="w-3.5 h-3.5" />
                  ) : svc.category === 'Candid' ? (
                    <Film className="w-3.5 h-3.5" />
                  ) : (
                    <Video className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="text-[11px] font-medium leading-tight">{svc.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Events Selection */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-semibold text-slate-300">
            2. Select Event Ceremonies (Multi-Day Support)
          </label>
          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="text-[10px] text-amber-400 hover:underline"
          >
            {showCustomInput ? 'Cancel' : '+ Custom Event'}
          </button>
        </div>

        {showCustomInput && (
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              placeholder="e.g. Sangeet & Cocktail Night"
              value={customEventInput}
              onChange={(e) => setCustomEventInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100"
            />
            <button
              type="button"
              onClick={handleAddCustomEvent}
              className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
            >
              Add
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {DEFAULT_EVENT_TYPES.map((ev: string) => {
            const isChecked = selectedEvents.includes(ev);
            return (
              <button
                key={ev}
                type="button"
                onClick={() => toggleEvent(ev)}
                className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                  isChecked
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {ev}
              </button>
            );
          })}
        </div>
      </div>

      {/* Addons Selection */}
      <div>
        <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
          3. Optional Production Add-ons
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DEFAULT_ADDITIONAL_SERVICES.map((addon: { id: string; name: string; label: string; deliverable: string }) => {
            const isChecked = selectedAddons.includes(addon.name);
            return (
              <button
                key={addon.id}
                type="button"
                onClick={() => toggleAddon(addon.name)}
                className={`px-2.5 py-1 rounded-lg text-[11px] border transition-all ${
                  isChecked
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {addon.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
