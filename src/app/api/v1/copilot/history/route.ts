import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ message: "Autentificați-vă pentru a șterge conversația." }, { status: 401 });
  }

  const { error } = await supabase
    .from("copilot_interactions")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ message: "Conversația nu a putut fi ștearsă." }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
