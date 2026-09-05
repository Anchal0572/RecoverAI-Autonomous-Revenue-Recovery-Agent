import { useState, useEffect } from 'react';
import { User, Bell, Shield, Paintbrush, CheckCircle2, Lock, Smartphone, Globe, Key, Volume2, Moon, DollarSign, Check, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUser } from '../api';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'preferences'>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile Form State
  const [firstName, setFirstName] = useState('Admin');
  const [lastName, setLastName] = useState('RevPulse');
  const [email, setEmail] = useState('admin@company.com');
  const [companyName, setCompanyName] = useState('Acme Global Corp');

  // Security Form State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Notifications Form State
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(true);
  const [highRiskAlerts, setHighRiskAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);

  // Interface Preferences State
  const [currency, setCurrency] = useState('INR');
  const [numberFormat, setNumberFormat] = useState('indian');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('10');

  const { data: profile } = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser
  });

  // Load saved preferences if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('revpulse_user_settings') || localStorage.getItem('recoverai_user_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.firstName) setFirstName(parsed.firstName);
        if (parsed.lastName) setLastName(parsed.lastName);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.companyName) setCompanyName(parsed.companyName);
        if (parsed.twoFactorEnabled !== undefined) setTwoFactorEnabled(parsed.twoFactorEnabled);
        if (parsed.sessionTimeout) setSessionTimeout(parsed.sessionTimeout);
        if (parsed.emailAlerts !== undefined) setEmailAlerts(parsed.emailAlerts);
        if (parsed.slackAlerts !== undefined) setSlackAlerts(parsed.slackAlerts);
        if (parsed.highRiskAlerts !== undefined) setHighRiskAlerts(parsed.highRiskAlerts);
        if (parsed.dailyDigest !== undefined) setDailyDigest(parsed.dailyDigest);
        if (parsed.currency) setCurrency(parsed.currency);
        if (parsed.numberFormat) setNumberFormat(parsed.numberFormat);
        if (parsed.soundEnabled !== undefined) setSoundEnabled(parsed.soundEnabled);
        if (parsed.refreshInterval) setRefreshInterval(parsed.refreshInterval);
      } else if (profile?.user) {
        if (profile.user.firstName) setFirstName(profile.user.firstName);
        if (profile.user.lastName) setLastName(profile.user.lastName);
        if (profile.user.email) setEmail(profile.user.email);
        if (profile.merchant?.name) setCompanyName(profile.merchant.name);
      }
    } catch (e) {}
  }, [profile]);

  const handleSave = () => {
    setSaving(true);
    setSaveSuccess(false);

    const payload = {
      firstName,
      lastName,
      email,
      companyName,
      twoFactorEnabled,
      sessionTimeout,
      emailAlerts,
      slackAlerts,
      highRiskAlerts,
      dailyDigest,
      currency,
      numberFormat,
      soundEnabled,
      refreshInterval,
      lastSaved: new Date().toISOString()
    };

    localStorage.setItem('revpulse_user_settings', JSON.stringify(payload));

    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }, 400);
  };

  const merchantWorkspaceId = profile?.merchant?.workspaceId || 'ws_revpulse_prod_01';

  return (
    <div className="space-y-6 max-w-5xl mx-auto select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Account & Merchant Preferences</h1>
          <p className="text-xs text-slate-400">Manage user identity, security controls, webhook alerts, and platform behavior</p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-lg animate-in fade-in duration-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Preferences saved successfully!</span>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation Tabs */}
        <div className="w-full md:w-56 shrink-0 flex flex-col gap-1.5 text-xs font-medium">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-left transition-all ${
              activeTab === 'profile'
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" /> Profile & Identity
          </button>
          
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-left transition-all ${
              activeTab === 'security'
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" /> Security & 2FA
          </button>
          
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-left transition-all ${
              activeTab === 'notifications'
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>
          
          <button 
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-left transition-all ${
              activeTab === 'preferences'
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500 font-semibold'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Paintbrush className="w-4 h-4" /> Interface Preferences
          </button>
        </div>

        {/* Settings Tab Content */}
        <div className="flex-1 space-y-5">
          {/* TAB 1: Profile & Identity */}
          {activeTab === 'profile' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
                <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
                  <span>User Profile Information</span>
                  <span className="text-[11px] font-mono text-blue-400 font-normal">Role: Administrator</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">First Name</label>
                    <input 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)} 
                      className="input-field h-8" 
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Last Name</label>
                    <input 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)} 
                      className="input-field h-8" 
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="text-slate-400 block mb-1 font-medium">Email Address</label>
                  <input 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    type="email" 
                    className="input-field h-8" 
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
                <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2">
                  Merchant Workspace Configuration
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Company / Merchant Name</label>
                    <input 
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)} 
                      className="input-field h-8" 
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Workspace Reference ID</label>
                    <input 
                      value={merchantWorkspaceId} 
                      readOnly 
                      className="input-field h-8 font-mono text-slate-400 bg-slate-950/60" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Security & 2FA */}
          {activeTab === 'security' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
                <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
                  <span>Two-Factor Authentication (2FA)</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    twoFactorEnabled 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {twoFactorEnabled ? 'PROTECTED (ACTIVE)' : 'DISABLED'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <div>
                    <div className="font-semibold text-slate-200">Require OTP on Financial Decisions</div>
                    <div className="text-[11px] text-slate-400">Enforce OTP confirmation for case approvals exceeding ₹50,000</div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${twoFactorEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${twoFactorEnabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
                <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2">
                  Session & Authentication Credentials
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">New Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field h-8" 
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Inactivity Session Timeout</label>
                    <select 
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="input-field h-8 text-xs bg-slate-950"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes (Recommended)</option>
                      <option value="60">1 Hour</option>
                      <option value="120">2 Hours</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
                <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2">
                  Operational Alerts & Webhook Triggers
                </div>

                <div className="space-y-3.5 text-xs divide-y divide-slate-800/60">
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="font-semibold text-slate-200">Email Alerts on High-Risk Recovery Failure</div>
                      <div className="text-[11px] text-slate-400">Immediate email when a high-value payment retry is exhausted</div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setEmailAlerts(!emailAlerts)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${emailAlerts ? 'bg-blue-600' : 'bg-slate-700'}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${emailAlerts ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <div className="font-semibold text-slate-200">Slack / Webhook Event Dispatch</div>
                      <div className="text-[11px] text-slate-400">Broadcast payment recovery updates to connected Slack channel</div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSlackAlerts(!slackAlerts)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${slackAlerts ? 'bg-blue-600' : 'bg-slate-700'}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${slackAlerts ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <div className="font-semibold text-slate-200">Human-in-the-Loop Threshold Alerts</div>
                      <div className="text-[11px] text-slate-400">Notify Finance Manager when transaction exceeds ₹50,000 threshold</div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setHighRiskAlerts(!highRiskAlerts)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${highRiskAlerts ? 'bg-blue-600' : 'bg-slate-700'}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${highRiskAlerts ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <div className="font-semibold text-slate-200">Daily Revenue Summary Digest</div>
                      <div className="text-[11px] text-slate-400">Daily 09:00 AM summary of recovered capital & leakage prevented</div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setDailyDigest(!dailyDigest)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${dailyDigest ? 'bg-blue-600' : 'bg-slate-700'}`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${dailyDigest ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Interface Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
                <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2">
                  Display & Regional Formatting
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Default Display Currency</label>
                    <select 
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="input-field h-8 text-xs bg-slate-950"
                    >
                      <option value="INR">₹ INR (Indian Rupee)</option>
                      <option value="USD">$ USD (US Dollar)</option>
                      <option value="EUR">€ EUR (Euro)</option>
                      <option value="GBP">£ GBP (British Pound)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Numeric Number System</label>
                    <select 
                      value={numberFormat}
                      onChange={(e) => setNumberFormat(e.target.value)}
                      className="input-field h-8 text-xs bg-slate-950"
                    >
                      <option value="indian">Lakhs & Crores (e.g. ₹7.18 Cr)</option>
                      <option value="international">Millions & Billions (e.g. $71.8M)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-medium">Telemetry Poll Interval</label>
                    <select 
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(e.target.value)}
                      className="input-field h-8 text-xs bg-slate-950"
                    >
                      <option value="5">Realtime (Every 5s)</option>
                      <option value="10">Standard (Every 10s)</option>
                      <option value="30">Eco Mode (Every 30s)</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-center">
                    <label className="text-slate-400 block mb-1 font-medium">Audio Notifications</label>
                    <div className="flex items-center justify-between bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
                      <span className="text-slate-300">Play chime on revenue recovery</span>
                      <button 
                        type="button"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`w-9 h-5 rounded-full transition-colors relative ${soundEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.7 transition-transform ${soundEnabled ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Button */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-500">
              Preferences apply immediately across your active merchant session.
            </span>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save Account Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
