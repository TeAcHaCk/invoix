import React from 'react';
import type { IndustryCategory } from '../types';
import { INDUSTRY_PRESETS } from '../constants/industryPresets';
import { Sparkles, Check } from 'lucide-react';

interface IndustryPresetSelectorProps {
  currentIndustry: IndustryCategory;
  onSelectIndustry: (industry: IndustryCategory) => void;
}

export const IndustryPresetSelector: React.FC<IndustryPresetSelectorProps> = ({
  currentIndustry,
  onSelectIndustry,
}) => {
  const presetsList = Object.values(INDUSTRY_PRESETS);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5 font-['Outfit']">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Select Industry Preset & Workflow</span>
        </label>
        <span className="text-[10px] text-slate-400">1-Click Auto-Configure</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {presetsList.map((preset) => {
          const isSelected = currentIndustry === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectIndustry(preset.id)}
              className={`text-left p-2.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-xl">{preset.icon}</span>
                {isSelected && (
                  <span className="bg-amber-500 text-slate-950 p-0.5 rounded-full">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="mt-2">
                <p className="text-xs font-bold text-slate-100 line-clamp-1 font-['Outfit']">
                  {preset.name}
                </p>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                  {preset.badge}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
