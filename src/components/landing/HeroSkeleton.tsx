"use client";

export default function HeroSkeleton() {
  return (
    <section className="relative w-full min-h-[calc(100dvh-5rem)] lg:h-[calc(100dvh-5rem)] bg-black text-white flex items-center justify-center overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neutral-800/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neutral-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 md:py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Side: Content Skeleton */}
          <div className="flex flex-col items-start text-left space-y-6 w-full max-w-xl">
            {/* Heading Skeleton */}
            <div className="space-y-3 w-full">
              <div className="h-10 sm:h-12 w-11/12 bg-neutral-900 rounded-sm animate-pulse" />
              <div className="h-10 sm:h-12 w-4/5 bg-neutral-900 rounded-sm animate-pulse" />
              <div className="h-10 sm:h-12 w-3/5 bg-neutral-900/80 rounded-sm animate-pulse" />
            </div>

            {/* Description Skeleton */}
            <div className="space-y-2.5 w-full pt-2">
              <div className="h-4 w-full bg-neutral-900/70 rounded-sm animate-pulse" />
              <div className="h-4 w-5/6 bg-neutral-900/70 rounded-sm animate-pulse" />
              <div className="h-4 w-2/3 bg-neutral-900/60 rounded-sm animate-pulse" />
            </div>

            {/* CTA Button Skeleton */}
            <div className="pt-4">
              <div className="h-12 w-56 bg-neutral-900 rounded-full animate-pulse border border-neutral-800/60" />
            </div>
          </div>

          {/* Right Side: Image Skeleton */}
          <div className="w-full flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg lg:max-w-none aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] rounded-2xl bg-neutral-900/60 border border-neutral-800/50 animate-pulse overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-neutral-900/40 via-transparent to-neutral-800/20" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
