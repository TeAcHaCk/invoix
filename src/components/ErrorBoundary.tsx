import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Shown instead of the default panel — used for client-facing pages. */
  fallback?: React.ReactNode;
  /** Labels the error in the console so it is clear which tree failed. */
  label?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render-time crashes so a thrown error shows a recoverable panel
 * instead of a blank page.
 *
 * This matters most on the public proposal route: a crash there is seen by the
 * user's CLIENT, mid-signing, with no way to tell anyone something went wrong.
 *
 * Must be a class — React exposes no hook equivalent for error boundaries.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[Invoix${this.props.label ? ' · ' + this.props.label : ''}] render crash:`, error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-500/15 text-rose-400 rounded-xl border border-rose-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 font-['Outfit']">Something went wrong</h1>
              <p className="text-xs text-slate-400">The page hit an unexpected error.</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Your saved documents are not affected. Reloading usually clears this — if it keeps
            happening, the details are in your browser console.
          </p>

          <details className="text-[11px] text-slate-500">
            <summary className="cursor-pointer hover:text-slate-300 transition-colors">
              Technical details
            </summary>
            <pre className="mt-2 p-2.5 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto whitespace-pre-wrap break-words font-mono text-[10px]">
              {error.message || String(error)}
            </pre>
          </details>

          <button
            type="button"
            onClick={this.handleReload}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Reload Page</span>
          </button>
        </div>
      </div>
    );
  }
}
