import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing Supabase env variables");
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * GET /api/finance?month=YYYY-MM
 * Returns all transactions, optionally filtered by month.
 */
export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getAdminClient();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // e.g. "2026-08"

    let query = supabaseAdmin
      .from("finance_transactions")
      .select("*")
      .order("date", { ascending: false });

    if (month) {
      const start = `${month}-01`;
      const [y, m] = month.split("-").map(Number);
      const endDate = new Date(y, m, 0); // last day of month
      const end = `${month}-${String(endDate.getDate()).padStart(2, "0")}`;
      query = query.gte("date", start).lte("date", end);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === "42P01") return NextResponse.json({ transactions: [] });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transactions: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[finance GET]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/finance
 * Body: { type, category, amount, description, date }
 */
export async function POST(req: NextRequest) {
  try {
    const { type, category, amount, description, date } = await req.json();

    if (!type || !category || !amount) {
      return NextResponse.json(
        { error: "type, category, and amount are required" },
        { status: 400 }
      );
    }

    if (!["income", "expense"].includes(type)) {
      return NextResponse.json({ error: "type must be income or expense" }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
    const { data, error } = await supabaseAdmin
      .from("finance_transactions")
      .insert([
        {
          type,
          category,
          amount: Number(amount),
          description: description || "",
          date: date || new Date().toISOString().split("T")[0],
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, transaction: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[finance POST]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/finance
 * Body: { id }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
    const { error } = await supabaseAdmin
      .from("finance_transactions")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[finance DELETE]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
