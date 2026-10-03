import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/utils/supabase/server";

const requestSchema = z.object({ query: z.string().trim().min(2).max(500) });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Autentificați-vă pentru a utiliza Copilotul." }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_QUERY", message: "Introduceți o întrebare validă." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      error: "DATA_SOURCE_NOT_CONFIGURED",
      message: "Copilotul va fi disponibil după conectarea datelor din jurnalul contabil.",
    },
    { status: 503 },
  );
}
