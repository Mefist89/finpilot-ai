import { NextResponse } from "next/server";

import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

type Direction = "purchase" | "sale";

function record(value: Json | undefined): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function text(value: Json | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizedId(value: Json | string | null | undefined) {
  return typeof value === "string" ? value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : "";
}

function direction(metadata: Json, companyIds: Set<string>): Direction {
  const root = record(metadata);
  const supplier = record(root.supplier);
  const customer = record(root.customer);
  if ([supplier.tax_id, supplier.vat_code].some((value) => companyIds.has(normalizedId(value)))) return "sale";
  if ([customer.tax_id, customer.vat_code].some((value) => companyIds.has(normalizedId(value)))) return "purchase";
  return root.direction === "sale" ? "sale" : "purchase";
}

export async function POST() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return NextResponse.json({ message: "Autentificarea este necesară." }, { status: 401 });

  const [documentsResult, invoicesResult, profileResult] = await Promise.all([
    supabase.from("documents").select("id,document_number,issue_date,currency,counterparty_name,counterparty_tax_id,metadata").eq("document_type", "invoice").in("status", ["ready", "posted"]),
    supabase.from("invoices").select("id,direction,invoice_number,source_document_id"),
    supabase.from("profiles").select("idno,vat_code").eq("id", userData.user.id).maybeSingle(),
  ]);

  if (documentsResult.error || invoicesResult.error) {
    return NextResponse.json({ message: "Facturile verificate nu au putut fi citite." }, { status: 500 });
  }

  const companyIds = new Set([profileResult.data?.idno, profileResult.data?.vat_code].map(normalizedId).filter(Boolean));
  const invoices = invoicesResult.data ?? [];
  let created = 0;
  let linked = 0;
  const errors: string[] = [];

  for (const document of documentsResult.data ?? []) {
    if (invoices.some((invoice) => invoice.source_document_id === document.id)) continue;

    const root = record(document.metadata);
    const invoiceDirection = direction(document.metadata, companyIds);
    const counterparty = record(invoiceDirection === "sale" ? root.customer : root.supplier);
    const invoiceNumber = document.document_number?.trim() ?? "";
    const issueDate = document.issue_date ?? "";
    const items = Array.isArray(root.items) ? root.items : [];
    const counterpartyName = text(counterparty.name) || document.counterparty_name?.trim() || "";
    const counterpartyTaxId = text(counterparty.tax_id) || document.counterparty_tax_id?.trim() || "";

    if (!invoiceNumber || !issueDate || !document.currency || !counterpartyName || items.length === 0) {
      errors.push(`Factura ${invoiceNumber || document.id} are date incomplete.`);
      continue;
    }

    const matchingInvoice = invoices.find((invoice) => invoice.direction === invoiceDirection && invoice.invoice_number === invoiceNumber);
    if (matchingInvoice) {
      const { error } = await supabase.from("invoices").update({ source_document_id: document.id }).eq("id", matchingInvoice.id).is("source_document_id", null);
      if (error) errors.push(`Factura ${invoiceNumber} nu a putut fi asociată documentului.`);
      else linked += 1;
      continue;
    }

    const { data: invoiceId, error } = await supabase.rpc("create_invoice", {
      p_direction: invoiceDirection,
      p_invoice_number: invoiceNumber,
      p_issue_date: issueDate,
      p_counterparty_name: counterpartyName,
      p_counterparty_tax_id: counterpartyTaxId,
      p_currency: document.currency,
      p_items: items,
      p_source_document_id: document.id,
    });

    if (error || !invoiceId) {
      if (error?.code === "23505") {
        const { data: existingInvoice, error: lookupError } = await supabase
          .from("invoices")
          .select("id,source_document_id")
          .eq("direction", invoiceDirection)
          .eq("invoice_number", invoiceNumber)
          .maybeSingle();
        if (!lookupError && existingInvoice) {
          if (!existingInvoice.source_document_id) {
            const { error: linkError } = await supabase.from("invoices").update({ source_document_id: document.id }).eq("id", existingInvoice.id).is("source_document_id", null);
            if (linkError) errors.push(`Factura ${invoiceNumber} există, dar nu a putut fi asociată documentului.`);
            else linked += 1;
          }
          continue;
        }
      }
      errors.push(`Factura ${invoiceNumber} nu a putut fi importată: ${error?.message || "eroare necunoscută"}`);
    } else {
      created += 1;
      invoices.push({ id: invoiceId, direction: invoiceDirection, invoice_number: invoiceNumber, source_document_id: document.id });
    }
  }

  return NextResponse.json({ created, linked, errors });
}
