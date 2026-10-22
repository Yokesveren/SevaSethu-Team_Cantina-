import React, { useState } from "react";
import { motion } from "motion/react";
import { Stethoscope, ArrowLeft, CheckCircle2, User, Mail, Phone, Award, Lock } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ViewType } from "../types";
import { NationalEmblem, TricolorRibbon, GovTopBar, GovFooterBar } from "../components/GovEmblem";

export default function RegisterDoctor({ onNavigate }: { onNavigate: (view: ViewType) => void }) {
  const { addDoctorRegistrationRequest } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", mobile: "", specialization: "", password: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDoctorRegistrationRequest({
      id: `REQ-${Date.now()}`,
      ...formData,
      status: "Pending",
      createdAt: new Date(),
    });
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-slate-900 flex flex-col selection:bg-amber-200 selection:text-slate-900">
      <GovTopBar />
      <div className="flex-1 flex flex-col justify-center items-center py-8 px-4">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="bg-white rounded-t-2xl border-x border-t border-slate-200 p-6 text-center shadow-xs">
            <div className="flex items-center justify-center gap-3 mb-2">
              <NationalEmblem className="h-11 w-auto text-slate-800" />
              <div className="h-8 w-px bg-slate-200" />
              <img src="/sevasetu-logo.png" alt="SeVaSetu Logo" className="h-9 w-auto object-contain" />
            </div>
            <h1 className="font-bold text-lg text-slate-900">Medical Officer & Doctor Registration</h1>
            <p className="text-xs text-slate-500 mt-0.5">National Health Mission · Ministry of Health & Family Welfare</p>
          </div>

          <TricolorRibbon className="h-1 w-full" />

          {/* Body */}
          <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-6 sm:p-8 shadow-xl">
            <button 
              onClick={() => onNavigate("dashboard")} 
              className="mb-4 text-xs text-[#1B4F8A] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </button>

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-blue-50 text-blue-900 rounded-xl text-center border border-blue-200 space-y-3"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm">Application Submitted to PHC Administrator!</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Your credentials have been submitted for verification. Upon administrative review and approval, your Medical Officer ID will be activated for clinical triage access.
                </p>
                <button 
                  onClick={() => onNavigate("dashboard")} 
                  className="mt-2 px-5 py-2 bg-[#0A2540] hover:bg-[#1B4F8A] text-white text-xs font-bold rounded-lg transition"
                >
                  Return to Portal Login
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Full Name & Degree</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1B4F8A] focus:outline-none" 
                      placeholder="Dr. Sarah Johnson, MBBS" 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Official Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input 
                        type="email" 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1B4F8A] focus:outline-none" 
                        placeholder="doctor@phc.in" 
                        required 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Mobile (OTP Auth)</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input 
                        type="tel" 
                        value={formData.mobile} 
                        onChange={e => setFormData({...formData, mobile: e.target.value})} 
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1B4F8A] focus:outline-none" 
                        placeholder="+91 98765 43210" 
                        required 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Medical Specialization</label>
                  <div className="relative">
                    <Award className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="text" 
                      value={formData.specialization} 
                      onChange={e => setFormData({...formData, specialization: e.target.value})} 
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#1B4F8A] focus:outline-none" 
                      placeholder="General Medicine / Obstetrics / Pediatrics" 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Account Passcode</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input 
                      type="password" 
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
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
                  className="w-full bg-[#165C46] hover:bg-[#124b38] text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <Stethoscope className="w-4 h-4 text-emerald-300" />
                  <span>Submit Medical Registration Request</span>
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
