"use client";

export default function StatisticsSkeleton() {
  return (
    <section className="w-full bg-[#f4f5f7] border-y border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-4 sm:gap-6 lg:gap-0 items-center justify-center">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center text-center px-2 sm:px-6 space-y-3 ${
                i !== 4 ? "lg:border-r lg:border-neutral-300/80" : ""
              }`}
            >
              <div className="h-9 sm:h-10 w-24 bg-neutral-300/80 rounded-sm animate-pulse" />
              <div className="h-3.5 w-36 bg-neutral-300/60 rounded-sm animate-pulse" />
              <div className="h-3.5 w-28 bg-neutral-300/50 rounded-sm animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
