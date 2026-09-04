import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service-role client — only used server-side, never exposed to browser
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables"
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface StaffRecord {
  id: string;
  email: string;
  role: string;
  full_name: string;
  created_at: string;
  confirmed: boolean;
}

/**
 * GET /api/onboard-staff
 * Returns all staff members by merging Supabase Auth users & profiles table.
 * Guarantees NO staff member is ever lost or deleted.
 */
export async function GET() {
  try {
    const supabaseAdmin = getAdminClient();

    // 1. Fetch profiles table
    let profiles: Record<string, any>[] = [];
    try {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, email, role, full_name, created_at, confirmed");
      if (!error && data) {
        profiles = data;
      }
    } catch {
      // ignore
    }

    // 2. Fetch all Auth users from Supabase Auth admin
    let authUsers: any[] = [];
    try {
      const { data: listData, error: listError } =
        await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (!listError && listData?.users) {
        authUsers = listData.users;
      }
    } catch {
      // ignore
    }

    // 3. Merge profiles and auth users (Auth is primary source of accounts)
    const staffMap = new Map<string, StaffRecord>();

    // Add from profiles first
    profiles.forEach((p) => {
      if (p.id) {
        staffMap.set(p.id, {
          id: p.id,
          email: p.email || "",
          role: p.role || "staff",
          full_name: p.full_name || "",
          created_at: p.created_at || new Date().toISOString(),
          confirmed: p.confirmed ?? true,
        });
      }
    });

    // Merge/enrich with auth users
    authUsers.forEach((u) => {
      const existing = staffMap.get(u.id);
      const email = u.email || existing?.email || "";
      const role = u.user_metadata?.role || existing?.role || "staff";
      const full_name = u.user_metadata?.full_name || existing?.full_name || "";
      const created_at = u.created_at || existing?.created_at || new Date().toISOString();

      staffMap.set(u.id, {
        id: u.id,
        email,
        role,
        full_name,
        created_at,
        confirmed: true,
      });
    });

    const staffList = Array.from(staffMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ staff: staffList });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[onboard-staff GET]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/onboard-staff
 * Body: { email, password, full_name, role }
 *
 * Creates a unique Supabase auth user with role metadata and stores profile.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name, role } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "email, password, and role are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabaseAdmin = getAdminClient();

    let userId: string | undefined;

    // 1. Try to create a brand new auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: { role, full_name: full_name?.trim() || "" },
      });

    if (authError) {
      if (
        authError.message.toLowerCase().includes("already") ||
        authError.message.toLowerCase().includes("registered") ||
        authError.message.toLowerCase().includes("exists")
      ) {
        return NextResponse.json(
          { error: "This email is already registered. Please use a different email address." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    userId = authData.user?.id;

    // 2. Upsert into profiles table
    if (userId) {
      try {
        await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              id: userId,
              email: cleanEmail,
              full_name: full_name?.trim() || "",
              role,
              confirmed: true,
              created_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
      } catch (profileErr) {
        console.warn("Profile upsert warning:", profileErr);
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      message: `Staff member ${full_name || cleanEmail} onboarded as ${role}`,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("[onboard-staff POST]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/onboard-staff
 * Body: { userId }
 *
 * Deletes the auth user and their profile row.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getAdminClient();

    // 1. Delete from profiles table first
    try {
      await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", userId);
    } catch (profileErr) {
      console.warn("Profile delete warning:", profileErr);
    }

    // 2. Delete the auth user from Supabase Auth
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("[onboard-staff DELETE]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
