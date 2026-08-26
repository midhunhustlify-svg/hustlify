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

interface DashboardContextType {
  settings: CompanySettings;
  setSettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
  settingsLoaded: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  saveSettings: (newSettings: CompanySettings) => Promise<{ success: boolean; error?: string }>;
  fetchSettings: () => Promise<void>;
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

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setSettings({
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
        });
      }
    } catch {
      // Gracefully handle if query fails
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    // Re-fetch automatically whenever user logs in or auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchSettings();
      } else {
        setSettings(defaultSettings);
        setSettingsLoaded(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSettings]);

  const saveSettings = async (
    newSettings: CompanySettings
  ): Promise<{ success: boolean; error?: string }> => {
    try {
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
