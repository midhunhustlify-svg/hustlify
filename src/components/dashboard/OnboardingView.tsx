"use client";

import { useState, useEffect, useCallback } from "react";
import { UserRole, ROLE_CONFIG } from "@/types/auth";

import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmDeleteModal from "@/components/dashboard/ConfirmDeleteModal";

// Roles that can be assigned to new staff
const ASSIGNABLE_ROLES: { value: UserRole; label: string; description: string; color: string }[] = [
  {
    value: "accountant",
    label: "Accountant",
    description: "Manages financial records and accounts",
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: "sales_admin",
    label: "Sales Admin",
    description: "Oversees the sales team and targets",
    color: "bg-purple-100 text-purple-700",
  },
  {
    value: "sales_staff",
    label: "Sales Staff",
    description: "Handles direct sales and customer outreach",
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    value: "hr",
    label: "HR",
    description: "Manages staff onboarding and HR operations",
    color: "bg-rose-100 text-rose-700",
  },
  {
    value: "admin",
    label: "Admin",
    description: "General admin with broader access",
    color: "bg-amber-100 text-amber-700",
  },
  {
    value: "student",
    label: "Student",
    description: "Enrolled student with course access",
    color: "bg-green-100 text-green-700",
  },
];

interface StaffMember {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  created_at: string;
  confirmed: boolean;
}

interface OnboardingViewProps {
  role: UserRole;
}

