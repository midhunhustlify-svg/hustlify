"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getRoleDashboardPath } from "@/lib/auth";

export default function DashboardIndexPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        router.replace("/login");
        return;
      }
      const role = user.user_metadata?.role;
      const destination = getRoleDashboardPath(role);
      router.replace(destination);
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-xs text-neutral-400 tracking-wider">Redirecting...</div>
    </div>
  );
}
