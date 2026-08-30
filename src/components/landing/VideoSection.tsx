"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { VideoSectionData, VideoItem } from "@/context/DashboardContext";

interface VideoSectionProps {
  data: VideoSectionData;
}

// Helper to convert YouTube / Vimeo / standard URLs to embed format or detect video type
function getVideoEmbedUrl(url: string): { isEmbed: boolean; embedUrl?: string } {
  if (!url) return { isEmbed: false };

  try {
    // YouTube links
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      let videoId = "";
      if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
      } else if (url.includes("watch?v=")) {
        const urlParams = new URL(url).searchParams;
        videoId = urlParams.get("v") || "";
      } else if (url.includes("embed/")) {
        return { isEmbed: true, embedUrl: url };
      }

      if (videoId) {
        return {
          isEmbed: true,
          embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
        };
      }
    }

    // Vimeo links
    if (url.includes("vimeo.com")) {
      const vimeoId = url.split("vimeo.com/")[1]?.split("?")[0];
      if (vimeoId) {
        return {
          isEmbed: true,
          embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
        };
      }
    }
  } catch {
    // Fallback to direct video tag
  }

  return { isEmbed: false };
}

export default function VideoSection({ data }: VideoSectionProps) {
  const { subheading, heading, items } = data || {};

  // Filter valid videos with non-empty URL
  const validVideos = useMemo(() => {
    if (!items || !Array.isArray(items)) return [];
    return items.filter((video: VideoItem) => video.video_url?.trim());
  }, [items]);

  // Zero Mock Data Policy
  const hasContent = subheading?.trim() || heading?.trim() || validVideos.length > 0;
  if (!hasContent) {
    return null;
  }

  const total = validVideos.length;

  return (
    <section className="relative w-full bg-transparent text-white py-16 md:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 md:mb-16">
          {/* Subheading Badge */}
          {subheading && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center"
            >
              <span className="px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs sm:text-sm font-semibold tracking-widest uppercase">
                {subheading}
              </span>
            </motion.div>
          )}

          {/* Heading */}
          {heading && (
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]"
            >
              {heading}
            </motion.h2>
          )}
        </div>

        {/* Video Player Display */}
        {validVideos.length > 0 && (
          <div>
            {total === 1 ? (
              /* Single Featured Video */
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-5xl mx-auto"
              >
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800/80 shadow-2xl">
                  {getVideoEmbedUrl(validVideos[0].video_url).isEmbed ? (
                    <iframe
                      src={getVideoEmbedUrl(validVideos[0].video_url).embedUrl}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={validVideos[0].title || heading || "Video presentation"}
                    />
                  ) : (
                    <video
                      src={validVideos[0].video_url}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>

                {validVideos[0].title && (
                  <p className="text-center text-sm sm:text-base font-semibold text-neutral-300 mt-4">
                    {validVideos[0].title}
                  </p>
                )}
              </motion.div>
            ) : (
              /* Two or More Videos Grid */
              <div
                className={`grid grid-cols-1 ${
                  total === 2 ? "lg:grid-cols-2 max-w-5xl mx-auto" : "md:grid-cols-2 lg:grid-cols-3"
                } gap-8`}
              >
                {validVideos.map((video, index) => {
                  const { isEmbed, embedUrl } = getVideoEmbedUrl(video.video_url);
                  return (
                    <motion.div
                      key={video.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden shadow-xl flex flex-col group hover:border-[#D4AF37]/50 transition-all duration-300 backdrop-blur-md"
                    >
                      {/* Video Player Box */}
                      <div className="relative w-full aspect-video bg-neutral-950 overflow-hidden">
                        {isEmbed ? (
                          <iframe
                            src={embedUrl}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={video.title || `Video ${index + 1}`}
                          />
                        ) : (
                          <video
                            src={video.video_url}
                            controls
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-cover"
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </div>

                      {/* Video Title */}
                      {video.title && (
                        <div className="p-4 sm:p-5">
                          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors leading-snug">
                            {video.title}
                          </h3>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Bottom Center CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 md:mt-16 flex justify-center items-center"
        >
          <Link
            href="#join-hustlify"
            className="bg-white text-black font-semibold text-sm sm:text-base px-8 py-3.5 rounded-full hover:bg-neutral-200 transition-all duration-200 shadow-xl inline-flex items-center justify-center gap-2 group"
          >
            <span>Join Hustlify Now</span>
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
        </motion.div>
      </div>
    </section>
  );
}
