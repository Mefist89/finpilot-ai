import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

type EditableDocument = {
  original_filename?: unknown;
  document_number?: unknown;
  counterparty_name?: unknown;
  counterparty_tax_id?: unknown;
  issue_date?: unknown;
  due_date?: unknown;
  currency?: unknown;
  subtotal?: unknown;
  vat_amount?: unknown;
  total_amount?: unknown;
};

function text(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function date(value: unknown) {
  const normalized = text(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
}

function amount(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : null;
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await authenticatedClient();
  if (!user) return NextResponse.json({ message: "Sesiunea a expirat. Conectați-vă din nou." }, { status: 401 });

  let body: EditableDocument;
  try {
    body = await request.json() as EditableDocument;
  } catch {
    return NextResponse.json({ message: "Datele trimise nu sunt valide." }, { status: 400 });
  }

  const originalFilename = text(body.original_filename, 255);
  const counterpartyName = text(body.counterparty_name, 180);
  const currency = text(body.currency, 3).toUpperCase();
  const totalAmount = amount(body.total_amount);

  if (!originalFilename || !counterpartyName || !/^[A-Z]{3}$/.test(currency) || totalAmount === null) {
    return NextResponse.json({ message: "Completați denumirea, partenerul, moneda și suma totală." }, { status: 400 });
  }

  const values = {
    original_filename: originalFilename,
    document_number: text(body.document_number, 80) || null,
    counterparty_name: counterpartyName,
    counterparty_tax_id: text(body.counterparty_tax_id, 40) || null,
    issue_date: date(body.issue_date),
    due_date: date(body.due_date),
    currency,
    subtotal: amount(body.subtotal),
    vat_amount: amount(body.vat_amount),
    total_amount: totalAmount,
  };

  const { data, error } = await supabase
    .from("documents")
    .update(values)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id,original_filename,document_number,counterparty_name,counterparty_tax_id,issue_date,due_date,currency,subtotal,vat_amount,total_amount")
    .maybeSingle();

  if (error || !data) return NextResponse.json({ message: "Documentul nu a putut fi actualizat." }, { status: 400 });

  await supabase.from("audit_events").insert({
    entity_type: "document",
    entity_id: id,
    action: "updated",
    metadata: { fields: Object.keys(values) },
  });

  return NextResponse.json({ document: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await authenticatedClient();
  if (!user) return NextResponse.json({ message: "Sesiunea a expirat. Conectați-vă din nou." }, { status: 401 });

  const { data: document, error: findError } = await supabase
    .from("documents")
    .select("id,original_filename,storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (findError || !document) return NextResponse.json({ message: "Documentul nu a fost găsit." }, { status: 404 });

  const [invoiceResult, ledgerResult] = await Promise.all([
    supabase.from("invoices").update({ source_document_id: null }).eq("source_document_id", id),
    supabase.from("ledger_entries").update({ source_document_id: null }).eq("source_document_id", id),
  ]);
  if (invoiceResult.error || ledgerResult.error) {
    return NextResponse.json({ message: "Legăturile contabile ale documentului nu au putut fi actualizate." }, { status: 400 });
  }

  const { error: deleteError } = await supabase.from("documents").delete().eq("id", id).eq("user_id", user.id);
  if (deleteError) return NextResponse.json({ message: "Documentul nu a putut fi șters." }, { status: 400 });

  const { error: storageError } = await supabase.storage.from("documents").remove([document.storage_path]);
  if (storageError) {
    return NextResponse.json({ message: "Înregistrarea a fost ștearsă, dar fișierul nu a putut fi eliminat din stocare.", deleted: true }, { status: 207 });
  }

  return NextResponse.json({ deleted: true, fileName: document.original_filename });
}
