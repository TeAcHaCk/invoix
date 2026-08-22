import React from 'react';
import type { WatermarkConfig } from '../types';

interface WatermarkLayerProps {
  config: WatermarkConfig;
}

export const WatermarkLayer: React.FC<WatermarkLayerProps> = ({ config }) => {
  if (!config.enabled) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none print:flex"
      style={{
        opacity: config.opacity,
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
            {config.customText || 'FBF'}
          </div>
        ) : (
          <img
            src={config.customImageUrl || '/assets/watermark.png'}
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
                textNode.innerText = config.customText || 'FBF';
                parent.appendChild(textNode);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};
