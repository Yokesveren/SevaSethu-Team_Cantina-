import { useState } from "react";
import { 
  User as UserIcon, 
  Building, 
  Shield, 
  Globe, 
  Bell, 
  ChevronRight, 
  Key, 
  Smartphone, 
  History, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  LogOut,
  Laptop,
  Tablet,
  Save,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  const [active, setActive] = useState("security");

  // Security tab states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [autoLockTimeout, setAutoLockTimeout] = useState("15");
  const [encryptionAudit, setEncryptionAudit] = useState(true);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [activeSessions, setActiveSessions] = useState([
    { id: "sess-1", device: "PHC Desktop Station (Primary)", ip: "192.168.1.104", location: "Patna PHC, Ward 4", lastActive: "Active Now", current: true, icon: Laptop },
    { id: "sess-2", device: "Samsung Galaxy Tab A8 (Field Unit)", ip: "103.21.144.22", location: "Danapur Sub-Centre 2", lastActive: "18 mins ago", current: false, icon: Tablet },
  ]);

  // Profile states
  const [profileName, setProfileName] = useState(user?.name || (user?.role === "ADMIN" ? "Shri Rajesh Verma" : "Dr. Aravind Kumar"));
  const [profileEmail, setProfileEmail] = useState(user?.email || (user?.role === "ADMIN" ? "admin@sevasetu.in" : "doctor@demo.sevasetu.in"));
  const [profileMobile, setProfileMobile] = useState("+91 94432 18902");
  const [profileSaved, setProfileSaved] = useState(false);

  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  // Notification states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsCriticalAlerts, setSmsCriticalAlerts] = useState(true);
  const [sosBroadcast, setSosBroadcast] = useState(true);

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordMessage({ text: "Please enter your current password.", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ text: "New password must be at least 6 characters.", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: "New passwords do not match.", type: "error" });
      return;
    }
    setPasswordMessage({ text: "Password updated successfully!", type: "success" });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordMessage(null), 4000);
  };

  const handleRevokeOtherSessions = () => {
    setActiveSessions(prev => prev.filter(s => s.current));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-phc-text text-2xl">Settings & Configuration</h1>
          <p className="text-sm text-phc-muted">Manage system security, credentials, user profiles, and PHC preferences</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200">
          <Shield size={14} />
          <span>ABDM & DISHA Compliant System</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* Navigation Sidebar */}
        <aside className="bg-phc-surface border border-phc-border rounded-lg p-2 space-y-1 h-fit">
          {[
            { id: "security", label: "Security & Credentials", icon: Shield, badge: "Important" },
            { id: "profile", label: "User Profile", icon: UserIcon },
            { id: "phc", label: "PHC Information", icon: Building },
            { id: "language", label: "Language & Regional", icon: Globe },
            { id: "notifications", label: "Alert Notifications", icon: Bell },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-[13px] font-display font-medium transition ${
                active === item.id 
                  ? "bg-phc-blue-light text-phc-blue font-semibold" 
                  : "text-phc-muted hover:bg-phc-bg hover:text-phc-text"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={16} />
                <span>{item.label}</span>
              </div>
              {item.badge && active !== item.id && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                  {item.badge}
                </span>
              )}
              {active === item.id && <ChevronRight size={14} />}
            </button>
          ))}
        </aside>

        {/* Main Settings Body */}
        <main className="bg-phc-surface border border-phc-border rounded-lg p-6 min-h-[520px]">
          {/* 1. SECURITY TAB */}
          {active === "security" && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Key size={18} className="text-phc-blue" />
                  <h2 className="font-display font-bold text-lg text-phc-text">Security & Access Management</h2>
                </div>
                <p className="text-xs text-phc-muted">Configure your password, two-factor authentication, and monitor active logins</p>
              </div>

              {/* Password Section */}
              <div className="border border-phc-border rounded-lg p-5 bg-phc-bg/40">
                <h3 className="text-sm font-semibold text-phc-text flex items-center gap-2 mb-3">
                  <Lock size={15} className="text-phc-blue" />
                  Change Account Password
                </h3>
                
                {passwordMessage && (
                  <div className={`p-3 rounded text-xs mb-4 flex items-center gap-2 border ${
                    passwordMessage.type === "success" 
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                      : "bg-red-50 text-red-800 border-red-200"
                  }`}>
                    {passwordMessage.type === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                    {passwordMessage.text}
                  </div>
                )}

                <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-[11px] font-bold text-phc-muted uppercase mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border rounded-lg bg-phc-surface text-sm focus:ring-2 focus:ring-phc-blue focus:outline-none pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-phc-muted hover:text-phc-text"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-phc-muted uppercase mb-1">New Password</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border rounded-lg bg-phc-surface text-sm focus:ring-2 focus:ring-phc-blue focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-phc-muted uppercase mb-1">Confirm Password</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 border rounded-lg bg-phc-surface text-sm focus:ring-2 focus:ring-phc-blue focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-phc-blue text-white rounded-lg text-xs font-semibold hover:bg-phc-blue-dark transition"
                    >
                      Update Password
                    </button>
                    <span className="text-[11px] text-phc-muted">Must be at least 6 characters</span>
                  </div>
                </form>
              </div>

              {/* 2FA & Session Security Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 2FA Card */}
                <div className="border border-phc-border rounded-lg p-5 bg-phc-bg/40">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-phc-text flex items-center gap-2">
                        <Smartphone size={15} className="text-phc-blue" />
                        Two-Factor Authentication (2FA)
                      </h3>
                      <p className="text-xs text-phc-muted mt-1">Require an Aadhaar/SMS OTP for sensitive clinical record exports</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        twoFactorEnabled ? "bg-phc-blue" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-phc-border flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${twoFactorEnabled ? "bg-emerald-500" : "bg-amber-500"}`} />
                    <span className="text-xs font-medium text-phc-text">
                      {twoFactorEnabled ? "2FA is Active via SMS (+91 94432 •••••)" : "2FA is currently Disabled"}
                    </span>
                  </div>
                </div>

                {/* Auto-Lock Card */}
                <div className="border border-phc-border rounded-lg p-5 bg-phc-bg/40">
                  <h3 className="text-sm font-semibold text-phc-text flex items-center gap-2 mb-1">
                    <History size={15} className="text-phc-blue" />
                    Inactivity Session Lockout
                  </h3>
                  <p className="text-xs text-phc-muted mb-3">Automatically lock screen when PHC terminal is unattended</p>
                  <select
                    value={autoLockTimeout}
                    onChange={(e) => setAutoLockTimeout(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-phc-surface text-xs focus:ring-2 focus:ring-phc-blue focus:outline-none"
                  >
                    <option value="5">5 Minutes (Recommended for high-traffic desks)</option>
                    <option value="15">15 Minutes (Standard PHC Duty)</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">1 Hour</option>
                  </select>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="border border-phc-border rounded-lg p-5 bg-phc-bg/40">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-phc-text flex items-center gap-2">
                      <Laptop size={15} className="text-phc-blue" />
                      Active Devices & Logged In Sessions
                    </h3>
                    <p className="text-xs text-phc-muted mt-0.5">Manage devices currently authenticated with your PHC credentials</p>
                  </div>
                  {activeSessions.length > 1 && (
                    <button
                      onClick={handleRevokeOtherSessions}
                      className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1.5 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition"
                    >
                      <LogOut size={13} />
                      Revoke Other Sessions
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {activeSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-phc-surface border border-phc-border rounded-lg text-xs">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-phc-blue rounded-lg">
                          <session.icon size={16} />
                        </div>
                        <div>
                          <div className="font-semibold text-phc-text flex items-center gap-2">
                            {session.device}
                            {session.current && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                                Current Session
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-phc-muted mt-0.5">
                            IP: {session.ip} • {session.location}
                          </div>
                        </div>
                      </div>
                      <span className="text-phc-muted text-[11px] font-mono">{session.lastActive}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Compliance & Role Level */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-700">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-phc-blue" />
                  <div>
                    <span className="font-semibold block">Access Role: {user?.role || "ADMINISTRATOR"}</span>
                    <span className="text-[11px] text-slate-500">Authorized for PHC Medical Records & Patient Triage Operations</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-mono text-[11px]">DISHA-Encrypted</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. USER PROFILE TAB */}
          {active === "profile" && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className="font-display font-bold text-lg text-phc-text mb-1">User Profile</h2>
                <p className="text-xs text-phc-muted">Update your medical personnel details and contact info</p>
              </div>

              {profileSaved && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  Profile updated successfully!
                </div>
              )}

              <div className="flex items-center gap-4 p-4 bg-phc-bg/50 border border-phc-border rounded-lg">
                <div className="w-16 h-16 rounded-full bg-phc-blue flex items-center justify-center text-white font-bold text-xl shadow-sm">
                  {profileName.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div className="space-y-1">
                  <div className="font-display font-bold text-base text-phc-text">{profileName}</div>
                  <div className="text-[12px] text-phc-muted">
                    {user?.role === "ADMIN" ? "PHC Administrator & Health Officer" : "Medical Officer / Doctor"}
                  </div>
                  <div className="text-[11px] font-mono text-phc-blue">ID: {user?.id || "ADM-001"}</div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-phc-muted uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={profileName} 
                    onChange={(e) => setProfileName(e.target.value)} 
                    className="w-full px-3 py-2 border rounded-lg bg-phc-surface text-sm" 
                    required 
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-phc-muted uppercase mb-1">Official Email</label>
                    <input 
                      type="email" 
                      value={profileEmail} 
                      onChange={(e) => setProfileEmail(e.target.value)} 
                      className="w-full px-3 py-2 border rounded-lg bg-phc-surface text-sm" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-phc-muted uppercase mb-1">Mobile Contact</label>
                    <input 
                      type="text" 
                      value={profileMobile} 
                      onChange={(e) => setProfileMobile(e.target.value)} 
                      className="w-full px-3 py-2 border rounded-lg bg-phc-surface text-sm" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-phc-muted uppercase mb-1">Assigned Designation</label>
                  <input 
                    readOnly 
                    value={user?.role === "ADMIN" ? "Primary Health Centre Administrator" : "Medical Officer (General Medicine)"} 
                    className="w-full px-3 py-2 border rounded-lg bg-phc-bg text-sm text-phc-muted cursor-not-allowed" 
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-phc-blue text-white rounded-lg text-xs font-semibold hover:bg-phc-blue-dark transition"
                >
                  <Save size={14} />
                  Save Profile Changes
                </button>
              </form>
            </div>
          )}

          {/* 3. PHC INFORMATION TAB */}
          {active === "phc" && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className="font-display font-bold text-lg text-phc-text mb-1">PHC Centre Information</h2>
                <p className="text-xs text-phc-muted">Primary Health Centre facility registration details</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-phc-muted uppercase mb-1">PHC Name</label>
                  <input readOnly value="Patna Rural Primary Health Centre" className="w-full px-3 py-2 border rounded-lg bg-phc-bg text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-phc-muted uppercase mb-1">Facility Registry Code (NIN)</label>
                    <input readOnly value="BR-PAT-PHC-042" className="w-full px-3 py-2 border rounded-lg bg-phc-bg text-sm font-mono" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-phc-muted uppercase mb-1">District / Block</label>
                    <input readOnly value="Patna / Danapur Block, Bihar" className="w-full px-3 py-2 border rounded-lg bg-phc-bg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-phc-muted uppercase mb-1">Affiliated Sub-Centres</label>
                  <div className="p-3 bg-phc-bg border rounded-lg text-xs space-y-1.5">
                    <div className="flex justify-between"><span>1. Danapur Rural Sub-Centre</span><span className="text-emerald-700 font-medium">Online</span></div>
                    <div className="flex justify-between"><span>2. Maner Health Wellness Post</span><span className="text-emerald-700 font-medium">Online</span></div>
                    <div className="flex justify-between"><span>3. Phulwari Sharif Health Wellness Centre</span><span className="text-emerald-700 font-medium">Online</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. LANGUAGE TAB */}
          {active === "language" && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className="font-display font-bold text-lg text-phc-text mb-1">Language & Regional Preferences</h2>
                <p className="text-xs text-phc-muted">Select portal and patient clinical sheet language</p>
              </div>
              <div className="space-y-3">
                {[
                  { id: "en", name: "English", desc: "Default medical terminology and UI" },
                  { id: "ta", name: "தமிழ் (Tamil)", desc: "தமிழ் இடைமுகம் மற்றும் நோயாளி தகவல்கள்" },
                  { id: "hi", name: "हिन्दी (Hindi)", desc: "हिन्दी इंटरफ़ेस और रोगी स्वास्थ्य डेटा" },
                ].map((lang) => (
                  <label key={lang.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-phc-bg/50">
                    <div>
                      <div className="font-semibold text-sm text-phc-text">{lang.name}</div>
                      <div className="text-xs text-phc-muted">{lang.desc}</div>
                    </div>
                    <input
                      type="radio"
                      name="language"
                      value={lang.id}
                      checked={selectedLanguage === lang.id}
                      onChange={() => setSelectedLanguage(lang.id)}
                      className="text-phc-blue"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 5. NOTIFICATIONS TAB */}
          {active === "notifications" && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h2 className="font-display font-bold text-lg text-phc-text mb-1">Alert & Notification Preferences</h2>
                <p className="text-xs text-phc-muted">Configure real-time alerts for critical patient triage and pharmacy shortages</p>
              </div>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 border rounded-lg bg-phc-bg/30 cursor-pointer">
                  <div>
                    <div className="font-semibold text-xs text-phc-text">Critical SOS & Triage Alerts</div>
                    <div className="text-[11px] text-phc-muted">Immediate push notification when Red-Triage is flagged</div>
                  </div>
                  <input type="checkbox" checked={sosBroadcast} onChange={e => setSosBroadcast(e.target.checked)} className="rounded text-phc-blue" />
                </label>
                <label className="flex items-center justify-between p-3 border rounded-lg bg-phc-bg/30 cursor-pointer">
                  <div>
                    <div className="font-semibold text-xs text-phc-text">SMS Emergency Dispatch</div>
                    <div className="text-[11px] text-phc-muted">Send automated SMS alert to on-duty Medical Officer</div>
                  </div>
                  <input type="checkbox" checked={smsCriticalAlerts} onChange={e => setSmsCriticalAlerts(e.target.checked)} className="rounded text-phc-blue" />
                </label>
                <label className="flex items-center justify-between p-3 border rounded-lg bg-phc-bg/30 cursor-pointer">
                  <div>
                    <div className="font-semibold text-xs text-phc-text">Inventory Stock Alert Emails</div>
                    <div className="text-[11px] text-phc-muted">Daily summary when essential drugs reach critical buffer</div>
                  </div>
                  <input type="checkbox" checked={emailAlerts} onChange={e => setEmailAlerts(e.target.checked)} className="rounded text-phc-blue" />
                </label>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

