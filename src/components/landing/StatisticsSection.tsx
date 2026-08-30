"use client";

import { motion } from "framer-motion";
import { StatisticsSectionData } from "@/context/DashboardContext";

interface StatisticsSectionProps {
  data: StatisticsSectionData;
}

export default function StatisticsSection({ data }: StatisticsSectionProps) {
  const items = data.items || [];
  const validItems = items.filter(
    (item) => item.value?.trim() || item.description?.trim()
  );

  // If no statistics data has been configured yet, render nothing
  if (validItems.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-[#f4f5f7] border-y border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-4 sm:gap-6 lg:gap-0 items-start justify-center">
          {validItems.slice(0, 4).map((item, index) => (
            <motion.div
              key={item.id || index}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`flex flex-col items-center justify-center text-center px-2 sm:px-6 ${
                index !== validItems.length - 1 && index < 3
                  ? "lg:border-r lg:border-neutral-300/80"
                  : ""
              }`}
            >
              {/* Stat Value */}
              {item.value && (
                <div className="text-2xl sm:text-3xl lg:text-[40px] font-bold font-black text-black tracking-tight leading-none mb-2 sm:mb-3">
                  {item.value}
                </div>
              )}

              {/* Stat Description */}
              {item.description && (
                <p className="text-[11px] sm:text-xs lg:text-[13px] text-neutral-600 font-medium leading-normal sm:leading-relaxed max-w-[160px] sm:max-w-[200px] lg:max-w-[230px] mx-auto min-h-[38px] sm:min-h-[44px] lg:min-h-0 flex items-start justify-center">
                  {item.description}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
