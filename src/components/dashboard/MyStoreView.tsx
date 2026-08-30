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

export default function MyStoreView({ role: _role }: MyStoreViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"hero" | "stats" | "showcase" | "master" | "video" | "card_grid" | "roadmap" | "faq">("hero");

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-6 border-b border-neutral-200 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => setActiveSubTab("hero")}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === "hero"
              ? "border-black text-black"
              : "border-transparent text-neutral-400 hover:text-black"
          }`}
        >
          Hero Section
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("stats")}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === "stats"
              ? "border-black text-black"
              : "border-transparent text-neutral-400 hover:text-black"
          }`}
        >
          Statistics Section
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("showcase")}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === "showcase"
              ? "border-black text-black"
              : "border-transparent text-neutral-400 hover:text-black"
          }`}
        >
          Showcase Section
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("master")}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === "master"
              ? "border-black text-black"
              : "border-transparent text-neutral-400 hover:text-black"
          }`}
        >
          Master at Hustlify
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("video")}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === "video"
              ? "border-black text-black"
              : "border-transparent text-neutral-400 hover:text-black"
          }`}
        >
          Video Section
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("card_grid")}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === "card_grid"
              ? "border-black text-black"
              : "border-transparent text-neutral-400 hover:text-black"
          }`}
        >
          Image Cards
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("roadmap")}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === "roadmap"
              ? "border-black text-black"
              : "border-transparent text-neutral-400 hover:text-black"
          }`}
        >
          Roadmap
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("faq")}
          className={`pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeSubTab === "faq"
              ? "border-black text-black"
              : "border-transparent text-neutral-400 hover:text-black"
          }`}
        >
          FAQ
        </button>
      </div>

      {/* Sub-tab Views */}
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

