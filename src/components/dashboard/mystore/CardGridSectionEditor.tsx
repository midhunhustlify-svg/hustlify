"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useDashboard, CardGridSectionData, ImageCardItem } from "@/context/DashboardContext";
import { useToast } from "@/context/ToastContext";

export default function CardGridSectionEditor() {
  const { cardGridData, saveCardGridData, fetchCardGridData, cardGridLoaded } = useDashboard();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<CardGridSectionData>(() => {
    if (typeof window !== "undefined") {
      const draft = sessionStorage.getItem("hustlify_draft_card_grid_section");
      if (draft) {
        try {
          return JSON.parse(draft);
        } catch {
          // ignore
        }
      }
    }
    return cardGridData;
  });

  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const isInitializedRef = useRef(false);

  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  useEffect(() => {
    fetchCardGridData();
  }, [fetchCardGridData]);

  useEffect(() => {
    if (!isInitializedRef.current && cardGridLoaded) {
      isInitializedRef.current = true;
      if (typeof window !== "undefined") {
        const draft = sessionStorage.getItem("hustlify_draft_card_grid_section");
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
      setFormData(cardGridData);
    }
  }, [cardGridData, cardGridLoaded]);

  const updateStateAndDraft = (
    updater: (prev: CardGridSectionData) => CardGridSectionData
  ) => {
    setFormData((prev) => {
      const next = updater(prev);
      setIsDirty(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("hustlify_draft_card_grid_section", JSON.stringify(next));
      }
      return next;
    });
  };

  const handleHeadingChange = (value: string) => {
    updateStateAndDraft((prev) => ({
      ...prev,
      heading: value,
    }));
  };

  const handleAddCard = () => {
    const newCard: ImageCardItem = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      image_url: "",
      heading: "",
      subheading: "",
    };

    updateStateAndDraft((prev) => ({
      ...prev,
      items: [...(prev.items || []), newCard],
    }));
  };

  const handleRemoveCard = (index: number) => {
    updateStateAndDraft((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const handleMoveCard = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= (formData.items || []).length) return;

    updateStateAndDraft((prev) => {
      const items = [...(prev.items || [])];
      const temp = items[index];
      items[index] = items[targetIndex];
      items[targetIndex] = temp;
      return {
        ...prev,
        items,
      };
    });
  };

  const handleCardFieldChange = (
    index: number,
    field: keyof ImageCardItem,
    value: string
  ) => {
    updateStateAndDraft((prev) => {
      const updated = [...(prev.items || [])];
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
      uploadFormData.append("folder", "hustlify/store");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await res.json();

      if (res.ok && data.success && data.url) {
        handleCardFieldChange(index, "image_url", data.url);
        showToast("Image uploaded to Cloudinary successfully", "success");
      } else {
        showToast(data.error || "Failed to upload image", "error");
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error uploading image", "error");
    } finally {
      setUploadingIndex(null);
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index]!.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    handleCardFieldChange(index, "image_url", "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await saveCardGridData(formData);

    if (result.success) {
      setIsDirty(false);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("hustlify_draft_card_grid_section");
      }
      showToast("Card section saved successfully", "success");
    } else {
      showToast(result.error || "Failed to save card section", "error");
    }

    setLoading(false);
  };

  const items = formData.items || [];

  return (
    <div className="space-y-6">
      <div className="bg-transparent md:bg-neutral-50 p-0 md:p-6 rounded-sm space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section Heading */}
          <div>
            <label
              htmlFor="grid-heading"
              className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5"
            >
              Section Heading
            </label>
            <input
              id="grid-heading"
              type="text"
              value={formData.heading || ""}
              onChange={(e) => handleHeadingChange(e.target.value)}
              placeholder="e.g. Master High-Income Skills"
              className="w-full px-3.5 py-2.5 bg-neutral-100 text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black font-semibold"
            />
          </div>

          {/* Cards Header & Add Card action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200 pt-2">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-black">
                Image Cards ({items.length})
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Cards show a full image with heading and subheading overlaid at the bottom
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddCard}
              className="bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-4 py-2 rounded-sm transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Card</span>
            </button>
          </div>

          {/* Items List */}
          {items.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-neutral-200 rounded-sm bg-neutral-50/50">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-neutral-800">No Cards Added</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Add card items with image, heading, and subheading to display on the landing page.
              </p>
              <button
                type="button"
                onClick={handleAddCard}
                className="mt-4 bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-5 py-2.5 rounded-sm transition-colors inline-flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add First Card</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((card, index) => (
                <div
                  key={card.id || index}
                  className="bg-transparent md:bg-neutral-100 p-0 md:p-5 rounded-none md:rounded-sm space-y-4 border-0 md:border md:border-neutral-200/60"
                >
                  {/* Card Top Bar */}
                  <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      Card {index + 1}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Move Up Button */}
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveCard(index, "up")}
                        className="p-1 text-neutral-500 hover:text-black disabled:opacity-20 disabled:hover:text-neutral-500 transition-colors"
                        title="Move Card Up"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>

                      {/* Move Down Button */}
                      <button
                        type="button"
                        disabled={index === items.length - 1}
                        onClick={() => handleMoveCard(index, "down")}
                        className="p-1 text-neutral-500 hover:text-black disabled:opacity-20 disabled:hover:text-neutral-500 transition-colors"
                        title="Move Card Down"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveCard(index)}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 transition-colors ml-2"
                        title="Remove this card"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Heading & Subheading */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor={`card-heading-${index}`}
                        className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                      >
                        Card Heading
                      </label>
                      <input
                        id={`card-heading-${index}`}
                        type="text"
                        value={card.heading}
                        onChange={(e) =>
                          handleCardFieldChange(index, "heading", e.target.value)
                        }
                        placeholder="e.g. Sales Psychology"
                        className="w-full px-3.5 py-2.5 bg-neutral-100 md:bg-white text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black font-semibold"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`card-subheading-${index}`}
                        className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                      >
                        Card Subheading
                      </label>
                      <input
                        id={`card-subheading-${index}`}
                        type="text"
                        value={card.subheading}
                        onChange={(e) =>
                          handleCardFieldChange(index, "subheading", e.target.value)
                        }
                        placeholder="e.g. Close 50K+ deals with confidence"
                        className="w-full px-3.5 py-2.5 bg-neutral-100 md:bg-white text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </div>

                  {/* Image Upload and URL */}
                  <div className="space-y-3 pt-1">
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                      Card Full Image
                    </label>

                    <input
                      ref={(el) => {
                        fileInputRefs.current[index] = el;
                      }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(index, e)}
                      className="hidden"
                    />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <button
                        type="button"
                        disabled={uploadingIndex === index}
                        onClick={() => fileInputRefs.current[index]?.click()}
                        className="bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-4 py-2 rounded-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {uploadingIndex === index ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Uploading to Cloudinary...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span>Upload Image</span>
                          </>
                        )}
                      </button>
                      <span className="text-xs text-neutral-400">or enter image URL directly below</span>
                    </div>

                    <input
                      type="url"
                      value={card.image_url}
                      onChange={(e) =>
                        handleCardFieldChange(index, "image_url", e.target.value)
                      }
                      placeholder="https://example.com/image.png"
                      className="w-full px-3.5 py-2.5 bg-neutral-100 md:bg-white text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
                    />

                    {/* Image Preview with Overlay Demo */}
                    {card.image_url && (
                      <div className="mt-3 p-3 bg-neutral-100 md:bg-white rounded-sm border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="relative w-32 h-40 bg-neutral-900 rounded-sm overflow-hidden shrink-0 border border-neutral-300">
                          <Image
                            src={card.image_url}
                            alt={`Preview card ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-2 text-white">
                            <p className="text-[10px] font-bold truncate leading-tight">
                              {card.heading || "Card Heading"}
                            </p>
                            <p className="text-[8px] text-neutral-300 truncate">
                              {card.subheading || "Card Subheading"}
                            </p>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-xs font-semibold text-neutral-800">Card Image Preview (With Overlay)</p>
                          <p className="text-[11px] text-neutral-500 truncate">{card.image_url}</p>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="text-xs text-red-600 hover:text-red-800 font-semibold transition-colors"
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

          {/* Action Button & Dirty indicator */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
            <div>
              {isDirty && (
                <span className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved changes
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-6 py-2.5 bg-black text-white text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-neutral-800 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Section</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
