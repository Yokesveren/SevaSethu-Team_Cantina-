import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Building2,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileBadge,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ViewType } from "../types";
import {
  NationalEmblem,
  TricolorRibbon,
  GovTopBar,
  GovFooterBar,
  AshokaChakra,
} from "../components/GovEmblem";

type PortalType = "selection" | "admin" | "doctor";
type AuthMode = "login" | "register";

export default function Login({
  onNavigate,
  onBackToWelcome,
}: {
  onNavigate: (view: ViewType) => void;
  onBackToWelcome: () => void;
}) {
  const [portal, setPortal] = useState<PortalType>("selection");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [emailOrId, setEmailOrId] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaCode, setCaptchaCode] = useState("7H9K");
  const [captchaError, setCaptchaError] = useState(false);
  const [autofillSuccess, setAutofillSuccess] = useState(false);

  const { login, error, registerAdminAccount, addDoctorRegistrationRequest } = useAuth();

  const generateCaptcha = () => {
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let res = "";
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(res);
    setCaptchaAnswer("");
    setCaptchaError(false);
  };

  const handlePortalSelect = (type: PortalType) => {
    setPortal(type);
    setAuthMode("login");
    setCaptchaAnswer("");
    setCaptchaError(false);
    if (type === "admin") {
      setEmailOrId("ADM-001");
      setPassword("admin123");
    } else if (type === "doctor") {
      setEmailOrId("DOC-PHC-0001");
      setPassword("doctor123");
    }
  };

  const handleAutofill = (type: "admin" | "doctor") => {
    if (type === "admin") {
      setEmailOrId("ADM-001");
      setPassword("admin123");
    } else {
      setEmailOrId("DOC-PHC-0001");
      setPassword("doctor123");
    }
    setCaptchaAnswer(captchaCode);
    setAutofillSuccess(true);
    setTimeout(() => setAutofillSuccess(false), 2000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (portal === "admin") {
        registerAdminAccount(
          fullName || "PHC Administrator",
          emailOrId || "admin@demo.sevasetu.in",
          password || "admin123"
        );
        setAuthMode("login");
        setEmailOrId(emailOrId || "admin@demo.sevasetu.in");
        setPassword("admin123");
        return;
      }

      if (portal === "doctor") {
        addDoctorRegistrationRequest({
          id: `REQ-${Date.now()}`,
          name: fullName || "Doctor Applicant",
          email: emailOrId || `doctor${Date.now()}@phc.in`,
          mobile: "+91 98765 43210",
          specialization: "General Medicine",
          status: "Pending",
          createdAt: new Date(),
        });
        setAuthMode("login");
        setEmailOrId("");
        setPassword("");
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaAnswer.toUpperCase() !== captchaCode.toUpperCase()) {
      setCaptchaError(true);
      return;
    }
    setCaptchaError(false);
    setIsLoading(true);
    try {
      await login(emailOrId, password);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-slate-900 flex flex-col selection:bg-amber-200 selection:text-slate-900">
      {/* 1. Official Government Top Bar */}
      <GovTopBar />

      {/* 2. Authentication Canvas */}
      <div className="flex-1 flex flex-col justify-center items-center py-8 px-4 relative overflow-hidden">
        {/* Subtle background Ashoka watermark */}
        <div className="absolute opacity-[0.03] pointer-events-none -right-16 -top-16">
          <AshokaChakra className="w-[500px] h-[500px] text-[#0A2540]" />
        </div>

        {/* Central Govt Application Card */}
        <div className="w-full max-w-lg relative z-10">
          {/* Top Logo & Government Emblem Header Card */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-t-2xl border-x border-t border-slate-200 p-6 text-center shadow-xs"
          >
            <div className="flex items-center justify-center gap-4 mb-3">
              <NationalEmblem className="h-14 w-auto text-slate-800 flex-shrink-0" />
              <div className="h-10 w-px bg-slate-200" />
              <img
                src="/sevasetu-logo.png"
                alt="SeVaSetu Official Logo"
                className="h-11 w-auto object-contain"
              />
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-[10.5px] font-bold text-slate-700 tracking-wider uppercase mb-1">
              Primary Health Centre Management Portal
            </div>
            <p className="text-xs text-slate-500 font-medium">
              National Health Mission · Ministry of Health & Family Welfare, Govt. of India
            </p>
          </motion.div>

          <TricolorRibbon className="h-1 w-full" />

          {/* Body Box */}
          <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-6 sm:p-8 shadow-xl">
            <AnimatePresence mode="wait">
              {portal === "selection" ? (
                /* Portal / Role Selection Screen */
                <motion.div
                  key="portal-selection"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                        Select Official Workstation
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Choose your designated role to enter the secure PHC terminal
                      </p>
                    </div>
                    <button
                      onClick={onBackToWelcome}
                      className="text-xs text-[#1B4F8A] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Home
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Admin Portal Card */}
                    <motion.button
                      whileHover={{ scale: 1.015, y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => handlePortalSelect("admin")}
                      className="text-left p-5 rounded-xl border border-slate-200 hover:border-[#1B4F8A] bg-slate-50/70 hover:bg-blue-50/40 transition-all shadow-xs group cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-[#0A2540] text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-[#1B4F8A] transition-colors">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm md:text-base group-hover:text-[#1B4F8A] transition-colors">
                                PHC Administration
                              </h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded">
                                Role: ADMIN
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              Manage Medical Officers, ASHA workforce, pharmaceutical stock, and district HMIS reporting.
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-[#1B4F8A] group-hover:translate-x-1 transition-all mt-1 flex-shrink-0" />
                      </div>
                    </motion.button>

                    {/* Doctor Portal Card */}
                    <motion.button
                      whileHover={{ scale: 1.015, y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => handlePortalSelect("doctor")}
                      className="text-left p-5 rounded-xl border border-slate-200 hover:border-emerald-700 bg-slate-50/70 hover:bg-emerald-50/40 transition-all shadow-xs group cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-[#165C46] text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:bg-emerald-700 transition-colors">
                            <Stethoscope className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm md:text-base group-hover:text-[#165C46] transition-colors">
                                Medical Officer & Doctor
                              </h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                                Role: DOCTOR
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              Real-time clinical triage, OPD patient queue, e-prescriptions, ABHA EHR, and emergency SOS handling.
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all mt-1 flex-shrink-0" />
                      </div>
                    </motion.button>
                  </div>

                  {/* Security Notice */}
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <span>
                      Restricted Government of India Healthcare System. All login sessions are audited under HMIS and IT Act guidelines.
                    </span>
                  </div>
                </motion.div>
              ) : (
                /* Login / Registration Screen */
                <motion.div
                  key="auth-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {/* Top Mode Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPortal("selection")}
                      className="text-xs text-[#1B4F8A] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Change Role
                    </button>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          portal === "admin"
                            ? "bg-[#0A2540] text-white"
                            : "bg-[#165C46] text-white"
                        }`}
                      >
                        {portal === "admin" ? "PHC Admin Workstation" : "Medical Officer Workstation"}
                      </span>
                    </div>
                  </div>

                  {/* Mode Pill Toggle: Sign In vs Register */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setAuthMode("login")}
                      className={`py-2 rounded-md transition-all cursor-pointer ${
                        authMode === "login"
                          ? "bg-white text-[#0A2540] shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Official Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode("register")}
                      className={`py-2 rounded-md transition-all cursor-pointer ${
                        authMode === "register"
                          ? "bg-white text-[#0A2540] shadow-xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {portal === "admin" ? "Register Admin" : "Apply as Doctor"}
                    </button>
                  </div>

                  {/* Quick-Fill Demo Bar */}
                  {authMode === "login" && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-50/90 border border-blue-200 rounded-lg p-3 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Sparkles className="w-4 h-4 text-[#1B4F8A] flex-shrink-0" />
                        <span className="text-slate-700 truncate">
                          Quick Demo: <strong className="font-mono text-[#1B4F8A]">{portal === "admin" ? "ADM-001" : "DOC-PHC-0001"}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAutofill(portal === "admin" ? "admin" : "doctor")}
                        className="px-2.5 py-1 bg-[#1B4F8A] text-white text-[11px] font-bold rounded hover:bg-[#143D6E] transition cursor-pointer flex-shrink-0 shadow-xs"
                      >
                        {autofillSuccess ? "Filled!" : "⚡ Quick Fill"}
                      </button>
                    </motion.div>
                  )}

                  {/* Form */}
                  {authMode === "register" ? (
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Full Name with Designation
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1B4F8A] focus:outline-none"
                            placeholder={portal === "admin" ? "Dr. Rajesh Verma (BHO)" : "Dr. Sunita Sharma (MBBS, DGO)"}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Official Government Email / ID
                        </label>
                        <div className="relative">
                          <FileBadge className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={emailOrId}
                            onChange={(e) => setEmailOrId(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1B4F8A] focus:outline-none"
                            placeholder={portal === "admin" ? "admin@gov.in or ADM-001" : "doctor@phc.gov.in"}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Security Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1B4F8A] focus:outline-none"
                            placeholder="Create a strong passphrase"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#0A2540] hover:bg-[#1B4F8A] text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span>
                            {portal === "admin" ? "Complete Admin Setup" : "Submit Doctor Registration"}
                          </span>
                        )}
                      </motion.button>
                    </form>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          {portal === "admin" ? "Administrator ID / Gov Email" : "Doctor ID / Official Email"}
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={emailOrId}
                            onChange={(e) => setEmailOrId(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1B4F8A] focus:outline-none font-medium"
                            placeholder={portal === "admin" ? "ADM-001 or admin@demo.sevasetu.in" : "DOC-PHC-0001"}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Passcode / Password
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1B4F8A] focus:outline-none font-medium"
                            placeholder="Enter account password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Government Security Captcha Box */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <label className="block text-[10.5px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                          Security Verification (Captcha)
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-200/90 border border-slate-300 px-3 py-1.5 rounded font-mono font-extrabold text-base tracking-widest select-none text-slate-800 line-through decoration-slate-400">
                            {captchaCode}
                          </div>
                          <button
                            type="button"
                            onClick={generateCaptcha}
                            className="text-slate-500 hover:text-slate-800 p-1.5 rounded hover:bg-slate-200 transition cursor-pointer"
                            title="Refresh Captcha"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <input
                            type="text"
                            value={captchaAnswer}
                            onChange={(e) => setCaptchaAnswer(e.target.value)}
                            placeholder="Enter code"
                            className="w-28 uppercase text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono font-bold focus:ring-2 focus:ring-[#1B4F8A] focus:outline-none"
                            required
                          />
                        </div>
                        {captchaError && (
                          <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Incorrect Captcha code. Please try again.
                          </p>
                        )}
                      </div>

                      {error && (
                        <div className="text-red-700 text-xs p-2.5 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <span>{error}</span>
                        </div>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#0A2540] hover:bg-[#1B4F8A] text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>Sign In to {portal === "admin" ? "Admin" : "Doctor"} Terminal</span>
                          </>
                        )}
                      </motion.button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Security Assurance */}
          <div className="mt-4 text-center text-[10.5px] text-slate-500 space-y-1">
            <p className="flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>256-Bit SSL/TLS Certified · National Health Stack (MoHFW)</span>
            </p>
            <p className="text-[10px] text-slate-400">
              Compliant with Guidelines for Indian Government Websites (GIGW 3.0)
            </p>
          </div>
        </div>
      </div>

      {/* 3. Official Indian Government Footer Bar */}
      <GovFooterBar />
    </div>
  );
}
