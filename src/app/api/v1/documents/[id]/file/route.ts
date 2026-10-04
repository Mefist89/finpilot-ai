import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("original_filename,storage_path,mime_type")
    .eq("id", id)
    .maybeSingle();

  if (documentError || !document) {
    return NextResponse.json({ message: "Documentul nu a fost găsit." }, { status: 404 });
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from("documents")
    .download(document.storage_path);

  if (downloadError || !file) {
    return NextResponse.json(
      { message: "Fișierul original nu a putut fi deschis." },
      { status: 404 },
    );
  }

  const bytes = await file.arrayBuffer();
  const safeName = document.original_filename.replace(/["\r\n]/g, "_");

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": document.mime_type || file.type || "application/pdf",
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
