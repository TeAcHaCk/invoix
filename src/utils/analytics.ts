// Google Analytics 4 (GA4) Event Dispatcher

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export function trackEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

export function trackPageView(pagePath: string, pageTitle?: string) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle || document.title,
    });
  }
}

// Preset business tracking events
export const Analytics = {
  exportPdf: (billType: string, industry: string) => {
    trackEvent('export_pdf', { bill_type: billType, industry });
  },
  printDocument: (billType: string) => {
    trackEvent('print_document', { bill_type: billType });
  },
  shareWhatsApp: (billType: string) => {
    trackEvent('share_whatsapp', { bill_type: billType });
  },
  saveVault: (billType: string) => {
    trackEvent('save_to_vault', { bill_type: billType });
  },
  selectIndustry: (industry: string) => {
    trackEvent('select_industry_preset', { industry });
  },
  selectPlan: (plan: string) => {
    trackEvent('select_pricing_plan', { plan });
  },
  installApp: () => {
    trackEvent('pwa_app_installed');
  },
};
