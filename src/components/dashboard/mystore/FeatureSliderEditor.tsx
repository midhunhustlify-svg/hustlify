"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useDashboard, FeatureSliderData, FeatureSlideItem } from "@/context/DashboardContext";
import { useToast } from "@/context/ToastContext";

export default function FeatureSliderEditor() {
  const { featureSliderData, saveFeatureSliderData, fetchFeatureSliderData, featureSliderLoaded } = useDashboard();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<FeatureSliderData>(() => {
    if (typeof window !== "undefined") {
      const draft = sessionStorage.getItem("hustlify_draft_feature_slider");
      if (draft) {
        try {
          return JSON.parse(draft);
        } catch {
          // ignore
        }
      }
    }
    return featureSliderData;
  });

  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const isInitializedRef = useRef(false);

  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  useEffect(() => {
    fetchFeatureSliderData();
  }, [fetchFeatureSliderData]);

  useEffect(() => {
    // Only initialize from context on initial load if user has not made local changes
    if (!isInitializedRef.current && featureSliderLoaded) {
      isInitializedRef.current = true;
      if (typeof window !== "undefined") {
        const draft = sessionStorage.getItem("hustlify_draft_feature_slider");
        if (draft) {
          try {
            setFormData(JSON.parse(draft));
            setIsDirty(true);
            return;
          } catch {
            // ignore
          }
        }
      }
      setFormData(featureSliderData);
    }
  }, [featureSliderData, featureSliderLoaded]);

  const updateStateAndDraft = (
    updater: (prev: FeatureSliderData) => FeatureSliderData
  ) => {
    setFormData((prev) => {
      const next = updater(prev);
      setIsDirty(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("hustlify_draft_feature_slider", JSON.stringify(next));
      }
      return next;
    });
  };

  const handleAddItem = () => {
    const newItem: FeatureSlideItem = {
      id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      subtitle: "",
      heading: "",
      subheading: "",
      description: "",
      image_url: "",
    };

    updateStateAndDraft((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleRemoveItem = (index: number) => {
    updateStateAndDraft((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (
    index: number,
    field: keyof FeatureSlideItem,
    value: string
  ) => {
    updateStateAndDraft((prev) => {
      const updated = [...prev.items];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          [field]: value,
        };
      }
      return {
        ...prev,
        items: updated,
      };
    });
  };

  const handleImageUpload = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (PNG, JPG, WEBP, etc.)", "error");
      return;
    }

    setUploadingIndex(index);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await res.json();

      if (res.ok && data.success && data.url) {
        handleItemChange(index, "image_url", data.url);
        showToast("Image uploaded to Cloudinary successfully", "success");
      } else {
        showToast(data.error || "Failed to upload image", "error");
      }
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Error uploading image",
        "error"
      );
    } finally {
      setUploadingIndex(null);
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index]!.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    handleItemChange(index, "image_url", "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await saveFeatureSliderData(formData);

    if (result.success) {
      setIsDirty(false);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("hustlify_draft_feature_slider");
      }
      showToast("Showcase section saved successfully", "success");
    } else {
      showToast(result.error || "Failed to save showcase section", "error");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-transparent md:bg-neutral-50 p-0 md:p-6 rounded-sm space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Header info & Add item action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-black">
                Showcase Slides
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Add multiple items that automatically cycle on the landing page
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-4 py-2 rounded-sm transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Slide Item</span>
            </button>
          </div>

          {/* Items List */}
          {formData.items.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-neutral-200 rounded-sm bg-neutral-50/50">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-neutral-800">No Showcase Slides Added</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Add items with subtitle, heading, gold subheading, description, and image to display on the landing page.
              </p>
              <button
                type="button"
                onClick={handleAddItem}
                className="mt-4 bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-5 py-2.5 rounded-sm transition-colors inline-flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add First Slide Item</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {formData.items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="bg-transparent md:bg-neutral-100 p-0 md:p-5 rounded-none md:rounded-sm space-y-4 border-0 md:border md:border-neutral-200/60"
                >
                  {/* Card Top Bar */}
                  <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      Slide Item {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 transition-colors"
                      title="Remove this slide item"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Remove</span>
                    </button>
                  </div>

                  {/* Subtitle & Heading */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Subtitle */}
                    <div>
                      <label
                        htmlFor={`item-subtitle-${index}`}
                        className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                      >
                        Subtitle
                      </label>
                      <input
                        id={`item-subtitle-${index}`}
                        type="text"
                        value={item.subtitle}
                        onChange={(e) =>
                          handleItemChange(index, "subtitle", e.target.value)
                        }
                        placeholder="e.g. Featured Program"
                        className="w-full px-3.5 py-2.5 bg-neutral-100 md:bg-white text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>

                    {/* Heading */}
                    <div>
                      <label
                        htmlFor={`item-heading-${index}`}
                        className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                      >
                        Heading
                      </label>
                      <input
                        id={`item-heading-${index}`}
                        type="text"
                        value={item.heading}
                        onChange={(e) =>
                          handleItemChange(index, "heading", e.target.value)
                        }
                        placeholder="e.g. Strategic Mastery"
                        className="w-full px-3.5 py-2.5 bg-neutral-100 md:bg-white text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black font-semibold"
                      />
                    </div>
                  </div>

                  {/* Subheading (Gold accent note) */}
                  <div>
                    <label
                      htmlFor={`item-subheading-${index}`}
                      className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                    >
                      Subheading{" "}
                      <span className="text-[10px] text-amber-600 font-medium normal-case">
                        (Displayed in Gold color on landing page)
                      </span>
                    </label>
                    <input
                      id={`item-subheading-${index}`}
                      type="text"
                      value={item.subheading}
                      onChange={(e) =>
                        handleItemChange(index, "subheading", e.target.value)
                      }
                      placeholder="e.g. Elevate Your Performance & Scale Effortlessly"
                      className="w-full px-3.5 py-2.5 bg-neutral-100 md:bg-white text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black font-medium"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor={`item-desc-${index}`}
                      className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id={`item-desc-${index}`}
                      rows={3}
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      placeholder="Enter detailed content description..."
                      className="w-full px-3.5 py-2.5 bg-neutral-100 md:bg-white text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black resize-y"
                    />
                  </div>

                  {/* Image Upload and URL */}
                  <div className="space-y-3 pt-1">
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                      Slide Image
                    </label>

                    <input
                      ref={(el) => {
                        fileInputRefs.current[index] = el;
                      }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(index, e)}
                      className="hidden"
                      id={`slide-image-file-${index}`}
                    />

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        type="button"
                        disabled={uploadingIndex === index}
                        onClick={() => fileInputRefs.current[index]?.click()}
                        className="bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-4 py-2.5 rounded-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 flex-shrink-0"
                      >
                        {uploadingIndex === index ? (
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
                          type="text"
                          value={item.image_url}
                          onChange={(e) =>
                            handleItemChange(index, "image_url", e.target.value)
                          }
                          placeholder="Or paste image URL"
                          className="w-full px-3.5 py-2.5 bg-neutral-100 md:bg-white text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    {item.image_url && (
                      <div className="mt-3 p-3 bg-neutral-200/60 md:bg-neutral-50 rounded-sm flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-32 h-24 bg-neutral-300 rounded-sm overflow-hidden flex-shrink-0">
                          <Image
                            src={item.image_url}
                            alt={`Slide ${index + 1} Preview`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 space-y-1 text-center sm:text-left">
                          <p className="text-xs font-semibold text-neutral-800">
                            Active Image Preview
                          </p>
                          <p className="text-[11px] text-neutral-500 truncate max-w-sm">
                            {item.image_url}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium underline inline-block mt-1"
                          >
                            Remove Image
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons at bottom */}
          {formData.items.length > 0 && (
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full sm:w-auto bg-neutral-200 hover:bg-neutral-300 text-black text-xs font-semibold px-4 py-2.5 rounded-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Another Slide</span>
              </button>

              <button
                type="submit"
                disabled={loading || uploadingIndex !== null}
                className="w-full sm:w-auto bg-black text-white text-xs font-semibold px-6 py-2.5 rounded-sm hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {loading ? "Saving Changes..." : "Save Showcase Section"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
