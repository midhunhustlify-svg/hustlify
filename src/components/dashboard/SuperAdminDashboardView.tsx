"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { UserRole } from "@/types/auth";
import { useDashboard, EnquiryStatus } from "@/context/DashboardContext";
import { useToast } from "@/context/ToastContext";

interface SuperAdminDashboardViewProps {
  role: UserRole;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function SuperAdminDashboardView({ role: _role }: SuperAdminDashboardViewProps) {
  const {
    settings,
    enquiries,
    enquiriesLoaded,
    fetchEnquiries,
    setActiveTab,
  } = useDashboard();

  const { showToast } = useToast();

  // Finance metrics state
  const [financeLoading, setFinanceLoading] = useState(true);
  const [financeTotals, setFinanceTotals] = useState({
    income: 0,
    expense: 0,
    net: 0,
  });

  // Staff members state
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffCount, setStaffCount] = useState(0);

  // Fetch month finance totals
  const fetchFinance = useCallback(async () => {
    setFinanceLoading(true);
    try {
      const month = getCurrentMonth();
      const res = await fetch(`/api/finance?month=${month}`);
      const data = await res.json();
      if (res.ok && data.transactions) {
        const income = data.transactions
          .filter((t: { type: string; amount: number }) => t.type === "income")
          .reduce((acc: number, t: { amount: number }) => acc + Number(t.amount || 0), 0);
        const expense = data.transactions
          .filter((t: { type: string; amount: number }) => t.type === "expense")
          .reduce((acc: number, t: { amount: number }) => acc + Number(t.amount || 0), 0);
        setFinanceTotals({
          income,
          expense,
          net: income - expense,
        });
      }
    } catch {
      // ignore
    } finally {
      setFinanceLoading(false);
    }
  }, []);

