import { useState, useEffect } from "react";
import { CheckCircle2, Clock, AlertTriangle, Calendar, Radio } from "lucide-react";
import { mockFollowups } from "@/data";
import { subscribeFollowups, FollowupDoc } from "../services/firebase";

const PRIORITY: Record<string, { bg: string; text: string }> = {
  Normal: { bg: "bg-gray-100", text: "text-gray-700" },
  Urgent: { bg: "bg-amber-100", text: "text-amber-800" },
  High: { bg: "bg-red-100", text: "text-red-700" },
};

const STATUS: Record<string, { bg: string; text: string }> = {
  "Due Today": { bg: "bg-blue-50", text: "text-blue-800" },
  "Upcoming": { bg: "bg-gray-100", text: "text-gray-700" },
  "Overdue": { bg: "bg-red-50", text: "text-red-700" },
  "Completed": { bg: "bg-emerald-50", text: "text-emerald-800" },
};

export default function Followups() {
  const [followups, setFollowups] = useState<any[]>(mockFollowups);

  // Live Firestore subscription on `follow_ups` collection
  useEffect(() => {
    const unsub = subscribeFollowups((liveDocs) => {
      if (liveDocs.length > 0) {
        setFollowups((prev) => {
          const liveIds = new Set(liveDocs.map((m) => m.id));
          const retained = prev.filter((p) => !liveIds.has(p.id));
          return [...liveDocs, ...retained];
        });
      }
    });
    return () => unsub();
  }, []);

  const completeFollowup = (id: string) => {
    setFollowups((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: "Completed" } : f))
    );
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-phc-text text-2xl leading-none">
            Follow-up Visit Cadence Engine
          </h1>
          <p className="text-[13px] text-phc-muted mt-1.5 font-sans">
            Maternal ANC checkups, TB DOTS pill tracking &amp; chronic review schedule · Live Firestore sync (<code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[11px]">follow_ups</code>)
          </p>
        </div>
      </div>

      <div className="bg-phc-surface border border-phc-border rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-phc-bg border-b border-phc-border">
              {["Patient", "Encounter / Cadence", "Due Date", "Reason", "ASHA Worker", "Priority", "Status", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-display font-semibold text-phc-muted uppercase text-[11px]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {followups.map((f) => (
              <tr key={f.id} className="border-b border-phc-border-light hover:bg-phc-bg transition-colors">
                <td className="px-4 py-3 font-bold text-phc-text">{f.patient || f.patientName}</td>
                <td className="px-4 py-3 text-phc-muted">{f.case || f.caseType}</td>
                <td className="px-4 py-3 text-phc-muted font-mono">{f.date || f.dueDate}</td>
                <td className="px-4 py-3 text-phc-muted">{f.reason}</td>
                <td className="px-4 py-3 text-phc-muted">{f.asha || f.ashaName}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-display font-semibold ${PRIORITY[f.priority]?.bg || "bg-slate-100"} ${PRIORITY[f.priority]?.text || "text-slate-700"}`}>
                    {f.priority || "Normal"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-display font-bold ${STATUS[f.status]?.bg || "bg-emerald-50"} ${STATUS[f.status]?.text || "text-emerald-800"}`}>
                    {f.status || "Due Today"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {f.status !== "Completed" && (
                    <button
                      onClick={() => completeFollowup(f.id)}
                      className="text-phc-blue hover:underline font-display text-[12px] font-bold cursor-pointer"
                    >
                      Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
