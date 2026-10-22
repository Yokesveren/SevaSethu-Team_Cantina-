import React, { createContext, useContext, useState } from "react";
import {
  User,
  Role,
  login as authLogin,
  demoUsers,
  initialDoctorList,
  DoctorRegistrationRequest,
  DEFAULT_ADMIN_ID,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_DOCTOR_ID,
  DEFAULT_DOCTOR_PASSWORD,
} from "./authService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  doctors: User[];
  addDoctor: (user: User) => void;
  updateDoctorStatus: (id: string, status: User["status"]) => void;
  doctorRegistrationRequests: DoctorRegistrationRequest[];
  addDoctorRegistrationRequest: (request: DoctorRegistrationRequest) => void;
  approveDoctorRegistration: (id: string) => { id: string; email: string } | null;
  registerAdminAccount: (name: string, email: string, password: string) => { id: string; email: string };
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  error: null,
  doctors: [],
  addDoctor: () => {},
  updateDoctorStatus: () => {},
  doctorRegistrationRequests: [],
  addDoctorRegistrationRequest: () => {},
  approveDoctorRegistration: () => null,
  registerAdminAccount: () => ({ id: DEFAULT_ADMIN_ID, email: "admin@demo.sevasetu.in" }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<User[]>(initialDoctorList);
  const [doctorRegistrationRequests, setDoctorRegistrationRequests] = useState<DoctorRegistrationRequest[]>([]);
  const [credentialMap, setCredentialMap] = useState<Record<string, string>>({
    [DEFAULT_ADMIN_ID.toLowerCase()]: DEFAULT_ADMIN_PASSWORD,
    "admin@demo.sevasetu.in": DEFAULT_ADMIN_PASSWORD,
    [DEFAULT_DOCTOR_ID.toLowerCase()]: DEFAULT_DOCTOR_PASSWORD,
    "doctor@demo.sevasetu.in": DEFAULT_DOCTOR_PASSWORD,
  });

  const addDoctor = (newUser: User) => {
    setDoctors(prev => [...prev, newUser]);
    if (newUser.email) {
      setCredentialMap(prev => ({ ...prev, [newUser.email.toLowerCase()]: prev[newUser.email.toLowerCase()] || "doctor123", [newUser.id.toLowerCase()]: prev[newUser.id.toLowerCase()] || "doctor123" }));
    }
  };

  const updateDoctorStatus = (id: string, status: User["status"]) => {
    setDoctors(prev => prev.map(d => d.id === id ? { ...d, status } : d));
  };

  const addDoctorRegistrationRequest = (request: DoctorRegistrationRequest) => {
    setDoctorRegistrationRequests(prev => [...prev, request]);
  };

  const approveDoctorRegistration = (id: string) => {
    const approvedRequest = doctorRegistrationRequests.find(r => r.id === id);
    if (!approvedRequest) return null;

    const newDoctorId = `DOC-PHC-${String(doctors.length + 1).padStart(4, '0')}`;
    const approvedEmail = approvedRequest.email.trim();
    const generatedPassword = "doctor123";

    const approvedUser: User = {
      id: newDoctorId,
      name: approvedRequest.name,
      email: approvedEmail,
      role: "DOCTOR",
      status: "Active",
      specialization: approvedRequest.specialization,
    };

    setDoctorRegistrationRequests(prev => prev.map(r => r.id === id ? { ...r, status: "Approved" } : r));
    setDoctors(prev => [...prev, approvedUser]);
    setCredentialMap(prev => ({
      ...prev,
      [newDoctorId.toLowerCase()]: generatedPassword,
      [approvedEmail.toLowerCase()]: generatedPassword,
    }));

    return { id: newDoctorId, email: approvedEmail };
  };

  const registerAdminAccount = (name: string, email: string, password: string) => {
    const normalizedEmail = email.trim();
    const adminId = `ADM-${String(Date.now()).slice(-6)}`;
    const adminUser: User = {
      id: adminId,
      name,
      email: normalizedEmail,
      role: "ADMIN",
      status: "Active",
    };

    setCredentialMap(prev => ({
      ...prev,
      [adminId.toLowerCase()]: password,
      [normalizedEmail.toLowerCase()]: password,
    }));
    setUser(adminUser);
    return { id: adminId, email: normalizedEmail };
  };

  const login = async (emailOrId: string, password: string) => {
    setError(null);
    const normalizedId = (emailOrId || "").trim();
    const lookupId = normalizedId.toLowerCase();
    const expectedPassword = credentialMap[lookupId] || credentialMap[normalizedId] || credentialMap[lookupId.replace(/^\s+|\s+$/g, "")];

    const loggedUser = await authLogin(emailOrId, password, doctors);
    if (!loggedUser) {
      setError("Invalid credentials or account not found.");
      return;
    }

    if (password !== expectedPassword && !(
      (lookupId === "admin" || lookupId === "doctor") &&
      ((password === DEFAULT_ADMIN_PASSWORD && loggedUser.role === "ADMIN") || (password === DEFAULT_DOCTOR_PASSWORD && loggedUser.role === "DOCTOR"))
    )) {
      setError("Invalid credentials. Please check the ID/email and password.");
      return;
    }

    if (loggedUser.role !== "ADMIN" && loggedUser.status !== "Active") {
      setError(`Account status: ${loggedUser.status}. Please contact Admin.`);
      return;
    }

    setUser(loggedUser);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, error, doctors, addDoctor, updateDoctorStatus, doctorRegistrationRequests, addDoctorRegistrationRequest, approveDoctorRegistration, registerAdminAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
