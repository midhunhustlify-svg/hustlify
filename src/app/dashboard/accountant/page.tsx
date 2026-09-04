"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AccountsView from "@/components/dashboard/AccountsView";
import { useDashboard } from "@/context/DashboardContext";

export default function AccountantDashboard() {
  const { activeTab } = useDashboard();

  return (
    <DashboardLayout role="accountant">
      {activeTab === "accounts" || !activeTab || activeTab === "dashboard" ? (
        <AccountsView role="accountant" />
      ) : (
        <div className="w-full">
          <AccountsView role="accountant" />
        </div>
      )}
    </DashboardLayout>
  );
}
