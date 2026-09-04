"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import EnquiriesView from "@/components/dashboard/EnquiriesView";
import SalesView from "@/components/dashboard/SalesView";
import SettingsView from "@/components/dashboard/SettingsView";
import { useDashboard } from "@/context/DashboardContext";

export default function SalesAdminDashboard() {
  const { activeTab } = useDashboard();

  return (
    <DashboardLayout role="sales_admin">
      {activeTab === "enquiries" ? (
        <EnquiriesView role="sales_admin" />
      ) : activeTab === "sales" || !activeTab || activeTab === "dashboard" ? (
        <SalesView role="sales_admin" />
      ) : activeTab === "settings" ? (
        <SettingsView role="sales_admin" />
      ) : (
        <SalesView role="sales_admin" />
      )}
    </DashboardLayout>
  );
}
