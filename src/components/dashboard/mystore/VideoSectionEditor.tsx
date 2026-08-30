"use client";

import { useEffect, useState, useRef } from "react";
import { useDashboard, VideoSectionData, VideoItem } from "@/context/DashboardContext";
import { useToast } from "@/context/ToastContext";

export default function VideoSectionEditor() {
  const { videoData, saveVideoData, fetchVideoData, videoLoaded } = useDashboard();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<VideoSectionData>(() => {
    if (typeof window !== "undefined") {
      const draft = sessionStorage.getItem("hustlify_draft_video_section");
      if (draft) {
        try {
          return JSON.parse(draft);
        } catch {
          // ignore
        }
      }
    }
    return videoData;
  });

  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const isInitializedRef = useRef(false);

  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  useEffect(() => {
    fetchVideoData();
  }, [fetchVideoData]);

  useEffect(() => {
    if (!isInitializedRef.current && videoLoaded) {
      isInitializedRef.current = true;
      if (typeof window !== "undefined") {
        const draft = sessionStorage.getItem("hustlify_draft_video_section");
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
      setFormData(videoData);
    }
  }, [videoData, videoLoaded]);

  const updateStateAndDraft = (
    updater: (prev: VideoSectionData) => VideoSectionData
  ) => {
    setFormData((prev) => {
      const next = updater(prev);
      setIsDirty(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("hustlify_draft_video_section", JSON.stringify(next));
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

  const handleAddVideo = () => {
    const newVideo: VideoItem = {
      id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      video_url: "",
      title: "",
    };

    updateStateAndDraft((prev) => ({
      ...prev,
      items: [...(prev.items || []), newVideo],
    }));
  };

  const handleRemoveVideo = (index: number) => {
    updateStateAndDraft((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const handleMoveVideo = (index: number, direction: "up" | "down") => {
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

  const handleVideoFieldChange = (
    index: number,
    field: keyof VideoItem,
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

  const handleVideoUpload = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      showToast("Please select a valid video file (MP4, WEBM, MOV, etc.)", "error");
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
        handleVideoFieldChange(index, "video_url", data.url);
        showToast("Video uploaded successfully", "success");
      } else {
        showToast(data.error || "Failed to upload video", "error");
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error uploading video", "error");
    } finally {
      setUploadingIndex(null);
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index]!.value = "";
      }
    }
  };

  const handleRemoveVideoUrl = (index: number) => {
    handleVideoFieldChange(index, "video_url", "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await saveVideoData(formData);

    if (result.success) {
      setIsDirty(false);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("hustlify_draft_video_section");
      }
      showToast("Video section saved successfully", "success");
    } else {
      showToast(result.error || "Failed to save video section", "error");
    }

    setLoading(false);
  };

  const items = formData.items || [];

  return (
    <div className="space-y-6">
      <div className="bg-transparent md:bg-neutral-50 p-0 md:p-6 rounded-sm space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section Subheading & Heading */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="video-subheading"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5"
              >
                Subheading
              </label>
              <input
                id="video-subheading"
                type="text"
                value={formData.subheading || ""}
                onChange={(e) => handleSectionFieldChange("subheading", e.target.value)}
                placeholder="e.g. Featured Videos"
                className="w-full px-3.5 py-2.5 bg-neutral-100 text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black font-medium"
              />
            </div>

            <div>
              <label
                htmlFor="video-heading"
                className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5"
              >
                Section Heading
              </label>
              <input
                id="video-heading"
                type="text"
                value={formData.heading || ""}
                onChange={(e) => handleSectionFieldChange("heading", e.target.value)}
                placeholder="e.g. Experience The Transformation in Action"
                className="w-full px-3.5 py-2.5 bg-neutral-100 text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black font-semibold"
              />
            </div>
          </div>

          {/* Videos Header & Add Video action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200 pt-2">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-black">
                Videos ({items.length})
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Upload video files or enter direct video / YouTube / Vimeo links
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddVideo}
              className="bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-4 py-2 rounded-sm transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Video</span>
            </button>
          </div>

          {/* Items List */}
          {items.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-neutral-200 rounded-sm bg-neutral-50/50">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-neutral-800">No Videos Added</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Add video items with uploaded files or external video links to display on the landing page.
              </p>
              <button
                type="button"
                onClick={handleAddVideo}
                className="mt-4 bg-black text-white hover:bg-neutral-800 text-xs font-semibold px-5 py-2.5 rounded-sm transition-colors inline-flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add First Video</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((video, index) => (
                <div
                  key={video.id || index}
                  className="bg-transparent md:bg-neutral-100 p-0 md:p-5 rounded-none md:rounded-sm space-y-4 border-0 md:border md:border-neutral-200/60"
                >
                  {/* Card Top Bar */}
                  <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      Video {index + 1}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Move Up Button */}
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveVideo(index, "up")}
                        className="p-1 text-neutral-500 hover:text-black disabled:opacity-20 disabled:hover:text-neutral-500 transition-colors"
                        title="Move Video Up"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>

                      {/* Move Down Button */}
                      <button
                        type="button"
                        disabled={index === items.length - 1}
                        onClick={() => handleMoveVideo(index, "down")}
                        className="p-1 text-neutral-500 hover:text-black disabled:opacity-20 disabled:hover:text-neutral-500 transition-colors"
                        title="Move Video Down"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(index)}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 transition-colors ml-2"
                        title="Remove this video"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  {/* Video Title */}
                  <div>
                    <label
                      htmlFor={`video-title-${index}`}
                      className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                    >
                      Video Title / Caption (Optional)
                    </label>
                    <input
                      id={`video-title-${index}`}
                      type="text"
                      value={video.title || ""}
                      onChange={(e) =>
                        handleVideoFieldChange(index, "title", e.target.value)
                      }
                      placeholder="e.g. Student Success Stories & Live Demo"
                      className="w-full px-3.5 py-2.5 bg-neutral-100 md:bg-white text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black font-semibold"
                    />
                  </div>

                  {/* Video Upload and URL */}
                  <div className="space-y-3 pt-1">
                    <label className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider">
                      Video Source
                    </label>

                    <input
                      ref={(el) => {
                        fileInputRefs.current[index] = el;
                      }}
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleVideoUpload(index, e)}
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
                            <span>Uploading Video...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span>Upload Video File</span>
                          </>
                        )}
                      </button>
                      <span className="text-xs text-neutral-400">or enter direct video / YouTube link below</span>
                    </div>

                    <input
                      type="text"
                      value={video.video_url || ""}
                      onChange={(e) =>
                        handleVideoFieldChange(index, "video_url", e.target.value)
                      }
                      placeholder="https://... (MP4, YouTube, Vimeo URL)"
                      className="w-full px-3.5 py-2.5 bg-neutral-100 md:bg-white text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black"
                    />

                    {/* Video Preview */}
                    {video.video_url && (
                      <div className="mt-3 p-3 bg-neutral-100 md:bg-white rounded-sm border border-neutral-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-neutral-800">Video Preview</p>
                          <button
                            type="button"
                            onClick={() => handleRemoveVideoUrl(index)}
                            className="text-xs text-red-600 hover:text-red-800 font-semibold transition-colors"
                          >
                            Remove Video
                          </button>
                        </div>
                        <div className="relative w-full aspect-video bg-black rounded-sm overflow-hidden border border-neutral-300">
                          {video.video_url.includes("youtube.com") || video.video_url.includes("youtu.be") ? (
                            <iframe
                              src={
                                video.video_url.includes("embed")
                                  ? video.video_url
                                  : video.video_url.includes("youtu.be/")
                                  ? `https://www.youtube.com/embed/${video.video_url.split("youtu.be/")[1]?.split("?")[0]}`
                                  : `https://www.youtube.com/embed/${new URLSearchParams(new URL(video.video_url).search).get("v")}`
                              }
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title="Video preview"
                            />
                          ) : (
                            <video
                              src={video.video_url}
                              controls
                              className="w-full h-full object-contain"
                            >
                              Your browser does not support the video tag.
                            </video>
                          )}
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
                <span>Save Video Section</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
