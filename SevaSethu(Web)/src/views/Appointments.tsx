import { useState } from "react";
import { Clock, UserCheck, CheckCircle2, Loader2, X, Activity, ChevronRight } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

type ApptStatus = "scheduled" | "in-progress" | "done" | "no-show";
type ApptType = "OPD" | "ANC" | "Immunisation" | "DOT" | "Follow-up" | "Procedure";

interface Appointment {
  id: string;
  token: string;
  time: string;
  duration: number;
  patient: string;
  patientId: string;
  age: number;
  sex: "M" | "F";
  type: ApptType;
  reason: string;
  doctor: string;
  asha?: string;
  status: ApptStatus;
}

const ALL_APPOINTMENTS: Appointment[] = [
  { id: "APT-001", token: "#981", time: "08:30", duration: 15, patient: "Kamla Devi",       patientId: "BR-PAT-P-0892", age: 45, sex: "F", type: "OPD",         reason: "Viral fever — follow-up, day 3",                      doctor: "Dr. Aravind Kumar", asha: "Meena K.",     status: "done" },
  { id: "APT-002", token: "#982", time: "08:45", duration: 20, patient: "Raghav Sharma",    patientId: "BR-PAT-P-0893", age: 62, sex: "M", type: "Follow-up",   reason: "Diabetes monitoring — HbA1c review",                  doctor: "Dr. Aravind Kumar",                       status: "done" },
  { id: "APT-003", token: "#983", time: "09:00", duration: 30, patient: "Ananya Singh",     patientId: "BR-PAT-P-0894", age: 28, sex: "F", type: "ANC",         reason: "ANC visit — 28 weeks, 4th antenatal check",           doctor: "Dr. Aravind Kumar", asha: "Sunita D.",    status: "done" },
  { id: "APT-004", token: "#984", time: "09:30", duration: 20, patient: "Baby Aarav Singh", patientId: "BR-PAT-P-0903", age: 1,  sex: "M", type: "OPD",         reason: "Paediatric fever — review",                           doctor: "Dr. Aravind Kumar", asha: "Rekha Sharma", status: "in-progress" },
  { id: "APT-005", token: "#985", time: "10:00", duration: 15, patient: "Asha Verma",       patientId: "BR-PAT-P-0902", age: 35, sex: "F", type: "Follow-up",   reason: "Hypertension — monthly review",                       doctor: "Dr. Aravind Kumar",                       status: "scheduled" },
  { id: "APT-006", token: "#986", time: "10:15", duration: 10, patient: "Shivam Tiwari",    patientId: "BR-PAT-P-0895", age: 55, sex: "M", type: "DOT",         reason: "TB DOT — direct observation day 43",                  doctor: "Staff Nurse Rekha",                       status: "scheduled" },
  { id: "APT-007", token: "#987", time: "11:00", duration: 15, patient: "Vikas Singh",      patientId: "BR-PAT-P-0901", age: 70, sex: "M", type: "Follow-up",   reason: "Diabetic foot — wound review",                        doctor: "Dr. Aravind Kumar",                       status: "scheduled" },
  { id: "APT-008", token: "#988", time: "11:15", duration: 20, patient: "Baby Pooja",       patientId: "BR-PAT-P-0905", age: 0,  sex: "F", type: "Immunisation", reason: "BCG + OPV₀ — birth dose at 6 weeks",                 doctor: "Staff Nurse Rekha", asha: "Anita Yadav",  status: "scheduled" },
  { id: "APT-009", token: "#989", time: "11:30", duration: 30, patient: "Pooja Kumari",     patientId: "BR-PAT-P-0900", age: 32, sex: "F", type: "ANC",         reason: "ANC visit — 32 weeks, gestational diabetes review",   doctor: "Dr. Aravind Kumar", asha: "Anita Yadav",  status: "scheduled" },
  { id: "APT-010", token: "#990", time: "12:00", duration: 15, patient: "Manohar Singh",    patientId: "BR-PAT-P-0906", age: 48, sex: "M", type: "Procedure",   reason: "Post-op wound dressing — day 7",                      doctor: "Dr. Aravind Kumar",                       status: "scheduled" },
];

