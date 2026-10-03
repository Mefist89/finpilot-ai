"use client";

import { CalendarDays, Download, FileInput, FileOutput, LoaderCircle, Plus, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import type { Enums, Json } from "@/types/database";
import { createClient } from "@/utils/supabase/client";

type Direction = Enums<"invoice_direction">;
type Invoice = { id: string; direction: Direction; invoice_number: string; issue_date: string; counterparty_name: string; counterparty_tax_id: string | null; currency: string; subtotal: number; vat_amount: number; total_amount: number; status: Enums<"invoice_status">; created_at: string };
type InvoiceItem = { id: string; invoice_id: string; line_number: number; product_name: string; sku: string | null; unit: string; quantity: number; unit_price: number; vat_rate: number; subtotal: number; vat_amount: number; total_amount: number };
type ItemDraft = { product_name: string; sku: string; unit: string; quantity: string; unit_price: string; vat_rate: string };
type Props = { invoices: Invoice[]; items: InvoiceItem[]; baseCurrency: string; loadError: string };

const inputClass = "focus-ring h-11 w-full rounded-xl border border-[#dfe4ec] bg-white px-3.5 text-xs font-semibold text-[#0b1838] placeholder:text-slate-400";
const emptyItem = (): ItemDraft => ({ product_name: "", sku: "", unit: "buc.", quantity: "1", unit_price: "", vat_rate: "20" });

function today() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function numberValue(value: string) {
  return Number(value.replace(",", "."));
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("ro-MD", { style: "currency", currency, minimumFractionDigits: 2 }).format(Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ro-MD", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function InvoiceRegisters({ invoices, items, baseCurrency, loadError }: Props) {
  const router = useRouter();
  const [direction, setDirection] = useState<Direction>("purchase");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(today());
  const [counterpartyName, setCounterpartyName] = useState("");
  const [counterpartyTaxId, setCounterpartyTaxId] = useState("");
  const [currency, setCurrency] = useState(baseCurrency);
  const [draftItems, setDraftItems] = useState<ItemDraft[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const itemsByInvoice = useMemo(() => {
    const result = new Map<string, InvoiceItem[]>();
    items.forEach((item) => result.set(item.invoice_id, [...(result.get(item.invoice_id) ?? []), item]));
    return result;
  }, [items]);

  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("ro");
    return invoices.filter((invoice) => invoice.direction === direction && (!term || [invoice.invoice_number, invoice.counterparty_name, invoice.counterparty_tax_id, ...(itemsByInvoice.get(invoice.id) ?? []).flatMap((item) => [item.product_name, item.sku])].join(" ").toLocaleLowerCase("ro").includes(term)));
  }, [direction, invoices, itemsByInvoice, search]);

  const totals = visible.reduce((result, invoice) => ({ subtotal: result.subtotal + Number(invoice.subtotal), vat: result.vat + Number(invoice.vat_amount), total: result.total + Number(invoice.total_amount) }), { subtotal: 0, vat: 0, total: 0 });

  function openCreate() {
    setInvoiceNumber("");
    setIssueDate(today());
    setCounterpartyName("");
    setCounterpartyTaxId("");
    setCurrency(baseCurrency);
    setDraftItems([emptyItem()]);
    setFormError("");
    setModalOpen(true);
  }

  function updateItem(index: number, field: keyof ItemDraft, value: string) {
    setDraftItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }

  async function saveInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedItems = draftItems.map((item) => ({ product_name: item.product_name.trim(), sku: item.sku.trim(), unit: item.unit.trim() || "buc.", quantity: numberValue(item.quantity), unit_price: numberValue(item.unit_price), vat_rate: numberValue(item.vat_rate) }));
    if (!invoiceNumber.trim() || !counterpartyName.trim() || !issueDate) return setFormError("Completați datele obligatorii ale facturii.");
    if (normalizedItems.some((item) => !item.product_name || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unit_price) || item.unit_price < 0 || !Number.isFinite(item.vat_rate) || item.vat_rate < 0)) return setFormError("Verificați produsele, cantitățile, prețurile și cotele TVA.");

    setSaving(true);
    setFormError("");
    const { error } = await createClient().rpc("create_invoice", { p_direction: direction, p_invoice_number: invoiceNumber.trim(), p_issue_date: issueDate, p_counterparty_name: counterpartyName.trim(), p_counterparty_tax_id: counterpartyTaxId.trim(), p_currency: currency, p_items: normalizedItems as unknown as Json });
    if (error) {
      setFormError(error.code === "23505" ? "Există deja o factură cu acest număr în registrul selectat." : "Factura nu a putut fi salvată. Verificați datele și încercați din nou.");
      setSaving(false);
      return;
    }
    setSaving(false);
    setModalOpen(false);
    router.refresh();
  }

  function exportCsv() {
    const rows: (string | number)[][] = [["Data", "Numărul facturii", direction === "purchase" ? "Furnizor" : "Client", "IDNO", "Valoare fără TVA", "TVA", "Total", "Moneda"]];
    visible.forEach((invoice) => rows.push([invoice.issue_date, invoice.invoice_number, invoice.counterparty_name, invoice.counterparty_tax_id ?? "", Number(invoice.subtotal).toFixed(2), Number(invoice.vat_amount).toFixed(2), Number(invoice.total_amount).toFixed(2), invoice.currency]));
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${direction === "purchase" ? "registru-procurari" : "registru-vanzari"}-${today()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <>
    {loadError && <p role="alert" className="mt-6 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[11px] font-bold text-rose-700">{loadError}</p>}

    <section className="mt-7 grid gap-3 sm:grid-cols-3">
      <Summary label="Valoare fără TVA" value={formatMoney(totals.subtotal, baseCurrency)} />
      <Summary label="TVA" value={formatMoney(totals.vat, baseCurrency)} />
      <Summary label="Total registru" value={formatMoney(totals.total, baseCurrency)} strong />
    </section>

    <div className="card-shadow mt-4 flex flex-col gap-3 rounded-2xl border border-[#e8ebf2] bg-white p-3 lg:flex-row lg:items-center">
      <div className="flex flex-1 gap-1">
        <button onClick={() => setDirection("purchase")} className={`focus-ring flex h-10 items-center gap-2 rounded-xl px-4 text-[11px] font-extrabold ${direction === "purchase" ? "bg-[#0b1838] text-white" : "text-slate-500 hover:bg-slate-50"}`}><FileInput className="h-4 w-4" />Registrul de procurări</button>
        <button onClick={() => setDirection("sale")} className={`focus-ring flex h-10 items-center gap-2 rounded-xl px-4 text-[11px] font-extrabold ${direction === "sale" ? "bg-[#0b1838] text-white" : "text-slate-500 hover:bg-slate-50"}`}><FileOutput className="h-4 w-4" />Registrul de vânzări</button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row"><div className="relative sm:w-[260px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Caută facturi, parteneri..." className="focus-ring h-10 w-full rounded-xl border border-[#e5e9f0] bg-[#fafbfc] pl-9 pr-3 text-[11px] font-medium text-[#0b1838]" /></div><button onClick={exportCsv} disabled={!visible.length} className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dfe4ec] px-4 text-[10px] font-extrabold text-slate-600 disabled:opacity-40"><Download className="h-4 w-4" />Exportă CSV</button><button onClick={openCreate} className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0b1838] px-4 text-[10px] font-extrabold text-white"><Plus className="h-4 w-4" />{direction === "purchase" ? "Factură primită" : "Factură emisă"}</button></div>
    </div>

    <section className="card-shadow mt-4 overflow-hidden rounded-2xl border border-[#e8ebf2] bg-white">
      {visible.length === 0 ? <div className="grid min-h-[320px] place-items-center px-6 text-center"><div>{direction === "purchase" ? <FileInput className="mx-auto h-10 w-10 text-slate-300" /> : <FileOutput className="mx-auto h-10 w-10 text-slate-300" />}<h2 className="mt-4 text-sm font-extrabold text-[#0b1838]">{direction === "purchase" ? "Registrul de procurări este gol" : "Registrul de vânzări este gol"}</h2><p className="mt-2 text-[11px] text-slate-400">Adăugați prima factură pentru a forma automat registrul.</p><button onClick={openCreate} className="focus-ring mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#0b1838] px-4 text-[10px] font-extrabold text-white"><Plus className="h-4 w-4" />Adaugă factura</button></div></div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-[#e9ecf2] bg-[#fbfcfd] text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400"><th className="px-5 py-4">Data / Factura</th><th className="px-3 py-4">{direction === "purchase" ? "Furnizor" : "Client"}</th><th className="px-3 py-4">Produse</th><th className="px-3 py-4 text-right">Fără TVA</th><th className="px-3 py-4 text-right">TVA</th><th className="px-5 py-4 text-right">Total</th></tr></thead><tbody className="divide-y divide-[#eef0f5]">{visible.map((invoice) => <tr key={invoice.id} className="hover:bg-slate-50/60"><td className="px-5 py-4"><span className="block text-[11px] font-extrabold text-[#0b1838]">{formatDate(invoice.issue_date)}</span><span className="mt-1 block font-mono text-[9px] font-bold text-[#0787ad]">{invoice.invoice_number}</span></td><td className="px-3 py-4"><b className="block text-[11px] text-slate-700">{invoice.counterparty_name}</b><span className="mt-1 block text-[9px] font-semibold text-slate-400">{invoice.counterparty_tax_id || "IDNO necompletat"}</span></td><td className="max-w-[270px] px-3 py-4"><span className="block truncate text-[10px] font-bold text-slate-600" title={(itemsByInvoice.get(invoice.id) ?? []).map((item) => item.product_name).join(", ")}>{(itemsByInvoice.get(invoice.id) ?? []).map((item) => item.product_name).join(", ") || "—"}</span><span className="mt-1 block text-[9px] text-slate-400">{(itemsByInvoice.get(invoice.id) ?? []).length} poziții</span></td><td className="px-3 py-4 text-right text-[11px] font-bold text-slate-600">{formatMoney(invoice.subtotal, invoice.currency)}</td><td className="px-3 py-4 text-right text-[11px] font-bold text-slate-600">{formatMoney(invoice.vat_amount, invoice.currency)}</td><td className="px-5 py-4 text-right text-[11px] font-extrabold text-[#0b1838]">{formatMoney(invoice.total_amount, invoice.currency)}</td></tr>)}</tbody></table></div>}
      <div className="border-t border-[#eef0f5] px-5 py-3.5 text-[10px] font-semibold text-slate-400">{visible.length} {visible.length === 1 ? "factură" : "facturi"}</div>
    </section>

    {modalOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b1838]/45 p-4 backdrop-blur-sm" onMouseDown={(event) => event.currentTarget === event.target && !saving && setModalOpen(false)}><form onSubmit={saveInvoice} className="animate-float-in max-h-[calc(100vh-2rem)] w-full max-w-[920px] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
      <div className="flex items-start justify-between"><div><h2 className="text-lg font-extrabold text-[#0b1838]">{direction === "purchase" ? "Factură fiscală primită" : "Factură fiscală emisă"}</h2><p className="mt-1 text-[11px] text-slate-400">Factura va apărea automat în {direction === "purchase" ? "registrul de procurări" : "registrul de vânzări"}.</p></div><button type="button" onClick={() => setModalOpen(false)} aria-label="Închide" className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><X className="h-5 w-5" /></button></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Numărul facturii *"><input required value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} className={inputClass} placeholder="Ex.: AAB1234567" /></Field><Field label="Data facturii *"><span className="relative block"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} className={`${inputClass} pl-10`} /></span></Field><Field label="Moneda *"><select value={currency} onChange={(event) => setCurrency(event.target.value)} className={inputClass}><option value="MDL">MDL</option><option value="EUR">EUR</option><option value="USD">USD</option><option value="RON">RON</option></select></Field><Field label={`${direction === "purchase" ? "Furnizor" : "Client"} *`} wide><input required value={counterpartyName} onChange={(event) => setCounterpartyName(event.target.value)} className={inputClass} placeholder="Denumirea partenerului" /></Field><Field label="IDNO / cod fiscal"><input value={counterpartyTaxId} onChange={(event) => setCounterpartyTaxId(event.target.value)} className={inputClass} placeholder="Codul fiscal" /></Field></div>
      <div className="mt-7 flex items-center justify-between"><div><h3 className="text-[13px] font-extrabold text-[#0b1838]">Produse și servicii</h3><p className="mt-1 text-[9px] text-slate-400">Prețul unitar se introduce fără TVA.</p></div><button type="button" onClick={() => setDraftItems((current) => [...current, emptyItem()])} className="focus-ring inline-flex h-9 items-center gap-2 rounded-xl border border-[#dfe4ec] px-3 text-[9px] font-extrabold text-slate-600"><Plus className="h-3.5 w-3.5" />Adaugă poziție</button></div>
      <div className="mt-3 space-y-3">{draftItems.map((item, index) => { const subtotal = Math.max(0, numberValue(item.quantity) || 0) * Math.max(0, numberValue(item.unit_price) || 0); const total = subtotal * (1 + Math.max(0, numberValue(item.vat_rate) || 0) / 100); return <div key={index} className="grid gap-3 rounded-2xl border border-[#e8ebf2] bg-[#fbfcfd] p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_0.7fr_0.7fr_1fr_0.7fr_1fr_auto] lg:items-end"><Field label="Produs / serviciu *"><input required value={item.product_name} onChange={(event) => updateItem(index, "product_name", event.target.value)} className={inputClass} /></Field><Field label="Cod produs"><input value={item.sku} onChange={(event) => updateItem(index, "sku", event.target.value)} className={inputClass} /></Field><Field label="Unitate"><input value={item.unit} onChange={(event) => updateItem(index, "unit", event.target.value)} className={inputClass} /></Field><Field label="Cantitate *"><input required inputMode="decimal" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} className={inputClass} /></Field><Field label="Preț fără TVA *"><input required inputMode="decimal" value={item.unit_price} onChange={(event) => updateItem(index, "unit_price", event.target.value)} className={inputClass} /></Field><Field label="TVA %"><input required inputMode="decimal" value={item.vat_rate} onChange={(event) => updateItem(index, "vat_rate", event.target.value)} className={inputClass} /></Field><div><span className="mb-2 block text-[9px] font-extrabold text-slate-500">Total</span><span className="flex h-11 items-center text-[11px] font-extrabold text-[#0b1838]">{formatMoney(total, currency)}</span></div><button type="button" disabled={draftItems.length === 1} onClick={() => setDraftItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label="Șterge poziția" className="focus-ring grid h-11 w-11 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-20"><Trash2 className="h-4 w-4" /></button></div>; })}</div>
      {formError && <p role="alert" className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[10px] font-bold text-rose-700">{formError}</p>}
      <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="focus-ring h-10 rounded-xl border border-[#dfe4ec] px-5 text-[10px] font-extrabold text-slate-600">Anulează</button><button disabled={saving} className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl bg-[#0b1838] px-5 text-[10px] font-extrabold text-white disabled:opacity-40">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{saving ? "Se salvează..." : "Salvează factura"}</button></div>
    </form></div>}
  </>;
}

function Summary({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <article className="card-shadow rounded-2xl border border-[#e8ebf2] bg-white p-5"><p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">{label}</p><p className={`mt-2 text-xl font-extrabold ${strong ? "text-[#0787ad]" : "text-[#0b1838]"}`}>{value}</p></article>;
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`block ${wide ? "lg:col-span-2" : ""}`}><span className="mb-2 block text-[9px] font-extrabold text-slate-500">{label}</span>{children}</label>;
}
