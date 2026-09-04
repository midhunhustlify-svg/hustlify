"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "@/context/DashboardContext";

const POPUP_SHOWN_KEY = "hustlify_popup_shown";
const SCROLL_THRESHOLD = 0.3; // trigger after 30% scroll

export default function ScrollPopupForm() {
  const { settings: contextSettings, addEnquiry } = useDashboard();
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    course: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const activeSettings = useMemo(() => {
    if (
      contextSettings &&
      (contextSettings.company_name ||
        contextSettings.email ||
        contextSettings.mobile_number ||
        contextSettings.address)
    ) {
      return contextSettings;
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
    return contextSettings;
  }, [contextSettings]);

  // Check if already shown this session
  useEffect(() => {
    const alreadyShown = sessionStorage.getItem(POPUP_SHOWN_KEY);
    if (alreadyShown) {
      setHasShown(true);
    }
  }, []);

  // Scroll listener — show popup once after threshold scroll
  const handleScroll = useCallback(() => {
    if (hasShown) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const scrollRatio = docHeight > 0 ? scrollTop / docHeight : 0;

    if (scrollRatio >= SCROLL_THRESHOLD) {
      setIsVisible(true);
      setHasShown(true);
      sessionStorage.setItem(POPUP_SHOWN_KEY, "true");
    }
  }, [hasShown]);

  useEffect(() => {
    if (hasShown) return;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll, hasShown]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      // 1. Send email notification (same as ContactSection)
      try {
        await fetch("/api/enquiry-notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: formData.fullName,
            mobile_number: formData.mobileNumber,
            course: formData.course || "General Inquiry",
            message: formData.message,
            admin_email: activeSettings?.email || "",
          }),
        });
      } catch (emailErr) {
        console.warn("Popup form email dispatch note:", emailErr);
      }

      // 2. Save to enquiries (same as ContactSection)
      await addEnquiry({
        full_name: formData.fullName,
        mobile_number: formData.mobileNumber,
        course: formData.course || "General Inquiry",
        message: formData.message,
        status: "pending",
      });

      setSubmitted(true);
      setFormData({
        fullName: "",
        mobileNumber: "",
        course: "",
        message: "",
      });
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setIsVisible(false);
    setSubmitted(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="popup-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
          />

          {/* Popup Card */}
          <motion.div
            key="popup-card"
            initial={{ opacity: 0, scale: 0.88, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 40 }}
            transition={{ type: "spring", damping: 26, stiffness: 340 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden">
              {/* Top accent bar */}

              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400 mb-1">
                      Contact Us
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 leading-tight">
                      Get in Touch
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    aria-label="Close popup"
                    className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all duration-200 cursor-pointer shrink-0 mt-0.5"
                  >
                    <svg
                      className="w-4.5 h-4.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Form / Success State */}
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-6 space-y-3"
                  >
                    <div className="w-14 h-14 mx-auto rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                      <svg
                        className="w-7 h-7 text-green-500"
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
                    </div>
                    <h4 className="text-lg font-bold text-neutral-900">
                      Message Sent!
                    </h4>
                    <p className="text-sm text-neutral-500 max-w-xs mx-auto">
                      Thank you for reaching out. A Hustlify representative
                      will get back to you shortly.
                    </p>
                    <button
                      type="button"
                      onClick={handleSuccessClose}
                      className="mt-2 px-6 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-neutral-700 transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    {/* Full Name */}
                    <div>
                      <input
                        id="popup-fullName"
                        name="fullName"
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Full Name"
                        className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800/20 focus:border-neutral-400 transition-all placeholder:text-neutral-400"
                      />
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <input
                        id="popup-mobileNumber"
                        name="mobileNumber"
                        type="tel"
                        required
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        placeholder="Phone Number"
                        className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800/20 focus:border-neutral-400 transition-all placeholder:text-neutral-400"
                      />
                    </div>

                    {/* Select Course */}
                    <div className="relative">
                      <select
                        id="popup-course"
                        name="course"
                        value={formData.course}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800/20 focus:border-neutral-400 transition-all appearance-none cursor-pointer"
                      >
                        <option value="" className="text-neutral-400">
                          Select Course
                        </option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <textarea
                        id="popup-message"
                        name="message"
                        rows={3}
                        required
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Your Message"
                        className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800/20 focus:border-neutral-400 transition-all placeholder:text-neutral-400 resize-none"
                      />
                    </div>

                    {/* Error */}
                    {errorMessage && (
                      <p className="text-xs text-red-500 font-medium">
                        {errorMessage}
                      </p>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 px-5 bg-neutral-900 hover:bg-neutral-700 text-white text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Send Message</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
