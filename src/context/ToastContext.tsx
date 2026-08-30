"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "error" | "info";

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number; // Duration in ms, defaults to 20000 (20 seconds)
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

interface ActiveToast {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success", duration: number = 2000) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      const newToast: ActiveToast = {
        id: Date.now(),
        message,
        type,
      };

      setToast(newToast);

      timerRef.current = setTimeout(() => {
        setToast(null);
      }, duration);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}

      {/* Top Center Toast Popup */}
      <AnimatePresence>
        {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 w-full max-w-md flex justify-center">
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -25, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -25, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="pointer-events-auto bg-black text-white rounded-sm border border-neutral-800 shadow-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs font-semibold w-full sm:w-auto min-w-[280px]"
            >
              <div className="flex items-center gap-2.5">
                {toast.type === "success" && (
                  <svg
                    className="w-4 h-4 text-white flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                {toast.type === "error" && (
                  <svg
                    className="w-4 h-4 text-red-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
                <span>{toast.message}</span>
              </div>

              <button
                type="button"
                onClick={hideToast}
                className="text-neutral-400 hover:text-white p-1 rounded-sm focus:outline-none transition-colors ml-2"
                aria-label="Dismiss notification"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
