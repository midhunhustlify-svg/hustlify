"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { UserRole } from "@/types/auth";
import { useDashboard, EnquiryItem } from "@/context/DashboardContext";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

interface SalesViewProps {
  role: UserRole;
}

interface StaffOption {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export default function SalesView({ role: _role }: SalesViewProps) {
  const { enquiries, enquiriesLoaded, fetchEnquiries, addEnquiry } = useDashboard();
  const { showToast } = useToast();
  const { user } = useAuth();

  // Filters
  const [selectedStaff, setSelectedStaff] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [filterAllTime, setFilterAllTime] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Staff options state
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loadingStaff, setLoadingStaff] = useState<boolean>(true);

  // Quick Add Sale Modal state
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);

  // View Staff Sales Modal
  const [viewStaffModal, setViewStaffModal] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saleForm, setSaleForm] = useState({
    fullName: "",
    mobileNumber: "",
    course: "",
    dealAmount: "",
    salesStaff: "",
    message: "",
  });

  // Fetch staff from profiles API
  const fetchStaffMembers = useCallback(async () => {
    setLoadingStaff(true);
    try {
      const res = await fetch("/api/onboard-staff");
      const data = await res.json();
      if (res.ok && data.staff) {
        setStaffList(data.staff);
      }
    } catch {
      // ignore
    } finally {
      setLoadingStaff(false);
    }
  }, []);

  useEffect(() => {
    fetchEnquiries();
    fetchStaffMembers();
  }, [fetchEnquiries, fetchStaffMembers]);

  // Combined sales staff options (from onboarded profiles + any converted_by values)
  const salesStaffOptions = useMemo(() => {
    const staffSet = new Map<string, { label: string; email: string }>();

    // From onboarded profiles
    staffList.forEach((s) => {
      const label = s.full_name ? `${s.full_name} (${s.email})` : s.email;
      staffSet.set(s.email.toLowerCase(), { label, email: s.email });
    });

    // From existing enquiries converted_by
    enquiries.forEach((e) => {
      if (e.converted_by && e.converted_by.trim()) {
        const key = e.converted_by.toLowerCase();
        if (!staffSet.has(key)) {
          staffSet.set(key, { label: e.converted_by, email: e.converted_by });
        }
      }
    });

    return Array.from(staffSet.values());
  }, [staffList, enquiries]);

  // All converted sales leads (status === "joined")
  const allSales = useMemo(() => {
    return enquiries.filter((e) => e.status === "joined");
  }, [enquiries]);

  // Filtered sales list based on staff, month, and search query
  const filteredSales = useMemo(() => {
    return allSales.filter((item) => {
      // Staff filter
      if (selectedStaff !== "all") {
        const staffKey = selectedStaff.toLowerCase();
        const convertedKey = (item.converted_by || "").toLowerCase();
        if (convertedKey !== staffKey && !convertedKey.includes(staffKey)) {
          return false;
        }
      }

      // Month filter (based on converted_at or created_at)
      if (!filterAllTime && selectedMonth) {
        const itemDate = item.converted_at || item.created_at;
        if (!itemDate.startsWith(selectedMonth)) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = item.full_name?.toLowerCase().includes(q);
        const phoneMatch = item.mobile_number?.toLowerCase().includes(q);
        const courseMatch = item.course?.toLowerCase().includes(q);
        const staffMatch = item.converted_by?.toLowerCase().includes(q);
        return nameMatch || phoneMatch || courseMatch || staffMatch;
      }

      return true;
    });
  }, [allSales, selectedStaff, filterAllTime, selectedMonth, searchQuery]);

  // Total KPIs
  const kpis = useMemo(() => {
    const currentMonthPrefix = getCurrentMonth();

    // Total filtered leads
    const totalSalesCount = filteredSales.length;

    // This month sales
    const thisMonthCount = allSales.filter((s) => {
      const d = s.converted_at || s.created_at;
      const matchesMonth = d.startsWith(currentMonthPrefix);
      if (selectedStaff !== "all") {
        const staffKey = selectedStaff.toLowerCase();
        const convertedKey = (s.converted_by || "").toLowerCase();
        return matchesMonth && (convertedKey === staffKey || convertedKey.includes(staffKey));
      }
      return matchesMonth;
    }).length;

    // Total sales revenue from deal_amount
    const totalRevenue = filteredSales.reduce((acc, s) => acc + (s.deal_amount || 0), 0);

    // Total enquiries (all leads) for conversion rate
    const relevantEnquiries = selectedStaff === "all"
      ? enquiries
      : enquiries.filter((e) => (e.converted_by || "").toLowerCase().includes(selectedStaff.toLowerCase()));

    const totalLeadsCount = relevantEnquiries.length;
    const conversionRate = totalLeadsCount > 0
      ? ((allSales.filter((s) => selectedStaff === "all" || (s.converted_by || "").toLowerCase().includes(selectedStaff.toLowerCase())).length / totalLeadsCount) * 100).toFixed(1)
      : "0";

    return {
      totalSalesCount,
      thisMonthCount,
      totalRevenue,
      totalLeadsCount,
      conversionRate,
    };
  }, [filteredSales, allSales, enquiries, selectedStaff]);

  // Staff Performance Leaderboard
  const staffLeaderboard = useMemo(() => {
    const map = new Map<string, { staff: string; totalSales: number; thisMonthSales: number; totalRevenue: number }>();
    const currentMonthPrefix = getCurrentMonth();

    allSales.forEach((s) => {
      const staffName = s.converted_by || "Unassigned / Direct";
      const existing = map.get(staffName) || {
        staff: staffName,
        totalSales: 0,
        thisMonthSales: 0,
        totalRevenue: 0,
      };

      existing.totalSales += 1;
      existing.totalRevenue += s.deal_amount || 0;

      const dateStr = s.converted_at || s.created_at;
      if (dateStr.startsWith(currentMonthPrefix)) {
        existing.thisMonthSales += 1;
      }

      map.set(staffName, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalSales - a.totalSales);
  }, [allSales]);

  // Month Options (last 12 months)
  const monthOptions = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      opts.push(val);
    }
    return opts;
  }, []);

  const handleAddSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.fullName.trim() || !saleForm.mobileNumber.trim()) {
      showToast("Student name and mobile number are required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const attributedStaff = saleForm.salesStaff.trim() || user?.email || user?.user_metadata?.full_name || "Sales Team";
      const res = await addEnquiry({
        full_name: saleForm.fullName.trim(),
        mobile_number: saleForm.mobileNumber.trim(),
        course: saleForm.course.trim() || "Course Admission",
        message: saleForm.message.trim() || "Direct Sale Conversion",
        status: "joined",
        converted_by: attributedStaff,
        deal_amount: saleForm.dealAmount ? Number(saleForm.dealAmount) : undefined,
      });

      if (res.success) {
        showToast("Sale recorded successfully and attributed to staff!", "success");
        setSaleForm({
          fullName: "",
          mobileNumber: "",
          course: "",
          dealAmount: "",
          salesStaff: "",
          message: "",
        });
        setIsAddSaleOpen(false);
        await fetchEnquiries();
      } else {
        showToast(res.error || "Failed to record sale", "error");
      }
    } catch {
      showToast("Error recording sale", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* ── Desktop Header (Hidden on mobile to avoid duplicate title & description) ── */}
      <div className="hidden md:flex md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-black tracking-tight">
              Sales & Conversions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
              {allSales.length} Total Sales
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Track student admissions, revenue performance, and sales staff conversions.
          </p>
        </div>

        <div>
          {/* Record Direct Sale Button (Desktop) */}
          <button
            type="button"
            onClick={() => setIsAddSaleOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-sm transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Record Closed Sale</span>
          </button>
        </div>
      </div>

      {/* ── Key Metric KPI Cards (Dashboard Boxes placed at Top, Grid-Cols-2 on mobile) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Closed Sales */}
        <div className="bg-white border border-neutral-200 rounded-lg p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Total Closed Sales
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-black mt-2">
            {!enquiriesLoaded ? "..." : kpis.totalSalesCount}
          </div>
          <div className="mt-2 text-[10px] sm:text-[11px] font-medium text-neutral-500 truncate">
            {selectedStaff === "all" ? "Across all team members" : `Converted by ${selectedStaff}`}
          </div>
        </div>

        {/* This Month Sales */}
        <div className="bg-white border border-neutral-200 rounded-lg p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              This Month Sales
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-2">
            {!enquiriesLoaded ? "..." : kpis.thisMonthCount}
          </div>
          <div className="mt-2 text-[10px] sm:text-[11px] font-medium text-neutral-500 truncate">
            {monthLabel(getCurrentMonth())}
          </div>
        </div>

        {/* Total Sales Value */}
        <div className="bg-white border border-neutral-200 rounded-lg p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-green-600 mt-2 truncate">
            {!enquiriesLoaded ? "..." : formatCurrency(kpis.totalRevenue)}
          </div>
          <div className="mt-2 text-[10px] sm:text-[11px] font-medium text-neutral-500 truncate">
            From closed student deals
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white border border-neutral-200 rounded-lg p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Conversion Rate
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-black mt-2">
            {!enquiriesLoaded ? "..." : `${kpis.conversionRate}%`}
          </div>
          <div className="mt-2 text-[10px] sm:text-[11px] font-medium text-neutral-500 truncate">
            {kpis.totalSalesCount} joined / {kpis.totalLeadsCount} total leads
          </div>
        </div>
      </div>

      {/* ── Record Closed Sale Button (Mobile Only, Placed directly after Dashboard boxes) ── */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setIsAddSaleOpen(true)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Record Closed Sale</span>
        </button>
      </div>

      {/* ── Filters Bar (Sales Staff & Month) ── */}
      <div className="bg-white border border-neutral-200 rounded-lg p-3.5 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        {/* Left: Filter by Sales Staff */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 max-w-sm">
          <label className="text-xs font-bold text-neutral-700 whitespace-nowrap">
            Sales Staff:
          </label>
          <button
            type="button"
            onClick={() => setIsStaffModalOpen(true)}
            className="w-full flex items-center justify-between pl-3 pr-2.5 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-md text-xs font-semibold text-neutral-800 transition-colors cursor-pointer"
          >
            <span className="truncate">
              {selectedStaff === "all"
                ? `All Sales Staff (${allSales.length} sales)`
                : salesStaffOptions.find((s) => s.email === selectedStaff)?.label || selectedStaff}
            </span>
            <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Right: Month Filter & All Time Toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterAllTime}
              onChange={(e) => setFilterAllTime(e.target.checked)}
              className="w-3.5 h-3.5 accent-black rounded cursor-pointer"
            />
            All time
          </label>

          {!filterAllTime && (
            <button
              type="button"
              onClick={() => setIsMonthModalOpen(true)}
              className="flex items-center justify-between pl-3 pr-2.5 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-md text-xs font-semibold text-neutral-800 transition-colors cursor-pointer"
            >
              <span className="truncate">{monthLabel(selectedMonth)}</span>
              <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Sales Staff Performance Leaderboard ── */}
      {selectedStaff === "all" && staffLeaderboard.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Sales Staff Performance Leaderboard</h2>
              <p className="text-[11px] text-neutral-500">Individual conversions and generated deal value</p>
            </div>
          </div>

          {/* Mobile View: Clean Leaderboard Card Items */}
          <div className="md:hidden space-y-2.5">
            {staffLeaderboard.map((item, idx) => {
              const isTop1 = idx === 0;
              const isTop2 = idx === 1;
              const isTop3 = idx === 2;

              const rankBadgeColor = isTop1
                ? "bg-amber-100 text-amber-900 border-amber-300"
                : isTop2
                ? "bg-neutral-200 text-neutral-800 border-neutral-300"
                : isTop3
                ? "bg-amber-50 text-amber-900 border-amber-200"
                : "bg-neutral-100 text-neutral-700 border-neutral-200";

              return (
                <div
                  key={item.staff}
                  className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-3.5 space-y-3 shadow-2xs"
                >
                  {/* Top: Rank + Staff Name + View Button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${rankBadgeColor}`}>
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-neutral-900 truncate">
                        {item.staff}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewStaffModal(item.staff)}
                      className="text-[11px] font-bold text-neutral-700 hover:text-black shrink-0 inline-flex items-center gap-1 bg-white border border-neutral-200 px-2.5 py-1 rounded-md shadow-2xs active:scale-95 transition-colors cursor-pointer"
                    >
                      <span>Sales</span>
                      <span>→</span>
                    </button>
                  </div>

                  {/* Stats Grid: 3 Clean Boxes */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-neutral-200/60">
                    <div className="bg-white border border-neutral-200/70 rounded-lg py-1.5 px-1">
                      <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                        Total
                      </span>
                      <span className="text-sm font-extrabold text-neutral-900 block mt-0.5">
                        {item.totalSales}
                      </span>
                    </div>

                    <div className="bg-white border border-neutral-200/70 rounded-lg py-1.5 px-1">
                      <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                        This Month
                      </span>
                      <span className="text-sm font-extrabold text-blue-600 block mt-0.5">
                        {item.thisMonthSales}
                      </span>
                    </div>

                    <div className="bg-white border border-neutral-200/70 rounded-lg py-1.5 px-1">
                      <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">
                        Revenue
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-green-600 block mt-0.5 truncate">
                        {formatCurrency(item.totalRevenue)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase text-[10px] whitespace-nowrap">
                  <th className="pb-2.5">Sales Staff Member</th>
                  <th className="pb-2.5 text-center">Total Sales</th>
                  <th className="pb-2.5 text-center">This Month Sales</th>
                  <th className="pb-2.5 text-right">Revenue Closed</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {staffLeaderboard.map((item, idx) => (
                  <tr key={item.staff} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 font-semibold text-neutral-900 flex items-center gap-2 whitespace-nowrap">
                      <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span>{item.staff}</span>
                    </td>
                    <td className="py-3 text-center font-bold text-black whitespace-nowrap">
                      {item.totalSales}
                    </td>
                    <td className="py-3 text-center text-blue-600 font-semibold whitespace-nowrap">
                      {item.thisMonthSales}
                    </td>
                    <td className="py-3 text-right text-green-600 font-bold whitespace-nowrap">
                      {formatCurrency(item.totalRevenue)}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setViewStaffModal(item.staff)}
                        className="text-[11px] font-semibold text-neutral-700 hover:text-black hover:underline cursor-pointer"
                      >
                        View Sales →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Staff Sales Detail Modal ── */}
      {viewStaffModal && (() => {
        const staffSales = allSales.filter((s) =>
          (s.converted_by || "").toLowerCase() === viewStaffModal.toLowerCase() ||
          (s.converted_by || "").toLowerCase().includes(viewStaffModal.toLowerCase())
        );
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewStaffModal(null)}>
            <div className="bg-white rounded-lg border border-neutral-200 shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 p-5">
                <div>
                  <h3 className="text-sm font-bold text-black">{viewStaffModal}</h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{staffSales.length} joined student{staffSales.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewStaffModal(null)}
                  className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 divide-y divide-neutral-100 p-2">
                {staffSales.length === 0 ? (
                  <div className="py-12 text-center text-xs text-neutral-400">No sales records found for this staff member.</div>
                ) : (
                  staffSales.map((item) => {
                    const cleanPhone = item.mobile_number?.replace(/[^0-9]/g, "");
                    const dateStr = new Date(item.converted_at || item.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    });
                    return (
                      <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-sm hover:bg-neutral-50">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {item.full_name?.charAt(0)?.toUpperCase() || "S"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-bold text-black truncate">{item.full_name}</p>
                              {item.course && (
                                <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-sm font-medium">{item.course}</span>
                              )}
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-sm font-bold">✓ Joined</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                              <span>{dateStr}</span>
                              {item.deal_amount ? (
                                <><span>•</span><span className="text-green-700 font-semibold">{formatCurrency(item.deal_amount)}</span></>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={`tel:${item.mobile_number}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-700 hover:text-black bg-white border border-neutral-200 px-2 py-1 rounded-sm"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{item.mobile_number}</span>
                          </a>
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-[11px] font-semibold text-green-700 hover:text-green-800 bg-green-50 border border-green-200 px-2 py-1 rounded-sm"
                            >
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Record Sale Modal ── */}
      {isAddSaleOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsAddSaleOpen(false)}
          />

          <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-xl shadow-2xl z-10 overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Grab Handle for Mobile */}
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1 bg-neutral-300 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-black flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                Record Direct Sale / Admission
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSaleOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddSaleSubmit} className="p-4 sm:p-6 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Student Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter student's full name"
                  value={saleForm.fullName}
                  onChange={(e) => setSaleForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black placeholder:text-neutral-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter 10-digit mobile number"
                    value={saleForm.mobileNumber}
                    onChange={(e) => setSaleForm((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black placeholder:text-neutral-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Course Enrolled
                  </label>
                  <input
                    type="text"
                    placeholder="Enter enrolled course name"
                    value={saleForm.course}
                    onChange={(e) => setSaleForm((prev) => ({ ...prev, course: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Deal / Admission Fee (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter admission fee in ₹"
                    value={saleForm.dealAmount}
                    onChange={(e) => setSaleForm((prev) => ({ ...prev, dealAmount: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black placeholder:text-neutral-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Attributed Sales Staff
                  </label>
                  <input
                    type="text"
                    placeholder="Staff email or name"
                    value={saleForm.salesStaff}
                    onChange={(e) => setSaleForm((prev) => ({ ...prev, salesStaff: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Notes / Admission Details
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter any admission notes or batch timing (optional)"
                  value={saleForm.message}
                  onChange={(e) => setSaleForm((prev) => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-black placeholder:text-neutral-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsAddSaleOpen(false)}
                  className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold rounded-lg transition-colors disabled:opacity-60 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? "Saving..." : "Save Closed Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Custom Sales Staff Action Sheet / Modal ── */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsStaffModalOpen(false)}
          />

          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-2xl z-10 overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1 bg-neutral-300 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Filter by Sales Staff</h3>
                <p className="text-xs text-neutral-500">
                  Select a team member to filter sales metrics
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setSelectedStaff("all");
                  setIsStaffModalOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                  selectedStaff === "all"
                    ? "bg-neutral-900 text-white border-neutral-900 font-bold shadow-xs"
                    : "border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50 bg-white text-neutral-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    selectedStaff === "all" ? "bg-white text-black" : "bg-neutral-100 text-neutral-700"
                  }`}>
                    👥
                  </div>
                  <div>
                    <span className="text-xs font-bold block">All Sales Staff</span>
                    <span className={`text-[11px] block ${selectedStaff === "all" ? "text-neutral-300" : "text-neutral-400"}`}>
                      Across all team members
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedStaff === "all" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-700"
                  }`}>
                    {allSales.length} sales
                  </span>
                  {selectedStaff === "all" && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>

              {salesStaffOptions.map((staff) => {
                const isSelected = selectedStaff.toLowerCase() === staff.email.toLowerCase();
                const staffSalesCount = allSales.filter((s) =>
                  (s.converted_by || "").toLowerCase().includes(staff.email.toLowerCase())
                ).length;
                const initial = staff.label.trim().charAt(0).toUpperCase() || "S";

                return (
                  <button
                    key={staff.email}
                    type="button"
                    onClick={() => {
                      setSelectedStaff(staff.email);
                      setIsStaffModalOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-neutral-900 text-white border-neutral-900 font-bold shadow-xs"
                        : "border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50 bg-white text-neutral-900"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected ? "bg-white text-black" : "bg-neutral-100 text-neutral-700"
                      }`}>
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">{staff.label}</span>
                        <span className={`text-[11px] block truncate ${isSelected ? "text-neutral-300" : "text-neutral-400"}`}>
                          {staff.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSelected ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-700"
                      }`}>
                        {staffSalesCount} sales
                      </span>
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-4 pb-4 pt-1 sm:hidden">
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Month Action Sheet / Modal ── */}
      {isMonthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMonthModalOpen(false)}
          />

          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl shadow-2xl z-10 overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1 bg-neutral-300 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Select Month</h3>
                <p className="text-xs text-neutral-500">Filter sales by calendar month or view all time</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMonthModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setFilterAllTime(true);
                  setIsMonthModalOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                  filterAllTime
                    ? "bg-neutral-900 text-white border-neutral-900 font-bold shadow-xs"
                    : "border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50 bg-white text-neutral-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    filterAllTime ? "bg-white text-black" : "bg-neutral-100 text-neutral-700"
                  }`}>
                    📅
                  </div>
                  <div>
                    <span className="text-xs font-bold block">All Time</span>
                    <span className={`text-[11px] block ${filterAllTime ? "text-neutral-300" : "text-neutral-400"}`}>
                      All recorded closed sales
                    </span>
                  </div>
                </div>

                {filterAllTime && (
                  <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              {monthOptions.map((m) => {
                const isSelected = !filterAllTime && selectedMonth === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setFilterAllTime(false);
                      setSelectedMonth(m);
                      setIsMonthModalOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-neutral-900 text-white border-neutral-900 font-bold shadow-xs"
                        : "border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50 bg-white text-neutral-900"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected ? "bg-white text-black" : "bg-neutral-100 text-neutral-700"
                      }`}>
                        🗓
                      </div>
                      <span className="text-xs font-bold">{monthLabel(m)}</span>
                    </div>

                    {isSelected && (
                      <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="px-4 pb-4 pt-1 sm:hidden">
              <button
                type="button"
                onClick={() => setIsMonthModalOpen(false)}
                className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
