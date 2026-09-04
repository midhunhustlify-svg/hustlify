"use client";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserRole } from "@/types/auth";
import { useDashboard, EnquiryItem, EnquiryStatus } from "@/context/DashboardContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import ConfirmDeleteModal from "@/components/dashboard/ConfirmDeleteModal";

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
    addEnquiry,
  } = useDashboard();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | EnquiryStatus>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingEnquiry, setDeletingEnquiry] = useState<EnquiryItem | null>(null);
  const [statusModalEnquiry, setStatusModalEnquiry] = useState<EnquiryItem | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Manual Add Enquiry State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEnquiry, setNewEnquiry] = useState({
    fullName: "",
    mobileNumber: "",
    course: "",
    message: "",
    status: "pending" as EnquiryStatus,
    dealAmount: "",
  });

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // Status Counts
  const counts = useMemo(() => {
    const total = enquiries.length;
    const pending = enquiries.filter((e) => e.status === "pending").length;
    const followUp = enquiries.filter((e) => e.status === "follow_up").length;
    const completed = enquiries.filter((e) => e.status === "completed").length;
    const joined = enquiries.filter((e) => e.status === "joined").length;
    return { total, pending, followUp, completed, joined };
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
    const extraData =
      newStatus === "joined"
        ? {
            converted_by: user?.user_metadata?.full_name || user?.email || "Sales Staff",
          }
        : undefined;

    const res = await updateEnquiryStatus(id, newStatus, extraData);
    if (res.success) {
      showToast(
        newStatus === "joined"
          ? "Lead marked as Joined & converted to sale!"
          : `Status updated to ${newStatus.replace("_", " ")}`,
        "success"
      );
    } else {
      showToast(res.error || "Failed to update status", "error");
    }
    setUpdatingId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingEnquiry) return;
    const id = deletingEnquiry.id;
    setDeletingId(id);
    const res = await deleteEnquiry(id);
    if (res.success) {
      showToast("Enquiry deleted successfully", "info");
      setDeletingEnquiry(null);
    } else {
      showToast(res.error || "Failed to delete enquiry", "error");
    }
    setDeletingId(null);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnquiry.fullName.trim() || !newEnquiry.mobileNumber.trim()) {
      showToast("Full name and mobile number are required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const isJoined = newEnquiry.status === "joined";
      const res = await addEnquiry({
        full_name: newEnquiry.fullName.trim(),
        mobile_number: newEnquiry.mobileNumber.trim(),
        course: newEnquiry.course.trim() || "General Inquiry",
        message: newEnquiry.message.trim() || "Manual entry",
        status: newEnquiry.status,
        converted_by: isJoined ? (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "Sales Staff") : undefined,
        deal_amount: newEnquiry.dealAmount ? Number(newEnquiry.dealAmount) : undefined,
      });

      if (res.success) {
        showToast(
          isJoined ? "Sale lead created & marked as Joined!" : "Enquiry added successfully",
          "success"
        );
        setNewEnquiry({
          fullName: "",
          mobileNumber: "",
          course: "",
          message: "",
          status: "pending",
          dealAmount: "",
        });
        setIsAddOpen(false);
        await fetchEnquiries();
      } else {
        showToast(res.error || "Failed to add enquiry", "error");
      }
    } catch {
      showToast("Error adding enquiry", "error");
    } finally {
      setIsSubmitting(false);
    }
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
      case "joined":
        return {
          label: "Joined (Sale)",
          bg: "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold",
          dot: "bg-emerald-600",
        };
      default:
        return {
          label: "Pending",
          bg: "bg-neutral-100 text-neutral-700 border-neutral-200",
          dot: "bg-neutral-400",
        };
    }
  };

  const statusOptions: {
    value: EnquiryStatus;
    label: string;
    dot: string;
    description: string;
    activeBorder: string;
    activeBg: string;
  }[] = [
    {
      value: "pending",
      label: "Pending",
      dot: "bg-amber-500",
      description: "New inquiry awaiting initial follow-up",
      activeBorder: "border-amber-400 ring-1 ring-amber-400",
      activeBg: "bg-amber-50/70 text-amber-900",
    },
    {
      value: "follow_up",
      label: "Follow Up",
      dot: "bg-blue-500",
      description: "Discussion in progress with candidate",
      activeBorder: "border-blue-400 ring-1 ring-blue-400",
      activeBg: "bg-blue-50/70 text-blue-900",
    },
    {
      value: "completed",
      label: "Completed",
      dot: "bg-neutral-500",
      description: "Enquiry resolved or finished",
      activeBorder: "border-neutral-400 ring-1 ring-neutral-400",
      activeBg: "bg-neutral-100 text-neutral-900",
    },
    {
      value: "joined",
      label: "Joined (Sale)",
      dot: "bg-emerald-600",
      description: "Candidate enrolled & recorded as sale",
      activeBorder: "border-emerald-500 ring-1 ring-emerald-500",
      activeBg: "bg-emerald-50/80 text-emerald-900",
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Desktop Top Header (Hidden on mobile to avoid duplicate title & description) */}
      <div className="hidden md:flex md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black tracking-tight">
            Enquiries
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage incoming visitor leads, course inquiries, and follow-up statuses
          </p>
        </div>

        <div>
          {/* Add Manual Enquiry Button (Desktop) */}
          <button
            type="button"
            onClick={() => setIsAddOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-sm transition-colors cursor-pointer"
          >
            {isAddOpen ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Cancel</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Enquiry</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Counter Cards (Dashboard) */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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
                ? "bg-neutral-800 text-white border-neutral-800 shadow-sm"
                : "bg-neutral-50 hover:bg-neutral-100 text-black border-neutral-200/80"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`w-2 h-2 rounded-full ${
                selectedFilter === "completed" ? "bg-white" : "bg-neutral-500"
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

          {/* Joined (Sales) - 5th box full width on mobile view with proper bg color */}
          <div
            onClick={() => setSelectedFilter("joined")}
            className={`col-span-2 sm:col-span-1 p-4 rounded-sm border cursor-pointer transition-all ${
              selectedFilter === "joined"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-950 border-emerald-200/90 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between sm:block">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full ${
                    selectedFilter === "joined" ? "bg-white" : "bg-emerald-600"
                  }`} />
                  <span className={`text-[11px] font-semibold uppercase tracking-wider block ${
                    selectedFilter === "joined" ? "text-white" : "text-emerald-800 font-bold"
                  }`}>
                    Joined (Sales)
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {counts.joined}
                </div>
              </div>
              <span className={`sm:hidden text-[10px] font-bold px-2.5 py-1 rounded-full ${
                selectedFilter === "joined" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
              }`}>
                Converted Sales
              </span>
            </div>
          </div>
        </div>

        {/* Mobile view: All Leads title + Add Enquiry button */}
        <div className="flex md:hidden items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              All Leads
            </span>
            <span className="bg-neutral-100 text-neutral-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-neutral-200">
              {filteredEnquiries.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {isAddOpen ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Cancel</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Enquiry</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Add Enquiry Form */}
      <AnimatePresence>
        {isAddOpen && (
          <motion.div
            key="add-enquiry-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">+</span>
                New Manual Enquiry
              </h2>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-xs font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={newEnquiry.fullName}
                    onChange={(e) => setNewEnquiry((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-sm text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black placeholder:text-neutral-400"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit mobile number"
                    value={newEnquiry.mobileNumber}
                    onChange={(e) => setNewEnquiry((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-sm text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black placeholder:text-neutral-400"
                  />
                </div>

                {/* Course */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Course / Subject
                  </label>
                  <input
                    type="text"
                    placeholder="Enter course or subject"
                    value={newEnquiry.course}
                    onChange={(e) => setNewEnquiry((prev) => ({ ...prev, course: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-sm text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black placeholder:text-neutral-400"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={newEnquiry.status}
                    onChange={(e) => setNewEnquiry((prev) => ({ ...prev, status: e.target.value as EnquiryStatus }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-sm text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="follow_up">Follow Up</option>
                    <option value="completed">Completed</option>
                    <option value="joined">Joined (Converted Sale)</option>
                  </select>
                </div>

                {/* Deal Amount (if Joined) */}
                {newEnquiry.status === "joined" && (
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1.5">
                      Deal / Course Fee (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Enter deal amount in ₹"
                      value={newEnquiry.dealAmount}
                      onChange={(e) => setNewEnquiry((prev) => ({ ...prev, dealAmount: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-300 rounded-sm text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-neutral-400"
                    />
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                  Message / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Details or message from the student / lead..."
                  value={newEnquiry.message}
                  onChange={(e) => setNewEnquiry((prev) => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-sm text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black placeholder:text-neutral-400 resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setNewEnquiry({ fullName: "", mobileNumber: "", course: "", message: "", status: "pending", dealAmount: "" });
                  }}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-sm transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Enquiry</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="w-full pl-9 pr-8 py-2.5 bg-neutral-100 text-black text-xs rounded-lg sm:rounded-sm border border-transparent focus:border-neutral-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-neutral-400 transition-all shadow-2xs"
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
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-black p-0.5 text-xs font-bold transition-colors"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Status Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {(["all", "pending", "follow_up", "completed", "joined"] as const).map((filterKey) => {
              const active = selectedFilter === filterKey;
              const labels: Record<string, string> = {
                all: "All",
                pending: "Pending",
                follow_up: "Follow Up",
                completed: "Completed",
                joined: "Joined (Sales)",
              };
              return (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setSelectedFilter(filterKey)}
                  className={`shrink-0 px-3.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold rounded-full sm:rounded-sm whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-black text-white shadow-xs"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 active:scale-95"
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
        <div className="space-y-2.5">
          {filteredEnquiries.map((enquiry) => {
            const badge = getStatusBadge(enquiry.status);
            const isUpdating = updatingId === enquiry.id;
            const isDeleting = deletingId === enquiry.id;
            const isExpanded = !!expandedIds[enquiry.id];

            const initial = enquiry.full_name?.trim()?.charAt(0)?.toUpperCase() || "U";
            const formattedDate = new Date(enquiry.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            const cleanPhone = enquiry.mobile_number?.replace(/[^0-9]/g, "");

            return (
              <div
                key={enquiry.id}
                className="bg-white hover:bg-neutral-50/60 border border-neutral-200/90 rounded-xl p-3 sm:p-3.5 transition-all shadow-2xs"
              >
                {/* Main Compact Row - Matches Reference Design */}
                <div className="flex items-center justify-between gap-3">
                  {/* Left Section: Avatar + Name + Status Pill + Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Circular Avatar */}
                    <div className="w-9 h-9 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                      {initial}
                    </div>

                    {/* Content Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                          {enquiry.full_name || "Unnamed Lead"}
                        </h4>
                        {/* Status Pill (Clickable to change status) */}
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => setStatusModalEnquiry(enquiry)}
                          title="Click to update status"
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-transform active:scale-95 cursor-pointer capitalize inline-flex items-center gap-1 ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          <span>{badge.label}</span>
                        </button>
                      </div>

                      {/* Subtitle: Course • Mobile • */}
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5 flex-wrap">
                        {enquiry.course && (
                          <span className="font-medium text-neutral-700">
                            {enquiry.course}
                          </span>
                        )}
                        {enquiry.course && enquiry.mobile_number && <span>•</span>}
                        {enquiry.mobile_number && (
                          <span className="font-mono text-neutral-600">
                            {enquiry.mobile_number}
                          </span>
                        )}
                        <span>•</span>
                      </div>

                      {/* Date */}
                      <span className="text-[10px] text-neutral-400 block mt-0.5">
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* Right Action Buttons: WhatsApp, Call, and Dropdown Expand Toggle */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 text-emerald-600 hover:text-white flex items-center justify-center transition-colors shadow-xs"
                        title="WhatsApp Lead"
                        aria-label="WhatsApp lead"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                        </svg>
                      </a>
                    )}

                    {cleanPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="w-8 h-8 rounded-full bg-white border border-neutral-200 hover:border-black text-neutral-600 hover:text-black flex items-center justify-center transition-colors shadow-xs"
                        title="Call Lead"
                        aria-label="Call lead"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </a>
                    )}

                    {/* Dropdown Toggle Button */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(enquiry.id)}
                      className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-600 hover:text-black flex items-center justify-center transition-all cursor-pointer shadow-xs"
                      title={isExpanded ? "Collapse Details" : "Show Full Details"}
                      aria-label={isExpanded ? "Collapse details" : "Show full details"}
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded Full Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* Converted By / Deal Amount */}
                    {(enquiry.converted_by || enquiry.deal_amount) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {enquiry.converted_by && (
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-sm border border-emerald-200">
                            Converted by: {enquiry.converted_by}
                          </span>
                        )}
                        {enquiry.deal_amount && (
                          <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-sm border border-green-200">
                            ₹{enquiry.deal_amount}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Message Note Content */}
                    {enquiry.message && enquiry.message.trim() ? (
                      <div className="bg-neutral-50 border border-neutral-200/80 rounded-lg p-2.5 sm:p-3 text-xs text-neutral-700">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                          Message Note
                        </p>
                        <p className="whitespace-pre-wrap leading-relaxed">{enquiry.message}</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-neutral-400 italic">No additional note provided.</p>
                    )}

                    {/* Bottom Action Row in Expanded State */}
                    <div className="flex items-center justify-between pt-1 border-t border-neutral-100/80">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => setStatusModalEnquiry(enquiry)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        <span>Change Status ({badge.label})</span>
                        <svg className="w-3 h-3 opacity-70 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => setDeletingEnquiry(enquiry)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reusable Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingEnquiry}
        onClose={() => setDeletingEnquiry(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Lead Enquiry"
        itemName={deletingEnquiry?.full_name}
        message={
          deletingEnquiry ? (
            <>
              Are you sure you want to permanently delete the enquiry from{" "}
              <strong className="text-neutral-900 font-bold">
                {deletingEnquiry.full_name}
              </strong>{" "}
              ({deletingEnquiry.mobile_number})? This action cannot be undone.
            </>
          ) : undefined
        }
        confirmText="Delete Enquiry"
        isLoading={!!deletingId}
      />

      {/* Mobile-First Status Action Sheet / Modal */}
      {statusModalEnquiry && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setStatusModalEnquiry(null)}
          />

          {/* Sheet Container */}
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-2xl z-10 overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Grab Handle for Mobile View */}
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1 bg-neutral-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Update Lead Status</h3>
                <p className="text-xs text-neutral-500 truncate max-w-[240px]">
                  {statusModalEnquiry.full_name} • {statusModalEnquiry.mobile_number}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalEnquiry(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Status Options List */}
            <div className="p-4 space-y-2.5 max-h-[65vh] overflow-y-auto">
              {statusOptions.map((opt) => {
                const isCurrent = statusModalEnquiry.status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      const targetEnquiry = statusModalEnquiry;
                      setStatusModalEnquiry(null);
                      if (!isCurrent) {
                        handleStatusChange(targetEnquiry.id, opt.value);
                      }
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isCurrent
                        ? `${opt.activeBg} ${opt.activeBorder} font-semibold shadow-xs`
                        : "border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50/80 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 ${opt.dot}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-900">{opt.label}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-semibold bg-white/90 text-neutral-800 border border-neutral-200/80 px-1.5 py-0.2 rounded-xs">
                              Current Status
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                          {opt.description}
                        </p>
                      </div>
                    </div>

                    {isCurrent ? (
                      <div className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0 ml-2 shadow-xs">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-neutral-300 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer / Cancel for Mobile */}
            <div className="px-4 pb-4 pt-1 sm:hidden">
              <button
                type="button"
                onClick={() => setStatusModalEnquiry(null)}
                className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
