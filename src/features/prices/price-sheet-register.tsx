"use client";

import { Calculator, CalendarDays, Download, FileSpreadsheet, LoaderCircle, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import type { Enums } from "@/types/database";
import { createClient } from "@/utils/supabase/client";

type Invoice = { id: string; invoice_number: string; issue_date: string; counterparty_name: string; currency: string; total_amount: number; status: Enums<"invoice_status"> };
type InvoiceItem = { id: string; invoice_id: string; line_number: number; product_name: string; sku: string | null; unit: string; quantity: number; unit_price: number; vat_rate: number };
type PriceSheet = { id: string; purchase_invoice_id: string; sheet_number: number; sheet_date: string; status: Enums<"price_sheet_status">; created_at: string };
type PriceItem = { id: string; price_sheet_id: string; line_number: number; product_name: string; sku: string | null; unit: string; quantity: number; purchase_price: number; additional_cost: number; markup_percent: number; vat_rate: number; sale_price: number };
type Props = { invoices: Invoice[]; invoiceItems: InvoiceItem[]; sheets: PriceSheet[]; sheetItems: PriceItem[]; baseCurrency: string; loadError: string };

const inputClass = "focus-ring h-11 w-full rounded-xl border border-[#dfe4ec] bg-white px-3.5 text-xs font-semibold text-[#0b1838] placeholder:text-slate-400";

function today() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function numberValue(value: string) { return Number(value.replace(",", ".")); }
function formatMoney(value: number, currency: string) { return new Intl.NumberFormat("ro-MD", { style: "currency", currency, minimumFractionDigits: 2 }).format(Number(value)); }
function formatDate(value: string) { return new Intl.DateTimeFormat("ro-MD", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)); }
function csvCell(value: string | number) { return `"${String(value).replaceAll('"', '""')}"`; }

