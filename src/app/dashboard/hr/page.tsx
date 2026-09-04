"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import EnquiriesView from "@/components/dashboard/EnquiriesView";
import OnboardingView from "@/components/dashboard/OnboardingView";
import { useDashboard } from "@/context/DashboardContext";

export default function HRDashboard() {
  const { activeTab } = useDashboard();

  return (
    <DashboardLayout role="hr">
      {activeTab === "enquiries" ? (
        <EnquiriesView role="hr" />
      ) : activeTab === "onboarding" ? (
        <OnboardingView role="hr" />
      ) : (
        <div className="w-full">
          {/* HR Dashboard overview placeholder */}
        </div>
      )}
    </DashboardLayout>
  );
}