export default function OnboardingView({ role: _role }: OnboardingViewProps) {
  const { showToast } = useToast();
  const { role: currentUserRole } = useAuth();

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    assignedRole: "" as UserRole | "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Filter / search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

  // Deletion / removal modal state
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);

  // Fetch staff via API route (uses service role — bypasses RLS)
  const fetchStaff = useCallback(async () => {
    setLoadingStaff(true);
    try {
      const res = await fetch("/api/onboard-staff");
      const result = await res.json();

      if (!res.ok || result.error) {
        showToast("Failed to load staff: " + (result.error || "Unknown error"), "error");
        setStaffList([]);
      } else {
        setStaffList(
          (result.staff || []).map((item: Record<string, unknown>) => ({
            id: item.id as string,
            email: (item.email as string) || "",
            role: (item.role as UserRole) || "student",
            full_name: (item.full_name as string) || "",
            created_at: (item.created_at as string) || new Date().toISOString(),
            confirmed: (item.confirmed as boolean) ?? false,
          }))
        );
      }
    } catch (err: unknown) {
      showToast("Error loading staff", "error");
      console.error(err);
    } finally {
      setLoadingStaff(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.assignedRole) {
      showToast("Please select a role", "error");
      return;
    }
    if (formData.password.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/onboard-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          role: formData.assignedRole,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        showToast(result.error || "Failed to onboard staff", "error");
        return;
      }

      showToast(
        `${formData.fullName || formData.email} onboarded as ${ROLE_CONFIG[formData.assignedRole as UserRole]?.label}`,
        "success"
      );

      setFormData({ fullName: "", email: "", password: "", assignedRole: "" });
      setShowForm(false);
      await fetchStaff();
    } catch (err: unknown) {
      showToast("Something went wrong. Please try again.", "error");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!deletingStaff) return;
    const member = deletingStaff;

    setRemovingId(member.id);
    try {
      const res = await fetch("/api/onboard-staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.id }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        showToast(result.error || "Failed to remove staff member", "error");
      } else {
        showToast(`${member.full_name || member.email} removed successfully`, "info");
        setStaffList((prev) => prev.filter((s) => s.id !== member.id));
        setDeletingStaff(null);
      }
    } catch {
      showToast("Error removing staff member", "error");
    } finally {
      setRemovingId(null);
    }
  };

  // Filtered staff list
  const filteredStaff = staffList.filter((member) => {
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      member.email.toLowerCase().includes(query) ||
      (member.full_name || "").toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  const getRoleBadge = (memberRole: UserRole) => {
    const match = ASSIGNABLE_ROLES.find((r) => r.value === memberRole);
    return match?.color || "bg-neutral-100 text-neutral-600";
  };

  const canOnboard = currentUserRole === "super_admin" || currentUserRole === "hr";

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Staff Onboarding
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            {currentUserRole === "super_admin"
              ? "Onboard new staff members and assign roles across the organisation."
              : "Onboard new staff and manage your team members."}
          </p>
        </div>
        {canOnboard && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 bg-black text-white text-xs font-bold rounded-sm hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
          >
            {showForm ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Onboard Staff
              </>
            )}
          </button>
        )}
      </div>

      {/* Onboard Form */}
      <AnimatePresence>
        {showForm && canOnboard && (
          <motion.div
            key="onboard-form"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-neutral-200 rounded-lg p-6"
          >
            <h2 className="text-sm font-bold text-neutral-800 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">+</span>
              New Staff Member
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="onboard-fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-sm text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-800/30 focus:border-neutral-400 transition-all placeholder:text-neutral-400"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="onboard-email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="staff@company.com"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-sm text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-800/30 focus:border-neutral-400 transition-all placeholder:text-neutral-400"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Temporary Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="onboard-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min. 8 characters"
                      className="w-full px-3.5 py-2.5 pr-10 bg-neutral-50 border border-neutral-200 rounded-sm text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-800/30 focus:border-neutral-400 transition-all placeholder:text-neutral-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Assign Role <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="onboard-assignedRole"
                      name="assignedRole"
                      required
                      value={formData.assignedRole}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-sm text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-800/30 focus:border-neutral-400 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select a role...</option>
                      {ASSIGNABLE_ROLES
                        .filter((r) =>
                          currentUserRole === "super_admin"
                            ? true
                            : r.value !== "hr" && r.value !== "admin"
                        )
                        .map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label} — {r.description}
                          </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role preview */}
              {formData.assignedRole && (
                <div className="flex items-center gap-2 p-3 bg-neutral-50 border border-neutral-200 rounded-sm">
                  {(() => {
                    const selected = ASSIGNABLE_ROLES.find((r) => r.value === formData.assignedRole);
                    if (!selected) return null;
                    return (
                      <>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${selected.color}`}>
                          {selected.label}
                        </span>
                        <span className="text-xs text-neutral-500">{selected.description}</span>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ fullName: "", email: "", password: "", assignedRole: "" });
                  }}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-black text-white text-xs font-bold rounded-sm hover:bg-neutral-800 transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Onboarding...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Onboard Staff Member
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff List */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        {/* List Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold text-neutral-800">
            Team Members
            {!loadingStaff && (
              <span className="ml-2 text-[11px] font-semibold text-neutral-400">
                ({filteredStaff.length})
              </span>
            )}
          </h2>

          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="onboarding-search"
                type="text"
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-sm text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-800/30 transition-all w-44 placeholder:text-neutral-400"
              />
            </div>

            {/* Role filter */}
            <div className="relative">
              <select
                id="onboarding-role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
                className="pl-3 pr-7 py-2 bg-neutral-50 border border-neutral-200 rounded-sm text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-800/30 transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Roles</option>
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-400">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loadingStaff ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
            <p className="text-xs text-neutral-400">Loading team members...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-700">
                {searchQuery || roleFilter !== "all"
                  ? "No staff match your search"
                  : "No staff onboarded yet"}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {searchQuery || roleFilter !== "all"
                  ? "Try a different search or filter"
                  : canOnboard
                  ? "Click 'Onboard Staff' to add your first team member."
                  : "No team members have been added yet."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Onboarded</th>
                  {canOnboard && (
                    <th className="px-5 py-3 text-right text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filteredStaff.map((member) => {
                  const roleCfg = ROLE_CONFIG[member.role];
                  const badgeClass = getRoleBadge(member.role);
                  const isRemoving = removingId === member.id;

                  return (
                    <tr key={member.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[11px] font-bold shrink-0 uppercase">
                            {(member.full_name || member.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-neutral-800 truncate max-w-[120px]">
                            {member.full_name || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-500 truncate max-w-[180px]">{member.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${badgeClass}`}>
                          {roleCfg?.label || member.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-neutral-400">
                        {new Date(member.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      {canOnboard && (
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            disabled={isRemoving}
                            onClick={() => setDeletingStaff(member)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded-sm transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {isRemoving ? (
                              <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reusable Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingStaff}
        onClose={() => setDeletingStaff(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Staff Member"
        itemName={deletingStaff?.full_name || deletingStaff?.email}
        message={
          deletingStaff ? (
            <>
              Are you sure you want to remove{" "}
              <strong className="text-neutral-900 font-bold">
                {deletingStaff.full_name || deletingStaff.email}
              </strong>{" "}
              from the system? Their access credentials and dashboard permissions will be deleted permanently.
            </>
          ) : undefined
        }
        confirmText="Remove Staff"
        isLoading={!!removingId}
      />
    </div>
  );
}
