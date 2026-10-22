import {
  LayoutDashboard,
  Users,
  Activity,
  ArrowRightLeft,
  Calendar,
  UserCheck,
  Package,
  ClipboardList,
  Siren,
  BarChart2,
  Settings,
  Palette,
  MessageSquareText,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Role } from "../auth/authService";
import { ViewType } from "../types";
import { NationalEmblem } from "./GovEmblem";

interface NavItem {
  id: ViewType;
  label: string;
  icon: LucideIcon;
  badge?: number;
  badgeColor?: "red" | "amber" | "blue";
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "DOCTOR"] },
  { id: "patients", label: "Patients", icon: Users, roles: ["ADMIN", "DOCTOR"] },
  { id: "triage", label: "Triage & Cases", icon: Activity, roles: ["DOCTOR"] },
  { id: "referrals", label: "Referrals", icon: ArrowRightLeft, badge: 6, badgeColor: "blue", roles: ["DOCTOR"] },
  { id: "appointments", label: "My Queue", icon: Calendar, roles: ["DOCTOR"] },
  { id: "admin-appointments", label: "Appointments", icon: Calendar, roles: ["ADMIN"] },
  { id: "asha", label: "ASHA Workers", icon: UserCheck, roles: ["ADMIN"] },
  { id: "admin-doctors", label: "Doctors", icon: Users, roles: ["ADMIN"] },
  { id: "inventory", label: "Inventory", icon: Package, badge: 3, badgeColor: "amber", roles: ["ADMIN"] },
  { id: "followups", label: "Follow-ups", icon: ClipboardList, roles: ["DOCTOR"] },
  { id: "sos", label: "SOS / Emergency", icon: Siren, badge: 1, badgeColor: "red", roles: ["DOCTOR"] },
  { id: "reports", label: "Reports", icon: BarChart2, roles: ["ADMIN", "DOCTOR"] },
];

const BOTTOM_ITEMS: NavItem[] = [
  { id: "settings", label: "Settings", icon: Settings, roles: ["ADMIN", "DOCTOR"] },
  { id: "design-system", label: "Design System", icon: Palette, roles: ["ADMIN"] },
];

const badgeCls: Record<string, string> = {
  red: "bg-red-500 text-white",
  amber: "bg-amber-500 text-white",
  blue: "bg-blue-600 text-white",
};

interface SidebarProps {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
  role: Role;
}

function NavItemButton({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate: (v: ViewType) => void }) {
  const Icon = item.icon;
  const isSOS = item.id === "sos";
  return (
    <button
      onClick={() => onNavigate(item.id)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mx-2 text-left transition-all cursor-pointer group ${active
          ? "bg-phc-sidebar-active text-white"
          : isSOS && item.badge
            ? "text-red-300 hover:bg-red-900/20 hover:text-red-200"
            : "text-phc-sidebar-text hover:bg-phc-sidebar-hover hover:text-white"
        }`}
      style={{ width: "calc(100% - 16px)" }}
    >
      <Icon
        size={16}
        className={`flex-shrink-0 transition-colors ${active
            ? "text-white"
            : isSOS && item.badge
              ? "text-red-400"
              : "text-phc-sidebar-icon group-hover:text-blue-300"
          }`}
      />
      <span className="flex-1 text-[12.5px] font-display font-medium leading-none">
        {item.label}
      </span>
      {item.badge !== undefined && (
        <span
          className={`text-[10px] font-bold font-display px-1.5 py-0.5 rounded-full leading-none flex-shrink-0 ${badgeCls[item.badgeColor || "blue"]}`}
        >
          {item.badge}
        </span>
      )}
      {active && <ChevronRight size={12} className="text-blue-200 ml-auto flex-shrink-0" />}
    </button>
  );
}

export default function Sidebar({ activeView, onNavigate, role }: SidebarProps) {
  return (
    <aside
      className="flex-shrink-0 flex flex-col overflow-y-auto"
      style={{ width: "240px", backgroundColor: "#162A45" }}
    >
      {/* System status */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 animate-pulse" />
          <span className="text-[11px] text-phc-sidebar-text font-sans">System Online</span>
          <span className="ml-auto text-[10px] font-mono text-phc-sidebar-icon">v2.4.1</span>
        </div>
      </div>

      {/* Section label */}
      <div className="px-6 pt-4 pb-2">
        <span className="text-[10px] font-display font-semibold tracking-widest text-phc-sidebar-icon uppercase">
          Main Menu
        </span>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-0 pb-2">
        {NAV_ITEMS.filter(item => item.roles.includes(role)).map((item) => (
          <NavItemButton
            key={item.id}
            item={item}
            active={activeView === item.id}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-white/10 my-2" />

      {/* Bottom nav */}
      <div className="flex flex-col gap-0.5 px-0 pb-4">
        {BOTTOM_ITEMS.filter(item => item.roles.includes(role)).map((item) => (
          <NavItemButton
            key={item.id}
            item={item}
            active={activeView === item.id}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {/* Footer info */}
      <div className="px-4 pb-4">
        <div className="rounded-lg bg-white/5 border border-white/10 p-2.5">
          <div className="flex items-center gap-2 mb-1.5">
            <NationalEmblem className="h-6 w-auto text-amber-400 flex-shrink-0" showMotto={false} />
            <div className="text-[10px] text-white font-bold leading-tight">
              National Health Mission
              <span className="block text-[9px] text-phc-sidebar-icon font-normal opacity-75">State Health Society, Bihar</span>
            </div>
          </div>
          <div className="text-[9.5px] font-mono text-emerald-400 flex items-center gap-1.5 mt-1 border-t border-white/10 pt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>ABDM / HMIS: BR-PAT-042</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
