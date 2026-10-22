export const mockPatients = [
  { id: "P-001", name: "Anjali Devi", age: 32, gender: "F", village: "Rampur", condition: "TB DOT", priority: "Routine", asha: "Meena", lastVisit: "2026-08-28" },
  { id: "P-002", name: "Rajesh Kumar", age: 45, gender: "M", village: "Shivpur", condition: "Hypertension", priority: "Needs Attention", asha: "Sunita", lastVisit: "2026-08-25" },
  { id: "P-003", name: "Sita Kumari", age: 24, gender: "F", village: "Rampur", condition: "Pregnancy (ANC)", priority: "Routine", asha: "Meena", lastVisit: "2026-08-30" },
  { id: "P-004", name: "Vikas Singh", age: 52, gender: "M", village: "Baghpat", condition: "Acute Chest Pain", priority: "Critical", asha: "Sunita", lastVisit: "2026-09-01" },
];

export const mockTriageQueue = [
  { id: "Q-001", patient: "Vikas Singh", age: 52, symptoms: "Chest pain", vitals: "Stable", priority: "Critical", asha: "Sunita", source: "Walk-in", time: "08:15 AM", waitingTime: "5m", status: "In Triage" },
  { id: "Q-002", patient: "Sunita Devi", age: 38, symptoms: "Fever, Cough", vitals: "Stable", priority: "Needs Attention", asha: "Meena", source: "ASHA Referral", time: "07:45 AM", waitingTime: "35m", status: "Waiting" },
];

export const dashboardMetrics = {
  newCases: 12,
  criticalCases: 2,
  todayQueue: 18,
  activeReferrals: 5,
  followupsDue: 8,
  sosAlerts: 1,
};

export const mockFollowups = [
  { id: "F-001", patient: "Anjali Devi", case: "TB DOT", date: "2026-09-01", reason: "Monthly checkup", asha: "Meena", priority: "Normal", status: "Due Today" },
  { id: "F-002", patient: "Rajesh Kumar", case: "Hypertension", date: "2026-09-02", reason: "Medication refill", asha: "Sunita", priority: "Normal", status: "Upcoming" },
  { id: "F-003", patient: "Sita Kumari", case: "ANC", date: "2026-08-31", reason: "ANC visit", asha: "Meena", priority: "Normal", status: "Overdue" },
];
