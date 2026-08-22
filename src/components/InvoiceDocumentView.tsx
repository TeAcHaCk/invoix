import React from 'react';
import type { QuotationDocument } from '../types';
import { FormalInvoiceView } from './FormalInvoiceView';
import { ModernProposalView } from './ModernProposalView';
import { CreativeProposalView } from './CreativeProposalView';

interface InvoiceDocumentViewProps {
  document: QuotationDocument;
  elementId?: string;
  zoomScale?: number;
}

export const InvoiceDocumentView: React.FC<InvoiceDocumentViewProps> = ({
  document: doc,
  elementId = 'quotation-invoice-canvas',
  zoomScale = 1,
}) => {
  return (
    <div
      className="canvas-viewport flex justify-center items-start transition-all duration-200"
      style={{
        transform: `scale(${zoomScale})`,
        transformOrigin: 'top center',
      }}
    >
      <div id={elementId} className="space-y-6">
        {doc.type === 'INVOICE' ? (
          <div
            className="print-page bg-white shadow-2xl transition-all duration-200"
            style={{
              width: '794px',
              minHeight: '1123px',
              boxSizing: 'border-box',
            }}
          >
            <FormalInvoiceView document={doc} />
          </div>
        ) : doc.theme === 'creative' ? (
          <CreativeProposalView document={doc} />
        ) : (
          <ModernProposalView document={doc} />
        )}
      </div>
    </div>
  );
};
