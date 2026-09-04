"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";

export interface CompanySettings {
  id?: string;
  company_name: string;
  email: string;
  mobile_number: string;
  whatsapp_number: string;
  address: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
}

export interface HeroSectionData {
  id?: string;
  heading: string;
  description: string;
  image_url: string;
}

export interface StatItem {
  id: string;
  value: string;
  description: string;
}

export interface StatisticsSectionData {
  id?: string;
  items: StatItem[];
}

export interface FeatureSlideItem {
  id: string;
  subtitle: string;
  heading: string;
  subheading: string;
  description: string;
  image_url: string;
}

export interface FeatureSliderData {
  id?: string;
  items: FeatureSlideItem[];
}

export interface MasterCardItem {
  id: string;
  image_url: string;
  heading: string;
  description: string;
}

export interface MasterSectionData {
  id?: string;
  heading: string;
  description: string;
  items: MasterCardItem[];
}

export interface VideoItem {
  id: string;
  video_url: string;
  title?: string;
}

export interface VideoSectionData {
  id?: string;
  subheading: string;
  heading: string;
  items: VideoItem[];
}

export interface ImageCardItem {
  id: string;
  image_url: string;
  heading: string;
  subheading: string;
}

export interface CardGridSectionData {
  id?: string;
  heading: string;
  items: ImageCardItem[];
}

export interface RoadmapStepItem {
  id: string;
  heading: string;
  description: string;
  image_url: string;
}

