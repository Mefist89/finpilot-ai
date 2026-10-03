import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/utils/supabase/server";

const requestSchema = z.object({ query: z.string().trim().min(2).max(500) });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Sign in to use Copilot." }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_QUERY", message: "A valid query is required." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      error: "DATA_SOURCE_NOT_CONFIGURED",
      message: "Copilot is not available until the ledger data source is connected.",
    },
    { status: 503 },
  );
}
