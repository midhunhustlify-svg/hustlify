"use client";

import { useEffect, useState, useRef } from "react";
import { useDashboard, FaqSectionData, FaqItem } from "@/context/DashboardContext";
import { useToast } from "@/context/ToastContext";

export default function FaqSectionEditor() {
  const { faqData, saveFaqData, fetchFaqData, faqLoaded } = useDashboard();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<FaqSectionData>(() => {
    if (typeof window !== "undefined") {
      const draft = sessionStorage.getItem("hustlify_draft_faq_section");
      if (draft) {
        try {
          return JSON.parse(draft);
        } catch {
          // ignore
        }
      }
    }
    return faqData;
  });

  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    fetchFaqData();
  }, [fetchFaqData]);

  useEffect(() => {
    if (!isInitializedRef.current && faqLoaded) {
      isInitializedRef.current = true;
      if (typeof window !== "undefined") {
        const draft = sessionStorage.getItem("hustlify_draft_faq_section");
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
      setFormData(faqData);
    }
  }, [faqData, faqLoaded]);

  const updateStateAndDraft = (
    updater: (prev: FaqSectionData) => FaqSectionData
  ) => {
    setFormData((prev) => {
      const next = updater(prev);
      setIsDirty(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("hustlify_draft_faq_section", JSON.stringify(next));
      }
      return next;
    });
  };

  const handleSectionFieldChange = (
    field: "subheading" | "heading",
    value: string
  ) => {
    updateStateAndDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddFaq = () => {
    const newItem: FaqItem = {
      id: `faq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      question: "",
      answer: "",
    };

    updateStateAndDraft((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const handleRemoveFaq = (index: number) => {
    updateStateAndDraft((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const handleMoveFaq = (index: number, direction: "up" | "down") => {
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

  const handleFaqFieldChange = (
    index: number,
    field: keyof FaqItem,
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await saveFaqData(formData);

    if (result.success) {
      setIsDirty(false);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("hustlify_draft_faq_section");
      }
      showToast("FAQ section saved successfully", "success");
    } else {
      showToast(result.error || "Failed to save FAQ section", "error");
    }

    setLoading(false);
  };

  const items = formData.items || [];

  return (
    <div className="space-y-6">
      <div className="bg-transparent md:bg-neutral-50 p-0 md:p-6 rounded-sm space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Common Section Subheading & Heading */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="faq-subheading"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5"
              >
                Section Subheading
              </label>
              <input
                id="faq-subheading"
                type="text"
                value={formData.subheading || ""}
                onChange={(e) => handleSectionFieldChange("subheading", e.target.value)}
                placeholder="e.g. FAQ"
                className="w-full px-3.5 py-2.5 bg-neutral-100 text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black font-semibold uppercase tracking-wider"
              />
            </div>

            <div>
              <label
                htmlFor="faq-heading"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5"
              >
                Section Heading
              </label>
              <input
                id="faq-heading"
                type="text"
                value={formData.heading || ""}
                onChange={(e) => handleSectionFieldChange("heading", e.target.value)}
                placeholder="e.g. Got questions? We've got answers"
                className="w-full px-3.5 py-2.5 bg-neutral-100 text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black font-semibold"
              />
            </div>
          </div>

          {/* FAQ Items Header & Add action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200 pt-2">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-black">
                Questions & Answers ({items.length})
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Add accordion items displayed on the right side of the landing page
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddFaq}
              className="bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-4 py-2 rounded-sm transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add FAQ</span>
            </button>
          </div>

          {/* FAQ Items List */}
          {items.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-neutral-200 rounded-sm bg-neutral-50/50">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-neutral-800">No FAQs Added</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Add frequent questions and their answers to display in the accordion.
              </p>
              <button
                type="button"
                onClick={handleAddFaq}
                className="mt-4 bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-5 py-2.5 rounded-sm transition-colors inline-flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add First FAQ</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="bg-transparent md:bg-neutral-100 p-0 md:p-5 rounded-none md:rounded-sm space-y-3.5 border-0 md:border md:border-neutral-200/60"
                >
                  {/* Item Top Bar */}
                  <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      Question {index + 1}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveFaq(index, "up")}
                        className="p-1 text-neutral-500 hover:text-black disabled:opacity-20 disabled:hover:text-neutral-500 transition-colors"
                        title="Move FAQ Up"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={index === items.length - 1}
                        onClick={() => handleMoveFaq(index, "down")}
                        className="p-1 text-neutral-500 hover:text-black disabled:opacity-20 disabled:hover:text-neutral-500 transition-colors"
                        title="Move FAQ Down"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveFaq(index)}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 transition-colors ml-2"
                        title="Remove this question"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  {/* Question */}
                  <div>
                    <label
                      htmlFor={`faq-q-${index}`}
                      className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                    >
                      Question
                    </label>
                    <input
                      id={`faq-q-${index}`}
                      type="text"
                      value={item.question}
                      onChange={(e) =>
                        handleFaqFieldChange(index, "question", e.target.value)
                      }
                      placeholder="e.g. Is this program suitable for complete beginners?"
                      className="w-full px-3.5 py-2.5 bg-neutral-100 md:bg-white text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black font-medium"
                    />
                  </div>

                  {/* Answer */}
                  <div>
                    <label
                      htmlFor={`faq-a-${index}`}
                      className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                    >
                      Answer
                    </label>
                    <textarea
                      id={`faq-a-${index}`}
                      rows={3}
                      value={item.answer}
                      onChange={(e) =>
                        handleFaqFieldChange(index, "answer", e.target.value)
                      }
                      placeholder="Provide a clear, detailed answer..."
                      className="w-full px-3.5 py-2.5 bg-neutral-100 md:bg-white text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black resize-y"
                    />
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
                <span>Save FAQ Section</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
