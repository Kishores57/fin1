import React, { useState, useEffect } from 'react';
import {
  X,
  Trees,
  Shield,
  UserCheck,
  Lock,
  Mail,
  User,
  Building,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Leaf,
  Compass,
  Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialTab = 'login', defaultRole = 'user' }) {
  const { login, register, handleAuthSuccess, targetTabAfterAuth } = useAuth();

  const [mode, setMode] = useState(initialTab); // 'login' | 'register'
  const [selectedRole, setSelectedRole] = useState(defaultRole); // 'user' | 'admin'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');

  // Keep mode synchronized if modal opens with a different tab
  useEffect(() => {
    if (isOpen) {
      setMode(initialTab);
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleQuickLogin = async (roleToUse) => {
    setError('');
    setLoading(true);
    try {
      const quickCreds =
        roleToUse === 'admin'
          ? { email: 'admin@vanjeevan.org', pass: 'admin123' }
          : { email: 'user@vanjeevan.org', pass: 'user123' };

      setEmail(quickCreds.email);
      setPassword(quickCreds.pass);
      setSelectedRole(roleToUse);

      const authedUser = await login(quickCreds.email, quickCreds.pass);
      setSuccessMsg(`Welcome, ${authedUser.name}! Entering platform...`);
      setTimeout(() => {
        handleAuthSuccess(authedUser);
        if (onAuthSuccess) onAuthSuccess(authedUser, targetTabAfterAuth);
        onClose();
      }, 500);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (err.code === 'ERR_NETWORK' || !err.response
          ? 'Backend server not reachable on port 8000. Please ensure backend is started.'
          : err.message || 'Authentication failed. Please check credentials.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail) throw new Error('Please enter a valid email address.');
      if (!password) throw new Error('Please enter your password.');

      if (mode === 'login') {
        const authedUser = await login(cleanEmail, password);
        setSuccessMsg(`Welcome back, ${authedUser.name}! Entering platform...`);
        setTimeout(() => {
          handleAuthSuccess(authedUser);
          if (onAuthSuccess) onAuthSuccess(authedUser, targetTabAfterAuth);
          onClose();
        }, 500);
      } else {
        // Registration
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');

        const authedUser = await register({
          name: name.trim(),
          email: cleanEmail,
          password,
          role: selectedRole,
          organization: organization.trim(),
        });
        setSuccessMsg(`Account created for ${authedUser.name} as ${authedUser.role.toUpperCase()}! Entering platform...`);
        setTimeout(() => {
          handleAuthSuccess(authedUser);
          if (onAuthSuccess) onAuthSuccess(authedUser, targetTabAfterAuth);
          onClose();
        }, 500);
      }
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (err.code === 'ERR_NETWORK' || !err.response
          ? 'Backend server not reachable on port 8000. Please ensure backend is started.'
          : err.message || 'Authentication error. Please try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1f15]/70 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-[#fdfcf9] rounded-3xl shadow-2xl border border-[rgba(20,46,31,0.12)] overflow-hidden transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Nature Banner */}
        <div className="relative bg-[#142e1f] text-white p-6 sm:p-7 overflow-hidden">
          {/* Subtle Ambient Orbs */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-[#95d5b2] backdrop-blur-sm">
              <Trees className="w-3.5 h-3.5 text-emerald-300" />
              VanJeevan · Role-Based Security
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-['Fraunces'] text-white">
            {mode === 'login' ? 'Sign In to VanJeevan' : 'Create Researcher Account'}
          </h2>
          <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-sm">
            {mode === 'login'
              ? 'Access the GIS Tree Inventory, Carbon Allometry & Earth Observation Workspace.'
              : 'Register as an Administrator or Field Researcher to manage urban canopy preservation.'}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="mt-5 inline-flex p-1 bg-white/10 rounded-xl backdrop-blur-sm border border-white/15">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'login'
                  ? 'bg-white text-[#142e1f] shadow-sm'
                  : 'text-white/80 hover:text-white'
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'register'
                  ? 'bg-white text-[#142e1f] shadow-sm'
                  : 'text-white/80 hover:text-white'
                }`}
            >
              New Account
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Demo Login Cards */}
          {mode === 'login' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#708477]">
                  Instant Role Credentials (1-Click)
                </span>
                <span className="text-[11px] text-[#2d6a4f] font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Ready to test
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Admin Quick Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  disabled={loading}
                  className="flex items-start gap-3 p-3 rounded-2xl border border-amber-500/30 bg-amber-50/60 hover:bg-amber-100/60 text-left transition-all group hover:shadow-sm"
                >
                  <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#582f0e] flex items-center gap-1">
                      <span>Sign In as Admin</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="text-[11px] text-[#7f4f24]/80 mt-0.5">
                      Full authority · Record deletion · User controls
                    </div>
                  </div>
                </button>

                {/* User Quick Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('user')}
                  disabled={loading}
                  className="flex items-start gap-3 p-3 rounded-2xl border border-emerald-600/30 bg-emerald-50/60 hover:bg-emerald-100/60 text-left transition-all group hover:shadow-sm"
                >
                  <div className="p-2 rounded-xl bg-emerald-700 text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#142e1f] flex items-center gap-1">
                      <span>Sign In as Researcher</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="text-[11px] text-[#2d6a4f]/80 mt-0.5">
                      Tree registration · GIS maps · Carbon allometry
                    </div>
                  </div>
                </button>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[rgba(20,46,31,0.1)]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#fdfcf9] px-3 text-[#708477]">Or sign in with email</span>
                </div>
              </div>
            </div>
          )}

          {/* Role Selection for Registration */}
          {mode === 'register' && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#708477] block">
                Select Your Role in Platform
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('user')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${selectedRole === 'user'
                      ? 'border-[#2d6a4f] bg-[#d8f3dc]/30 ring-2 ring-[#2d6a4f]/20'
                      : 'border-[rgba(20,46,31,0.12)] bg-white hover:bg-[#f3efe6]'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Leaf className="w-4 h-4 text-[#2d6a4f]" />
                    <span className="text-xs font-bold text-[#142e1f]">Field Researcher</span>
                  </div>
                  <p className="text-[11px] text-[#708477]">
                    Standard access to survey trees, calculate carbon &amp; analyze GIS canopy.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${selectedRole === 'admin'
                      ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-600/20'
                      : 'border-[rgba(20,46,31,0.12)] bg-white hover:bg-[#f3efe6]'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-[#582f0e]">Administrator</span>
                  </div>
                  <p className="text-[11px] text-[#708477]">
                    Tree authority status with user oversight, tree deletion &amp; compliance tools.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Error & Success Alerts */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Patil"
                      className="w-full pl-11 pr-4 py-3 min-h-[48px] rounded-2xl border-2 border-emerald-600/30 hover:border-emerald-600 focus:border-emerald-600 bg-white text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 transition-all shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Organization / Academic Department
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                      <Building className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. KKWIEER Forestry Dept"
                      className="w-full pl-11 pr-4 py-3 min-h-[48px] rounded-2xl border-2 border-emerald-600/30 hover:border-emerald-600 focus:border-emerald-600 bg-white text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 transition-all shadow-xs"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'login' ? 'admin@vanjeevan.org or user@vanjeevan.org' : 'name@institution.edu'}
                  className="w-full pl-11 pr-4 py-3 min-h-[48px] rounded-2xl border-2 border-emerald-600/30 hover:border-emerald-600 focus:border-emerald-600 bg-white text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  Password <span className="text-red-500">*</span>
                </label>
                {mode === 'login' && (
                  <span className="text-[11px] text-stone-500">
                    Default: <code className="text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">admin123</code> / <code className="text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">user123</code>
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3 min-h-[48px] rounded-2xl border-2 border-emerald-600/30 hover:border-emerald-600 focus:border-emerald-600 bg-white text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 transition-all shadow-xs"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors focus:outline-none cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#142e1f] hover:bg-[#1b3d2b] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md shadow-[#142e1f]/10 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login' ? 'Sign In & Enter Platform' : `Create ${selectedRole.toUpperCase()} Account`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-2 text-center text-xs text-[#708477]">
            Protected by VanJeevan Secure Key Cryptography &middot; Role Verified
          </div>
        </div>
      </div>
    </div>
  );
}
