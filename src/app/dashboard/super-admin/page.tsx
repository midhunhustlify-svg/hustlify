"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SettingsView from "@/components/dashboard/SettingsView";
import MyStoreView from "@/components/dashboard/MyStoreView";
import EnquiriesView from "@/components/dashboard/EnquiriesView";
import SalesView from "@/components/dashboard/SalesView";
import OnboardingView from "@/components/dashboard/OnboardingView";
import AccountsView from "@/components/dashboard/AccountsView";
import SuperAdminDashboardView from "@/components/dashboard/SuperAdminDashboardView";
import { useDashboard } from "@/context/DashboardContext";

export default function SuperAdminDashboard() {
  const { activeTab } = useDashboard();

  return (
    <DashboardLayout role="super_admin">
      {activeTab === "settings" ? (
        <SettingsView role="super_admin" />
      ) : activeTab === "mystore" ? (
        <MyStoreView role="super_admin" />
      ) : activeTab === "enquiries" ? (
        <EnquiriesView role="super_admin" />
      ) : activeTab === "sales" ? (
        <SalesView role="super_admin" />
      ) : activeTab === "onboarding" ? (
        <OnboardingView role="super_admin" />
      ) : activeTab === "accounts" ? (
        <AccountsView role="super_admin" />
      ) : (
        <SuperAdminDashboardView role="super_admin" />
      )}
    </DashboardLayout>
  );
}
