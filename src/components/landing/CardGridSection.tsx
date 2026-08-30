"use client";

import { useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { CardGridSectionData, ImageCardItem } from "@/context/DashboardContext";

interface CardGridSectionProps {
  data: CardGridSectionData;
}

export default function CardGridSection({ data }: CardGridSectionProps) {
  const { heading, items } = data || {};

  // Filter valid cards that have an image or heading or subheading
  const validCards = useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    return items.filter(
      (card: ImageCardItem) =>
        card.image_url?.trim() || card.heading?.trim() || card.subheading?.trim()
    );
  }, [items]);

  // Zero Mock Data Policy
  const hasContent = heading?.trim() || validCards.length > 0;
  if (!hasContent) {
    return null;
  }

  return (
    <section className="relative w-full bg-white text-neutral-900 py-14 md:py-20 overflow-hidden border-t border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        {heading && (
          <div className="text-center mx-auto mb-8 md:mb-12 max-w-sm sm:max-w-2xl md:max-w-3xl">
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-lg sm:text-2xl md:text-3xl lg:text-4xl tracking-tight text-neutral-900 leading-snug sm:leading-[1.15]"
            >
              {heading}
            </motion.h2>
          </div>
        )}

        {/* Small Scrollable Cards Container (No Arrow Buttons, Peek Effect on Mobile & Smooth X-Axis Scroll) */}
        {validCards.length > 0 && (
          <div className="overflow-x-auto overflow-y-hidden scroll-smooth pb-4 pt-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="flex items-stretch gap-3 sm:gap-5 w-fit min-w-full justify-start sm:justify-center">
              {validCards.map((card, index) => (
                <motion.div
                  key={card.id || index}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="shrink-0 w-[145px] sm:w-[220px] md:w-[240px] aspect-[3/4] rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-neutral-200 bg-neutral-900 snap-start relative"
                >
                  {/* Full Card Image */}
                  {card.image_url ? (
                    <Image
                      src={card.image_url}
                      alt={card.heading || `Card ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      sizes="(max-width: 640px) 145px, 240px"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-700">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Overlaid Gradient & Text at Bottom of Card */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-2.5 sm:p-4 text-white">
                    {card.heading && (
                      <h3 className="text-xs sm:text-base font-bold text-white leading-tight group-hover:text-[#D4AF37] transition-colors mb-0.5 sm:mb-1 drop-shadow-sm line-clamp-1 sm:line-clamp-2">
                        {card.heading}
                      </h3>
                    )}

                    {card.subheading && (
                      <p className="text-[10px] sm:text-xs text-neutral-300 font-normal leading-tight sm:leading-snug drop-shadow-sm line-clamp-2">
                        {card.subheading}
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