  // Fetch staff count
  const fetchStaff = useCallback(async () => {
    setStaffLoading(true);
    try {
      const res = await fetch("/api/onboard-staff");
      const data = await res.json();
      if (res.ok && data.staff) {
        setStaffCount(data.staff.length);
      }
    } catch {
      // ignore
    } finally {
      setStaffLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnquiries();
    fetchFinance();
    fetchStaff();
  }, [fetchEnquiries, fetchFinance, fetchStaff]);

  // Enquiries Breakdown
  const enquiryCounts = useMemo(() => {
    const total = enquiries.length;
    const pending = enquiries.filter((e) => e.status === "pending").length;
    const followUp = enquiries.filter((e) => e.status === "follow_up").length;
    const completed = enquiries.filter((e) => e.status === "completed").length;
    return { total, pending, followUp, completed };
  }, [enquiries]);

  // Recent 6 Enquiries
  const recentEnquiries = useMemo(() => {
    return [...enquiries].slice(0, 6);
  }, [enquiries]);

  const handleRefreshAll = async () => {
    await Promise.all([fetchEnquiries(), fetchFinance(), fetchStaff()]);
    showToast("Dashboard refreshed", "success");
  };

  const getStatusBadge = (status: EnquiryStatus | string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "follow_up":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "completed":
      case "joined":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-200";
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* ── Top Metric KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Enquiries */}
        <div
          onClick={() => setActiveTab("enquiries")}
          className="bg-white border border-neutral-200 rounded-lg p-3.5 sm:p-5 hover:border-black/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Total Enquiries
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-100 group-hover:bg-black group-hover:text-white flex items-center justify-center text-neutral-600 transition-colors">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-black mt-2">
            {!enquiriesLoaded ? "..." : enquiryCounts.total}
          </div>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2 text-[10px] sm:text-[11px] font-medium text-neutral-500">
            <span className="text-amber-600 font-semibold">{enquiryCounts.pending} pending</span>
            <span>•</span>
            <span className="text-blue-600 font-semibold">{enquiryCounts.followUp} follow up</span>
          </div>
        </div>

        {/* This Month Income */}
        <div
          onClick={() => setActiveTab("accounts")}
          className="bg-white border border-neutral-200 rounded-lg p-3.5 sm:p-5 hover:border-green-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              This Month Income
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-50 group-hover:bg-green-600 group-hover:text-white flex items-center justify-center text-green-600 transition-colors">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-green-600 mt-2 truncate">
            {financeLoading ? "..." : formatCurrency(financeTotals.income)}
          </div>
          <div className="mt-2 text-[10px] sm:text-[11px] font-medium text-neutral-500">
            Current calendar month
          </div>
        </div>

        {/* This Month Expenses */}
        <div
          onClick={() => setActiveTab("accounts")}
          className="bg-white border border-neutral-200 rounded-lg p-3.5 sm:p-5 hover:border-red-500/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              This Month Expenses
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-50 group-hover:bg-red-500 group-hover:text-white flex items-center justify-center text-red-500 transition-colors">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
          <div className="text-xl sm:text-3xl font-extrabold text-red-500 mt-2 truncate">
            {financeLoading ? "..." : formatCurrency(financeTotals.expense)}
          </div>
          <div className="mt-2 text-[10px] sm:text-[11px] font-medium text-neutral-500">
            Current calendar month
          </div>
        </div>

        {/* Onboarded Staff */}
        <div
          onClick={() => setActiveTab("onboarding")}
          className="bg-white border border-neutral-200 rounded-lg p-3.5 sm:p-5 hover:border-black/50 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Active Staff
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-100 group-hover:bg-black group-hover:text-white flex items-center justify-center text-neutral-600 transition-colors">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-black mt-2">
            {staffLoading ? "..." : staffCount}
          </div>
          <div className="mt-2 text-[10px] sm:text-[11px] font-medium text-neutral-500">
            Registered team members
          </div>
        </div>
      </div>

      {/* ── Quick Navigation Hub Cards ── */}
      <div>
        <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3.5">
          Management Sections
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          {/* My Store */}
          <div
            onClick={() => setActiveTab("mystore")}
            className="p-3.5 sm:p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-lg hover:border-indigo-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-white border border-indigo-100 shadow-xs flex items-center justify-center text-indigo-600 mb-2.5 sm:mb-3">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900">My Store & CMS</h3>
              <p className="text-[11px] sm:text-xs text-neutral-600 mt-1">
                Customize 8 landing page sections, banners, videos and roadmaps.
              </p>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-indigo-700 mt-2.5 sm:mt-3 inline-flex items-center gap-1">
              Edit Content →
            </span>
          </div>

          {/* Enquiries */}
          <div
            onClick={() => setActiveTab("enquiries")}
            className="p-3.5 sm:p-4 bg-blue-50/60 border border-blue-200/80 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-white border border-blue-100 shadow-xs flex items-center justify-center text-blue-600 mb-2.5 sm:mb-3">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900">Enquiries & Leads</h3>
              <p className="text-[11px] sm:text-xs text-neutral-600 mt-1">
                Review incoming student leads, phone numbers, and update statuses.
              </p>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-blue-700 mt-2.5 sm:mt-3 inline-flex items-center gap-1">
              Manage Leads →
            </span>
          </div>

          {/* Accounts */}
          <div
            onClick={() => setActiveTab("accounts")}
            className="p-3.5 sm:p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-lg hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-white border border-emerald-100 shadow-xs flex items-center justify-center text-emerald-600 mb-2.5 sm:mb-3">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900">Accounts & Finance</h3>
              <p className="text-[11px] sm:text-xs text-neutral-600 mt-1">
                Add incomes, track expense categories, and monitor monthly balance.
              </p>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 mt-2.5 sm:mt-3 inline-flex items-center gap-1">
              View Finances →
            </span>
          </div>

          {/* Onboarding */}
          <div
            onClick={() => setActiveTab("onboarding")}
            className="p-3.5 sm:p-4 bg-amber-50/60 border border-amber-200/80 rounded-lg hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-white border border-amber-100 shadow-xs flex items-center justify-center text-amber-600 mb-2.5 sm:mb-3">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900">Staff Onboarding</h3>
              <p className="text-[11px] sm:text-xs text-neutral-600 mt-1">
                Invite team members and assign roles (Accountant, Sales, HR, Admin).
              </p>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 mt-2.5 sm:mt-3 inline-flex items-center gap-1">
              Onboard Staff →
            </span>
          </div>
        </div>
      </div>

      {/* ── Recent Enquiries Full Section ── */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4 sm:p-6 space-y-3.5">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Recent Enquiries</h2>
            <p className="text-[11px] text-neutral-500">Latest visitor leads and inquiries</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("enquiries")}
            className="text-xs font-semibold text-neutral-700 hover:text-black transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            View All ({enquiries.length}) →
          </button>
        </div>

        {!enquiriesLoaded ? (
          <div className="py-8 text-center text-xs text-neutral-400">Loading enquiries...</div>
        ) : recentEnquiries.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">No enquiries recorded yet.</div>
        ) : (
          <div className="space-y-2.5">
            {recentEnquiries.map((enquiry) => {
              const cleanPhone = enquiry.mobile_number?.replace(/[^0-9]/g, "");
              const initial = enquiry.full_name?.trim()?.charAt(0)?.toUpperCase() || "U";
              const formattedDate = new Date(enquiry.created_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={enquiry.id}
                  onClick={() => setActiveTab("enquiries")}
                  className="bg-neutral-50/70 hover:bg-neutral-100/70 border border-neutral-200/80 rounded-lg p-3 sm:p-3.5 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar Initial Circle */}
                    <div className="w-9 h-9 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                      {initial}
                    </div>

                    {/* Content Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                          {enquiry.full_name || "Unnamed Lead"}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${getStatusBadge(
                            enquiry.status
                          )}`}
                        >
                          {enquiry.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500 flex-wrap">
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
                        <span className="text-[10px] text-neutral-400">
                          {formattedDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right quick actions: WhatsApp & Call */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {cleanPhone ? (
                      <>
                        <a
                          href={`https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 text-emerald-600 hover:text-white flex items-center justify-center transition-colors shadow-xs"
                          title="WhatsApp Lead"
                          aria-label="WhatsApp lead"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                          </svg>
                        </a>
                        <a
                          href={`tel:${cleanPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 rounded-full bg-white border border-neutral-200 hover:border-black text-neutral-600 hover:text-black flex items-center justify-center transition-colors shadow-xs"
                          title="Call Lead"
                          aria-label="Call lead"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </a>
                      </>
                    ) : (
                      <span className="text-neutral-400 group-hover:text-black transition-colors text-xs font-bold">
                        →
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