const STATUS_META: Record<ApptStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  "scheduled":   { label: "Scheduled",   bg: "bg-amber-50",  text: "text-amber-800", icon: <Clock size={10} /> },
  "in-progress": { label: "In Progress", bg: "bg-blue-50",   text: "text-blue-800",  icon: <Loader2 size={10} className="animate-spin" /> },
  "done":        { label: "Done",        bg: "bg-gray-100",  text: "text-gray-700",  icon: <CheckCircle2 size={10} /> },
  "no-show":     { label: "No Show",     bg: "bg-red-50",    text: "text-red-700",   icon: <X size={10} /> },
};

const TYPE_COLORS: Record<ApptType, string> = {
  OPD:          "bg-sky-100 text-sky-800",
  ANC:          "bg-pink-100 text-pink-800",
  Immunisation: "bg-green-100 text-green-800",
  DOT:          "bg-orange-100 text-orange-800",
  "Follow-up":  "bg-slate-100 text-slate-700",
  Procedure:    "bg-violet-100 text-violet-800",
};

// Detail panel
function AppointmentDetail({
  appt,
  onClose,
  onStatusChange,
}: {
  appt: Appointment;
  onClose: () => void;
  onStatusChange: (id: string, status: ApptStatus) => void;
}) {
  const sm = STATUS_META[appt.status];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl border border-phc-border w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="font-display font-bold text-slate-900 text-lg leading-none">{appt.patient}</div>
            <div className="text-[12px] text-slate-500 mt-1">{appt.patientId} · {appt.age < 1 ? "Infant" : `${appt.age}${appt.sex}`} · Token {appt.token}</div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400 cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 text-[13px]">
          <div className="flex justify-between">
            <span className="text-slate-500">Time</span>
            <span className="font-mono font-semibold text-slate-800">{appt.time} · {appt.duration} min</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Type</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${TYPE_COLORS[appt.type]}`}>{appt.type}</span>
          </div>
          <div className="flex justify-between items-start gap-4">
            <span className="text-slate-500 shrink-0">Reason</span>
            <span className="text-slate-800 text-right">{appt.reason}</span>
          </div>
          {appt.asha && (
            <div className="flex justify-between">
              <span className="text-slate-500">ASHA Worker</span>
              <span className="flex items-center gap-1 text-phc-green font-medium"><UserCheck size={11} />{appt.asha}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Status</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${sm.bg} ${sm.text}`}>
              {sm.icon} {sm.label}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        {appt.status !== "done" && appt.status !== "no-show" && (
          <div className="flex gap-2 mt-5 pt-4 border-t border-phc-border">
            {appt.status === "scheduled" && (
              <button
                onClick={() => { onStatusChange(appt.id, "in-progress"); onClose(); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-phc-blue text-white text-[12.5px] font-display font-semibold hover:bg-phc-blue-dark transition-colors cursor-pointer"
              >
                <Activity size={13} /> Start Consultation
              </button>
            )}
            {appt.status === "in-progress" && (
              <button
                onClick={() => { onStatusChange(appt.id, "done"); onClose(); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-[12.5px] font-display font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <CheckCircle2 size={13} /> Mark Done
              </button>
            )}
            <button
              onClick={() => { onStatusChange(appt.id, "no-show"); onClose(); }}
              className="px-3 py-2 rounded-lg border border-red-200 text-red-600 text-[12.5px] font-display font-semibold hover:bg-red-50 transition-colors cursor-pointer"
            >
              No Show
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState(ALL_APPOINTMENTS);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  // Filter to current doctor's appointments only
  const myName = user?.name || "Dr. Aravind Kumar";
  const myAppointments = appointments.filter((a) => a.doctor === myName || a.doctor.includes("Kumar"));

  const done       = myAppointments.filter((a) => a.status === "done").length;
  const inProgress = myAppointments.filter((a) => a.status === "in-progress").length;
  const upcoming   = myAppointments.filter((a) => a.status === "scheduled").length;
  const noShow     = myAppointments.filter((a) => a.status === "no-show").length;

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const handleStatusChange = (id: string, status: ApptStatus) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  // Next patient is first "scheduled" after the in-progress one
  const nextPatient = myAppointments.find((a) => a.status === "scheduled");
  const currentPatient = myAppointments.find((a) => a.status === "in-progress");

  return (
    <div className="p-6">
      {selectedAppt && (
        <AppointmentDetail
          appt={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display font-bold text-phc-text text-2xl leading-none">My Queue</h1>
          <p className="text-[13px] text-slate-500 mt-1.5">{today} · Morning Shift · {myName}</p>
        </div>
        {/* Live status pill */}
        {currentPatient && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader2 size={13} className="animate-spin text-phc-blue" />
            <span className="text-[12.5px] font-display font-semibold text-phc-blue">
              Seeing: {currentPatient.patient} · {currentPatient.token}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Today",  value: myAppointments.length, color: "text-slate-900" },
          { label: "Done",         value: done,       color: "text-emerald-600" },
          { label: "In Progress",  value: inProgress, color: "text-phc-blue" },
          { label: "Upcoming",     value: upcoming,   color: "text-amber-700" },
        ].map((s) => (
          <div key={s.label} className="bg-phc-surface border border-phc-border rounded-lg px-4 py-3">
            <div className={`font-display font-bold text-2xl leading-none ${s.color}`}>{s.value}</div>
            <div className="text-[12px] text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Next up banner */}
      {nextPatient && !currentPatient && (
        <div
          className="flex items-center justify-between mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => setSelectedAppt(nextPatient)}
        >
          <div className="flex items-center gap-3">
            <ChevronRight size={16} className="text-amber-600" />
            <div>
              <span className="font-display font-semibold text-amber-900 text-[13.5px]">Next up: {nextPatient.patient}</span>
              <span className="text-amber-700 text-[12px] ml-2">{nextPatient.token} · {nextPatient.time} · {nextPatient.type}</span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleStatusChange(nextPatient.id, "in-progress"); }}
            className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-[12px] font-display font-semibold hover:bg-amber-700 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Activity size={12} /> Start
          </button>
        </div>
      )}

      {/* Queue table */}
      <div className="bg-phc-surface border border-phc-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-phc-bg border-b border-phc-border">
              {["Token", "Time", "Patient", "Type", "Reason", "ASHA", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-display font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {myAppointments.map((a, i) => {
              const sm = STATUS_META[a.status];
              const isActive = a.status === "in-progress";
              const isDone   = a.status === "done" || a.status === "no-show";
              return (
                <tr
                  key={a.id}
                  onClick={() => setSelectedAppt(a)}
                  className={`border-b border-phc-border-light cursor-pointer transition-colors
                    ${isActive ? "bg-blue-50/60" : isDone ? "opacity-60" : i % 2 === 1 ? "bg-phc-bg/40" : ""}
                    hover:bg-phc-blue-light/20`}
                >
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-[12px] text-phc-blue font-semibold">{a.token}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-[12px] text-slate-800">{a.time}</span>
                    <span className="block text-[10.5px] text-slate-400">{a.duration} min</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="font-display font-semibold text-slate-900 text-[13px] whitespace-nowrap">{a.patient}</span>
                    <span className="block text-[11px] text-slate-500">{a.age < 1 ? "Infant" : `${a.age}${a.sex}`}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10.5px] font-display font-bold ${TYPE_COLORS[a.type]}`}>{a.type}</span>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-slate-600 max-w-[200px] truncate" title={a.reason}>{a.reason}</td>
                  <td className="px-4 py-2.5 text-[12px]">
                    {a.asha ? (
                      <span className="flex items-center gap-1 text-phc-green whitespace-nowrap">
                        <UserCheck size={10} />{a.asha}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-display font-semibold ${sm.bg} ${sm.text}`}>
                      {sm.icon} {sm.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {!isDone && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedAppt(a); }}
                        className="text-[12px] text-phc-blue hover:underline font-display cursor-pointer"
                      >
                        Manage
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-2.5 border-t border-phc-border bg-phc-bg text-[11.5px] text-slate-500">
          {myAppointments.length} appointments · {done} done · {noShow} no-show · {upcoming} remaining
        </div>
      </div>
    </div>
  );
}
