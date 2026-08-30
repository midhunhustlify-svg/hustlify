"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { HeroSectionData } from "@/context/DashboardContext";

interface HeroSectionProps {
  data: HeroSectionData;
}

export default function HeroSection({ data }: HeroSectionProps) {
  const { heading, description, image_url } = data;

  const hasContent = heading || description || image_url;

  return (
    <section className="relative w-full min-h-[calc(100dvh-5rem)] lg:h-[calc(100dvh-5rem)] bg-transparent text-white flex items-center justify-center overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 md:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Side: Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-start text-left space-y-6"
          >
            {/* Heading */}
            {heading ? (
              <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.12] text-white">
                {heading}
              </h1>
            ) : null}

            {/* Description */}
            {description ? (
              <p className="text-base text-neutral-400 font-normal leading-relaxed max-w-xl">
                {description}
              </p>
            ) : null}

            {/* CTA Button placed on left-side content bottom */}
            <div className="pt-2">
              <Link
                href="#book-consultation"
                className="bg-white text-black font-semibold text-sm sm:text-base px-8 py-3.5 rounded-full hover:bg-neutral-200 transition-all duration-200 shadow-xl inline-flex items-center justify-center gap-2 group"
              >
                <span>Book a free consultation</span>
                <svg
                  className="w-4 h-4 transform transition-transform duration-200 group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
            </div>
          </motion.div>

          {/* Right Side: Image */}
          {image_url ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
              className="w-full flex justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-lg lg:max-w-none aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-neutral-800/60 bg-neutral-950">
                <Image
                  src={image_url}
                  alt={heading || "Hustlify Hero"}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
