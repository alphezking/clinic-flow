export const APP_ROLES = [
  "super_admin",
  "clinic_admin",
  "receptionist",
  "doctor",
  "nurse",
  "lab_tech",
  "pharmacist",
  "cashier",
  "accountant",
  "records_officer",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  clinic_admin: "Clinic Administrator",
  receptionist: "Receptionist",
  doctor: "Doctor",
  nurse: "Nurse",
  lab_tech: "Laboratory Technician",
  pharmacist: "Pharmacist",
  cashier: "Cashier",
  accountant: "Accountant",
  records_officer: "Records Officer",
};

export const ADMIN_ROLES: AppRole[] = ["super_admin", "clinic_admin"];

export function isAdmin(roles: AppRole[]): boolean {
  return roles.some((r) => ADMIN_ROLES.includes(r));
}

export function hasAnyRole(roles: AppRole[], required: AppRole[]): boolean {
  if (!required.length) return true;
  return roles.some((r) => required.includes(r));
}

/**
 * Which modules each role can access. Admins see everything.
 */
export const MODULE_ACCESS = {
  dashboard: APP_ROLES,
  patients: ["clinic_admin", "super_admin", "receptionist", "doctor", "nurse", "records_officer"] as AppRole[],
  appointments: ["clinic_admin", "super_admin", "receptionist", "doctor", "nurse"] as AppRole[],
  queue: ["clinic_admin", "super_admin", "receptionist", "doctor", "nurse"] as AppRole[],
  consultations: ["clinic_admin", "super_admin", "doctor", "nurse"] as AppRole[],
  laboratory: ["clinic_admin", "super_admin", "lab_tech", "doctor", "nurse"] as AppRole[],
  pharmacy: ["clinic_admin", "super_admin", "pharmacist", "doctor"] as AppRole[],
  billing: ["clinic_admin", "super_admin", "cashier", "accountant", "receptionist"] as AppRole[],
  reports: ["clinic_admin", "super_admin", "accountant"] as AppRole[],
  staff: ADMIN_ROLES,
  settings: ADMIN_ROLES,
  audit: ADMIN_ROLES,
  support: ["clinic_admin", "super_admin"] as AppRole[],
  backups: ADMIN_ROLES,
} as const;

export type ModuleKey = keyof typeof MODULE_ACCESS;

export function canAccess(module: ModuleKey, roles: AppRole[]): boolean {
  return hasAnyRole(roles, [...MODULE_ACCESS[module]]);
}
