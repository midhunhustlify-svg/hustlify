"use client";

import { useMemo, useRef } from "react";
import Image from "next/image";
import { motion, useScroll } from "framer-motion";
import { RoadmapSectionData, RoadmapStepItem } from "@/context/DashboardContext";

interface RoadmapSectionProps {
  data: RoadmapSectionData;
}

export default function RoadmapSection({ data }: RoadmapSectionProps) {
  const { heading, description, items } = data || {};
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter valid steps that have either heading, description, or image
  const validSteps = useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    return items.filter(
      (step: RoadmapStepItem) =>
        step.heading?.trim() || step.description?.trim() || step.image_url?.trim()
    );
  }, [items]);

  // Track scroll progress along the roadmap track
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 65%", "end 60%"],
  });

  // Zero Mock Data Policy
  const hasContent = heading?.trim() || description?.trim() || validSteps.length > 0;
  if (!hasContent) {
    return null;
  }

  return (
    <section className="relative w-full bg-transparent text-white py-20 md:py-32 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header (Common Heading & Description) */}
        {(heading || description) && (
          <div className="text-center max-w-5xl mx-auto space-y-4 mb-16 md:mb-24">
            {heading && (
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight"
              >
                {heading}
              </motion.h2>
            )}

            {description && (
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-base text-neutral-300 font-normal leading-relaxed"
              >
                {description}
              </motion.p>
            )}
          </div>
        )}

        {/* Timeline Roadmap Structure Matching Reference */}
        {validSteps.length > 0 && (
          <div ref={containerRef} className="relative pl-8 sm:pl-12">
            {/* Inactive Base Timeline Line */}
            <div className="absolute left-[8px] top-4 bottom-8 w-[2px] -translate-x-1/2 bg-neutral-800/90 pointer-events-none" />

            {/* Active Animated Fill Line on Scroll (Vibrant Blue Glow) */}
            <motion.div
              style={{ scaleY: scrollYProgress, transformOrigin: "top" }}
              className="absolute left-[8px] top-4 bottom-8 w-[2px] -translate-x-1/2 bg-gradient-to-b from-[#2563EB] via-[#3B82F6] to-[#60A5FA] pointer-events-none shadow-[0_0_12px_rgba(59,130,246,0.85)] z-[5]"
            />

            <div className="space-y-16 sm:space-y-24">
              {validSteps.map((step, index) => (
                <motion.div
                  key={step.id || index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.05 }}
                  className="relative group"
                >
                  {/* Step Content: Left Heading | Right (Description + Bottom Image) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
                    {/* Left Column: Step Heading */}
                    <div className="lg:col-span-5 relative">
                      {/* Milestone Circle Dot on the Timeline with full solid blue background */}
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0.8 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: false, margin: "-20% 0px -20% 0px" }}
                        transition={{ duration: 0.3 }}
                        className="absolute -left-[32px] sm:-left-[48px] top-[14px] sm:top-[18px] lg:top-[20px] -translate-y-1/2 w-4 h-4 rounded-full bg-[#3B82F6] border-2 border-[#60A5FA] group-hover:scale-110 transition-all duration-300 z-10 shrink-0 shadow-[0_0_12px_rgba(59,130,246,0.9)]"
                      />

                      {step.heading && (
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
                          {step.heading}
                        </h3>
                      )}
                    </div>

                    {/* Right Column: Decreased Description + Decreased Image Size */}
                    <div className="lg:col-span-7 space-y-4 max-w-lg">
                      {/* Step Description (Decreased font size) */}
                      {step.description && (
                        <p className="text-xs sm:text-sm text-neutral-300 font-normal leading-relaxed">
                          {step.description}
                        </p>
                      )}

                      {/* Step Image at Bottom (Decreased container size) */}
                      {step.image_url && (
                        <div className="relative w-full max-w-lg aspect-[16/10] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800/80 shadow-xl">
                          <Image
                            src={step.image_url}
                            alt={step.heading || `Roadmap step ${index + 1}`}
                            fill
                            className="object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 520px"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
