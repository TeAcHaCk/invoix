import type { CustomTemplatePreset, QuotationDocument } from '../types';

const STORAGE_KEY = 'invoix_custom_templates_v1';

export const getCustomTemplates = (): CustomTemplatePreset[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read custom templates from storage:', err);
    return [];
  }
};

export const saveCustomTemplate = (template: CustomTemplatePreset): void => {
  try {
    const existing = getCustomTemplates();
    const index = existing.findIndex((t) => t.id === template.id);
    let updated: CustomTemplatePreset[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = { ...template, updatedAt: new Date().toISOString() };
    } else {
      updated = [template, ...existing];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save custom template:', err);
  }
};

export const deleteCustomTemplate = (templateId: string): void => {
  try {
    const existing = getCustomTemplates();
    const filtered = existing.filter((t) => t.id !== templateId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete custom template:', err);
  }
};

export const createTemplateFromDocument = (
  doc: QuotationDocument,
  name: string,
  description?: string
): CustomTemplatePreset => {
  const id = `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  return {
    id,
    name: name.trim() || 'My Custom Template',
    description: description?.trim() || 'Personalized studio layout preset',
    industry: doc.industry || 'software_tech',
    theme: doc.theme || 'modern',
    accentColor: doc.accentColor || '#f59e0b',
    fontFamily: doc.fontFamily || 'Plus Jakarta Sans',
    sectionVisibility: {
      banner: doc.sectionVisibility?.banner ?? true,
      scope: doc.sectionVisibility?.scope ?? doc.includeScopeSection ?? true,
      deliverables: doc.sectionVisibility?.deliverables ?? true,
      crew: doc.sectionVisibility?.crew ?? doc.includeCrewSection ?? true,
      whyChooseUs: doc.sectionVisibility?.whyChooseUs ?? doc.includeWhyChooseUs ?? true,
      pricingTable: doc.sectionVisibility?.pricingTable ?? true,
      paymentMilestones: doc.sectionVisibility?.paymentMilestones ?? true,
      bankDetails: doc.sectionVisibility?.bankDetails ?? true,
      terms: doc.sectionVisibility?.terms ?? true,
      signatory: doc.sectionVisibility?.signatory ?? true,
    },
    sectionTitles: doc.sectionTitles,
    createdAt: now,
    updatedAt: now,
    isCustom: true,
    sampleDocument: {
      packageBannerTitle: doc.packageBannerTitle,
      eventCoverage: doc.eventCoverage,
      deliverables: doc.deliverables,
      crewMembers: doc.crewMembers,
      whyChooseUs: doc.whyChooseUs,
      termsAndConditions: doc.termsAndConditions,
      paymentTerms: doc.paymentTerms,
    },
  };
};
