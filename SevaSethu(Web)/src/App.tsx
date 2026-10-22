import { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import GlobalSOSBanner from "./components/GlobalSOSBanner";
import Dashboard from "./views/Dashboard";
import Patients from "./views/Patients";
import Triage from "./views/Triage";
import Referrals from "./views/Referrals";
import Appointments from "./views/Appointments";
import AdminAppointments from "./views/AdminAppointments";
import ASHAWorkers from "./views/ASHAWorkers";
import AdminManagement from "./views/AdminManagement";
import Settings from "./views/Settings";
import Inventory from "./views/Inventory";
import SOS from "./views/SOS";
import Reports from "./views/Reports";
import Followups from "./views/Followups";
import DesignSystem from "./views/DesignSystem";
import Login from "./views/Login";
import RegisterAdmin from "./views/RegisterAdmin";
import RegisterDoctor from "./views/RegisterDoctor";
import WelcomeScreen from "./components/WelcomeScreen";
import { EmergencySOSModal, AshaConnectionApprovalModal } from "./components/DoctorNotificationModals";
import RealtimePatientModal from "./components/RealtimePatientModal";
import { useAuth } from "./auth/AuthContext";
import { ViewType } from "./types";

export default function App() {
  const { isAuthenticated, user } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>("dashboard");
  const [showWelcome, setShowWelcome] = useState(true);

  const navigate = (view: ViewType) => setActiveView(view);

  if (!isAuthenticated || !user) {
    if (activeView === "register-admin") return <RegisterAdmin onNavigate={navigate} />;
    if (activeView === "register-doctor") return <RegisterDoctor onNavigate={navigate} />;
    if (showWelcome) return <WelcomeScreen onComplete={() => setShowWelcome(false)} />;
    return <Login onNavigate={navigate} onBackToWelcome={() => setShowWelcome(true)} />;
  }

  const renderView = () => {
    // Define route permissions
    const isAdminView = ["asha", "inventory", "admin-doctors", "admin-registrations", "admin-appointments"].includes(activeView);
    
    if (isAdminView && user.role !== "ADMIN") {
      return (
        <div className="p-12 text-center">
          <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
          <p className="text-phc-muted">You do not have permission to access this area.</p>
        </div>
      );
    }
    
    if (user.role === "DOCTOR" && user.status !== "Active") {
      return (
        <div className="p-12 text-center">
          <h2 className="text-xl font-bold text-amber-600">Account Not Active</h2>
          <p className="text-phc-muted">Please contact PHC Administrator to activate your account.</p>
        </div>
      );
    }

    switch (activeView) {
      case "dashboard":     return <Dashboard onNavigate={navigate} />;
      case "patients":      return <Patients />;
      case "triage":        return <Triage />;
      case "referrals":     return <Referrals />;
      case "appointments":       return <Appointments />;
      case "admin-appointments": return <AdminAppointments />;
      case "asha":          return <ASHAWorkers />;
      case "admin-doctors": return <AdminManagement />;
      case "inventory":     return <Inventory />;
      case "sos":           return <SOS />;
      case "reports":       return <Reports />;
      case "design-system": return <DesignSystem />;
      case "followups":
        return <Followups />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Feature 4: Global Real-Time Emergency SOS Alert Banner */}
      <GlobalSOSBanner onNavigate={navigate} />

      {/* Emergency SOS Dispatch Pop-up Notification Modal */}
      {(user.role === "DOCTOR" || user.role === "ADMIN") && (
        <EmergencySOSModal onNavigate={navigate} />
      )}

      {/* ASHA Teleconsultation & Patient Connection Approval Modal */}
      {(user.role === "DOCTOR" || user.role === "ADMIN") && (
        <AshaConnectionApprovalModal onNavigate={navigate} />
      )}

      {/* Real-Time ASHA New Patient Registration Notification Pop-up */}
      {(user.role === "DOCTOR" || user.role === "ADMIN") && (
        <RealtimePatientModal onNavigate={navigate} />
      )}

      <Header onNavigate={navigate} />
      <div className="flex flex-1 min-h-0">
        <Sidebar activeView={activeView} onNavigate={setActiveView} role={user.role} />
        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
