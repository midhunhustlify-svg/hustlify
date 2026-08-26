"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getRoleDashboardPath } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const destination = getRoleDashboardPath(user.user_metadata?.role);
        router.replace(destination);
      } else {
        setCheckingAuth(false);
      }
    });
  }, [router]);

  if (checkingAuth) {
    return null;
  }

  return (
    <main className="flex-1 bg-black text-white">
      {/* Landing page content */}
    </main>
  );
}
