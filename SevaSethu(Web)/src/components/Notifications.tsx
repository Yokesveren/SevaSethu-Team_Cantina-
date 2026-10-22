import { useState } from "react";
import { Bell, X } from "lucide-react";

const NOTIFICATIONS = [
  { id: 1, type: "Critical", message: "SOS Alert: Saurabh Verma", time: "27m ago", read: false },
  { id: 2, type: "Referral", message: "New Referral ACK: Geeta Yadav", time: "1h ago", read: false },
  { id: 3, type: "Stock", message: "Low stock alert: Paracetamol", time: "2h ago", read: true },
];

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-phc-surface border border-phc-border rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-phc-border">
        <h3 className="font-display font-semibold text-[13px]">Notifications</h3>
        <button onClick={onClose}><X size={14} className="text-phc-muted"/></button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {NOTIFICATIONS.map(n => (
          <div key={n.id} className={`px-4 py-3 border-b border-phc-border-light ${n.read ? "bg-phc-surface" : "bg-phc-blue-light/30"}`}>
            <div className="text-[11px] font-bold text-phc-blue uppercase">{n.type}</div>
            <div className="text-[12.5px] mt-0.5">{n.message}</div>
            <div className="text-[10px] text-phc-subtle mt-1">{n.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
