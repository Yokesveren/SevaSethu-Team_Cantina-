import { useState } from "react";
import {
  Clock, Plus, UserCheck, CheckCircle2, Loader2, X,
  Users, Calendar, BarChart3, ChevronDown,
} from "lucide-react";

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
  { id: "APT-011", token: "#991", time: "12:30", duration: 20, patient: "Lakshmi Devi",     patientId: "BR-PAT-P-0907", age: 58, sex: "F", type: "Follow-up",   reason: "Cataract — pre-referral evaluation",                  doctor: "Dr. Priya Sharma",  asha: "Rekha Sharma", status: "scheduled" },
  { id: "APT-012", token: "#992", time: "09:15", duration: 15, patient: "Rakesh Yadav",     patientId: "BR-PAT-P-0908", age: 44, sex: "M", type: "OPD",         reason: "Acute back pain",                                     doctor: "Dr. Priya Sharma",                        status: "no-show" },
];

const DOCTORS = ["All Doctors", "Dr. Aravind Kumar", "Dr. Priya Sharma", "Staff Nurse Rekha"];
const TYPES: ApptType[] = ["OPD", "ANC", "Immunisation", "DOT", "Follow-up", "Procedure"];

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

// New appointment modal
function NewAppointmentModal({ onClose, onAdd }: { onClose: () => void; onAdd: (a: Appointment) => void }) {
  const [form, setForm] = useState({
    patient: "", age: "", sex: "F" as "M" | "F", type: "OPD" as ApptType,
    time: "", duration: "15", doctor: "Dr. Aravind Kumar", reason: "", asha: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAppt: Appointment = {
      id: `APT-${Date.now()}`,
      token: `#${Math.floor(Math.random() * 900) + 100}`,
      time: form.time,
      duration: parseInt(form.duration) || 15,
      patient: form.patient,
      patientId: `BR-PAT-P-${Math.floor(Math.random() * 9000) + 1000}`,
      age: parseInt(form.age) || 0,
      sex: form.sex,
      type: form.type,
      reason: form.reason,
      doctor: form.doctor,
      asha: form.asha || undefined,
      status: "scheduled",
    };
    onAdd(newAppt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl border border-phc-border w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-slate-900 text-lg">New Appointment</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-400 cursor-pointer"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[11.5px] font-display font-semibold text-slate-600 mb-1">Patient Name *</label>
              <input required value={form.patient} onChange={e => setForm(f => ({ ...f, patient: e.target.value }))}
                className="w-full px-3 py-2 border border-phc-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-phc-blue/30" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-[11.5px] font-display font-semibold text-slate-600 mb-1">Age</label>
              <input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                className="w-full px-3 py-2 border border-phc-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-phc-blue/30" placeholder="Years" />
            </div>
            <div>
              <label className="block text-[11.5px] font-display font-semibold text-slate-600 mb-1">Sex</label>
              <select value={form.sex} onChange={e => setForm(f => ({ ...f, sex: e.target.value as "M" | "F" }))}
                className="w-full px-3 py-2 border border-phc-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-phc-blue/30">
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
            </div>
            <div>
              <label className="block text-[11.5px] font-display font-semibold text-slate-600 mb-1">Time *</label>
              <input required type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full px-3 py-2 border border-phc-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-phc-blue/30" />
            </div>
            <div>
              <label className="block text-[11.5px] font-display font-semibold text-slate-600 mb-1">Duration (min)</label>
              <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                className="w-full px-3 py-2 border border-phc-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-phc-blue/30" />
            </div>
            <div>
              <label className="block text-[11.5px] font-display font-semibold text-slate-600 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ApptType }))}
                className="w-full px-3 py-2 border border-phc-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-phc-blue/30">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11.5px] font-display font-semibold text-slate-600 mb-1">Assign to Doctor</label>
              <select value={form.doctor} onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))}
                className="w-full px-3 py-2 border border-phc-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-phc-blue/30">
                {DOCTORS.filter(d => d !== "All Doctors").map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[11.5px] font-display font-semibold text-slate-600 mb-1">Reason / Chief Complaint</label>
              <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                className="w-full px-3 py-2 border border-phc-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-phc-blue/30" placeholder="e.g. Fever follow-up" />
            </div>
            <div className="col-span-2">
              <label className="block text-[11.5px] font-display font-semibold text-slate-600 mb-1">ASHA Worker (optional)</label>
              <input value={form.asha} onChange={e => setForm(f => ({ ...f, asha: e.target.value }))}
                className="w-full px-3 py-2 border border-phc-border rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-phc-blue/30" placeholder="ASHA name" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-phc-border text-slate-600 text-[12.5px] font-display font-semibold hover:bg-slate-50 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-phc-blue text-white text-[12.5px] font-display font-semibold hover:bg-phc-blue-dark transition-colors cursor-pointer">
              Book Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState(ALL_APPOINTMENTS);
  const [filterDoctor, setFilterDoctor] = useState("All Doctors");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showNewModal, setShowNewModal] = useState(false);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Filter
  const visible = appointments.filter((a) => {
    const docMatch = filterDoctor === "All Doctors" || a.doctor === filterDoctor;
    const statusMatch = filterStatus === "all" || a.status === filterStatus;
    return docMatch && statusMatch;
  });

  // Stats per doctor
  const doctorStats = DOCTORS.filter(d => d !== "All Doctors").map(doc => {
    const docAppts = appointments.filter(a => a.doctor === doc);
    return {
      name: doc,
      total: docAppts.length,
      done: docAppts.filter(a => a.status === "done").length,
      inProgress: docAppts.filter(a => a.status === "in-progress").length,
      upcoming: docAppts.filter(a => a.status === "scheduled").length,
    };
  });

  const handleAdd = (appt: Appointment) => {
    setAppointments(prev => [...prev, appt]);
  };

  const handleCancel = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  const handleReassign = (id: string, newDoctor: string) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, doctor: newDoctor } : a));
  };

  return (
    <div className="p-6">
      {showNewModal && (
        <NewAppointmentModal onClose={() => setShowNewModal(false)} onAdd={handleAdd} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display font-bold text-phc-text text-2xl leading-none">Appointments & Scheduling</h1>
          <p className="text-[13px] text-slate-500 mt-1.5">{today} · Facility-wide view · Morning Shift</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-phc-blue text-white text-[12.5px] font-display font-semibold hover:bg-phc-blue-dark transition-colors cursor-pointer"
        >
          <Plus size={14} /> New Appointment
        </button>
      </div>

      {/* Doctor load cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {doctorStats.map(doc => (
          <div
            key={doc.name}
            className={`bg-phc-surface border rounded-lg px-4 py-3 cursor-pointer transition-all ${filterDoctor === doc.name ? "border-phc-blue ring-2 ring-phc-blue/20" : "border-phc-border hover:border-slate-300"}`}
            onClick={() => setFilterDoctor(filterDoctor === doc.name ? "All Doctors" : doc.name)}
          >
            <div className="flex items-center gap-2 mb-2">
              <Users size={13} className="text-phc-blue shrink-0" />
              <span className="font-display font-semibold text-slate-800 text-[12.5px] truncate">{doc.name}</span>
            </div>
            <div className="flex gap-3 text-[11.5px]">
              <span className="text-slate-500">{doc.total} total</span>
              <span className="text-emerald-600">{doc.done} done</span>
              {doc.inProgress > 0 && <span className="text-phc-blue">{doc.inProgress} active</span>}
              <span className="text-amber-700">{doc.upcoming} left</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-slate-400" />
          <span className="text-[12px] text-slate-500">Filter:</span>
        </div>
        {/* Doctor filter */}
        <div className="relative">
          <select
            value={filterDoctor}
            onChange={e => setFilterDoctor(e.target.value)}
            className="pl-3 pr-7 py-1.5 border border-phc-border rounded-lg text-[12px] font-display text-slate-700 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-phc-blue/30 cursor-pointer"
          >
            {DOCTORS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        {/* Status filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="pl-3 pr-7 py-1.5 border border-phc-border rounded-lg text-[12px] font-display text-slate-700 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-phc-blue/30 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
            <option value="no-show">No Show</option>
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <span className="ml-auto text-[12px] text-slate-500">
          <BarChart3 size={12} className="inline mr-1 text-slate-400" />
          Showing {visible.length} of {appointments.length}
        </span>
      </div>

      {/* Full table */}
      <div className="bg-phc-surface border border-phc-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-phc-bg border-b border-phc-border">
              {["Token", "Time", "Patient", "Type", "Reason", "Doctor / Nurse", "ASHA", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-display font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400 text-[13px]">No appointments match the filters.</td>
              </tr>
            )}
            {visible.map((a, i) => {
              const sm = STATUS_META[a.status];
              return (
                <tr key={a.id} className={`border-b border-phc-border-light hover:bg-phc-blue-light/20 transition-colors ${a.status === "in-progress" ? "bg-blue-50/40" : i % 2 === 1 ? "bg-phc-bg/40" : ""}`}>
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
                  <td className="px-4 py-2.5 text-[12px] text-slate-600 max-w-[180px] truncate" title={a.reason}>{a.reason}</td>
                  <td className="px-4 py-2.5">
                    {/* Inline reassign dropdown */}
                    <select
                      value={a.doctor}
                      onChange={e => handleReassign(a.id, e.target.value)}
                      className="text-[12px] text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-phc-blue cursor-pointer"
                    >
                      {DOCTORS.filter(d => d !== "All Doctors").map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-[12px]">
                    {a.asha ? (
                      <span className="flex items-center gap-1 text-phc-green whitespace-nowrap"><UserCheck size={10} />{a.asha}</span>
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
                    {a.status === "scheduled" && (
                      <button
                        onClick={() => handleCancel(a.id)}
                        className="text-[11.5px] text-red-500 hover:underline font-display cursor-pointer"
                        title="Cancel appointment"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-2.5 border-t border-phc-border bg-phc-bg text-[11.5px] text-slate-500">
          {appointments.length} total facility appointments today
        </div>
      </div>
    </div>
  );
}
