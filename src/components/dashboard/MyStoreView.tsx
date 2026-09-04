"use client";

import { useState } from "react";
import { UserRole } from "@/types/auth";
import HeroSectionEditor from "@/components/dashboard/mystore/HeroSectionEditor";
import StatisticsSectionEditor from "@/components/dashboard/mystore/StatisticsSectionEditor";
import FeatureSliderEditor from "@/components/dashboard/mystore/FeatureSliderEditor";
import MasterSectionEditor from "@/components/dashboard/mystore/MasterSectionEditor";
import VideoSectionEditor from "@/components/dashboard/mystore/VideoSectionEditor";
import CardGridSectionEditor from "@/components/dashboard/mystore/CardGridSectionEditor";
import RoadmapSectionEditor from "@/components/dashboard/mystore/RoadmapSectionEditor";
import FaqSectionEditor from "@/components/dashboard/mystore/FaqSectionEditor";

interface MyStoreViewProps {
  role: UserRole;
}

type TabKey = "hero" | "stats" | "showcase" | "master" | "video" | "card_grid" | "roadmap" | "faq";

interface TabItem {
  id: TabKey;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabItem[] = [
  {
    id: "hero",
    label: "Hero Section",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    id: "stats",
    label: "Statistics",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "showcase",
    label: "Showcase Sliders",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: "master",
    label: "Master at Hustlify",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    id: "video",
    label: "Video Section",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "card_grid",
    label: "Image Cards",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: "roadmap",
    label: "Roadmap",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    id: "faq",
    label: "FAQ",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function MyStoreView({ role: _role }: MyStoreViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<TabKey>("hero");

  return (
    <div className="space-y-8 max-w-4xl">
      {/* ── Sub-Navigation Pill Tabs ── */}
      <div className="bg-neutral-100/90 p-1.5 rounded-xl border border-neutral-200/80">
        <div className="flex items-center gap-1.5 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-white text-black shadow-sm font-bold"
                    : "text-neutral-600 hover:text-black hover:bg-white/50"
                }`}
              >
                <span className={isActive ? "text-black" : "text-neutral-500"}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Sub-tab Views ── */}
      {activeSubTab === "hero" && <HeroSectionEditor />}
      {activeSubTab === "stats" && <StatisticsSectionEditor />}
      {activeSubTab === "showcase" && <FeatureSliderEditor />}
      {activeSubTab === "master" && <MasterSectionEditor />}
      {activeSubTab === "video" && <VideoSectionEditor />}
      {activeSubTab === "card_grid" && <CardGridSectionEditor />}
      {activeSubTab === "roadmap" && <RoadmapSectionEditor />}
      {activeSubTab === "faq" && <FaqSectionEditor />}
    </div>
  );
}
