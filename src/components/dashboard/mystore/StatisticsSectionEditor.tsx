"use client";

import { useEffect, useState } from "react";
import { useDashboard, StatisticsSectionData, StatItem } from "@/context/DashboardContext";
import { useToast } from "@/context/ToastContext";

const initialSlots: StatItem[] = [
  { id: "stat-1", value: "", description: "" },
  { id: "stat-2", value: "", description: "" },
  { id: "stat-3", value: "", description: "" },
  { id: "stat-4", value: "", description: "" },
];

export default function StatisticsSectionEditor() {
  const { statisticsData, saveStatisticsData, fetchStatisticsData } = useDashboard();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<StatisticsSectionData>(statisticsData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStatisticsData();
  }, [fetchStatisticsData]);

  useEffect(() => {
    if (statisticsData.items && statisticsData.items.length > 0) {
      // Ensure we always have 4 slots
      const items = [...statisticsData.items];
      while (items.length < 4) {
        items.push({
          id: `stat-${items.length + 1}`,
          value: "",
          description: "",
        });
      }
      setFormData({ ...statisticsData, items });
    } else {
      setFormData({ items: initialSlots });
    }
  }, [statisticsData]);

  const handleItemChange = (
    index: number,
    field: "value" | "description",
    newVal: string
  ) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      if (!updatedItems[index]) {
        updatedItems[index] = {
          id: `stat-${index + 1}`,
          value: "",
          description: "",
        };
      }
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: newVal,
      };
      return {
        ...prev,
        items: updatedItems,
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await saveStatisticsData(formData);

    if (result.success) {
      showToast("Statistics section saved successfully", "success");
    } else {
      showToast(result.error || "Failed to save statistics section", "error");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Form */}
      <div className="bg-transparent md:bg-neutral-50 p-0 md:p-6 rounded-sm space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.items.slice(0, 4).map((item, index) => (
              <div
                key={item.id || index}
                className="bg-transparent md:bg-neutral-100 p-0 md:p-4 rounded-none md:rounded-sm space-y-4 border-0 md:border md:border-neutral-200/60"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                    Statistic Card {index + 1}
                  </span>
                </div>

                {/* Value Input */}
                <div>
                  <label
                    htmlFor={`stat-value-${index}`}
                    className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                  >
                    Statistic Value
                  </label>
                  <input
                    id={`stat-value-${index}`}
                    type="text"
                    value={item.value}
                    onChange={(e) =>
                      handleItemChange(index, "value", e.target.value)
                    }
                    placeholder="Enter value"
                    className="w-full px-3.5 py-2.5 bg-neutral-100 md:bg-white text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black font-semibold"
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label
                    htmlFor={`stat-desc-${index}`}
                    className="block text-[11px] font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                  >
                    Statistic Description
                  </label>
                  <textarea
                    id={`stat-desc-${index}`}
                    rows={3}
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(index, "description", e.target.value)
                    }
                    placeholder="Enter description"
                    className="w-full px-3.5 py-2.5 bg-neutral-100 md:bg-white text-black text-sm rounded-sm focus:outline-none focus:ring-1 focus:ring-black resize-y"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Save Button placed to right side */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white text-xs font-semibold px-6 py-2.5 rounded-sm hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Statistics"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
