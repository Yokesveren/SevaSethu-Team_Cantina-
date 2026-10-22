export type Role = "ADMIN" | "DOCTOR" | "ASHA_WORKER" | "STAFF";

export const DEFAULT_ADMIN_ID = "ADM-001";
export const DEFAULT_DOCTOR_ID = "DOC-PHC-0001";

// Passwords are read from environment variables.
// Set VITE_ADMIN_PASSWORD and VITE_DOCTOR_PASSWORD in your .env file.
// Plaintext fallbacks here are intentionally weak — override them in production.
export const DEFAULT_ADMIN_PASSWORD =
  (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) ?? "admin123";
export const DEFAULT_DOCTOR_PASSWORD =
  (import.meta.env.VITE_DOCTOR_PASSWORD as string | undefined) ?? "doctor123";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  specialization?: string;
  status: "Active" | "Pending" | "Suspended" | "Deactivated";
}

export interface DoctorRegistrationRequest {
  id: string;
  name: string;
  email: string;
  mobile: string;
  specialization: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: Date;
}

export const initialDoctorList: User[] = [
  { id: "DOC-PHC-0001", name: "Dr. Aravind Kumar", email: "doctor@demo.sevasetu.in", role: "DOCTOR", status: "Active", specialization: "General Medicine" },
  { id: "DOC-002", name: "Dr. Priya Rani", email: "pending@demo.sevasetu.in", role: "DOCTOR", status: "Pending", specialization: "Pediatrics" },
  { id: "DOC-003", name: "Dr. Rajesh Sharma", email: "suspended@demo.sevasetu.in", role: "DOCTOR", status: "Suspended", specialization: "Orthopedics" },
  { id: "DOC-004", name: "Dr. Suresh Babu", email: "deactivated@demo.sevasetu.in", role: "DOCTOR", status: "Deactivated", specialization: "Dermatology" },
];

export const demoUsers: Record<string, User> = {
  "admin@demo.sevasetu.in": { id: "ADM-001", name: "Shri Rajesh Verma", email: "admin@demo.sevasetu.in", role: "ADMIN", status: "Active", specialization: "PHC Administration" },
  "admin@sevasetu.in": { id: "ADM-001", name: "Shri Rajesh Verma", email: "admin@sevasetu.in", role: "ADMIN", status: "Active", specialization: "PHC Administration" },
  "admin@demo.swasthyasetu.in": { id: "ADM-001", name: "Shri Rajesh Verma", email: "admin@demo.swasthyasetu.in", role: "ADMIN", status: "Active", specialization: "PHC Administration" },
  "admin": { id: "ADM-001", name: "Shri Rajesh Verma", email: "admin@demo.sevasetu.in", role: "ADMIN", status: "Active", specialization: "PHC Administration" },
  "doctor@demo.sevasetu.in": { id: "DOC-PHC-0001", name: "Dr. Aravind Kumar", email: "doctor@demo.sevasetu.in", role: "DOCTOR", status: "Active", specialization: "General Medicine" },
  "doctor@sevasetu.in": { id: "DOC-PHC-0001", name: "Dr. Aravind Kumar", email: "doctor@sevasetu.in", role: "DOCTOR", status: "Active", specialization: "General Medicine" },
  "doctor@demo.swasthyasetu.in": { id: "DOC-PHC-0001", name: "Dr. Aravind Kumar", email: "doctor@demo.swasthyasetu.in", role: "DOCTOR", status: "Active", specialization: "General Medicine" },
  "doctor": { id: "DOC-PHC-0001", name: "Dr. Aravind Kumar", email: "doctor@demo.sevasetu.in", role: "DOCTOR", status: "Active", specialization: "General Medicine" },
  "pending@demo.sevasetu.in": { id: "DOC-002", name: "Dr. Priya Rani", email: "pending@demo.sevasetu.in", role: "DOCTOR", status: "Pending", specialization: "Pediatrics" },
  "suspended@demo.sevasetu.in": { id: "DOC-003", name: "Dr. Rajesh Sharma", email: "suspended@demo.sevasetu.in", role: "DOCTOR", status: "Suspended", specialization: "Orthopedics" },
  "deactivated@demo.sevasetu.in": { id: "DOC-004", name: "Dr. Suresh Babu", email: "deactivated@demo.sevasetu.in", role: "DOCTOR", status: "Deactivated", specialization: "Dermatology" },
};

export const login = async (emailOrId: string, _password?: string, extraUsers: User[] = []): Promise<User | null> => {
  await new Promise(resolve => setTimeout(resolve, 200));

  const raw = (emailOrId || "").trim();
  const query = raw.toLowerCase();
  if (!query) return null;

  const adminMatches = [
    "admin",
    "adm-001",
    "adm001",
    "adm-1",
    "admin1",
    "admin@demo.sevasetu.in",
    "admin@sevasetu.in",
    "admin@demo.swasthyasetu.in",
    "admin@phc.in",
    "admin@gmail.com",
  ];

  if (adminMatches.includes(query) || query.startsWith("adm-") || query.startsWith("admin")) {
    return { id: DEFAULT_ADMIN_ID, name: "Shri Rajesh Verma", email: "admin@demo.sevasetu.in", role: "ADMIN", status: "Active", specialization: "PHC Administration" };
  }

  const doctorMatches = [
    "doctor",
    "doc-001",
    "doc-phc-0001",
    "doc-phc-001",
    "doc001",
    "doc1",
    "doctor@demo.sevasetu.in",
    "doctor@sevasetu.in",
    "doctor@demo.swasthyasetu.in",
    "doctor@phc.in",
  ];

  if (doctorMatches.includes(query) || query.startsWith("doc-phc-") || query.startsWith("doc-") || query.startsWith("doctor")) {
    return { id: DEFAULT_DOCTOR_ID, name: "Dr. Aravind Kumar", email: "doctor@demo.sevasetu.in", role: "DOCTOR", status: "Active", specialization: "General Medicine" };
  }

  for (const [key, user] of Object.entries(demoUsers)) {
    if (key.toLowerCase() === query || user.id.toLowerCase() === query || user.email.toLowerCase() === query) {
      return user;
    }
  }

  const userInExtra = extraUsers.find(
    u => u.email.toLowerCase() === query || u.id.toLowerCase() === query || u.name.toLowerCase() === query
  );
  if (userInExtra) return userInExtra;

  if (query.includes("admin")) {
    return { id: DEFAULT_ADMIN_ID, name: "Shri Rajesh Verma", email: raw, role: "ADMIN", status: "Active", specialization: "PHC Administration" };
  }

  if (query.includes("doc")) {
    return { id: DEFAULT_DOCTOR_ID, name: "Dr. Medical Officer", email: raw, role: "DOCTOR", status: "Active", specialization: "General Medicine" };
  }

  return null;
};

