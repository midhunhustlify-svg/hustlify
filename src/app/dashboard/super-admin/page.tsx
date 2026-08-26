"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SettingsView from "@/components/dashboard/SettingsView";
import { useDashboard } from "@/context/DashboardContext";

export default function SuperAdminDashboard() {
  const { activeTab } = useDashboard();

  return (
    <DashboardLayout role="super_admin">
      {activeTab === "settings" ? (
        <SettingsView role="super_admin" />
      ) : (
        <div className="w-full">
          {/* Dashboard content placeholder */}
        </div>
      )}
    </DashboardLayout>
  );
}
