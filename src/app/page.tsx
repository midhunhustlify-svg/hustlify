"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getRoleDashboardPath } from "@/lib/auth";
import { useDashboard } from "@/context/DashboardContext";
import HeroSection from "@/components/landing/HeroSection";
import HeroSkeleton from "@/components/landing/HeroSkeleton";
import StatisticsSection from "@/components/landing/StatisticsSection";
import StatisticsSkeleton from "@/components/landing/StatisticsSkeleton";
import FeatureSliderSection from "@/components/landing/FeatureSliderSection";
import MasterSection from "@/components/landing/MasterSection";
import VideoSection from "@/components/landing/VideoSection";
import CardGridSection from "@/components/landing/CardGridSection";
import RoadmapSection from "@/components/landing/RoadmapSection";
import FaqSection from "@/components/landing/FaqSection";
import ContactSection from "@/components/landing/ContactSection";
import Footer from "@/components/landing/Footer";
import FloatingContactWidget from "@/components/landing/FloatingContactWidget";

export default function Home() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const {
    settings,
    settingsLoaded,
    heroData,
    heroLoaded,
    statisticsData,
    statisticsLoaded,
    featureSliderData,
    featureSliderLoaded,
    masterData,
    masterLoaded,
    videoData,
    videoLoaded,
    cardGridData,
    cardGridLoaded,
    roadmapData,
    roadmapLoaded,
    faqData,
    faqLoaded,
  } = useDashboard();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const destination = getRoleDashboardPath(user.user_metadata?.role);
        router.replace(destination);
      } else {
        setCheckingAuth(false);
      }
    });
  }, [router]);

  if (
    checkingAuth ||
    !settingsLoaded ||
    !heroLoaded ||
    !statisticsLoaded ||
    !featureSliderLoaded ||
    !masterLoaded ||
    !videoLoaded ||
    !cardGridLoaded ||
    !roadmapLoaded ||
    !faqLoaded
  ) {
    return (
      <main className="flex-1 bg-black text-white flex flex-col">
        <HeroSkeleton />
        <StatisticsSkeleton />
      </main>
    );
  }

  return (
    <main className="flex-1 text-white flex flex-col relative min-h-screen">
      {/* Fixed Landing Page Background Image & Shadow */}
      <div className="fixed inset-0 -z-20 w-full h-full pointer-events-none">
        <Image
          src="/background/background.png"
          alt="Landing Background"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <HeroSection data={heroData} />
      <StatisticsSection data={statisticsData} />
      <FeatureSliderSection data={featureSliderData} />
      <MasterSection data={masterData} />
      <VideoSection data={videoData} />
      <CardGridSection data={cardGridData} />
      <RoadmapSection data={roadmapData} />
      <FaqSection data={faqData} />
      <ContactSection settings={settings} />
      <Footer settings={settings} />
      <FloatingContactWidget />
    </main>
  );
}


