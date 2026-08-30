"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useDashboard, HeroSectionData } from "@/context/DashboardContext";
import { useToast } from "@/context/ToastContext";

export default function HeroSectionEditor() {
  const { heroData, saveHeroData, fetchHeroData } = useDashboard();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<HeroSectionData>(heroData);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchHeroData();
  }, [fetchHeroData]);

  useEffect(() => {
    setFormData(heroData);
  }, [heroData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (PNG, JPG, WEBP, etc.)", "error");
      return;
    }

    setUploadingImage(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await res.json();

      if (res.ok && data.success && data.url) {
        setFormData((prev) => ({
          ...prev,
          image_url: data.url,
        }));
        showToast("Image uploaded to Cloudinary successfully", "success");
      } else {
        showToast(data.error || "Failed to upload image to Cloudinary", "error");
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error uploading image", "error");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      image_url: "",
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await saveHeroData(formData);

    if (result.success) {
      showToast("Hero section saved successfully", "success");
    } else {
      showToast(result.error || "Failed to save hero section", "error");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section Form */}
      <div className="bg-transparent md:bg-neutral-50 p-0 md:p-6 rounded-sm space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Heading */}
          <div>
            <label
              htmlFor="heading"
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5"
            >
              Hero Heading
            </label>
            <input
              id="heading"
              name="heading"
              type="text"
              required
              value={formData.heading}
              onChange={handleChange}
              placeholder="e.g. Master High-Ticket Sales with Industry Leaders"
              className="w-full px-3.5 py-2.5 bg-neutral-100 text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5"
            >
              Hero Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter a compelling description for your store landing page"
              className="w-full px-3.5 py-2.5 bg-neutral-100 text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black resize-y"
            />
          </div>

          {/* Image Upload & URL */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
              Hero Image
            </label>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="hero-image-file"
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                disabled={uploadingImage}
                onClick={() => fileInputRef.current?.click()}
                className="bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-4 py-2.5 rounded-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 flex-shrink-0"
              >
                {uploadingImage ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    <span>Upload Image</span>
                  </>
                )}
              </button>

              <div className="flex-1">
                <input
                  name="image_url"
                  type="text"
                  value={formData.image_url}
                  onChange={handleChange}
                  placeholder="Or paste direct image URL"
                  className="w-full px-3.5 py-2.5 bg-neutral-100 text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            {/* Live Image Preview */}
            {formData.image_url && (
              <div className="mt-4 p-3 bg-neutral-100 rounded-sm flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-36 h-28 bg-neutral-200 rounded-sm overflow-hidden flex-shrink-0">
                  <Image
                    src={formData.image_url}
                    alt="Hero Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <p className="text-xs font-semibold text-neutral-800">
                    Active Hero Image Preview
                  </p>
                  <p className="text-[11px] text-neutral-500 truncate max-w-sm">
                    {formData.image_url}
                  </p>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-xs text-red-600 hover:text-red-800 font-medium underline inline-block mt-1"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="bg-black text-white text-xs font-semibold px-6 py-2.5 rounded-sm hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Hero Section"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
