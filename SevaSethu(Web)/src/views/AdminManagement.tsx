import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function AdminManagement() {
  const { doctors, updateDoctorStatus, doctorRegistrationRequests, approveDoctorRegistration, addDoctor } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", specialization: "" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newDoctorId = `DOC-PHC-${String(doctors.length + 1).padStart(4, '0')}`;
    addDoctor({ 
      id: newDoctorId, 
      name: formData.name, 
      email: formData.email, 
      specialization: formData.specialization, 
      role: "DOCTOR", 
      status: "Active" 
    });
    setIsCreating(false);
    setFormData({ name: "", email: "", specialization: "" });
  };

  const handleApproveDoctor = (id: string) => {
    const result = approveDoctorRegistration(id);
    if (result) {
      console.log(`Doctor approved: ${result.id} / ${result.email}`);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-bold text-phc-text text-2xl">Doctor Management</h1>
          <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 bg-phc-blue text-white px-4 py-2 rounded-lg text-[13px] font-display font-semibold hover:bg-phc-blue-dark">
            <UserPlus size={16} />
            Create Doctor Account
          </button>
        </div>

        {isCreating && (
          <div className="bg-phc-surface border border-phc-border p-6 rounded-lg mb-6 shadow-sm">
            <h2 className="font-display font-bold text-lg mb-4">Create New Doctor</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[11px] font-bold text-phc-muted uppercase mb-1">Name</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-phc-bg" required /></div>
                <div><label className="block text-[11px] font-bold text-phc-muted uppercase mb-1">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-phc-bg" required /></div>
                <div><label className="block text-[11px] font-bold text-phc-muted uppercase mb-1">Specialization</label><input type="text" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-phc-bg" required /></div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-phc-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-phc-blue-dark">Create Account</button>
                <button type="button" onClick={() => setIsCreating(false)} className="bg-phc-bg text-phc-text px-4 py-2 rounded-lg font-semibold hover:bg-phc-border">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-phc-surface border border-phc-border rounded-lg overflow-hidden">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-phc-bg border-b border-phc-border">
                {["Name", "ID", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-display font-semibold text-phc-muted uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doctors.map(d => (
                <tr key={d.id} className="border-b border-phc-border-light hover:bg-phc-bg">
                  <td className="px-4 py-3 font-medium text-phc-text">{d.name}</td>
                  <td className="px-4 py-3 text-phc-muted">{d.id}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${d.status === "Active" ? "bg-green-50 text-green-700" : d.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    {d.status === "Pending" && (
                      <button onClick={() => updateDoctorStatus(d.id, "Active")} className="text-green-600 hover:underline">Activate</button>
                    )}
                    {d.status === "Active" && (
                      <button onClick={() => updateDoctorStatus(d.id, "Suspended")} className="text-red-600 hover:underline">Suspend</button>
                    )}
                    {d.status === "Suspended" && (
                      <button onClick={() => updateDoctorStatus(d.id, "Active")} className="text-green-600 hover:underline">Reactivate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-4">Doctor Registration Requests</h2>
        <table className="w-full bg-white rounded-lg shadow-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase text-phc-muted border-b">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Specialization</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctorRegistrationRequests.map(r => (
              <tr key={r.id} className="border-b">
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3">{r.specialization}</td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3">
                  {r.status === "Pending" && (
                    <button onClick={() => handleApproveDoctor(r.id)} className="text-green-600 hover:underline">Approve & Assign ID</button>
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