export function PriceSheetRegister({ invoices, invoiceItems, sheets, sheetItems, baseCurrency, loadError }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [sheetDate, setSheetDate] = useState(today());
  const [markupPercent, setMarkupPercent] = useState("25");
  const [additionalCost, setAdditionalCost] = useState("0");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const invoiceMap = useMemo(() => new Map(invoices.map((invoice) => [invoice.id, invoice])), [invoices]);
  const itemsByInvoice = useMemo(() => { const map = new Map<string, InvoiceItem[]>(); invoiceItems.forEach((item) => map.set(item.invoice_id, [...(map.get(item.invoice_id) ?? []), item])); return map; }, [invoiceItems]);
  const itemsBySheet = useMemo(() => { const map = new Map<string, PriceItem[]>(); sheetItems.forEach((item) => map.set(item.price_sheet_id, [...(map.get(item.price_sheet_id) ?? []), item])); return map; }, [sheetItems]);
  const usedInvoiceIds = useMemo(() => new Set(sheets.filter((sheet) => sheet.status !== "cancelled").map((sheet) => sheet.purchase_invoice_id)), [sheets]);
  const availableInvoices = invoices.filter((invoice) => !usedInvoiceIds.has(invoice.id));

  const visible = sheets.filter((sheet) => { const invoice = invoiceMap.get(sheet.purchase_invoice_id); const term = search.trim().toLocaleLowerCase("ro"); return !term || [sheet.sheet_number, invoice?.invoice_number, invoice?.counterparty_name, ...(itemsBySheet.get(sheet.id) ?? []).flatMap((item) => [item.product_name, item.sku])].join(" ").toLocaleLowerCase("ro").includes(term); });
  const selectedInvoice = invoiceMap.get(invoiceId);
  const selectedItems = invoiceId ? itemsByInvoice.get(invoiceId) ?? [] : [];
  const markup = Math.max(0, numberValue(markupPercent) || 0);
  const extra = Math.max(0, numberValue(additionalCost) || 0);

  function openCreate() {
    setInvoiceId(availableInvoices[0]?.id ?? "");
    setSheetDate(today());
    setMarkupPercent("25");
    setAdditionalCost("0");
    setFormError("");
    setModalOpen(true);
  }

  async function saveSheet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invoiceId) return setFormError("Selectați factura de procurare.");
    if (!Number.isFinite(markup) || !Number.isFinite(extra)) return setFormError("Verificați adaosul comercial și costurile suplimentare.");
    setSaving(true);
    setFormError("");
    const { error } = await createClient().rpc("create_price_sheet", { p_purchase_invoice_id: invoiceId, p_sheet_date: sheetDate, p_markup_percent: markup, p_additional_cost: extra });
    if (error) {
      setFormError(error.code === "23505" ? "Pentru această factură există deja o fișă de preț activă." : "Fișa de preț nu a putut fi salvată.");
      setSaving(false);
      return;
    }
    setSaving(false);
    setModalOpen(false);
    router.refresh();
  }

  function exportCsv() {
    const rows: (string | number)[][] = [["Fișa", "Data", "Factura", "Furnizor", "Produs", "Cod", "Cantitate", "Preț achiziție", "Cost suplimentar", "Adaos %", "TVA %", "Preț vânzare"]];
    visible.forEach((sheet) => { const invoice = invoiceMap.get(sheet.purchase_invoice_id); (itemsBySheet.get(sheet.id) ?? []).forEach((item) => rows.push([`FP-${String(sheet.sheet_number).padStart(5, "0")}`, sheet.sheet_date, invoice?.invoice_number ?? "", invoice?.counterparty_name ?? "", item.product_name, item.sku ?? "", item.quantity, item.purchase_price, item.additional_cost, item.markup_percent, item.vat_rate, item.sale_price])); });
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `fise-stabilire-preturi-${today()}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <>
    {loadError && <p role="alert" className="mt-6 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[11px] font-bold text-rose-700">{loadError}</p>}
    <div className="mt-7 rounded-2xl border border-cyan-100 bg-[#effbfe] px-5 py-4"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#0787ad]"><Calculator className="h-4 w-4" /></span><div><p className="text-[11px] font-extrabold text-[#0b1838]">Formula utilizată</p><p className="mt-1 text-[10px] font-semibold leading-5 text-[#087a9d]">(Preț de achiziție + cost suplimentar) × (1 + adaos comercial) × (1 + TVA) = preț de vânzare</p></div></div></div>

    <div className="card-shadow mt-4 flex flex-col gap-3 rounded-2xl border border-[#e8ebf2] bg-white p-3 sm:flex-row sm:items-center"><div className="relative flex-1 sm:max-w-[320px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Caută fișe, facturi, produse..." className="focus-ring h-10 w-full rounded-xl border border-[#e5e9f0] bg-[#fafbfc] pl-9 pr-3 text-[11px]" /></div><div className="ml-auto flex gap-2"><button onClick={exportCsv} disabled={!visible.length} className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe4ec] px-4 text-[10px] font-extrabold text-slate-600 disabled:opacity-40"><Download className="h-4 w-4" />Exportă CSV</button><button onClick={openCreate} disabled={!availableInvoices.length} className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl bg-[#0b1838] px-4 text-[10px] font-extrabold text-white disabled:opacity-40"><Plus className="h-4 w-4" />Fișă nouă</button></div></div>

    {!availableInvoices.length && invoices.length === 0 && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-[10px] font-semibold text-amber-800">Pentru a crea o fișă de preț, adăugați mai întâi o factură în Registrul de procurări.</div>}

    <section className="card-shadow mt-4 overflow-hidden rounded-2xl border border-[#e8ebf2] bg-white">{visible.length === 0 ? <div className="grid min-h-[320px] place-items-center px-6 text-center"><div><FileSpreadsheet className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 text-sm font-extrabold text-[#0b1838]">Nu există fișe de stabilire a prețurilor</h2><p className="mt-2 text-[11px] text-slate-400">Creați o fișă pornind de la o factură din registrul de procurări.</p>{availableInvoices.length > 0 && <button onClick={openCreate} className="focus-ring mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#0b1838] px-4 text-[10px] font-extrabold text-white"><Plus className="h-4 w-4" />Creează prima fișă</button>}</div></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left"><thead><tr className="border-b border-[#e9ecf2] bg-[#fbfcfd] text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400"><th className="px-5 py-4">Fișa / Factura</th><th className="px-3 py-4">Produs</th><th className="px-3 py-4 text-right">Preț achiziție</th><th className="px-3 py-4 text-right">Cost supl.</th><th className="px-3 py-4 text-right">Adaos</th><th className="px-3 py-4 text-right">TVA</th><th className="px-5 py-4 text-right">Preț vânzare</th></tr></thead><tbody className="divide-y divide-[#eef0f5]">{visible.flatMap((sheet) => { const invoice = invoiceMap.get(sheet.purchase_invoice_id); return (itemsBySheet.get(sheet.id) ?? []).map((item, index) => <tr key={item.id} className={index ? "bg-[#fcfdfe]" : "border-t border-[#dfe4ec]"}><td className="px-5 py-4 align-top">{index === 0 && <><b className="block text-[11px] text-[#0b1838]">FP-{String(sheet.sheet_number).padStart(5, "0")}</b><span className="mt-1 block text-[9px] font-bold text-[#0787ad]">{formatDate(sheet.sheet_date)} · {invoice?.invoice_number}</span><span className="mt-1 block text-[9px] text-slate-400">{invoice?.counterparty_name}</span></>}</td><td className="px-3 py-4"><b className="block text-[11px] text-slate-700">{item.product_name}</b><span className="mt-1 block text-[9px] text-slate-400">{item.quantity} {item.unit}{item.sku ? ` · ${item.sku}` : ""}</span></td><td className="px-3 py-4 text-right text-[11px] font-bold text-slate-600">{formatMoney(item.purchase_price, invoice?.currency ?? baseCurrency)}</td><td className="px-3 py-4 text-right text-[11px] font-bold text-slate-600">{formatMoney(item.additional_cost, invoice?.currency ?? baseCurrency)}</td><td className="px-3 py-4 text-right text-[11px] font-bold text-slate-600">{item.markup_percent}%</td><td className="px-3 py-4 text-right text-[11px] font-bold text-slate-600">{item.vat_rate}%</td><td className="px-5 py-4 text-right text-[11px] font-extrabold text-[#0787ad]">{formatMoney(item.sale_price, invoice?.currency ?? baseCurrency)}</td></tr>); })}</tbody></table></div>}<div className="border-t border-[#eef0f5] px-5 py-3.5 text-[10px] font-semibold text-slate-400">{visible.length} {visible.length === 1 ? "fișă" : "fișe"} · {visible.reduce((sum, sheet) => sum + (itemsBySheet.get(sheet.id)?.length ?? 0), 0)} poziții</div></section>

    {modalOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b1838]/45 p-4 backdrop-blur-sm" onMouseDown={(event) => event.currentTarget === event.target && !saving && setModalOpen(false)}><form onSubmit={saveSheet} className="animate-float-in max-h-[calc(100vh-2rem)] w-full max-w-[760px] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7"><div className="flex items-start justify-between"><div><h2 className="text-lg font-extrabold text-[#0b1838]">Fișă de stabilire a prețurilor</h2><p className="mt-1 text-[11px] text-slate-400">Selectați factura și parametrii de calcul.</p></div><button type="button" onClick={() => setModalOpen(false)} aria-label="Închide" className="rounded-lg p-2 text-slate-400"><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="block sm:col-span-2"><span className="mb-2 block text-[10px] font-extrabold text-[#0b1838]">Factura de procurare *</span><select required value={invoiceId} onChange={(event) => setInvoiceId(event.target.value)} className={inputClass}>{availableInvoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoice_number} — {invoice.counterparty_name} — {formatMoney(invoice.total_amount, invoice.currency)}</option>)}</select></label><label><span className="mb-2 block text-[10px] font-extrabold text-[#0b1838]">Data fișei *</span><span className="relative block"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="date" value={sheetDate} onChange={(event) => setSheetDate(event.target.value)} className={`${inputClass} pl-10`} /></span></label><label><span className="mb-2 block text-[10px] font-extrabold text-[#0b1838]">Adaos comercial, % *</span><input required inputMode="decimal" value={markupPercent} onChange={(event) => setMarkupPercent(event.target.value)} className={inputClass} /></label><label className="sm:col-span-2"><span className="mb-2 block text-[10px] font-extrabold text-[#0b1838]">Cost suplimentar pe unitate ({selectedInvoice?.currency ?? baseCurrency})</span><input required inputMode="decimal" value={additionalCost} onChange={(event) => setAdditionalCost(event.target.value)} className={inputClass} /></label></div><div className="mt-5 overflow-hidden rounded-2xl border border-[#e8ebf2]"><div className="bg-[#f8fafc] px-4 py-3 text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Previzualizarea prețurilor</div><div className="divide-y divide-[#eef0f5]">{selectedItems.map((item) => { const salePrice = (Number(item.unit_price) + extra) * (1 + markup / 100) * (1 + Number(item.vat_rate) / 100); return <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3"><div><b className="block text-[10px] text-[#0b1838]">{item.product_name}</b><span className="mt-1 block text-[9px] text-slate-400">Achiziție: {formatMoney(item.unit_price, selectedInvoice?.currency ?? baseCurrency)} · Adaos {markup}% · TVA {item.vat_rate}%</span></div><b className="shrink-0 text-[12px] text-[#0787ad]">{formatMoney(salePrice, selectedInvoice?.currency ?? baseCurrency)}</b></div>; })}</div></div>{formError && <p role="alert" className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[10px] font-bold text-rose-700">{formError}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="focus-ring h-10 rounded-xl border border-[#dfe4ec] px-5 text-[10px] font-extrabold text-slate-600">Anulează</button><button disabled={saving || !invoiceId} className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl bg-[#0b1838] px-5 text-[10px] font-extrabold text-white disabled:opacity-40">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}{saving ? "Se calculează..." : "Calculează și salvează"}</button></div></form></div>}
  </>;
}
