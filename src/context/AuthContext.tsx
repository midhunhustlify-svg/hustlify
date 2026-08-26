"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { UserRole } from "@/types/auth";
import { getCurrentUserRole } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  userEmail: string;
  role: UserRole;
  loading: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [role, setRole] = useState<UserRole>("super_admin");
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAuth = useCallback(async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser) {
        setUser(currentUser);
        setUserEmail(currentUser.email || "");
        const userRole = await getCurrentUserRole();
        if (userRole) setRole(userRole);
      } else {
        setUser(null);
        setUserEmail("");
      }
    } catch {
      setUser(null);
      setUserEmail("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setUserEmail(session.user.email || "");
      } else {
        setUser(null);
        setUserEmail("");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAuth]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserEmail("");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userEmail,
        role,
        loading,
        logout,
        refreshAuth: fetchAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
