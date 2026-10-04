import { ArrowLeft, Building2, CalendarDays, FileText, Hash, ReceiptText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusPill } from "@/components/status-pill";
import { DocumentReviewActions } from "@/features/documents/document-review-actions";
import type { DocumentStatus } from "@/types/accounting";
import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

type ExtractedItem = { product_name: string; sku: string; unit: string; quantity: number; unit_price: number; vat_rate: number; total_amount: number };

function record(value: Json | undefined): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function text(value: Json | undefined) {
  return typeof value === "string" ? value : "";
}

function number(value: Json | undefined) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function items(value: Json | undefined): ExtractedItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const item = record(entry);
    const productName = text(item.product_name);
    if (!productName) return [];
    return [{ product_name: productName, sku: text(item.sku), unit: text(item.unit) || "buc.", quantity: number(item.quantity), unit_price: number(item.unit_price), vat_rate: number(item.vat_rate), total_amount: number(item.total_amount) }];
  });
}

function status(value: string): DocumentStatus {
  if (value === "posted") return "Posted";
  if (value === "ready") return "Ready";
  if (["uploaded", "processing"].includes(value)) return "Processing";
  return "Needs review";
}

function money(value: number | null, currency: string | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("ro-MD", { style: "currency", currency: currency || "MDL", currencyDisplay: "code", minimumFractionDigits: 2 }).format(Number(value));
}

