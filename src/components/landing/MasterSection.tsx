"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { MasterSectionData, MasterCardItem } from "@/context/DashboardContext";

interface MasterSectionProps {
  data: MasterSectionData;
}

export default function MasterSection({ data }: MasterSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { heading, description, items } = data || {};

  // Filter valid cards that have either an image, heading, or description
  const validCards = useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    return items.filter(
      (card: MasterCardItem) =>
        card.heading?.trim() ||
        card.description?.trim() ||
        card.image_url?.trim()
    );
  }, [items]);

  // If no content configured at all, strictly render nothing (no mock data)
  const hasContent = heading?.trim() || description?.trim() || validCards.length > 0;
  if (!hasContent) {
    return null;
  }

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [validCards]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = Math.min(el.clientWidth * 0.8, 400);
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative w-full bg-white text-neutral-900 py-16 md:py-24 overflow-hidden border-t border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14">
          <div className="max-w-2xl space-y-3">
            {heading && (
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900 leading-[1.12]"
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
                className="text-sm sm:text-base text-neutral-600 font-normal leading-relaxed"
              >
                {description}
              </motion.p>
            )}
          </div>

          {/* Navigation Arrows for X-Axis Horizontal Scroll */}
          {validCards.length > 1 && (
            <div className="hidden sm:flex items-center space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className="p-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black transition-all border border-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className="p-3 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-black transition-all border border-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Cards Container: 1 Column Grid on Mobile, Horizontal Scroll on Tablet/Desktop */}
        {validCards.length > 0 && (
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="sm:overflow-x-auto sm:overflow-y-hidden sm:scroll-smooth pb-4 pt-2 sm:snap-x sm:snap-mandatory sm:[&::-webkit-scrollbar]:hidden sm:[-ms-overflow-style:none] sm:[scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
          >
            <div className="grid grid-cols-1 gap-6 w-full sm:flex sm:items-stretch sm:gap-6 sm:w-fit sm:min-w-full sm:justify-center">
              {validCards.map((card, index) => (
                <motion.div
                  key={card.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="w-full sm:w-[340px] md:w-[360px] sm:shrink-0 bg-neutral-50 hover:bg-white border border-neutral-200/90 rounded-sm overflow-hidden flex flex-col transition-all duration-300 group sm:snap-start shadow-sm hover:shadow-lg"
                >
                  {/* Full Bleed Card Image (No padding around image) */}
                  {card.image_url ? (
                    <div className="relative aspect-[16/10] w-full bg-neutral-100 shrink-0 overflow-hidden">
                      <Image
                        src={card.image_url}
                        alt={card.heading || `Master card ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, 360px"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] w-full bg-neutral-100 border-b border-neutral-200 flex items-center justify-center text-neutral-400 shrink-0">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Text Content Only with Padding */}
                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    {card.heading && (
                      <h3 className="text-lg sm:text-xl font-bold text-neutral-900 group-hover:text-black transition-colors leading-snug mb-2">
                        {card.heading}
                      </h3>
                    )}

                    {card.description && (
                      <p className="text-sm text-neutral-600 font-normal leading-relaxed">
                        {card.description}
                      </p>
                    )}
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
