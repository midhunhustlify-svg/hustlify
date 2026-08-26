"use client";

import { useEffect, useState } from "react";
import { UserRole } from "@/types/auth";
import { useDashboard, CompanySettings } from "@/context/DashboardContext";

interface SettingsViewProps {
  role: UserRole;
}

export default function SettingsView({ role: _role }: SettingsViewProps) {
  const { settings, saveSettings, fetchSettings } = useDashboard();

  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    const result = await saveSettings(formData);

    if (result.success) {
      setStatusMsg({
        type: "success",
        text: "Company settings saved successfully",
      });
    } else {
      setStatusMsg({
        type: "error",
        text: result.error || "Failed to save company settings",
      });
    }

    setLoading(false);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black tracking-tight">
          Company Details
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Configure official company profile, contact channels, and address details
        </p>
      </div>

      {/* Status feedback */}
      {statusMsg && (
        <div
          className={`p-3 text-xs rounded-sm ${
            statusMsg.type === "success"
              ? "bg-black text-white font-medium"
              : "bg-neutral-200 text-black font-medium"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Company Form Card */}
      <div className="bg-neutral-50 p-6 rounded-sm space-y-6">
        <form onSubmit={handleSaveSettings} className="space-y-5">
          {/* General Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="company_name"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5"
              >
                Company Name
              </label>
              <input
                id="company_name"
                name="company_name"
                type="text"
                required
                value={formData.company_name}
                onChange={handleChange}
                placeholder="Enter company name"
                className="w-full px-3.5 py-2.5 bg-neutral-100 text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5"
              >
                Mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter mail address"
                className="w-full px-3.5 py-2.5 bg-neutral-100 text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          {/* Contact Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="mobile_number"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5"
              >
                Mobile Number
              </label>
              <input
                id="mobile_number"
                name="mobile_number"
                type="tel"
                required
                value={formData.mobile_number}
                onChange={handleChange}
                placeholder="Enter mobile number"
                className="w-full px-3.5 py-2.5 bg-neutral-100 text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label
                htmlFor="whatsapp_number"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5"
              >
                WhatsApp Number
              </label>
              <input
                id="whatsapp_number"
                name="whatsapp_number"
                type="tel"
                required
                value={formData.whatsapp_number}
                onChange={handleChange}
                placeholder="Enter WhatsApp number"
                className="w-full px-3.5 py-2.5 bg-neutral-100 text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          {/* Address Details */}
          <div>
            <label
              htmlFor="address"
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5"
            >
              Street Address / Building
            </label>
            <input
              id="address"
              name="address"
              type="text"
              required
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter street address or building details"
              className="w-full px-3.5 py-2.5 bg-neutral-100 text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="landmark"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5"
              >
                Landmark
              </label>
              <input
                id="landmark"
                name="landmark"
                type="text"
                value={formData.landmark}
                onChange={handleChange}
                placeholder="Enter landmark"
                className="w-full px-3.5 py-2.5 bg-neutral-100 text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label
                htmlFor="city"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5"
              >
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter city"
                className="w-full px-3.5 py-2.5 bg-neutral-100 text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="state"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5"
              >
                State
              </label>
              <input
                id="state"
                name="state"
                type="text"
                required
                value={formData.state}
                onChange={handleChange}
                placeholder="Enter state"
                className="w-full px-3.5 py-2.5 bg-neutral-100 text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div>
              <label
                htmlFor="pincode"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5"
              >
                Pincode
              </label>
              <input
                id="pincode"
                name="pincode"
                type="text"
                required
                value={formData.pincode}
                onChange={handleChange}
                placeholder="Enter pincode"
                className="w-full px-3.5 py-2.5 bg-neutral-100 text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white text-xs font-semibold px-6 py-2.5 rounded-sm hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
