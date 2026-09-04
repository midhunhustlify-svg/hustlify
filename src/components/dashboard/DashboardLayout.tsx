"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { UserRole, ROLE_CONFIG } from "@/types/auth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardBottomNav from "@/components/dashboard/DashboardBottomNav";
import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/context/DashboardContext";

export interface NavItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

interface DashboardLayoutProps {
  role: UserRole;
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  customNavItems?: NavItem[];
}

export default function DashboardLayout({
  role,
  children,
  activeTab: controlledActiveTab,
  onTabChange,
  customNavItems,
}: DashboardLayoutProps) {
  const router = useRouter();
  const { user, userEmail, loading, logout } = useAuth();
  const { activeTab: contextActiveTab, setActiveTab: setContextActiveTab } = useDashboard();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const activeTab =
    controlledActiveTab !== undefined ? controlledActiveTab : contextActiveTab;

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setContextActiveTab(tabId);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xs text-neutral-400 font-medium tracking-wider">
          Loading...
        </div>
      </div>
    );
  }

  const roleLabel = ROLE_CONFIG[role]?.label || role;

  const defaultNavItems: NavItem[] = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: "mystore",
      name: "My Store",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      id: "enquiries",
      name: "Enquiries",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
    },
  ];

  // Add Sales nav item for super_admin and sales_admin roles only
  if (role === "super_admin" || role === "sales_admin") {
    defaultNavItems.push({
      id: "sales",
      name: "Sales",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    });
  }

  // Add Accounts nav item for super_admin, admin, and accountant roles
  if (role === "super_admin" || role === "admin" || role === "accountant") {
    defaultNavItems.push({
      id: "accounts",
      name: "Accounts",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    });
  }

  // Add Onboarding nav item for super_admin and hr roles only
  if (role === "super_admin" || role === "hr") {
    defaultNavItems.push({
      id: "onboarding",
      name: "Onboarding",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    });
  }

  // Settings nav item is always placed at the end
  defaultNavItems.push({
    id: "settings",
    name: "Settings",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  });

  const navigationItems = customNavItems || defaultNavItems;

  const getActiveTitle = () => {
    if (activeTab === "settings") return "Settings";
    if (activeTab === "mystore") return "My Store";
    if (activeTab === "sales") return "Sales & Conversions";
    if (activeTab === "accounts") return "Accounts & Finance";
    if (activeTab === "onboarding") return "Staff Onboarding";
    const current = navigationItems.find((item) => item.id === activeTab);
    return current?.name || "Dashboard Overview";
  };

  return (
    <div className="h-screen w-full bg-black text-white flex flex-col md:flex-row overflow-hidden">
      {/* Left Sidebar - Desktop only (Untouched) */}
      <aside className="hidden md:flex flex-col w-64 bg-neutral-950 p-6 flex-shrink-0 h-screen overflow-y-auto justify-between">
        <div className="space-y-8">
          {/* Centered Logo */}
          <div className="flex justify-center items-center w-full">
            <Link href="/" className="flex justify-center items-center w-full">
              <Image
                src="/logo/logo.png"
                alt="Hustlify Logo"
                width={150}
                height={48}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navigationItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    handleTabClick(item.id);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-sm transition-colors text-left ${
                    isActive
                      ? "bg-white text-black"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sign Out at Bottom */}
        <div className="pt-8">
          <button
            onClick={handleLogout}
            className="w-full bg-neutral-900 text-white hover:bg-white hover:text-black font-semibold text-xs py-2.5 px-3 rounded-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Right Side Column - Fixed viewport with internal scroll only for main content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white text-black">
        {/* Top Header - Fixed */}
        <div className="flex-shrink-0">
          <DashboardHeader
            role={role}
            userEmail={userEmail}
            activeTitle={getActiveTitle()}
          />
        </div>

        {/* Right Side Main Content Area - Scrollable */}
        <main className="flex-1 p-6 md:p-10 pb-24 md:pb-10 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar & Slide-up Sheet */}
      <DashboardBottomNav
        items={navigationItems}
        activeTab={activeTab}
        onTabChange={handleTabClick}
        userEmail={userEmail}
        onLogout={handleLogout}
        role={role}
        isMenuOpen={mobileSidebarOpen}
        onToggleMenu={setMobileSidebarOpen}
      />
    </div>
  );
}
