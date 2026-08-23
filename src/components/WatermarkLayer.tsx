import React from 'react';
import type { WatermarkConfig } from '../types';
import { useAuth } from '../context/AuthContext';
import { canDisableWatermark } from '../utils/planLimits';

interface WatermarkLayerProps {
  config: WatermarkConfig;
}

export const WatermarkLayer: React.FC<WatermarkLayerProps> = ({ config }) => {
  const { profile } = useAuth();
  const isPaid = canDisableWatermark(profile);

  // If paid user and disabled, do not render
  if (isPaid && !config.enabled) return null;

  // Free users always get the default watermark with at least 0.05 opacity
  const effectiveOpacity = isPaid ? config.opacity : Math.max(0.05, config.opacity);
  const effectiveImage = isPaid ? (config.customImageUrl || '/invoix-logo.png') : '/invoix-logo.png';
  const effectiveText = isPaid ? (config.customText || 'INVOIX') : 'INVOIX';

  return (
    <div
      className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none print:flex"
      style={{
        opacity: effectiveOpacity,
        transform: `translateY(${config.positionY}px)`,
      }}
    >
      <div
        className="transition-transform duration-200 flex items-center justify-center"
        style={{
          transform: `scale(${config.scale}) rotate(${config.rotation}deg)`,
        }}
      >
        {config.type === 'text' ? (
          <div className="text-center font-bold tracking-widest uppercase font-serif text-slate-800 whitespace-nowrap text-7xl select-none">
            {effectiveText}
          </div>
        ) : (
          <img
            src={effectiveImage}
            alt="Watermark"
            className="max-w-[550px] max-h-[550px] object-contain select-none filter contrast-125"
            onError={(e) => {
              // Fallback to text if image fails
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const textNode = document.createElement('div');
                textNode.className = 'text-center font-bold tracking-widest font-serif text-slate-800 text-8xl';
                textNode.innerText = effectiveText;
                parent.appendChild(textNode);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};
