import React from 'react';
import type { IndustryCategory, CustomTemplatePreset } from '../types';
import { INDUSTRY_PRESETS } from '../constants/industryPresets';
import { Sparkles, Check, Plus, Trash2, LayoutTemplate } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface IndustryPresetSelectorProps {
  currentIndustry: IndustryCategory;
  onSelectIndustry: (industry: IndustryCategory) => void;
  customTemplates?: CustomTemplatePreset[];
  activeCustomTemplateId?: string;
  onSelectCustomTemplate?: (template: CustomTemplatePreset) => void;
  onDeleteCustomTemplate?: (templateId: string) => void;
  onOpenCreateTemplate?: () => void;
}

export const IndustryPresetSelector: React.FC<IndustryPresetSelectorProps> = ({
  currentIndustry,
  onSelectIndustry,
  customTemplates = [],
  activeCustomTemplateId,
  onSelectCustomTemplate,
  onDeleteCustomTemplate,
  onOpenCreateTemplate,
}) => {
  const { confirm, toast } = useToast();
  const presetsList = Object.values(INDUSTRY_PRESETS);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5 font-['Outfit']">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Select Industry Preset & Workflow</span>
        </label>
        <span className="text-[10px] text-slate-400">1-Click Auto-Configure</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {presetsList.map((preset) => {
          const isSelected = !activeCustomTemplateId && currentIndustry === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectIndustry(preset.id)}
              className={`text-left p-2.5 rounded-xl border transition-all relative flex flex-col justify-between cursor-pointer ${
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

        {/* 7th Tile: Design Custom Template */}
        <button
          type="button"
          onClick={onOpenCreateTemplate}
          className="text-left p-2.5 rounded-xl border border-dashed border-amber-500/50 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold uppercase">
              NEW
            </span>
          </div>

          <div className="mt-2">
            <p className="text-xs font-bold text-amber-300 line-clamp-1 font-['Outfit']">
              Custom Template
            </p>
            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
              Design & Save Your Own
            </p>
          </div>
        </button>
      </div>

      {/* User's Saved Custom Templates Section */}
      {customTemplates.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 font-['Outfit']">
              <LayoutTemplate className="w-3.5 h-3.5 text-purple-400" />
              <span>My Saved Templates ({customTemplates.length})</span>
            </label>
            <span className="text-[10px] text-purple-400 font-mono">Personal Library</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {customTemplates.map((tmpl) => {
              const isSelected = activeCustomTemplateId === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => onSelectCustomTemplate && onSelectCustomTemplate(tmpl)}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500/80 ring-1 ring-purple-400/40 shadow-lg shadow-purple-500/10'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <div
                      className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: tmpl.accentColor || '#8b5cf6' }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-100 truncate font-['Outfit']">
                        {tmpl.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {tmpl.fontFamily} • {tmpl.theme}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {isSelected && (
                      <span className="bg-purple-500 text-slate-950 p-0.5 rounded-full mr-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                    {onDeleteCustomTemplate && (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = await confirm({
                            title: 'Delete Custom Template',
                            message: `Are you sure you want to delete "${tmpl.name}"?`,
                            confirmText: 'Delete',
                            variant: 'danger',
                          });
                          if (ok) {
                            onDeleteCustomTemplate(tmpl.id);
                            toast.success(`Template "${tmpl.name}" deleted`);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition-colors"
                        title="Delete custom template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

