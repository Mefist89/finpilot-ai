import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  return NextResponse.json({
    currency: null,
    revenue: "0.00",
    expenses: "0.00",
    documents_processed: 0,
    automation_rate: "0.00",
    review_queue: 0,
    generated_at: new Date().toISOString(),
  });
}
