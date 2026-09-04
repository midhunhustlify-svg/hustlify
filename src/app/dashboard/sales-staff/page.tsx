"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import EnquiriesView from "@/components/dashboard/EnquiriesView";
import { useDashboard } from "@/context/DashboardContext";

export default function SalesStaffDashboard() {
  const { activeTab } = useDashboard();

  return (
    <DashboardLayout role="sales_staff">
      {activeTab === "enquiries" || !activeTab || activeTab === "dashboard" ? (
        <EnquiriesView role="sales_staff" />
      ) : (
        <EnquiriesView role="sales_staff" />
      )}
    </DashboardLayout>
  );
}
