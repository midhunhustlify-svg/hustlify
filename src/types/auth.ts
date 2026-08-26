export type UserRole =
  | "super_admin"
  | "admin"
  | "accountant"
  | "hr"
  | "sales_admin"
  | "sales_staff"
  | "student";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
}

export const ROLE_CONFIG: Record<
  UserRole,
  { label: string; dashboardPath: string }
> = {
  super_admin: {
    label: "Super Admin",
    dashboardPath: "/dashboard/super-admin",
  },
  admin: {
    label: "Admin",
    dashboardPath: "/dashboard/admin",
  },
  accountant: {
    label: "Accountant",
    dashboardPath: "/dashboard/accountant",
  },
  hr: {
    label: "HR",
    dashboardPath: "/dashboard/hr",
  },
  sales_admin: {
    label: "Sales Admin",
    dashboardPath: "/dashboard/sales-admin",
  },
  sales_staff: {
    label: "Sales Staff",
    dashboardPath: "/dashboard/sales-staff",
  },
  student: {
    label: "Student",
    dashboardPath: "/dashboard/student",
  },
};