function date(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ro-MD", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export default async function DocumentPage({ params }: PageProps<"/documents/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: document }, { data: extraction }] = await Promise.all([
    supabase.from("documents").select("id,original_filename,storage_path,mime_type,status,document_number,counterparty_name,counterparty_tax_id,issue_date,due_date,currency,subtotal,vat_amount,total_amount,confidence,metadata").eq("id", id).maybeSingle(),
    supabase.from("document_extractions").select("extracted_data").eq("document_id", id).maybeSingle(),
  ]);
  if (!document) notFound();

  const { data: signed } = await supabase.storage.from("documents").createSignedUrl(document.storage_path, 3600);
  const extracted = record(extraction?.extracted_data);
  const metadata = record(document.metadata);
  const invoiceItems = items(extracted.items ?? metadata.items);
  const warningsValue = extracted.warnings ?? metadata.warnings;
  const warnings = Array.isArray(warningsValue) ? warningsValue.filter((item): item is string => typeof item === "string") : [];
  const currentStatus = status(document.status);

  const fields = [
    { icon: Hash, label: "Numărul documentului", value: document.document_number || "—" },
    { icon: Building2, label: "Furnizor", value: document.counterparty_name || "—" },
    { icon: ShieldCheck, label: "IDNO / cod fiscal", value: document.counterparty_tax_id || "—" },
    { icon: CalendarDays, label: "Data emiterii", value: date(document.issue_date) },
    { icon: CalendarDays, label: "Data scadenței", value: date(document.due_date) },
    { icon: ReceiptText, label: "Moneda", value: document.currency || "MDL" },
  ];

  return (
    <div className="min-h-[calc(100vh-122px)] bg-[#f6f8fc]">
      <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
        <Link href="/documents" className="focus-ring inline-flex items-center gap-2 rounded-xl px-2 py-2 text-[11px] font-extrabold text-slate-500 hover:bg-white hover:text-[#0b1838]"><ArrowLeft className="h-4 w-4" />Înapoi la documente</Link>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0"><p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#0a91b8]">Verificarea documentului</p><h1 className="mt-2 truncate text-xl font-extrabold tracking-[-0.03em] text-[#0b1838] sm:text-2xl">{document.original_filename}</h1><p className="mt-1 text-[10px] font-medium text-slate-400">Comparați factura originală cu datele extrase automat.</p></div>
          <StatusPill status={currentStatus} />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(520px,1.05fr)]">
          <section className="overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#edf0f4] px-4 py-3 text-[10px] font-extrabold text-[#0b1838]"><FileText className="h-4 w-4 text-[#0a91b8]" />Document original</div>
            {signed?.signedUrl ? <iframe src={signed.signedUrl} title={`Previzualizare ${document.original_filename}`} className="h-[720px] w-full bg-slate-100" /> : <div className="grid h-[520px] place-items-center p-8 text-center text-[11px] font-semibold text-slate-400">Previzualizarea fișierului nu este disponibilă.</div>}
          </section>

          <div className="space-y-5">
            <section className="rounded-2xl border border-[#e4e8ef] bg-white p-5 shadow-sm sm:p-6"><h2 className="text-[13px] font-extrabold text-[#0b1838]">Date extrase</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{fields.map((field) => <div key={field.label} className="rounded-xl bg-[#f8fafc] p-3.5"><p className="flex items-center gap-2 text-[8px] font-extrabold uppercase tracking-[0.1em] text-slate-400"><field.icon className="h-3.5 w-3.5 text-[#0a91b8]" />{field.label}</p><p className="mt-2 text-[11px] font-extrabold text-[#0b1838]">{field.value}</p></div>)}</div></section>

            <section className="rounded-2xl border border-[#e4e8ef] bg-white p-5 shadow-sm sm:p-6"><h2 className="text-[13px] font-extrabold text-[#0b1838]">Totaluri</h2><div className="mt-4 grid grid-cols-3 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[8px] font-bold uppercase text-slate-400">Subtotal</p><p className="mt-1.5 text-[11px] font-extrabold text-[#0b1838]">{money(document.subtotal, document.currency)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[8px] font-bold uppercase text-slate-400">TVA</p><p className="mt-1.5 text-[11px] font-extrabold text-[#0b1838]">{money(document.vat_amount, document.currency)}</p></div><div className="rounded-xl bg-[#eaf9fd] p-3"><p className="text-[8px] font-bold uppercase text-[#0787ad]">Total</p><p className="mt-1.5 text-[12px] font-extrabold text-[#0b1838]">{money(document.total_amount, document.currency)}</p></div></div><p className="mt-3 text-[9px] font-semibold text-slate-400">Încredere AI: {document.confidence === null ? "—" : `${Math.round(Number(document.confidence) * 100)}%`}</p></section>

            <section className="overflow-hidden rounded-2xl border border-[#e4e8ef] bg-white shadow-sm"><div className="border-b border-[#edf0f4] px-5 py-4"><h2 className="text-[13px] font-extrabold text-[#0b1838]">Pozițiile facturii</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left"><thead><tr className="bg-[#fafbfc] text-[8px] font-extrabold uppercase tracking-wider text-slate-400"><th className="px-4 py-3">Produs</th><th className="px-3 py-3">Cantitate</th><th className="px-3 py-3">Preț unitar</th><th className="px-3 py-3">TVA</th><th className="px-4 py-3 text-right">Total</th></tr></thead><tbody className="divide-y divide-[#edf0f4]">{invoiceItems.map((item, index) => <tr key={`${item.product_name}-${index}`} className="text-[10px]"><td className="px-4 py-3"><p className="font-extrabold text-[#0b1838]">{item.product_name}</p><p className="mt-0.5 text-[8px] text-slate-400">{item.sku || "Fără cod"}</p></td><td className="px-3 py-3 font-semibold text-slate-500">{item.quantity} {item.unit}</td><td className="px-3 py-3 font-semibold text-slate-500">{money(item.unit_price, document.currency)}</td><td className="px-3 py-3 font-semibold text-slate-500">{item.vat_rate}%</td><td className="px-4 py-3 text-right font-extrabold text-[#0b1838]">{money(item.total_amount, document.currency)}</td></tr>)}</tbody></table>{invoiceItems.length === 0 && <p className="px-5 py-8 text-center text-[10px] font-semibold text-slate-400">Nu au fost extrase poziții.</p>}</div></section>

            {warnings.length > 0 && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">De verificat</h2><ul className="mt-2 space-y-1 text-[10px] font-semibold leading-5 text-amber-700">{warnings.map((warning) => <li key={warning}>• {warning}</li>)}</ul></section>}
          </div>
        </div>
      </div>
      <DocumentReviewActions documentId={document.id} verified={["ready", "posted"].includes(document.status)} />
    </div>
  );
}
