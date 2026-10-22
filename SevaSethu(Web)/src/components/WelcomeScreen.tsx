import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HeartPulse,
  Users,
  ClipboardList,
  Stethoscope,
  ArrowRight,
  ShieldCheck,
  Radio,
  WifiOff,
  Building2,
  PhoneCall,
  ChevronRight,
  CheckCircle2,
  FileText,
  Activity,
  Award,
} from "lucide-react";
import {
  NationalEmblem,
  TricolorRibbon,
  GovTopBar,
  GovFooterBar,
  AshokaChakra,
} from "./GovEmblem";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [selectedPillar, setSelectedPillar] = useState<number>(0);
  const [lang, setLang] = useState("English");

  const pillars = [
    {
      icon: WifiOff,
      title: "Offline-First VitalPack™",
      tag: "Sub-Centre & Tribal Care",
      desc: "Zero-bandwidth clinical telemetry. ASHA workers collect patient vitals offline; our engine prioritizes emergency packets for immediate sync when connectivity is restored.",
      stat: "< 2 KB Payload",
      badge: "Red-Yellow-Green Protocol",
    },
    {
      icon: Radio,
      title: "Indic Multilingual Triage",
      tag: "Speech & NLP Extraction",
      desc: "Voice-driven clinical capture in Hindi, Tamil, Telugu, and English. Automated entity extraction mapping symptoms to standardized SNOMED CT and ICD-10 codes.",
      stat: "4+ Regional Dialects",
      badge: "IndicConformer AI",
    },
    {
      icon: Building2,
      title: "Capacity-Aware Referrals",
      tag: "Tertiary Network Link",
      desc: "Real-time bed, ICU, and specialist visibility across District Hospitals and Medical Colleges. Prevents futile transfers and pre-notifies emergency trauma teams.",
      stat: "Live Bed Telemetry",
      badge: "Counter-Referral Loop",
    },
    {
      icon: Activity,
      title: "Unified PHC Command",
      tag: "Medical Officer Workspace",
      desc: "Centralized EHR with ABHA/Ayushman Bharat ID integration, automated follow-up intelligence, and one-touch SOS incident command for maternal and pediatric distress.",
      stat: "100% ABHA Compliant",
      badge: "ABDM M1 / M2 / M3",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-slate-900 flex flex-col selection:bg-amber-200 selection:text-slate-900 overflow-x-hidden">
      {/* 1. Official Government of India Top Utility Bar */}
      <GovTopBar currentLang={lang} onLangChange={setLang} />

      {/* 2. Main Portal Header Bar */}
      <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo & National Emblem Identity */}
          <div className="flex items-center gap-3 md:gap-5">
            <NationalEmblem className="h-11 md:h-13 w-auto text-slate-800 flex-shrink-0" />
            <div className="h-10 w-px bg-slate-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <img
                src="/sevasetu-logo.png"
                alt="SeVaSetu Official Logo"
                className="h-10 md:h-12 w-auto object-contain drop-shadow-xs"
              />
              <div className="hidden lg:block pl-2 border-l border-slate-200">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 block leading-tight">
                  National Health Mission
                </span>
                <span className="text-[11px] font-semibold text-slate-700 block leading-tight">
                  Primary Health Centre Portal
                </span>
              </div>
            </div>
          </div>

          {/* Right Action & Trust Badges */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-[10.5px] font-bold text-[#0A2540] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Ayushman Bharat Certified
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                SIH Problem ID: 26133
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onComplete}
              className="bg-[#0A2540] hover:bg-[#1B4F8A] text-white px-4 md:px-5 py-2.5 rounded-lg text-xs md:text-sm font-semibold tracking-wide flex items-center gap-2 shadow-sm transition-all cursor-pointer border border-[#0A2540]"
            >
              <span>Portal Sign In</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section with UX Motion & Indian Govt Aesthetic */}
      <section className="relative bg-gradient-to-b from-[#0A2540] via-[#103157] to-[#164273] text-white py-12 md:py-20 px-4 overflow-hidden">
        {/* Subtle Ashoka Chakra watermark animation */}
        <div className="absolute -right-20 -bottom-20 md:right-10 md:bottom-2 opacity-[0.06] pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          >
            <AshokaChakra className="w-96 h-96 text-white" />
          </motion.div>
        </div>

        {/* Ambient Tricolor Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="lg:col-span-7 space-y-6 text-left"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-[11px] font-medium tracking-wide">
                <span className="w-2 h-2 rounded-full bg-[#FF9933] animate-ping" />
                <span className="text-amber-300 font-semibold">Government of India Initiative</span>
                <span className="opacity-40">·</span>
                <span className="text-slate-200">Smart India Hackathon</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
                Empowering Rural Healthcare from{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-300">
                  Grassroots to Hospitals
                </span>
              </h1>

              <p className="text-slate-200 text-sm md:text-base leading-relaxed max-w-2xl font-normal">
                SeVaSetu bridges over 28,000+ ASHA community workers with Primary Health
                Centres and District Hospitals. Featuring intelligent offline-first telemetry,
                multilingual clinical speech capture, and capacity-aware emergency referral routing.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(255, 153, 51, 0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onComplete}
                  className="bg-gradient-to-r from-[#FF9933] to-[#E68A00] text-slate-950 font-bold px-6 py-3.5 rounded-lg text-sm md:text-base flex items-center gap-2.5 shadow-lg cursor-pointer transition-all hover:brightness-105"
                >
                  <span>Enter SeVaSetu Portal</span>
                  <ArrowRight className="w-5 h-5 text-slate-950" />
                </motion.button>

                <button
                  onClick={() => {
                    const el = document.getElementById("pillars-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-white/10 hover:bg-white/20 border border-white/25 text-white font-medium px-5 py-3.5 rounded-lg text-sm flex items-center gap-2 transition cursor-pointer backdrop-blur-xs"
                >
                  <span>Explore Architecture</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              </div>

              {/* National Compliance Badges */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-6 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>ABDM Milestone M1 / M2 / M3</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>FHIR R4 Standardized</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>256-Bit AES Encryption</span>
                </div>
              </div>
            </motion.div>

            {/* Right Interactive Portal Preview Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="lg:col-span-5"
            >
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/40 text-slate-800">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs font-mono text-slate-500 ml-2">
                      PHC Tele-Command v2.5
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Live Syncing
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      RED
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-red-900">Emergency Eclampsia Alert</p>
                        <span className="text-[10px] font-mono text-red-700">2 min ago</span>
                      </div>
                      <p className="text-[11px] text-red-800 mt-0.5">
                        ASHA Sunita Devi · Patient: Priya Kumari (24y) · BP 172/108
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] bg-red-200/80 text-red-900 px-2 py-0.5 rounded font-semibold">
                          PHC Ambulance Dispatched
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono">ETA: 14 min</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      PHC
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900">Danapur Block PHC Queue</p>
                        <span className="text-[10px] text-emerald-700 font-bold">● 4 Doctors Active</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Today's Outpatients: 142 · Referrals in Transit: 3 · ANC Visits: 28
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      ABHA
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-amber-900">Ayushman Bharat Health Account</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Direct sync enabled with National Health Stack and eSanjeevani.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 text-center">
                  <button
                    onClick={onComplete}
                    className="w-full bg-[#0A2540] hover:bg-[#1B4F8A] text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
                  >
                    Launch Doctor & Admin Workstations →
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Live Telemetry & National Impact Ribbon */}
      <section className="bg-white border-y border-slate-200 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="border-r border-slate-200 last:border-0 pr-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight">
                1,450+
              </div>
              <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mt-1">
                Connected PHCs & CHCs
              </div>
            </div>

            <div className="border-r border-slate-200 last:border-0 pr-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#1B4F8A] tracking-tight">
                28,400+
              </div>
              <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mt-1">
                Grassroot ASHA Caretakers
              </div>
            </div>

            <div className="border-r border-slate-200 last:border-0 pr-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#165C46] tracking-tight">
                99.98%
              </div>
              <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mt-1">
                Emergency Triage Sync
              </div>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#B91C1C] tracking-tight">
                1.2M+
              </div>
              <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mt-1">
                Rural Citizens Supported
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Core Architectural Pillars Section */}
      <section id="pillars-section" className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1B4F8A] text-[11px] font-bold uppercase tracking-wider mb-3">
            <span>Engineering Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Purpose-Built for India’s Public Healthcare Realities
          </h2>
          <p className="text-slate-600 text-sm mt-3">
            Designed under Ministry of Health and Family Welfare guidelines to solve the
            bandwidth, language, and specialist constraints in rural Indian primary care.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            const isSelected = selectedPillar === idx;
            return (
              <motion.div
                key={pillar.title}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedPillar(idx)}
                className={`rounded-xl p-6 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-white border-[#1B4F8A] shadow-md ring-2 ring-[#1B4F8A]/20"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-lg bg-[#E8F1FA] text-[#1B4F8A] flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {pillar.stat}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold tracking-wider uppercase text-amber-700 block mb-1">
                    {pillar.tag}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {pillar.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-slate-500">
                    {pillar.badge}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#1B4F8A]" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 6. Ready to Serve Banner */}
      <section className="bg-[#EBF3FB] border-y border-[#D0E2F4] py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <NationalEmblem className="h-12 w-auto text-slate-800 mx-auto" />
          <h3 className="text-2xl font-bold text-[#0A2540] tracking-tight">
            Join the SeVaSetu Healthcare Network
          </h3>
          <p className="text-sm text-slate-700 max-w-xl mx-auto leading-relaxed">
            Authorized PHC Medical Officers, Doctors, and District Administrators can access
            the workstation with their verified credentials or official ABHA ID.
          </p>

          <div className="pt-2 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={onComplete}
              className="bg-[#0A2540] hover:bg-[#1B4F8A] text-white px-8 py-3.5 rounded-lg text-sm font-bold flex items-center gap-3 shadow-md cursor-pointer transition"
            >
              <span>Access PHC Workstation</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </motion.button>
          </div>
        </div>
      </section>

      {/* 7. Official Indian Government Footer Bar */}
      <GovFooterBar />
    </div>
  );
}
