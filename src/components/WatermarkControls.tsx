import React, { useRef } from 'react';
import type { WatermarkConfig } from '../types';
import { Eye, EyeOff, Sliders, RotateCw, Image as ImageIcon, Type, Sparkles, Upload } from 'lucide-react';

interface WatermarkControlsProps {
  config: WatermarkConfig;
  onChange: (newConfig: WatermarkConfig) => void;
}

export const WatermarkControls: React.FC<WatermarkControlsProps> = ({ config, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (partial: Partial<WatermarkConfig>) => {
    onChange({ ...config, ...partial });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          update({
            customImageUrl: event.target.result as string,
            type: 'monogram',
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-amber-500/20 rounded-xl p-4 shadow-xl text-slate-200">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold tracking-wide text-amber-200 uppercase font-['Outfit']">
            Watermark Engine
          </h3>
        </div>
        <button
          type="button"
          onClick={() => update({ enabled: !config.enabled })}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
            config.enabled
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          {config.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{config.enabled ? 'Enabled' : 'Disabled'}</span>
        </button>
      </div>

      {config.enabled && (
        <div className="space-y-3.5 text-xs">
          {/* Watermark Type Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => update({ type: 'monogram' })}
              className={`flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                config.type === 'monogram'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Studio Emblem</span>
            </button>
            <button
              type="button"
              onClick={() => update({ type: 'text' })}
              className={`flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                config.type === 'text'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Custom Text</span>
            </button>
          </div>

          {/* Custom Text Input */}
          {config.type === 'text' && (
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Watermark Text</label>
              <input
                type="text"
                value={config.customText}
                onChange={(e) => update({ customText: e.target.value })}
                placeholder="e.g. INVOIX or CONFIDENTIAL"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Custom Watermark Image Upload */}
          {config.type === 'monogram' && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Upload Custom Watermark</span>
                </button>
                {config.customImageUrl && (
                  <button
                    type="button"
                    onClick={() => update({ customImageUrl: '/assets/watermark.png' })}
                    className="text-[11px] text-slate-400 hover:text-amber-300 underline"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Opacity Slider */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center space-x-1">
                <Sliders className="w-3 h-3 text-amber-400" />
                <span>Opacity</span>
              </span>
              <span className="text-amber-300 font-mono font-medium">
                {Math.round(config.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.25"
              step="0.01"
              value={config.opacity}
              onChange={(e) => update({ opacity: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Scale / Size Slider */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Size / Scale</span>
              <span className="text-amber-300 font-mono font-medium">
                {Math.round(config.scale * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.6"
              step="0.05"
              value={config.scale}
              onChange={(e) => update({ scale: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Rotation & Position Y */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span className="flex items-center space-x-1">
                  <RotateCw className="w-3 h-3 text-amber-400" />
                  <span>Rotation</span>
                </span>
                <span className="text-amber-300 font-mono">{config.rotation}°</span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                step="5"
                value={config.rotation}
                onChange={(e) => update({ rotation: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Vertical Pos</span>
                <span className="text-amber-300 font-mono">{config.positionY}px</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={config.positionY}
                onChange={(e) => update({ positionY: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
