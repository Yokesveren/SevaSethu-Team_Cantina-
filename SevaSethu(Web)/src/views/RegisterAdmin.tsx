import React, { useState } from "react";
import { motion } from "motion/react";
import { ShieldCheck, ArrowLeft, CheckCircle2, User, Mail, Lock } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ViewType } from "../types";
import { NationalEmblem, TricolorRibbon, GovTopBar, GovFooterBar } from "../components/GovEmblem";

export default function RegisterAdmin({ onNavigate }: { onNavigate: (view: ViewType) => void }) {
  const { registerAdminAccount } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    registerAdminAccount(name, email, password);
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-slate-900 flex flex-col selection:bg-amber-200 selection:text-slate-900">
      <GovTopBar />
      <div className="flex-1 flex flex-col justify-center items-center py-8 px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="bg-white rounded-t-2xl border-x border-t border-slate-200 p-6 text-center shadow-xs">
            <div className="flex items-center justify-center gap-3 mb-2">
              <NationalEmblem className="h-11 w-auto text-slate-800" />
              <div className="h-8 w-px bg-slate-200" />
              <img src="/sevasetu-logo.png" alt="SeVaSetu Logo" className="h-9 w-auto object-contain" />
            </div>
            <h1 className="font-bold text-lg text-slate-900">PHC Administrator Registration</h1>
            <p className="text-xs text-slate-500 mt-0.5">National Health Mission · Ministry of Health & Family Welfare</p>
          </div>

          <TricolorRibbon className="h-1 w-full" />

          {/* Card Body */}
          <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-6 sm:p-8 shadow-xl">
            <button 
              onClick={() => onNavigate("dashboard")} 
              className="mb-4 text-xs text-[#1B4F8A] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </button>

            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-emerald-50 text-emerald-900 rounded-xl text-center border border-emerald-200 space-y-2"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm">Account Registered Successfully!</p>
                <p className="text-xs text-emerald-700">Administrator access granted. Entering PHC command console...</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Full Name & Title</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1B4F8A] focus:outline-none" 
                      placeholder="Dr. Admin Officer (BHO)"
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Official Email / ID</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1B4F8A] focus:outline-none" 
                      placeholder="admin@phc.gov.in"
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Passcode</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1B4F8A] focus:outline-none" 
                      placeholder="Enter secure password"
                      required 
                    />
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit" 
                  className="w-full bg-[#0A2540] hover:bg-[#1B4F8A] text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Register & Authorize Account</span>
                </motion.button>
              </form>
            )}
          </div>
        </div>
      </div>
      <GovFooterBar />
    </div>
  );
}
