"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaqSectionData, FaqItem } from "@/context/DashboardContext";

interface FaqSectionProps {
  data: FaqSectionData;
}

export default function FaqSection({ data }: FaqSectionProps) {
  const { subheading, heading, items } = data || {};
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Filter valid FAQ items
  const validFaqs = useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    return items.filter(
      (item: FaqItem) => item.question?.trim() || item.answer?.trim()
    );
  }, [items]);

  // Zero Mock Data Policy
  const hasContent = subheading?.trim() || heading?.trim() || validFaqs.length > 0;
  if (!hasContent) {
    return null;
  }

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="relative w-full bg-white text-neutral-900 py-20 md:py-32 overflow-hidden border-t border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left Column: Subheading & Heading */}
          <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-28">
            {subheading && (
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="text-xs sm:text-sm font-semibold tracking-wider text-neutral-400 uppercase block"
              >
                {subheading}
              </motion.span>
            )}

            {heading && (
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 leading-[1.15]"
              >
                {heading}
              </motion.h2>
            )}
          </div>

          {/* Right Column: Accordion Q&A List */}
          {validFaqs.length > 0 && (
            <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
              {validFaqs.map((faq, index) => {
                const isOpen = openIndex === index;

                return (
                  <motion.div
                    key={faq.id || index}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.04 }}
                    className="bg-[#f4f6f8] hover:bg-[#edf0f4] rounded-lg sm:rounded-xl border border-neutral-200/70 transition-colors overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="w-full p-4 sm:p-5 flex items-center gap-3 text-left focus:outline-none select-none cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      {/* Triangle Play / Arrow Icon */}
                      <span
                        className={`text-[11px] sm:text-xs text-neutral-700 transition-transform duration-200 shrink-0 ${
                          isOpen ? "rotate-90" : "rotate-0"
                        }`}
                      >
                        ▶
                      </span>

                      {/* Question Text */}
                      <span className="text-sm sm:text-base font-semibold text-neutral-900 leading-snug flex-1">
                        {faq.question}
                      </span>
                    </button>

                    {/* Expandable Answer */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="answer-content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-neutral-600 font-normal leading-relaxed pl-7 sm:pl-8 border-t border-neutral-200/50 mt-1 pt-3">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
