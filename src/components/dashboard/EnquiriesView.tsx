"use client";

import { useState, useMemo, useEffect } from "react";
import { UserRole } from "@/types/auth";
import { useDashboard, EnquiryItem, EnquiryStatus } from "@/context/DashboardContext";
import { useToast } from "@/context/ToastContext";

interface EnquiriesViewProps {
  role: UserRole;
}

export default function EnquiriesView({ role: _role }: EnquiriesViewProps) {
  const {
    enquiries,
    enquiriesLoaded,
    fetchEnquiries,
    updateEnquiryStatus,
    deleteEnquiry,
  } = useDashboard();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | EnquiryStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // Status Counts
  const counts = useMemo(() => {
    const total = enquiries.length;
    const pending = enquiries.filter((e) => e.status === "pending").length;
    const followUp = enquiries.filter((e) => e.status === "follow_up").length;
    const completed = enquiries.filter((e) => e.status === "completed").length;
    return { total, pending, followUp, completed };
  }, [enquiries]);

  // Filtered List
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((item) => {
      // Status filter
      if (selectedFilter !== "all" && item.status !== selectedFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = item.full_name?.toLowerCase().includes(query);
        const phoneMatch = item.mobile_number?.toLowerCase().includes(query);
        const courseMatch = item.course?.toLowerCase().includes(query);
        const messageMatch = item.message?.toLowerCase().includes(query);
        return nameMatch || phoneMatch || courseMatch || messageMatch;
      }
      return true;
    });
  }, [enquiries, selectedFilter, searchQuery]);

  const handleStatusChange = async (id: string, newStatus: EnquiryStatus) => {
    setUpdatingId(id);
    const res = await updateEnquiryStatus(id, newStatus);
    if (res.success) {
      showToast(`Status updated to ${newStatus.replace("_", " ")}`, "success");
    } else {
      showToast(res.error || "Failed to update status", "error");
    }
    setUpdatingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this enquiry?")) {
      return;
    }
    setDeletingId(id);
    const res = await deleteEnquiry(id);
    if (res.success) {
      showToast("Enquiry deleted", "info");
    } else {
      showToast(res.error || "Failed to delete enquiry", "error");
    }
    setDeletingId(null);
  };

  const getStatusBadge = (status: EnquiryStatus) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-500",
        };
      case "follow_up":
        return {
          label: "Follow Up",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          dot: "bg-blue-500",
        };
      case "completed":
        return {
          label: "Completed",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500",
        };
      default:
        return {
          label: "Pending",
          bg: "bg-neutral-100 text-neutral-700 border-neutral-200",
          dot: "bg-neutral-400",
        };
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black tracking-tight">
            Enquiries
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage incoming visitor leads, course inquiries, and follow-up statuses
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchEnquiries()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-sm transition-colors self-start sm:self-auto cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total */}
        <div
          onClick={() => setSelectedFilter("all")}
          className={`p-4 rounded-sm border cursor-pointer transition-all ${
            selectedFilter === "all"
              ? "bg-black text-white border-black shadow-sm"
              : "bg-neutral-50 hover:bg-neutral-100 text-black border-neutral-200/80"
          }`}
        >
          <span className={`text-[11px] font-semibold uppercase tracking-wider block mb-1 ${
            selectedFilter === "all" ? "text-neutral-300" : "text-neutral-500"
          }`}>
            Total Enquiries
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {counts.total}
          </div>
        </div>

        {/* Pending */}
        <div
          onClick={() => setSelectedFilter("pending")}
          className={`p-4 rounded-sm border cursor-pointer transition-all ${
            selectedFilter === "pending"
              ? "bg-amber-500 text-white border-amber-500 shadow-sm"
              : "bg-neutral-50 hover:bg-neutral-100 text-black border-neutral-200/80"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`w-2 h-2 rounded-full ${
              selectedFilter === "pending" ? "bg-white" : "bg-amber-500"
            }`} />
            <span className={`text-[11px] font-semibold uppercase tracking-wider block ${
              selectedFilter === "pending" ? "text-white" : "text-neutral-500"
            }`}>
              Pending
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {counts.pending}
          </div>
        </div>

        {/* Follow Up */}
        <div
          onClick={() => setSelectedFilter("follow_up")}
          className={`p-4 rounded-sm border cursor-pointer transition-all ${
            selectedFilter === "follow_up"
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-neutral-50 hover:bg-neutral-100 text-black border-neutral-200/80"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`w-2 h-2 rounded-full ${
              selectedFilter === "follow_up" ? "bg-white" : "bg-blue-500"
            }`} />
            <span className={`text-[11px] font-semibold uppercase tracking-wider block ${
              selectedFilter === "follow_up" ? "text-white" : "text-neutral-500"
            }`}>
              Follow Up
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {counts.followUp}
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => setSelectedFilter("completed")}
          className={`p-4 rounded-sm border cursor-pointer transition-all ${
            selectedFilter === "completed"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
              : "bg-neutral-50 hover:bg-neutral-100 text-black border-neutral-200/80"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`w-2 h-2 rounded-full ${
              selectedFilter === "completed" ? "bg-white" : "bg-emerald-500"
            }`} />
            <span className={`text-[11px] font-semibold uppercase tracking-wider block ${
              selectedFilter === "completed" ? "text-white" : "text-neutral-500"
            }`}>
              Completed
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {counts.completed}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, mobile, course, or message..."
              className="w-full pl-9 pr-4 py-2.5 bg-neutral-100 text-black text-xs rounded-sm focus:outline-none focus:ring-1 focus:ring-black placeholder:text-neutral-400"
            />
            <svg
              className="w-4 h-4 text-neutral-400 absolute left-3 top-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Status Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(["all", "pending", "follow_up", "completed"] as const).map((filterKey) => {
              const active = selectedFilter === filterKey;
              const labels: Record<string, string> = {
                all: "All",
                pending: "Pending",
                follow_up: "Follow Up",
                completed: "Completed",
              };
              return (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setSelectedFilter(filterKey)}
                  className={`px-3 py-2 text-xs font-semibold rounded-sm whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? "bg-black text-white"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {labels[filterKey]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Enquiries List */}
      {!enquiriesLoaded ? (
        <div className="py-12 text-center text-xs text-neutral-400">
          Loading enquiries...
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-neutral-200 rounded-sm bg-neutral-50/50 space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-neutral-800">No Enquiries Found</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {searchQuery.trim() || selectedFilter !== "all"
              ? "No enquiries match your search filter criteria."
              : "When visitors submit the contact form on your website, inquiries will appear here automatically."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredEnquiries.map((enquiry) => {
            const badge = getStatusBadge(enquiry.status);
            const isUpdating = updatingId === enquiry.id;
            const isDeleting = deletingId === enquiry.id;

            const formattedDate = new Date(enquiry.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            const cleanPhone = enquiry.mobile_number?.replace(/[^0-9]/g, "");

            return (
              <div
                key={enquiry.id}
                className="bg-neutral-50 hover:bg-neutral-50/80 border border-neutral-200/80 rounded-sm p-4 sm:p-5 transition-all space-y-3 text-black"
              >
                {/* Top Row: User details & Status Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/60 pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {enquiry.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-black">
                          {enquiry.full_name}
                        </h4>
                        {enquiry.course && (
                          <span className="text-[10px] font-semibold bg-neutral-200/80 text-neutral-700 px-2 py-0.5 rounded-sm">
                            {enquiry.course}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400 block mt-0.5">
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* Status Dropdown & Action */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {/* Status Pill / Dropdown */}
                    <div className="relative">
                      <select
                        disabled={isUpdating}
                        value={enquiry.status}
                        onChange={(e) =>
                          handleStatusChange(enquiry.id, e.target.value as EnquiryStatus)
                        }
                        className={`text-xs font-semibold px-3 py-1.5 rounded-sm border focus:outline-none cursor-pointer appearance-none pr-7 ${badge.bg}`}
                      >
                        <option value="pending" className="bg-white text-black">
                          ● Pending
                        </option>
                        <option value="follow_up" className="bg-white text-black">
                          ● Follow Up
                        </option>
                        <option value="completed" className="bg-white text-black">
                          ● Completed
                        </option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-70">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(enquiry.id)}
                      title="Delete Enquiry"
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded-sm hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Middle Row: Contact Links */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {/* Phone Call */}
                  <a
                    href={`tel:${enquiry.mobile_number}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-black bg-white border border-neutral-200 px-2.5 py-1 rounded-sm transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{enquiry.mobile_number}</span>
                  </a>

                  {/* WhatsApp Direct */}
                  {cleanPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:text-green-800 bg-green-50 border border-green-200 px-2.5 py-1 rounded-sm transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>

                {/* Bottom Row: Message Content */}
                <div className="bg-white border border-neutral-200/80 rounded-sm p-3 text-xs sm:text-sm text-neutral-700 font-normal leading-relaxed">
                  <p className="whitespace-pre-wrap">{enquiry.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