export interface RoadmapSectionData {
  id?: string;
  heading: string;
  description: string;
  items: RoadmapStepItem[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqSectionData {
  id?: string;
  subheading: string;
  heading: string;
  items: FaqItem[];
}

export type EnquiryStatus = "pending" | "follow_up" | "completed" | "joined";

export interface EnquiryItem {
  id: string;
  full_name: string;
  mobile_number: string;
  course?: string;
  message: string;
  status: EnquiryStatus;
  converted_by?: string;
  converted_at?: string;
  deal_amount?: number;
  created_at: string;
  updated_at?: string;
}

interface DashboardContextType {
  settings: CompanySettings;
  setSettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
  settingsLoaded: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  saveSettings: (newSettings: CompanySettings) => Promise<{ success: boolean; error?: string }>;
  fetchSettings: () => Promise<void>;

  heroData: HeroSectionData;
  setHeroData: React.Dispatch<React.SetStateAction<HeroSectionData>>;
  heroLoaded: boolean;
  saveHeroData: (newHero: HeroSectionData) => Promise<{ success: boolean; error?: string }>;
  fetchHeroData: () => Promise<void>;

  statisticsData: StatisticsSectionData;
  setStatisticsData: React.Dispatch<React.SetStateAction<StatisticsSectionData>>;
  statisticsLoaded: boolean;
  saveStatisticsData: (newStats: StatisticsSectionData) => Promise<{ success: boolean; error?: string }>;
  fetchStatisticsData: () => Promise<void>;

  featureSliderData: FeatureSliderData;
  setFeatureSliderData: React.Dispatch<React.SetStateAction<FeatureSliderData>>;
  featureSliderLoaded: boolean;
  saveFeatureSliderData: (newData: FeatureSliderData) => Promise<{ success: boolean; error?: string }>;
  fetchFeatureSliderData: () => Promise<void>;

  masterData: MasterSectionData;
  setMasterData: React.Dispatch<React.SetStateAction<MasterSectionData>>;
  masterLoaded: boolean;
  saveMasterData: (newData: MasterSectionData) => Promise<{ success: boolean; error?: string }>;
  fetchMasterData: () => Promise<void>;

  videoData: VideoSectionData;
  setVideoData: React.Dispatch<React.SetStateAction<VideoSectionData>>;
  videoLoaded: boolean;
  saveVideoData: (newData: VideoSectionData) => Promise<{ success: boolean; error?: string }>;
  fetchVideoData: () => Promise<void>;

  cardGridData: CardGridSectionData;
  setCardGridData: React.Dispatch<React.SetStateAction<CardGridSectionData>>;
  cardGridLoaded: boolean;
  saveCardGridData: (newData: CardGridSectionData) => Promise<{ success: boolean; error?: string }>;
  fetchCardGridData: () => Promise<void>;

  roadmapData: RoadmapSectionData;
  setRoadmapData: React.Dispatch<React.SetStateAction<RoadmapSectionData>>;
  roadmapLoaded: boolean;
  saveRoadmapData: (newData: RoadmapSectionData) => Promise<{ success: boolean; error?: string }>;
  fetchRoadmapData: () => Promise<void>;

  faqData: FaqSectionData;
  setFaqData: React.Dispatch<React.SetStateAction<FaqSectionData>>;
  faqLoaded: boolean;
  saveFaqData: (newData: FaqSectionData) => Promise<{ success: boolean; error?: string }>;
  fetchFaqData: () => Promise<void>;

  enquiries: EnquiryItem[];
  setEnquiries: React.Dispatch<React.SetStateAction<EnquiryItem[]>>;
  enquiriesLoaded: boolean;
  fetchEnquiries: () => Promise<void>;
  updateEnquiryStatus: (
    id: string,
    status: EnquiryStatus,
    extraData?: { converted_by?: string; deal_amount?: number }
  ) => Promise<{ success: boolean; error?: string }>;
  deleteEnquiry: (id: string) => Promise<{ success: boolean; error?: string }>;
  addEnquiry: (enquiry: Omit<EnquiryItem, "id" | "created_at">) => Promise<{ success: boolean; error?: string }>;
}

const defaultSettings: CompanySettings = {
  company_name: "",
  email: "",
  mobile_number: "",
  whatsapp_number: "",
  address: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
};

const defaultHeroData: HeroSectionData = {
  heading: "",
  description: "",
  image_url: "",
};

const defaultStatItems: StatItem[] = [
  { id: "stat-1", value: "", description: "" },
  { id: "stat-2", value: "", description: "" },
  { id: "stat-3", value: "", description: "" },
  { id: "stat-4", value: "", description: "" },
];

const defaultStatisticsData: StatisticsSectionData = {
  items: defaultStatItems,
};

const defaultFeatureSliderData: FeatureSliderData = {
  items: [],
};

const defaultMasterData: MasterSectionData = {
  heading: "",
  description: "",
  items: [],
};

const defaultVideoData: VideoSectionData = {
  subheading: "",
  heading: "",
  items: [],
};

const defaultCardGridData: CardGridSectionData = {
  heading: "",
  items: [],
};

const defaultRoadmapData: RoadmapSectionData = {
  heading: "",
  description: "",
  items: [],
};

const defaultFaqData: FaqSectionData = {
  subheading: "",
  heading: "",
  items: [],
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [heroData, setHeroData] = useState<HeroSectionData>(defaultHeroData);
  const [heroLoaded, setHeroLoaded] = useState(false);

  const [statisticsData, setStatisticsData] = useState<StatisticsSectionData>(defaultStatisticsData);
  const [statisticsLoaded, setStatisticsLoaded] = useState(false);

  const [featureSliderData, setFeatureSliderData] = useState<FeatureSliderData>(defaultFeatureSliderData);
  const [featureSliderLoaded, setFeatureSliderLoaded] = useState(false);

  const [masterData, setMasterData] = useState<MasterSectionData>(defaultMasterData);
  const [masterLoaded, setMasterLoaded] = useState(false);

  const [videoData, setVideoData] = useState<VideoSectionData>(defaultVideoData);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const [cardGridData, setCardGridData] = useState<CardGridSectionData>(defaultCardGridData);
  const [cardGridLoaded, setCardGridLoaded] = useState(false);

  const [roadmapData, setRoadmapData] = useState<RoadmapSectionData>(defaultRoadmapData);
  const [roadmapLoaded, setRoadmapLoaded] = useState(false);

  const [faqData, setFaqData] = useState<FaqSectionData>(defaultFaqData);
  const [faqLoaded, setFaqLoaded] = useState(false);

  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [enquiriesLoaded, setEnquiriesLoaded] = useState(false);

  const fetchEnquiries = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("enquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42P01") {
          // Table not created yet — preserve existing in-memory state, load from localStorage if empty
          setEnquiries((prev) => {
            if (prev.length > 0) return prev; // keep existing in-memory data
            if (typeof window !== "undefined") {
              const local = localStorage.getItem("hustlify_enquiries");
              if (local) {
                try { return JSON.parse(local); } catch { /* ignore */ }
              }
            }
            return prev;
          });
        } else {
          // Real DB error — try localStorage fallback
          if (typeof window !== "undefined") {
            const local = localStorage.getItem("hustlify_enquiries");
            if (local) {
              try { setEnquiries(JSON.parse(local)); } catch { /* ignore */ }
            }
          }
        }
      } else if (data) {
        const loaded: EnquiryItem[] = data.map((item: Record<string, unknown>) => ({
          id: item.id as string,
          full_name: (item.full_name as string) || "",
          mobile_number: (item.mobile_number as string) || "",
          course: (item.course as string) || "",
          message: (item.message as string) || "",
          status: ((item.status as EnquiryStatus) || "pending"),
          converted_by: item.converted_by as string | undefined,
          converted_at: item.converted_at as string | undefined,
          deal_amount: item.deal_amount !== undefined && item.deal_amount !== null ? Number(item.deal_amount) : undefined,
          created_at: (item.created_at as string) || new Date().toISOString(),
          updated_at: item.updated_at as string | undefined,
        }));
        setEnquiries(loaded);
        if (typeof window !== "undefined") {
          localStorage.setItem("hustlify_enquiries", JSON.stringify(loaded));
        }
      }
    } catch {
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_enquiries");
        if (local) {
          try { setEnquiries(JSON.parse(local)); } catch { /* ignore */ }
        }
      }
    } finally {
      setEnquiriesLoaded(true);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const loaded: CompanySettings = {
          id: data.id,
          company_name: data.company_name || "",
          email: data.email || "",
          mobile_number: data.mobile_number || "",
          whatsapp_number: data.whatsapp_number || "",
          address: data.address || "",
          landmark: data.landmark || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
        };
        setSettings(loaded);
        if (typeof window !== "undefined") {
          localStorage.setItem("hustlify_company_settings", JSON.stringify(loaded));
        }
      } else if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_company_settings");
        if (local) {
          try {
            setSettings(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } catch {
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_company_settings");
        if (local) {
          try {
            setSettings(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

  const fetchHeroData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("hero_section")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const loadedHero: HeroSectionData = {
          id: data.id,
          heading: data.heading || "",
          description: data.description || "",
          image_url: data.image_url || "",
        };
        setHeroData(loadedHero);
        if (typeof window !== "undefined") {
          localStorage.setItem("hustlify_hero_data", JSON.stringify(loadedHero));
        }
      } else if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_hero_data");
        if (local) {
          try {
            setHeroData(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } catch {
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_hero_data");
        if (local) {
          try {
            setHeroData(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } finally {
      setHeroLoaded(true);
    }
  }, []);

  const fetchStatisticsData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("statistics_section")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const loadedItems: StatItem[] = Array.isArray(data.items)
          ? data.items
          : defaultStatItems;

        const loadedStats: StatisticsSectionData = {
          id: data.id,
          items: loadedItems,
        };
        setStatisticsData(loadedStats);
        if (typeof window !== "undefined") {
          localStorage.setItem("hustlify_statistics_data", JSON.stringify(loadedStats));
        }
      } else if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_statistics_data");
        if (local) {
          try {
            setStatisticsData(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } catch {
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_statistics_data");
        if (local) {
          try {
            setStatisticsData(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } finally {
      setStatisticsLoaded(true);
    }
  }, []);

  const fetchFeatureSliderData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("feature_slider_section")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const loadedItems: FeatureSlideItem[] = Array.isArray(data.items)
          ? data.items
          : [];

        const loadedSlider: FeatureSliderData = {
          id: data.id,
          items: loadedItems,
        };
        setFeatureSliderData(loadedSlider);
        if (typeof window !== "undefined") {
          localStorage.setItem("hustlify_feature_slider_data", JSON.stringify(loadedSlider));
        }
      } else if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_feature_slider_data");
        if (local) {
          try {
            setFeatureSliderData(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } catch {
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_feature_slider_data");
        if (local) {
          try {
            setFeatureSliderData(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } finally {
      setFeatureSliderLoaded(true);
    }
  }, []);

  const fetchMasterData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("master_section")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const loadedItems: MasterCardItem[] = Array.isArray(data.items)
          ? data.items
          : [];

        const loadedMaster: MasterSectionData = {
          id: data.id,
          heading: data.heading || "",
          description: data.description || "",
          items: loadedItems,
        };
        setMasterData(loadedMaster);
        if (typeof window !== "undefined") {
          localStorage.setItem("hustlify_master_data", JSON.stringify(loadedMaster));
        }
      } else if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_master_data");
        if (local) {
          try {
            setMasterData(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } catch {
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_master_data");
        if (local) {
          try {
            setMasterData(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } finally {
      setMasterLoaded(true);
    }
  }, []);

  const fetchVideoData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("video_section")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const loadedItems: VideoItem[] = Array.isArray(data.items)
          ? data.items
          : [];

        const loadedVideo: VideoSectionData = {
          id: data.id,
          subheading: data.subheading || "",
          heading: data.heading || "",
          items: loadedItems,
        };
        setVideoData(loadedVideo);
        if (typeof window !== "undefined") {
          localStorage.setItem("hustlify_video_data", JSON.stringify(loadedVideo));
        }
      } else if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_video_data");
        if (local) {
          try {
            setVideoData(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } catch {
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_video_data");
        if (local) {
          try {
            setVideoData(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } finally {
      setVideoLoaded(true);
    }
  }, []);

  const fetchCardGridData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("card_grid_section")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const loadedItems: ImageCardItem[] = Array.isArray(data.items)
          ? data.items
          : [];

        const loadedGrid: CardGridSectionData = {
          id: data.id,
          heading: data.heading || "",
          items: loadedItems,
        };
        setCardGridData(loadedGrid);
        if (typeof window !== "undefined") {
          localStorage.setItem("hustlify_card_grid_data", JSON.stringify(loadedGrid));
        }
      } else if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_card_grid_data");
        if (local) {
          try {
            setCardGridData(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } catch {
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_card_grid_data");
        if (local) {
          try {
            setCardGridData(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } finally {
      setCardGridLoaded(true);
    }
  }, []);

  const fetchRoadmapData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("roadmap_section")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const loadedItems: RoadmapStepItem[] = Array.isArray(data.items)
          ? data.items
          : [];

        const loadedRoadmap: RoadmapSectionData = {
          id: data.id,
          heading: data.heading || "",
          description: data.description || "",
          items: loadedItems,
        };
        setRoadmapData(loadedRoadmap);
        if (typeof window !== "undefined") {
          localStorage.setItem("hustlify_roadmap_data", JSON.stringify(loadedRoadmap));
        }
      } else if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_roadmap_data");
        if (local) {
          try {
            setRoadmapData(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } catch {
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_roadmap_data");
        if (local) {
          try {
            setRoadmapData(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } finally {
      setRoadmapLoaded(true);
    }
  }, []);

  const fetchFaqData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("faq_section")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const loadedItems: FaqItem[] = Array.isArray(data.items)
          ? data.items
          : [];

        const loadedFaq: FaqSectionData = {
          id: data.id,
          subheading: data.subheading || "",
          heading: data.heading || "",
          items: loadedItems,
        };
        setFaqData(loadedFaq);
        if (typeof window !== "undefined") {
          localStorage.setItem("hustlify_faq_data", JSON.stringify(loadedFaq));
        }
      } else if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_faq_data");
        if (local) {
          try {
            setFaqData(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } catch {
      if (typeof window !== "undefined") {
        const local = localStorage.getItem("hustlify_faq_data");
        if (local) {
          try {
            setFaqData(JSON.parse(local));
          } catch {
            // ignore
          }
        }
      }
    } finally {
      setFaqLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchHeroData();
    fetchStatisticsData();
    fetchFeatureSliderData();
    fetchMasterData();
    fetchVideoData();
    fetchCardGridData();
    fetchRoadmapData();
    fetchFaqData();
    fetchEnquiries();

    // Re-fetch automatically whenever user logs in or auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignore token refresh so active form editing is not overwritten on window focus / tab switch
      if (event === "TOKEN_REFRESHED") {
        return;
      }

      if (session?.user && event === "SIGNED_IN") {
        fetchSettings();
        fetchHeroData();
        fetchStatisticsData();
        fetchFeatureSliderData();
        fetchMasterData();
        fetchVideoData();
        fetchCardGridData();
        fetchRoadmapData();
        fetchFaqData();
        fetchEnquiries();
      } else if (!session?.user) {
        setSettings(defaultSettings);
        setSettingsLoaded(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSettings, fetchHeroData, fetchStatisticsData, fetchFeatureSliderData, fetchMasterData, fetchVideoData, fetchCardGridData, fetchRoadmapData, fetchFaqData, fetchEnquiries]);

  const addEnquiry = async (
    enquiry: Omit<EnquiryItem, "id" | "created_at">
  ): Promise<{ success: boolean; error?: string }> => {
    const payload = {
      full_name: enquiry.full_name,
      mobile_number: enquiry.mobile_number,
      course: enquiry.course || "General Inquiry",
      message: enquiry.message,
      status: enquiry.status || "pending",
      converted_by: enquiry.converted_by,
      converted_at: enquiry.status === "joined" ? (enquiry.converted_at || new Date().toISOString()) : undefined,
      deal_amount: enquiry.deal_amount,
      created_at: new Date().toISOString(),
    };

    // 1. Send admin email notification via Brevo API
    try {
      const adminEmail = settings?.email || "";
      await fetch("/api/enquiry-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: payload.full_name,
          mobile_number: payload.mobile_number,
          course: payload.course,
          message: payload.message,
          admin_email: adminEmail,
        }),
      });
    } catch (mailErr) {
      console.warn("Enquiry notification email failed:", mailErr);
    }

    // 2. Persist to Supabase and update state
    try {
      const { data, error } = await supabase
        .from("enquiries")
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        setEnquiries((prev) => {
          const updated = [data as EnquiryItem, ...prev];
          if (typeof window !== "undefined") {
            localStorage.setItem("hustlify_enquiries", JSON.stringify(updated));
          }
          return updated;
        });
      } else {
        const fallback: EnquiryItem = {
          id: crypto.randomUUID(),
          ...payload,
        };
        setEnquiries((prev) => {
          const updated = [fallback, ...prev];
          if (typeof window !== "undefined") {
            localStorage.setItem("hustlify_enquiries", JSON.stringify(updated));
          }
          return updated;
        });
      }

      return { success: true };
    } catch {
      return { success: true };
    }
  };

  const updateEnquiryStatus = async (
    id: string,
    status: EnquiryStatus,
    extraData?: { converted_by?: string; deal_amount?: number }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const now = new Date().toISOString();
      const isJoining = status === "joined";

      setEnquiries((prev) => {
        const updated = prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                updated_at: now,
                ...(extraData?.converted_by !== undefined ? { converted_by: extraData.converted_by } : {}),
                ...(extraData?.deal_amount !== undefined ? { deal_amount: extraData.deal_amount } : {}),
                ...(isJoining ? { converted_at: item.converted_at || now } : {}),
              }
            : item
        );
        if (typeof window !== "undefined") {
          localStorage.setItem("hustlify_enquiries", JSON.stringify(updated));
        }
        return updated;
      });

      const updatePayload: Record<string, unknown> = {
        status,
        updated_at: now,
      };

      if (extraData?.converted_by !== undefined) {
        updatePayload.converted_by = extraData.converted_by;
      }
      if (extraData?.deal_amount !== undefined) {
        updatePayload.deal_amount = extraData.deal_amount;
      }
      if (isJoining) {
        updatePayload.converted_at = now;
      }

      const { error } = await supabase
        .from("enquiries")
        .update(updatePayload)
        .eq("id", id);

      if (error && error.code !== "42P01") {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update enquiry status";
      return { success: false, error: msg };
    }
  };

  const deleteEnquiry = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setEnquiries((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        if (typeof window !== "undefined") {
          localStorage.setItem("hustlify_enquiries", JSON.stringify(updated));
        }
        return updated;
      });

      const { error } = await supabase.from("enquiries").delete().eq("id", id);
      if (error && error.code !== "42P01") {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to delete enquiry" };
    }
  };

  const saveSettings = async (
    newSettings: CompanySettings
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("hustlify_company_settings", JSON.stringify(newSettings));
      }

      const payload = {
        company_name: newSettings.company_name,
        email: newSettings.email,
        mobile_number: newSettings.mobile_number,
        whatsapp_number: newSettings.whatsapp_number,
        address: newSettings.address,
        landmark: newSettings.landmark,
        city: newSettings.city,
        state: newSettings.state,
        pincode: newSettings.pincode,
        updated_at: new Date().toISOString(),
      };

      let queryError;

      if (settings.id) {
        const { error } = await supabase
          .from("company_settings")
          .update(payload)
          .eq("id", settings.id);
        queryError = error;
      } else {
        const { data, error } = await supabase
          .from("company_settings")
          .insert([payload])
          .select("id")
          .single();

        if (data) {
          newSettings.id = data.id;
        }
        queryError = error;
      }

      if (queryError) {
        return { success: false, error: queryError.message };
      }

      setSettings(newSettings);
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to save settings",
      };
    }
  };

  const saveHeroData = async (
    newHero: HeroSectionData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("hustlify_hero_data", JSON.stringify(newHero));
      }

      const payload = {
        heading: newHero.heading,
        description: newHero.description,
        image_url: newHero.image_url,
        updated_at: new Date().toISOString(),
      };

      let queryError;
      const currentId = newHero.id || heroData.id;

      if (currentId) {
        const { error } = await supabase
          .from("hero_section")
          .update(payload)
          .eq("id", currentId);
        queryError = error;
      } else {
        const { data: existing } = await supabase
          .from("hero_section")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          newHero.id = existing.id;
          const { error } = await supabase
            .from("hero_section")
            .update(payload)
            .eq("id", existing.id);
          queryError = error;
        } else {
          const { data, error } = await supabase
            .from("hero_section")
            .insert([payload])
            .select("id")
            .single();

          if (data) {
            newHero.id = data.id;
          }
          queryError = error;
        }
      }

      setHeroData({ ...newHero });

      if (queryError) {
        return { success: false, error: queryError.message };
      }

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to save hero section",
      };
    }
  };

  const saveStatisticsData = async (
    newStats: StatisticsSectionData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("hustlify_statistics_data", JSON.stringify(newStats));
      }

      const payload = {
        items: newStats.items,
        updated_at: new Date().toISOString(),
      };

      let queryError;
      const currentId = newStats.id || statisticsData.id;

      if (currentId) {
        const { error } = await supabase
          .from("statistics_section")
          .update(payload)
          .eq("id", currentId);
        queryError = error;
      } else {
        const { data: existing } = await supabase
          .from("statistics_section")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          newStats.id = existing.id;
          const { error } = await supabase
            .from("statistics_section")
            .update(payload)
            .eq("id", existing.id);
          queryError = error;
        } else {
          const { data, error } = await supabase
            .from("statistics_section")
            .insert([payload])
            .select("id")
            .single();

          if (data) {
            newStats.id = data.id;
          }
          queryError = error;
        }
      }

      setStatisticsData({ ...newStats });

      if (queryError) {
        return { success: false, error: queryError.message };
      }

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to save statistics section",
      };
    }
  };

  const saveFeatureSliderData = async (
    newData: FeatureSliderData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("hustlify_feature_slider_data", JSON.stringify(newData));
      }

      const payload = {
        items: newData.items,
        updated_at: new Date().toISOString(),
      };

      let queryError;
      const currentId = newData.id || featureSliderData.id;

      if (currentId) {
        const { error } = await supabase
          .from("feature_slider_section")
          .update(payload)
          .eq("id", currentId);
        queryError = error;
      } else {
        const { data: existing } = await supabase
          .from("feature_slider_section")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          newData.id = existing.id;
          const { error } = await supabase
            .from("feature_slider_section")
            .update(payload)
            .eq("id", existing.id);
          queryError = error;
        } else {
          const { data, error } = await supabase
            .from("feature_slider_section")
            .insert([payload])
            .select("id")
            .single();

          if (data) {
            newData.id = data.id;
          }
          queryError = error;
        }
      }

      if (queryError) {
        console.error("Supabase feature_slider_section save error:", queryError);
        return { success: false, error: queryError.message };
      }

      setFeatureSliderData({ ...newData });

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to save feature section",
      };
    }
  };

  const saveMasterData = async (
    newData: MasterSectionData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("hustlify_master_data", JSON.stringify(newData));
      }

      const payload = {
        heading: newData.heading,
        description: newData.description,
        items: newData.items,
        updated_at: new Date().toISOString(),
      };

      let queryError;
      const currentId = newData.id || masterData.id;

      if (currentId) {
        const { error } = await supabase
          .from("master_section")
          .update(payload)
          .eq("id", currentId);
        queryError = error;
      } else {
        const { data: existing } = await supabase
          .from("master_section")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          newData.id = existing.id;
          const { error } = await supabase
            .from("master_section")
            .update(payload)
            .eq("id", existing.id);
          queryError = error;
        } else {
          const { data, error } = await supabase
            .from("master_section")
            .insert([payload])
            .select("id")
            .single();

          if (data) {
            newData.id = data.id;
          }
          queryError = error;
        }
      }

      if (queryError) {
        console.error("Supabase master_section save error:", queryError);
        return { success: false, error: queryError.message };
      }

      setMasterData({ ...newData });

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to save master section",
      };
    }
  };

  const saveVideoData = async (
    newData: VideoSectionData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("hustlify_video_data", JSON.stringify(newData));
      }

      const payload = {
        subheading: newData.subheading,
        heading: newData.heading,
        items: newData.items,
        updated_at: new Date().toISOString(),
      };

      let queryError;
      const currentId = newData.id || videoData.id;

      if (currentId) {
        const { error } = await supabase
          .from("video_section")
          .update(payload)
          .eq("id", currentId);
        queryError = error;
      } else {
        const { data: existing } = await supabase
          .from("video_section")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          newData.id = existing.id;
          const { error } = await supabase
            .from("video_section")
            .update(payload)
            .eq("id", existing.id);
          queryError = error;
        } else {
          const { data, error } = await supabase
            .from("video_section")
            .insert([payload])
            .select("id")
            .single();

          if (data) {
            newData.id = data.id;
          }
          queryError = error;
        }
      }

      if (queryError) {
        console.error("Supabase video_section save error:", queryError);
        return { success: false, error: queryError.message };
      }

      setVideoData({ ...newData });

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to save video section",
      };
    }
  };

  const saveCardGridData = async (
    newData: CardGridSectionData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("hustlify_card_grid_data", JSON.stringify(newData));
      }

      const payload = {
        heading: newData.heading,
        items: newData.items,
        updated_at: new Date().toISOString(),
      };

      let queryError;
      const currentId = newData.id || cardGridData.id;

      if (currentId) {
        const { error } = await supabase
          .from("card_grid_section")
          .update(payload)
          .eq("id", currentId);
        queryError = error;
      } else {
        const { data: existing } = await supabase
          .from("card_grid_section")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          newData.id = existing.id;
          const { error } = await supabase
            .from("card_grid_section")
            .update(payload)
            .eq("id", existing.id);
          queryError = error;
        } else {
          const { data, error } = await supabase
            .from("card_grid_section")
            .insert([payload])
            .select("id")
            .single();

          if (data) {
            newData.id = data.id;
          }
          queryError = error;
        }
      }

      if (queryError) {
        console.error("Supabase card_grid_section save error:", queryError);
        return { success: false, error: queryError.message };
      }

      setCardGridData({ ...newData });

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to save card grid section",
      };
    }
  };

  const saveRoadmapData = async (
    newData: RoadmapSectionData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("hustlify_roadmap_data", JSON.stringify(newData));
      }

      const payload = {
        heading: newData.heading,
        description: newData.description,
        items: newData.items,
        updated_at: new Date().toISOString(),
      };

      let queryError;
      const currentId = newData.id || roadmapData.id;

      if (currentId) {
        const { error } = await supabase
          .from("roadmap_section")
          .update(payload)
          .eq("id", currentId);
        queryError = error;
      } else {
        const { data: existing } = await supabase
          .from("roadmap_section")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          newData.id = existing.id;
          const { error } = await supabase
            .from("roadmap_section")
            .update(payload)
            .eq("id", existing.id);
          queryError = error;
        } else {
          const { data, error } = await supabase
            .from("roadmap_section")
            .insert([payload])
            .select("id")
            .single();

          if (data) {
            newData.id = data.id;
          }
          queryError = error;
        }
      }

      if (queryError) {
        console.error("Supabase roadmap_section save error:", queryError);
        return { success: false, error: queryError.message };
      }

      setRoadmapData({ ...newData });

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to save roadmap section",
      };
    }
  };

  const saveFaqData = async (
    newData: FaqSectionData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("hustlify_faq_data", JSON.stringify(newData));
      }

      const payload = {
        subheading: newData.subheading,
        heading: newData.heading,
        items: newData.items,
        updated_at: new Date().toISOString(),
      };

      let queryError;
      const currentId = newData.id || faqData.id;

      if (currentId) {
        const { error } = await supabase
          .from("faq_section")
          .update(payload)
          .eq("id", currentId);
        queryError = error;
      } else {
        const { data: existing } = await supabase
          .from("faq_section")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          newData.id = existing.id;
          const { error } = await supabase
            .from("faq_section")
            .update(payload)
            .eq("id", existing.id);
          queryError = error;
        } else {
          const { data, error } = await supabase
            .from("faq_section")
            .insert([payload])
            .select("id")
            .single();

          if (data) {
            newData.id = data.id;
          }
          queryError = error;
        }
      }

      if (queryError) {
        console.error("Supabase faq_section save error:", queryError);
        return { success: false, error: queryError.message };
      }

      setFaqData({ ...newData });

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to save FAQ section",
      };
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        settings,
        setSettings,
        settingsLoaded,
        activeTab,
        setActiveTab,
        saveSettings,
        fetchSettings,

        heroData,
        setHeroData,
        heroLoaded,
        saveHeroData,
        fetchHeroData,

        statisticsData,
        setStatisticsData,
        statisticsLoaded,
        saveStatisticsData,
        fetchStatisticsData,

        featureSliderData,
        setFeatureSliderData,
        featureSliderLoaded,
        saveFeatureSliderData,
        fetchFeatureSliderData,

        masterData,
        setMasterData,
        masterLoaded,
        saveMasterData,
        fetchMasterData,

        videoData,
        setVideoData,
        videoLoaded,
        saveVideoData,
        fetchVideoData,

        cardGridData,
        setCardGridData,
        cardGridLoaded,
        saveCardGridData,
        fetchCardGridData,

        roadmapData,
        setRoadmapData,
        roadmapLoaded,
        saveRoadmapData,
        fetchRoadmapData,

        faqData,
        setFaqData,
        faqLoaded,
        saveFaqData,
        fetchFaqData,

        enquiries,
        setEnquiries,
        enquiriesLoaded,
        fetchEnquiries,
        updateEnquiryStatus,
        deleteEnquiry,
        addEnquiry,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
