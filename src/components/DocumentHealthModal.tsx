import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  X,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import type { QuotationDocument } from '../types';
import { auditDocument, countBlocking, type AuditIssue } from '../utils/documentAudit';

interface DocumentHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: QuotationDocument;
  onJumpToTab: (tabId: string) => void;
}

const TAB_LABEL_TO_ID: Record<string, string> = {
  'Deliverables': 'deliverables',
  'Scope & Phases': 'scope',
  'Taxes & Terms': 'tax-payment',
  'Pricing & Items': 'pricing',
  'Business Profile': 'business',
  'Client & Details': 'client',
  'Preset & Style': 'industry',
  'Contract & Sign': 'watermark-terms',
};

export const DocumentHealthModal: React.FC<DocumentHealthModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  onJumpToTab,
}) => {
  if (!isOpen) return null;

  const issues = auditDocument(doc);
  const blockingCount = countBlocking(issues);
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const infos = issues.filter((i) => i.severity === 'info');

  const handleFixIssue = (issue: AuditIssue) => {
    const targetTabId = TAB_LABEL_TO_ID[issue.tab] || 'client';
    onJumpToTab(targetTabId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-2xl ${
                blockingCount > 0
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : warningCount > 0
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {blockingCount > 0 ? (
                <ShieldAlert className="w-5 h-5" />
              ) : warningCount > 0 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
                <span>Document Health & Pre-flight Inspector</span>
              </h3>
              <p className="text-xs text-slate-400">
                {blockingCount > 0
                  ? `${blockingCount} critical issue${blockingCount > 1 ? 's' : ''} require attention before sending`
                  : warningCount > 0
                  ? `${warningCount} recommendation${warningCount > 1 ? 's' : ''} to review for maximum polish`
                  : 'All pre-flight checks passed! 100% ready for client delivery.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 no-scrollbar">
          {issues.length === 0 ? (
            <div className="text-center py-8 px-4 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-100 font-['Outfit']">
                100% Client-Ready!
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                No silent content loss, placeholder tax IDs, or missing payment methods detected.
                Your document will print and display flawlessly.
              </p>
            </div>
          ) : (
            <>
              {/* Critical Errors */}
              {errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Action Required ({errors.length})</span>
                  </div>
                  {errors.map((issue) => (
                    <div
                      key={issue.id}
                      className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-3.5 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-rose-200">{issue.message}</p>
                        {issue.hint && <p className="text-[11px] text-rose-300/70">{issue.hint}</p>}
                      </div>
                      <button
                        onClick={() => handleFixIssue(issue)}
                        className="shrink-0 text-[11px] font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-2.5 py-1.5 rounded-xl border border-rose-500/30 flex items-center space-x-1 transition-all cursor-pointer"
                      >
                        <span>Fix in {issue.tab}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Warnings ({warnings.length})</span>
                  </div>
                  {warnings.map((issue) => (
                    <div
                      key={issue.id}
                      className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-3.5 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-amber-200">{issue.message}</p>
                        {issue.hint && <p className="text-[11px] text-amber-300/70">{issue.hint}</p>}
                      </div>
                      <button
                        onClick={() => handleFixIssue(issue)}
                        className="shrink-0 text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2.5 py-1.5 rounded-xl border border-amber-500/30 flex items-center space-x-1 transition-all cursor-pointer"
                      >
                        <span>Fix in {issue.tab}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations / Info */}
              {infos.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider">
                    <Info className="w-3.5 h-3.5" />
                    <span>Suggestions ({infos.length})</span>
                  </div>
                  {infos.map((issue) => (
                    <div
                      key={issue.id}
                      className="bg-sky-950/20 border border-sky-500/30 rounded-2xl p-3.5 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-sky-200">{issue.message}</p>
                        {issue.hint && <p className="text-[11px] text-sky-300/70">{issue.hint}</p>}
                      </div>
                      <button
                        onClick={() => handleFixIssue(issue)}
                        className="shrink-0 text-[11px] font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 px-2.5 py-1.5 rounded-xl border border-sky-500/30 flex items-center space-x-1 transition-all cursor-pointer"
                      >
                        <span>View in {issue.tab}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Pre-flight checks run automatically in real-time</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
