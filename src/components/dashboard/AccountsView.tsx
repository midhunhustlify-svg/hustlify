"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { UserRole } from "@/types/auth";
import { useToast } from "@/context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import ConfirmDeleteModal from "@/components/dashboard/ConfirmDeleteModal";

// ─── Category presets ────────────────────────────────────────────────────────
const EXPENSE_PRESETS = [
  "Salary",
  "Rent / Office",
  "Utilities",
  "Internet & Phone",
  "Marketing & Ads",
  "Software & Tools",
  "Travel & Transport",
  "Equipment",
  "Miscellaneous",
];

const INCOME_PRESETS = [
  "Course Fee",
  "Consultation",
  "Training Program",
  "Workshop",
  "Placement Service",
  "Subscription",
  "Commission",
  "Other Revenue",
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
}

interface AccountsViewProps {
  role: UserRole;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AccountsView({ role: _role }: AccountsViewProps) {
  const { showToast } = useToast();

  // Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [filterAll, setFilterAll] = useState(false);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);

  // Active form tab
  const [activeForm, setActiveForm] = useState<"income" | "expense" | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    categoryPreset: "",
    customCategory: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterAll
        ? "/api/finance"
        : `/api/finance?month=${selectedMonth}`;
      const res = await fetch(url);
      const result = await res.json();
      if (!res.ok || result.error) {
        showToast("Failed to load transactions: " + (result.error || ""), "error");
        setTransactions([]);
      } else {
        setTransactions(result.transactions || []);
      }
    } catch {
      showToast("Error loading transactions", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, filterAll, showToast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ── Totals ────────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  // ── Form helpers ──────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({
      categoryPreset: "",
      customCategory: "",
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const effectiveCategory =
    formData.categoryPreset === "__custom__"
      ? formData.customCategory.trim()
      : formData.categoryPreset;

  const presets = activeForm === "expense" ? EXPENSE_PRESETS : INCOME_PRESETS;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeForm) return;

    if (!effectiveCategory) {
      showToast("Please select or enter a category", "error");
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeForm,
          category: effectiveCategory,
          amount: Number(formData.amount),
          description: formData.description,
          date: formData.date,
        }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        showToast(result.error || "Failed to save", "error");
      } else {
        showToast(
          `${activeForm === "income" ? "Income" : "Expense"} added successfully`,
          "success"
        );
        resetForm();
        setActiveForm(null);
        await fetchTransactions();
      }
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;
    const id = deletingTransaction.id;
    setDeletingId(id);
    try {
      const res = await fetch("/api/finance", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        showToast(result.error || "Failed to delete", "error");
      } else {
        showToast("Transaction deleted", "info");
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        setDeletingTransaction(null);
      }
    } catch {
      showToast("Error deleting transaction", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Month options (last 12 months) ────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-6">
      {/* ── Desktop Header (Hidden on Mobile as requested) ── */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Accounts</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Track income and expenses for your organisation.
          </p>
        </div>

        {/* Desktop Date Filter */}
        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterAll}
              onChange={(e) => setFilterAll(e.target.checked)}
              className="w-3.5 h-3.5 accent-black rounded cursor-pointer"
            />
            All time
          </label>

          {!filterAll && (
            <button
              type="button"
              onClick={() => setIsMonthModalOpen(true)}
              className="flex items-center gap-2 pl-3 pr-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-sm text-xs font-semibold text-neutral-800 transition-colors cursor-pointer"
            >
              <span>{monthLabel(selectedMonth)}</span>
              <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Dashboard Summary KPI Cards (Placed at top on Mobile) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        {/* Income */}
        <div className="bg-white border border-neutral-200 rounded-sm p-3.5 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Total Income
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-sm bg-green-50 text-green-600 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-base sm:text-xl font-bold text-green-600 truncate">
              {loading ? "—" : formatCurrency(totals.income)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-neutral-400 mt-0.5 truncate">
              {filterAll ? "All time" : monthLabel(selectedMonth)}
            </p>
          </div>
        </div>

        {/* Expense */}
        <div className="bg-white border border-neutral-200 rounded-sm p-3.5 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Total Expense
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-sm bg-red-50 text-red-500 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-base sm:text-xl font-bold text-red-500 truncate">
              {loading ? "—" : formatCurrency(totals.expense)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-neutral-400 mt-0.5 truncate">
              {filterAll ? "All time" : monthLabel(selectedMonth)}
            </p>
          </div>
        </div>

        {/* Net Balance */}
        <div className="col-span-2 sm:col-span-1 bg-white border border-neutral-200 rounded-sm p-3.5 sm:p-5 flex items-center sm:items-start justify-between sm:justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              Net Balance
            </span>
            <p
              className={`text-lg sm:text-xl font-bold mt-0.5 truncate ${
                totals.net >= 0 ? "text-blue-600" : "text-orange-500"
              }`}
            >
              {loading ? "—" : formatCurrency(totals.net)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-neutral-400 mt-0.5">
              Income – Expense
            </p>
          </div>
          <div
            className={`w-8 h-8 sm:w-8 sm:h-8 rounded-sm flex items-center justify-center shrink-0 ${
              totals.net >= 0 ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-500"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Mobile Redesigned Date Filter Button (Directly after Dashboard on Mobile) ── */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setIsMonthModalOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-sm transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-sm bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="truncate">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Filter by date
              </span>
              <span className="text-xs font-bold text-neutral-900 block truncate">
                {filterAll ? "All Time Records" : monthLabel(selectedMonth)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-700 bg-neutral-100 px-2 py-1 rounded-sm shrink-0">
            <span>Change</span>
            <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      </div>

      {/* ── Add Income & Add Expense Buttons (Directly after Date Filter) ── */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => {
            setActiveForm(activeForm === "income" ? null : "income");
            resetForm();
          }}
          className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold rounded-sm transition-colors cursor-pointer ${
            activeForm === "income"
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-white border border-neutral-200 text-neutral-700 hover:border-green-400 hover:text-green-600"
          }`}
        >
          <svg className="w-3.5 h-3.5 text-current shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Income</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveForm(activeForm === "expense" ? null : "expense");
            resetForm();
          }}
          className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold rounded-sm transition-colors cursor-pointer ${
            activeForm === "expense"
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-white border border-neutral-200 text-neutral-700 hover:border-red-400 hover:text-red-500"
          }`}
        >
          <svg className="w-3.5 h-3.5 text-current shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Expense</span>
        </button>
      </div>

      {/* ── Form Panel ── */}
      <AnimatePresence>
        {activeForm && (
          <motion.div
            key={activeForm}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-neutral-200 rounded-sm p-6"
          >
            {/* Form header */}
            <div className="flex items-center gap-2 mb-5">
              <span
                className={`w-2 h-2 rounded-full ${
                  activeForm === "income" ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <h2 className="text-sm font-bold text-neutral-800">
                Add {activeForm === "income" ? "Income" : "Expense"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category dropdown */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      id={`finance-category-${activeForm}`}
                      onClick={() => setIsCategoryPickerOpen(true)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200 rounded-sm text-sm text-neutral-800 transition-colors text-left cursor-pointer"
                    >
                      <span className={formData.categoryPreset ? "font-semibold text-neutral-900 truncate" : "text-neutral-400"}>
                        {formData.categoryPreset === "__custom__"
                          ? (formData.customCategory ? `Custom: ${formData.customCategory}` : "+ Custom category")
                          : (formData.categoryPreset || "Select category...")}
                      </span>
                      <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Custom category input */}
                  {formData.categoryPreset === "__custom__" && (
                    <input
                      id={`finance-custom-cat-${activeForm}`}
                      type="text"
                      required
                      placeholder="Enter custom category..."
                      value={formData.customCategory}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, customCategory: e.target.value }))
                      }
                      className="mt-2 w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-sm text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-800/30 placeholder:text-neutral-400"
                    />
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Amount (₹) <span className="text-red-400">*</span>
                  </label>
                  <input
                    id={`finance-amount-${activeForm}`}
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-sm text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-800/30 placeholder:text-neutral-400"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    id={`finance-date-${activeForm}`}
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-sm text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-800/30"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <input
                    id={`finance-desc-${activeForm}`}
                    type="text"
                    placeholder="Optional note..."
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-sm text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-800/30 placeholder:text-neutral-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setActiveForm(null); resetForm(); }}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2.5 text-white text-xs font-bold rounded-sm transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer ${
                    activeForm === "income"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Save {activeForm === "income" ? "Income" : "Expense"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Transactions Table ── */}
      <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-800">
            Transactions
            {!loading && (
              <span className="ml-2 text-[11px] font-semibold text-neutral-400">
                ({transactions.length})
              </span>
            )}
          </h2>
          <span className="text-[11px] text-neutral-400 font-medium">
            {filterAll ? "All time" : monthLabel(selectedMonth)}
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
            <p className="text-xs text-neutral-400">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-700">No transactions yet</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                Add income or expense entries using the buttons above.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Transactions Cards List */}
            <div className="md:hidden divide-y divide-neutral-100">
              {transactions.map((t) => {
                const isIncome = t.type === "income";
                const isDeleting = deletingId === t.id;
                return (
                  <div key={t.id} className="p-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isIncome
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {isIncome ? "Income" : "Expense"}
                        </span>
                        <span className="text-xs font-bold text-neutral-900 truncate">
                          {t.category}
                        </span>
                      </div>

                      {t.description && (
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                          {t.description}
                        </p>
                      )}

                      <p className="text-[10px] text-neutral-400 mt-1">
                        {new Date(t.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`text-sm font-extrabold ${
                          isIncome ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </span>

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => setDeletingTransaction(t)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-red-500 hover:bg-red-50 rounded-sm transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isDeleting ? (
                          <div className="w-2.5 h-2.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Mobile Net Balance footer */}
              <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                  Net Balance
                </span>
                <span
                  className={`text-sm font-bold ${
                    totals.net >= 0 ? "text-blue-600" : "text-orange-500"
                  }`}
                >
                  {formatCurrency(totals.net)}
                </span>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Category</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Description</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Amount</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {transactions.map((t) => {
                    const isIncome = t.type === "income";
                    const isDeleting = deletingId === t.id;
                    return (
                      <tr key={t.id} className="hover:bg-neutral-50/60 transition-colors">
                        {/* Date */}
                        <td className="px-5 py-3.5 text-neutral-500 whitespace-nowrap">
                          {new Date(t.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        {/* Type badge */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isIncome
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {isIncome ? (
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                              </svg>
                            ) : (
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                              </svg>
                            )}
                            {isIncome ? "Income" : "Expense"}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-3.5 font-semibold text-neutral-800">
                          {t.category}
                        </td>

                        {/* Description */}
                        <td className="px-5 py-3.5 text-neutral-400 max-w-[180px] truncate">
                          {t.description || "—"}
                        </td>

                        {/* Amount */}
                        <td
                          className={`px-5 py-3.5 text-right font-bold ${
                            isIncome ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {isIncome ? "+" : "-"}
                          {formatCurrency(t.amount)}
                        </td>

                        {/* Delete */}
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => setDeletingTransaction(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-red-500 hover:bg-red-50 rounded-sm transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {isDeleting ? (
                              <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Footer totals row */}
                <tfoot>
                  <tr className="border-t-2 border-neutral-200 bg-neutral-50">
                    <td colSpan={4} className="px-5 py-3 text-xs font-bold text-neutral-600 uppercase tracking-wider">
                      Net Balance
                    </td>
                    <td
                      className={`px-5 py-3 text-right text-sm font-bold ${
                        totals.net >= 0 ? "text-blue-600" : "text-orange-500"
                      }`}
                    >
                      {formatCurrency(totals.net)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Custom Month Picker Modal / Bottom Sheet ── */}
      <AnimatePresence>
        {isMonthModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setIsMonthModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-sm border border-neutral-200 shadow-xl max-w-sm w-full max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">Select Time Period</h3>
                  <p className="text-[11px] text-neutral-400">Filter income and expenses by date</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMonthModalOpen(false)}
                  className="w-7 h-7 rounded-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-colors cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Options List */}
              <div className="p-3 overflow-y-auto divide-y divide-neutral-100 max-h-[60vh]">
                {/* All Time */}
                <button
                  type="button"
                  onClick={() => {
                    setFilterAll(true);
                    setIsMonthModalOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-sm text-left transition-colors cursor-pointer ${
                    filterAll
                      ? "bg-neutral-900 text-white font-bold"
                      : "hover:bg-neutral-50 text-neutral-800 font-semibold"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${filterAll ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold">All Time</p>
                      <p className={`text-[10px] ${filterAll ? "text-neutral-300" : "text-neutral-400"}`}>
                        Show all transactions
                      </p>
                    </div>
                  </div>
                  {filterAll && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Months */}
                {monthOptions.map((m) => {
                  const isSelected = !filterAll && selectedMonth === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setSelectedMonth(m);
                        setFilterAll(false);
                        setIsMonthModalOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-sm text-left transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-neutral-900 text-white font-bold"
                          : "hover:bg-neutral-50 text-neutral-800 font-semibold"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${isSelected ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-bold">{monthLabel(m)}</p>
                          <p className={`text-[10px] ${isSelected ? "text-neutral-300" : "text-neutral-400"}`}>
                            {m === getCurrentMonth() ? "Current month" : "Monthly summary"}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Custom Category Picker Modal / Sheet ── */}
      <AnimatePresence>
        {isCategoryPickerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setIsCategoryPickerOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-sm border border-neutral-200 shadow-xl max-w-sm w-full max-h-[80vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">
                    Select {activeForm === "income" ? "Income" : "Expense"} Category
                  </h3>
                  <p className="text-[11px] text-neutral-400">Choose a preset or enter custom</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCategoryPickerOpen(false)}
                  className="w-7 h-7 rounded-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-colors cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Options List */}
              <div className="p-3 overflow-y-auto divide-y divide-neutral-100 max-h-[60vh]">
                {presets.map((p) => {
                  const isSelected = formData.categoryPreset === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          categoryPreset: p,
                          customCategory: "",
                        }));
                        setIsCategoryPickerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-sm text-left transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-neutral-900 text-white font-bold"
                          : "hover:bg-neutral-50 text-neutral-800 font-semibold"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${activeForm === "income" ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-xs">{p}</span>
                      </div>
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}

                {/* Custom category option */}
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      categoryPreset: "__custom__",
                    }));
                    setIsCategoryPickerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-sm text-left transition-colors cursor-pointer ${
                    formData.categoryPreset === "__custom__"
                      ? "bg-neutral-900 text-white font-bold"
                      : "hover:bg-neutral-50 text-neutral-800 font-semibold"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold">+ Custom category</span>
                  </div>
                  {formData.categoryPreset === "__custom__" && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reusable Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction"
        message={
          deletingTransaction ? (
            <>
              Are you sure you want to delete this{" "}
              <strong className="text-neutral-900 font-bold">
                {deletingTransaction.type === "income" ? "Income" : "Expense"}
              </strong>{" "}
              record — <strong className="text-neutral-900">{deletingTransaction.category}</strong>{" "}
              ({formatCurrency(deletingTransaction.amount)})? This cannot be undone.
            </>
          ) : undefined
        }
        confirmText="Delete Transaction"
        isLoading={!!deletingId}
      />
    </div>
  );
}
