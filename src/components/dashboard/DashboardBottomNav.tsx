"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserRole, ROLE_CONFIG } from "@/types/auth";
import { NavItem } from "@/components/dashboard/DashboardLayout";

interface DashboardBottomNavProps {
  items: NavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  userEmail?: string;
  onLogout: () => void;
  role?: UserRole;
  isMenuOpen?: boolean;
  onToggleMenu?: (isOpen: boolean) => void;
}

export default function DashboardBottomNav({
  items,
  activeTab,
  onTabChange,
  userEmail,
  onLogout,
  role,
  isMenuOpen: controlledIsOpen,
  onToggleMenu,
}: DashboardBottomNavProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isMenuOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setMenuOpen = (open: boolean) => {
    if (onToggleMenu) {
      onToggleMenu(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  const handleItemSelect = (itemId: string) => {
    onTabChange(itemId);
    setMenuOpen(false);
  };

  // Quick items displayed in the bottom bar beside the Menu button
  // Shows items such as Settings and any additional custom sidebar items added
  const bottomBarItems = items.filter((item) => item.id !== "dashboard");
  const quickItems = bottomBarItems.length > 0 ? bottomBarItems : items;

  const roleLabel = role ? ROLE_CONFIG[role]?.label || role : null;

  return (
    <>
      {/* Fixed Bottom Navigation Bar - Mobile only */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800/80 px-3 py-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] shadow-lg"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {/* 1st: Menu Bar Icon Button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!isMenuOpen)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-lg transition-all ${
              isMenuOpen
                ? "text-white"
                : "text-neutral-400 hover:text-white active:scale-95"
            }`}
          >
            <div
              className={`p-1.5 rounded-md transition-colors ${
                isMenuOpen ? "bg-neutral-800 text-white" : ""
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </div>
            <span className="text-[10px] font-semibold tracking-wider mt-0.5">
              Menu
            </span>
          </button>

          {/* Subsequent Icons: Settings & other sidebar items */}
          {quickItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemSelect(item.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-lg transition-all ${
                  isActive
                    ? "text-white"
                    : "text-neutral-400 hover:text-white active:scale-95"
                }`}
              >
                <div
                  className={`p-1.5 rounded-md transition-colors ${
                    isActive ? "bg-white text-black shadow-sm" : ""
                  }`}
                >
                  {item.icon ? (
                    <div className="w-5 h-5 flex items-center justify-center">
                      {item.icon}
                    </div>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={`text-[10px] tracking-wider mt-0.5 ${
                    isActive ? "font-bold text-white" : "font-medium"
                  }`}
                >
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Slide-up Bottom Sheet Menu ("bottom come menu bar it will show all side bar") */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-xs z-50"
            />

            {/* Slide-Up Bottom Drawer Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-950 border-t border-neutral-800 rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
            >
              {/* Grab Handle */}
              <div className="pt-3 pb-1 flex justify-center items-center">
                <div className="w-10 h-1 bg-neutral-700 rounded-full" />
              </div>

              {/* Sheet Header */}
              <div className="px-5 py-3 flex items-center justify-between border-b border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold tracking-tight text-white uppercase">
                    Navigation Menu
                  </h2>
                  {roleLabel && (
                    <span className="bg-neutral-800 text-neutral-300 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm">
                      {roleLabel}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-md focus:outline-none"
                  aria-label="Close menu"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Sheet Content: All Sidebar Navigation Links */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
                <div className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider px-3 mb-2">
                  All Sidebar Items
                </div>
                {items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemSelect(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 text-xs font-semibold rounded-md transition-colors text-left ${
                        isActive
                          ? "bg-white text-black"
                          : "text-neutral-300 hover:text-white hover:bg-neutral-900 active:bg-neutral-800"
                      }`}
                    >
                      {item.icon && (
                        <span className="w-4 h-4 flex items-center justify-center">
                          {item.icon}
                        </span>
                      )}
                      <span className="text-xs font-semibold">{item.name}</span>
                      {isActive && (
                        <span className="ml-auto text-[10px] uppercase font-bold tracking-wider opacity-80">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Sheet Footer: User Email & Sign Out */}
              <div className="px-5 pt-3 border-t border-neutral-800/80 space-y-3">
                {userEmail && (
                  <div className="px-1">
                    <p className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">
                      Signed in as
                    </p>
                    <p className="text-xs text-neutral-300 font-medium truncate mt-0.5">
                      {userEmail}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full bg-neutral-900 hover:bg-white hover:text-black text-white font-semibold text-xs py-2.5 px-3 rounded-md transition-colors flex items-center justify-center gap-2 border border-neutral-800 hover:border-white"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
