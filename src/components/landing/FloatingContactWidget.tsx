"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "@/context/DashboardContext";

export default function FloatingContactWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings } = useDashboard();

  const activeSettings = useMemo(() => {
    if (settings && (settings.mobile_number || settings.whatsapp_number)) {
      return settings;
    }
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("hustlify_company_settings");
      if (local) {
        try {
          return JSON.parse(local);
        } catch {
          // ignore
        }
      }
    }
    return settings;
  }, [settings]);

  const rawPhone = activeSettings?.mobile_number || "7034328322";
  const rawWhatsapp = activeSettings?.whatsapp_number || activeSettings?.mobile_number || "7034328322";
  const cleanWhatsapp = rawWhatsapp.replace(/[^0-9]/g, "");

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Action Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.85 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="flex flex-col items-end gap-3 mb-3"
          >
            {/* WhatsApp Action Button */}
            <motion.a
              href={`https://wa.me/${cleanWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 bg-[#25D366] text-white px-4 py-2.5 rounded-full shadow-lg shadow-green-500/25 hover:bg-[#20bd5a] transition-colors group cursor-pointer"
            >
              <span className="text-xs font-bold tracking-wide">
                Chat on WhatsApp
              </span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <svg className="w-4.5 h-4.5 fill-white" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </div>
            </motion.a>

            {/* Direct Call Action Button */}
            <motion.a
              href={`tel:${rawPhone}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 bg-blue-600 text-white px-4 py-2.5 rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-colors group cursor-pointer"
            >
              <span className="text-xs font-bold tracking-wide">
                Call Us Now
              </span>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Trigger Button */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle contact options"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer ${
          isOpen
            ? "bg-neutral-900 text-white border border-neutral-700 shadow-white/5"
            : "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/40 ring-4 ring-blue-600/25"
        }`}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </motion.div>
      </motion.button>
    </div>
  );
}
