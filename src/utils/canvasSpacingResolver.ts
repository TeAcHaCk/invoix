import type { QuotationDocument, SectionDividerStyle } from '../types';

export interface ResolvedCanvasSpacing {
  sectionGapPx: number;
  pagePaddingPx: number;
  dividerStyle: SectionDividerStyle;
  isCompact: boolean;
}

export const resolveCanvasSpacing = (doc: QuotationDocument): ResolvedCanvasSpacing => {
  const spacingConfig = doc.canvasSpacing;
  const dividerStyle: SectionDividerStyle = spacingConfig?.dividerStyle || 'none';

  // Density calculation factors
  const phaseCount = (doc.eventCoverage || []).filter((p) => p.dayTitle || (p.services || []).length > 0).length;
  const itemCount = (doc.pricingItems || []).length;
  const deliverableCount = (doc.deliverables || []).filter((d) => d.included).length;
  const isHighDensity = phaseCount > 3 || itemCount > 4 || deliverableCount > 4;

  let mode = spacingConfig?.mode;
  if (!mode) {
    if (doc.layoutDensity === 'compact') mode = 'tight';
    else if (doc.layoutDensity === 'standard') mode = 'relaxed';
    else mode = 'auto';
  }

  let sectionGapPx: number;
  let pagePaddingPx: number;
  let isCompact = false;

  switch (mode) {
    case 'tight':
      sectionGapPx = 10;
      pagePaddingPx = 24;
      isCompact = true;
      break;
    case 'balanced':
      sectionGapPx = 16;
      pagePaddingPx = 32;
      isCompact = false;
      break;
    case 'relaxed':
      sectionGapPx = 24;
      pagePaddingPx = 40;
      isCompact = false;
      break;
    case 'custom':
      sectionGapPx = Math.min(36, Math.max(6, spacingConfig?.sectionGapPx ?? 16));
      pagePaddingPx = Math.min(48, Math.max(18, spacingConfig?.pagePaddingPx ?? 32));
      isCompact = sectionGapPx <= 12;
      break;
    case 'auto':
    default:
      if (isHighDensity) {
        sectionGapPx = 11;
        pagePaddingPx = 26;
        isCompact = true;
      } else {
        sectionGapPx = 16;
        pagePaddingPx = 34;
        isCompact = false;
      }
      break;
  }

  return {
    sectionGapPx,
    pagePaddingPx,
    dividerStyle,
    isCompact,
  };
};
