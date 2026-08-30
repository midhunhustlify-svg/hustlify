"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CompanySettings, useDashboard } from "@/context/DashboardContext";
import { supabase } from "@/lib/supabaseClient";

interface ContactSectionProps {
  settings?: CompanySettings;
}

export default function ContactSection({ settings }: ContactSectionProps) {
  const { settings: contextSettings, addEnquiry } = useDashboard();

  const activeSettings = useMemo(() => {
    if (settings && (settings.company_name || settings.email || settings.mobile_number || settings.address)) {
      return settings;
    }
    if (contextSettings && (contextSettings.company_name || contextSettings.email || contextSettings.mobile_number || contextSettings.address)) {
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
    return settings || contextSettings;
  }, [settings, contextSettings]);

  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    course: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
      // 1. Dispatch Email Notification directly
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
        console.warn("Contact form email dispatch note:", emailErr);
      }

      // 2. Save to Dashboard / DB
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

  const hasAddress =
    activeSettings?.address ||
    activeSettings?.landmark ||
    activeSettings?.city ||
    activeSettings?.state ||
    activeSettings?.pincode;

  const fullAddress = [
    activeSettings?.address,
    activeSettings?.landmark,
    activeSettings?.city,
    activeSettings?.state && activeSettings?.pincode
      ? `${activeSettings.state} - ${activeSettings.pincode}`
      : activeSettings?.state || activeSettings?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <section id="contact" className="relative w-full bg-transparent text-white py-12 sm:py-16 md:py-20 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight"
          >
            Ready ? lets talk
          </motion.h2>
        </div>

        {/* 2-Column Grid: Left (Get in Touch & Company Details) | Right (Form) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Get in Touch & Company Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 space-y-5"
          >
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
                Get in Touch.
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1.5 leading-relaxed">
                Have questions about our training programs or want to scale your sales career? Reach out to our team directly.
              </p>
            </div>

            {/* Company Details (Fetched dynamically from company_settings) */}
            <div className="space-y-4 pt-2 border-t border-neutral-800/80">
              {/* Company Name */}
              {activeSettings?.company_name && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block mb-0.5">
                    Company
                  </span>
                  <p className="text-sm font-semibold text-white">
                    {activeSettings.company_name}
                  </p>
                </div>
              )}

              {/* Email */}
              {activeSettings?.email && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block">
                      Email Us
                    </span>
                    <a
                      href={`mailto:${activeSettings.email}`}
                      className="text-xs sm:text-sm text-white hover:text-[#3B82F6] transition-colors font-medium break-all"
                    >
                      {activeSettings.email}
                    </a>
                  </div>
                </div>
              )}

              {/* Phone / Mobile */}
              {activeSettings?.mobile_number && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block">
                      Call Us
                    </span>
                    <a
                      href={`tel:${activeSettings.mobile_number}`}
                      className="text-xs sm:text-sm text-white hover:text-[#3B82F6] transition-colors font-medium"
                    >
                      {activeSettings.mobile_number}
                    </a>
                  </div>
                </div>
              )}

              {/* WhatsApp */}
              {activeSettings?.whatsapp_number && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center text-green-400 shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block">
                      WhatsApp
                    </span>
                    <a
                      href={`https://wa.me/${activeSettings.whatsapp_number.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm text-white hover:text-green-400 transition-colors font-medium"
                    >
                      {activeSettings.whatsapp_number}
                    </a>
                  </div>
                </div>
              )}

              {/* Address */}
              {hasAddress && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 block">
                      Location
                    </span>
                    <p className="text-xs sm:text-sm text-neutral-300 font-normal leading-relaxed">
                      {fullAddress}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column: Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7"
          >
            <div className="w-full">
              {submitted ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-white">Message Sent Successfully!</h4>
                  <p className="text-xs sm:text-sm text-neutral-300 max-w-sm mx-auto">
                    Thank you for reaching out. A Hustlify representative will get back to you shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-3 px-5 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-neutral-200 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full px-3.5 py-2.5 sm:py-3 bg-[#141416] border-none rounded-md text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-white/40 transition-all placeholder:text-neutral-500"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label htmlFor="mobileNumber" className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                      Mobile Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="mobileNumber"
                      name="mobileNumber"
                      type="tel"
                      required
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      placeholder="Enter your mobile number"
                      className="w-full px-3.5 py-2.5 sm:py-3 bg-[#141416] border-none rounded-md text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-white/40 transition-all placeholder:text-neutral-500"
                    />
                  </div>

                  {/* Select Course */}
                  <div>
                    <label htmlFor="course" className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                      Select Course
                    </label>
                    <div className="relative">
                      <select
                        id="course"
                        name="course"
                        value={formData.course}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 sm:py-3 bg-[#141416] border-none rounded-md text-neutral-300 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-white/40 transition-all appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-[#141416] text-neutral-400">Select course</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-neutral-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                      Message <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={3}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Write your message here..."
                      className="w-full px-3.5 py-2.5 sm:py-3 bg-[#141416] border-none rounded-md text-white text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-white/40 transition-all placeholder:text-neutral-500 resize-y"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-5 bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider rounded-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <span>Send a message</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
