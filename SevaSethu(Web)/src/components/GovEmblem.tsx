import React from "react";

export function NationalEmblem({ className = "h-12 w-auto", showMotto = true }: { className?: string; showMotto?: boolean }) {
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox="0 0 120 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
        aria-label="National Emblem of India"
      >
        {/* Ashoka Lion Capital Vector Silhouette (Gov Standard Gold/Navy) */}
        <g fill="currentColor">
          {/* Central Lion Head */}
          <path d="M60 14 C56 14 53 17 53 21 C53 23 54 25 55 26 C52 27 50 30 50 34 C50 38 52 41 55 43 C54 44 53 46 53 48 C53 52 56 55 60 55 C64 55 67 52 67 48 C67 46 66 44 65 43 C68 41 70 38 70 34 C70 30 68 27 65 26 C66 25 67 23 67 21 C67 17 64 14 60 14 Z" />
          {/* Left Lion Head */}
          <path d="M42 22 C39 22 36 25 36 29 C36 31 37 33 38 34 C35 35 33 38 33 42 C33 46 35 49 38 51 C37 52 36 54 36 56 C36 60 39 63 43 63 C46 63 49 61 50 58 C48 55 47 51 47 47 C47 43 49 39 51 36 C49 34 47 31 46 28 C45 24 43 22 42 22 Z" opacity="0.95" />
          {/* Right Lion Head */}
          <path d="M78 22 C81 22 84 25 84 29 C84 31 83 33 82 34 C85 35 87 38 87 42 C87 46 85 49 82 51 C83 52 84 54 84 56 C84 60 81 63 77 63 C74 63 71 61 70 58 C72 55 73 51 73 47 C73 43 71 39 69 36 C71 34 73 31 74 28 C75 24 77 22 78 22 Z" opacity="0.95" />
          {/* Mane and Body Details */}
          <path d="M45 54 C42 58 40 64 40 70 C40 76 43 82 48 86 C51 84 55 83 60 83 C65 83 69 84 72 86 C77 82 80 76 80 70 C80 64 78 58 75 54 C72 58 66 61 60 61 C54 61 48 58 45 54 Z" />
          {/* Abacus Base / Pedestal */}
          <rect x="30" y="88" width="60" height="4" rx="1.5" />
          <rect x="25" y="93" width="70" height="15" rx="2" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
          {/* Relief figures on abacus: Galloping Horse & Bull & Dharma Chakra */}
          {/* Dharma Chakra on Abacus */}
          <circle cx="60" cy="100.5" r="5.5" stroke="currentColor" strokeWidth="1" fill="none" />
          <circle cx="60" cy="100.5" r="1.5" fill="currentColor" />
          {/* Left Galloping Horse hint */}
          <path d="M35 103 C34 100 37 98 40 98 C42 98 43 100 44 102 C43 103 41 104 39 104 C37 104 35 103 35 103 Z" />
          {/* Right Bull hint */}
          <path d="M85 103 C86 100 83 98 80 98 C78 98 77 100 76 102 C77 103 79 104 81 104 C83 104 85 103 85 103 Z" />
          {/* Inverted Lotus Base */}
          <path d="M22 110 C28 112 36 114 60 114 C84 114 92 112 98 110 C96 117 88 122 60 122 C32 122 24 117 22 110 Z" />
          <rect x="28" y="123" width="64" height="3" rx="1" />
        </g>
      </svg>
      {showMotto && (
        <span className="font-serif text-[9px] tracking-widest font-semibold uppercase text-center mt-0.5 text-slate-800 dark:text-slate-200">
          सत्यमेव जयते
        </span>
      )}
    </div>
  );
}

export function TricolorRibbon({ className = "h-1 w-full" }: { className?: string }) {
  return (
    <div className={`flex ${className}`}>
      <div className="flex-1 bg-[#FF9933]" />
      <div className="flex-1 bg-[#FFFFFF] border-y border-slate-200/50" />
      <div className="flex-1 bg-[#138808]" />
    </div>
  );
}

export function AshokaChakra({ className = "w-6 h-6 text-[#000080]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor">
      <circle cx="50" cy="50" r="46" strokeWidth="4" />
      <circle cx="50" cy="50" r="10" strokeWidth="4" />
      <circle cx="50" cy="50" r="3" fill="currentColor" />
      {[...Array(24)].map((_, i) => (
        <line
          key={i}
          x1="50"
          y1="50"
          x2={50 + 44 * Math.cos((i * 15 * Math.PI) / 180)}
          y2={50 + 44 * Math.sin((i * 15 * Math.PI) / 180)}
          strokeWidth="1.8"
        />
      ))}
    </svg>
  );
}

