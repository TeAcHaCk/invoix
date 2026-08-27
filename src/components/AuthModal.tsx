import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Lock,
  Mail,
  Building2,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  LogOut,
  Crown,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    profile,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setErrorMessage(error.message);
        } else {
          setSuccessMessage('Signed in successfully!');
          setTimeout(() => onClose(), 800);
        }
      } else if (mode === 'signup') {
        const { error } = await signUpWithEmail(email, password, businessName);
        if (error) {
          setErrorMessage(error.message);
        } else {
          setSuccessMessage('Account created successfully! You can now sign in.');
          setTimeout(() => onClose(), 1200);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
      <div className="glass rounded-2xl w-full max-w-md shadow-2xl shadow-black/40 overflow-hidden text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] modal-enter">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-['Outfit']">
                {user ? 'Account & Profile' : mode === 'signup' ? 'Create Invoix Account' : 'Sign In to Invoix'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {user ? user.email : 'Secure cloud backup & real-time proposal tracking'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If User is already signed in */}
        {user ? (
          <div className="p-6 space-y-4 text-xs">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center space-x-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/30 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-lg font-['Outfit']">
                {user.email?.[0].toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className="font-bold text-sm text-slate-100 font-['Outfit']">{profile?.business_name || 'Studio Owner'}</p>
                  <span className="text-[9px] bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5" />
                    {profile?.plan || 'Free'} Plan
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">{user.email}</p>
              </div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
              <p className="text-[11px] font-semibold text-slate-200 flex items-center space-x-1.5 font-['Outfit']">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cloud Synchronization Active</span>
              </p>
              <p className="text-[10.5px] text-slate-400 leading-relaxed">
                All your quotations, client proposals, and invoices are securely stored in your personal cloud vault and synced across your devices.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => signOut()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-red-400 border border-slate-800 hover:border-red-500/30 rounded-xl font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div className="p-6 space-y-4 text-xs">
            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error / Success Notifications */}
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl flex items-start space-x-2 text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-start space-x-2 text-[11px]">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1 font-['Outfit']">
                    Business / Studio Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Nexus Digital Agency"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1 font-['Outfit']">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1 font-['Outfit']">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In to Workspace' : 'Create Free Account'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase font-mono">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-700 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all text-xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google Account</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
