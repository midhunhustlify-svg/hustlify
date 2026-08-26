"use client";

import { UserRole, ROLE_CONFIG } from "@/types/auth";

interface DashboardHeaderProps {
  role: UserRole;
  userEmail?: string;
  activeTitle?: string;
}

export default function DashboardHeader({
  role,
  userEmail,
  activeTitle,
}: DashboardHeaderProps) {
  const roleLabel = ROLE_CONFIG[role]?.label || role;

  return (
    <header className="w-full bg-white text-black px-6 md:px-10 py-5 flex items-center justify-between">
      {/* Left side: Page Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-black capitalize">
          {activeTitle || "Dashboard"}
        </h1>
      </div>

      {/* Right side: User email and Role badge */}
      <div className="flex items-center space-x-4">
        {userEmail && (
          <span className="text-xs text-neutral-500 font-medium hidden sm:inline-block">
            {userEmail}
          </span>
        )}

        <span className="bg-black text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm">
          {roleLabel}
        </span>
      </div>
    </header>
  );
}