export function GovTopBar({
  onLangChange,
  currentLang = "English",
}: {
  onLangChange?: (lang: string) => void;
  currentLang?: string;
}) {
  return (
    <div className="bg-[#0A2540] text-white text-[11px] font-sans border-b border-white/10">
      <TricolorRibbon className="h-1 w-full" />
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium tracking-wide">
          <span className="text-[#FFB86C]">भारत सरकार</span>
          <span className="opacity-40">|</span>
          <span>GOVERNMENT OF INDIA</span>
          <span className="hidden md:inline opacity-40">|</span>
          <span className="hidden md:inline text-slate-300">
            स्वास्थ्य एवं परिवार कल्याण मंत्रालय (MoHFW)
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ABDM / HMIS LIVE
          </span>
          <span className="opacity-40">|</span>
          <div className="flex items-center gap-1 bg-white/10 rounded px-1.5 py-0.5 text-[10px]">
            <span className="opacity-75">Text:</span>
            <button
              onClick={() => {
                document.documentElement.style.fontSize = "90%";
              }}
              className="px-1 hover:text-[#FFB86C] font-semibold"
              title="Decrease Font Size"
            >
              A-
            </button>
            <button
              onClick={() => {
                document.documentElement.style.fontSize = "100%";
              }}
              className="px-1 hover:text-[#FFB86C] font-semibold"
              title="Reset Font Size"
            >
              A
            </button>
            <button
              onClick={() => {
                document.documentElement.style.fontSize = "110%";
              }}
              className="px-1 hover:text-[#FFB86C] font-semibold"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>
          <span className="opacity-40">|</span>
          <select
            value={currentLang}
            onChange={(e) => onLangChange?.(e.target.value)}
            className="bg-white/10 text-white text-[11px] rounded px-2 py-0.5 border border-white/20 focus:outline-none focus:ring-1 focus:ring-[#FF9933] cursor-pointer"
          >
            <option value="English" className="text-slate-900">English</option>
            <option value="हिन्दी" className="text-slate-900">हिन्दी</option>
            <option value="தமிழ்" className="text-slate-900">தமிழ்</option>
            <option value="मराठी" className="text-slate-900">मराठी</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export function GovFooterBar() {
  return (
    <footer className="bg-[#091D33] text-slate-300 text-xs py-6 border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <NationalEmblem className="h-9 w-auto text-amber-400" showMotto={false} />
              <div>
                <p className="font-bold text-white text-[11px] leading-tight">SeVaSetu PHC Portal</p>
                <p className="text-[10px] text-slate-400">National Health Mission (NHM)</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Bridging Rural Primary Healthcare, ASHA Grassroot Networks, and Specialist Tele-triage across India.
            </p>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold text-white uppercase tracking-wider mb-2">National Health Portals</h4>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li><a href="https://abdm.gov.in" target="_blank" rel="noreferrer" className="hover:text-[#FFB86C] transition">Ayushman Bharat Digital Mission (ABDM)</a></li>
              <li><a href="https://mohfw.gov.in" target="_blank" rel="noreferrer" className="hover:text-[#FFB86C] transition">Ministry of Health & Family Welfare</a></li>
              <li><a href="https://nhm.gov.in" target="_blank" rel="noreferrer" className="hover:text-[#FFB86C] transition">National Health Mission (NHM)</a></li>
              <li><a href="https://esanjeevani.in" target="_blank" rel="noreferrer" className="hover:text-[#FFB86C] transition">eSanjeevani Teleconsultation</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold text-white uppercase tracking-wider mb-2">Standards & Security</h4>
            <div className="space-y-1 text-[11px] text-slate-400">
              <p>• 256-Bit SSL/TLS Encryption</p>
              <p>• SNOMED CT & LOINC Standardized</p>
              <p>• FHIR R4 & ABDM Milestone M1/M2/M3</p>
              <p>• GIGW 3.0 Accessibility Compliant</p>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold text-white uppercase tracking-wider mb-2">Emergency & Support</h4>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <p className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-red-600 text-white font-bold rounded text-[10px]">112</span>
                <span>National Emergency Response</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-emerald-700 text-white font-bold rounded text-[10px]">104</span>
                <span>State Health Helpline</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-blue-700 text-white font-bold rounded text-[10px]">1075</span>
                <span>MoHFW Toll Free Helpline</span>
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© 2026 SeVaSetu — Primary Health Centre Network, Ministry of Health and Family Welfare, Government of India.</p>
          <div className="flex items-center gap-4 text-[10.5px]">
            <span className="hover:text-white cursor-pointer">Website Policy</span>
            <span>·</span>
            <span className="hover:text-white cursor-pointer">Privacy Statement</span>
            <span>·</span>
            <span className="hover:text-white cursor-pointer">Security Audit</span>
            <span>·</span>
            <span className="hover:text-white cursor-pointer">Helpdesk</span>
          </div>
        </div>
      </div>
      <TricolorRibbon className="h-1 w-full mt-4 opacity-75" />
    </footer>
  );
}
