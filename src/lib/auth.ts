import { supabase } from "@/lib/supabaseClient";
import { UserRole, ROLE_CONFIG } from "@/types/auth";

export function getRoleDashboardPath(role?: string | null): string {
  if (role && role in ROLE_CONFIG) {
    return ROLE_CONFIG[role as UserRole].dashboardPath;
  }
  return "/dashboard/super-admin";
}

export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    // Check user_metadata first
    const roleFromMeta = user.user_metadata?.role as UserRole | undefined;
    if (roleFromMeta && roleFromMeta in ROLE_CONFIG) {
      return roleFromMeta;
    }

    // Check profiles table if present
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role && profile.role in ROLE_CONFIG) {
      return profile.role as UserRole;
    }

    return (user.user_metadata?.role as UserRole) || "super_admin";
  } catch {
    return null;
  }
}
