"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FeatureSliderData, FeatureSlideItem } from "@/context/DashboardContext";

interface FeatureSliderSectionProps {
  data: FeatureSliderData;
}

export default function FeatureSliderSection({ data }: FeatureSliderSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Filter out completely empty items so no empty slides are shown
  const validItems = useMemo(() => {
    if (!data?.items || !Array.isArray(data.items)) return [];
    return data.items.filter(
      (item: FeatureSlideItem) =>
        item.heading?.trim() ||
        item.subheading?.trim() ||
        item.subtitle?.trim() ||
        item.description?.trim() ||
        item.image_url?.trim()
    );
  }, [data]);

  const total = validItems.length;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-transition timer (5 seconds)
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [total, isPaused, nextSlide, currentIndex]);

  // If no items have content, strictly render nothing (no mock data)
  if (total === 0) {
    return null;
  }

  // Ensure current index is valid if items array size changes
  const activeSlideIndex = currentIndex >= total ? 0 : currentIndex;
  const currentItem = validItems[activeSlideIndex];

  return (
    <section
      className="relative w-full bg-transparent text-white py-16 md:py-16 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >

      {/* Left Navigation Arrow (Y-axis centered on left) */}
      {total > 1 && (
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-2 sm:left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all border border-neutral-800 hover:border-neutral-700 backdrop-blur-sm shadow-xl focus:outline-none"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Right Navigation Arrow (Y-axis centered on right) */}
      {total > 1 && (
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-2 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all border border-neutral-800 hover:border-neutral-700 backdrop-blur-sm shadow-xl focus:outline-none"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-12 lg:px-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 items-center">
          {/* Left Side: Dynamic Content (Expanded Column Width & Sizing) */}
          <div className="lg:col-span-7 flex flex-col justify-center min-h-0 lg:min-h-[340px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${activeSlideIndex}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                className="space-y-3 sm:space-y-3.5"
              >
                {/* Subtitle Badge */}
                {currentItem.subtitle && (
                  <div className="inline-flex items-center">
                    <span className="px-3.5 py-1.5 rounded-full bg-blue-700 text-neutral-300 text-xs sm:text-sm font-semibold tracking-widest uppercase">
                      {currentItem.subtitle}
                    </span>
                  </div>
                )}

                {/* Heading */}
                {currentItem.heading && (
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
                    {currentItem.heading}
                  </h2>
                )}

                {/* Subheading in Gold */}
                {currentItem.subheading && (
                  <h3 className="text-xl sm:text-3xl lg:text-4xl font-semibold text-[#D4AF37] leading-snug">
                    {currentItem.subheading}
                  </h3>
                )}

                {/* Description */}
                {currentItem.description && (
                  <p className="text-sm sm:text-base text-neutral-300 font-normal leading-relaxed max-w-3xl">
                    {currentItem.description}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Side: Dynamic Image (Persistent Preloaded Stack) */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end items-center">
            <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-none aspect-[16/10] sm:aspect-[16/10] lg:aspect-[4/3] max-h-[280px] sm:max-h-[360px] lg:max-h-[420px] flex items-center justify-center">
              {validItems.map((item, idx) => {
                if (!item.image_url) return null;
                const isActive = idx === activeSlideIndex;
                return (
                  <motion.div
                    key={item.id || `slide-img-${idx}`}
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0,
                      scale: isActive ? 1 : 0.97,
                      zIndex: isActive ? 10 : 0,
                    }}
                    transition={{ duration: 0.45, ease: "easeInOut" }}
                    className={`absolute inset-0 w-full h-full flex items-center justify-center ${
                      isActive ? "pointer-events-auto" : "pointer-events-none"
                    }`}
                  >
                    <Image
                      src={item.image_url}
                      alt={item.heading || `Showcase slide ${idx + 1}`}
                      fill
                      priority={idx === 0}
                      loading="eager"
                      className="object-contain"
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 450px"
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Centered Slide Indicators */}
        {total > 1 && (
          <div className="pt-6 sm:pt-12 flex justify-center items-center">
            <div className="flex items-center space-x-1">
              {validItems.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === activeSlideIndex
                      ? "w-5 bg-[#D4AF37]"
                      : "w-2.5 bg-neutral-700 hover:bg-neutral-500"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
