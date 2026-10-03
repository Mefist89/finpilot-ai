"use client";

import { ArrowDownToLine, ArrowUpFromLine, CalendarDays, Download, FileText, Landmark, LoaderCircle, Plus, ReceiptText, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import type { Enums } from "@/types/database";
import { createClient } from "@/utils/supabase/client";

type Account = { id: string; code: string; name: string; account_type: Enums<"account_type">; is_active: boolean };
type Document = { id: string; original_filename: string; document_number: string | null; issue_date: string | null; status: Enums<"document_status"> };
type Entry = { id: string; entry_number: number; entry_date: string; description: string; status: Enums<"entry_status">; source_document_id: string | null; created_at: string };
type Line = { id: string; entry_id: string; account_id: string; line_number: number; debit: number; credit: number; currency: string };
type Props = { accounts: Account[]; documents: Document[]; entries: Entry[]; lines: Line[]; baseCurrency: string; loadError: string };

const statusLabels: Record<Entry["status"], string> = { draft: "Ciornă", approved: "Aprobată", posted: "Contabilizată", voided: "Anulată" };
const statusClasses: Record<Entry["status"], string> = { draft: "bg-amber-50 text-amber-700", approved: "bg-sky-50 text-sky-700", posted: "bg-emerald-50 text-emerald-700", voided: "bg-slate-100 text-slate-500" };
const filters = ["all", "draft", "approved", "posted", "voided"] as const;
type Filter = (typeof filters)[number];
const inputClass = "focus-ring h-11 w-full rounded-xl border border-[#dfe4ec] bg-white px-3.5 text-xs font-semibold text-[#0b1838] placeholder:text-slate-400";

function today() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("ro-MD", { style: "currency", currency, minimumFractionDigits: 2 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ro-MD", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function OperationJournal({ accounts, documents, entries, lines, baseCurrency, loadError }: Props) {
  const router = useRouter();
  const activeAccounts = accounts.filter((account) => account.is_active);
  const accountMap = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts]);
  const documentMap = useMemo(() => new Map(documents.map((document) => [document.id, document])), [documents]);
  const linesByEntry = useMemo(() => {
    const result = new Map<string, Line[]>();
    lines.forEach((line) => result.set(line.entry_id, [...(result.get(line.entry_id) ?? []), line]));
    return result;
  }, [lines]);

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [entryDate, setEntryDate] = useState(today());
  const [description, setDescription] = useState("");
  const [debitAccountId, setDebitAccountId] = useState("");
  const [creditAccountId, setCreditAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [sourceDocumentId, setSourceDocumentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const visibleEntries = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("ro");
    return entries.filter((entry) => {
      if (filter !== "all" && entry.status !== filter) return false;
      if (!normalizedSearch) return true;
      const source = entry.source_document_id ? documentMap.get(entry.source_document_id) : undefined;
      const haystack = [entry.entry_number, entry.description, source?.original_filename, source?.document_number, ...(linesByEntry.get(entry.id) ?? []).flatMap((line) => {
        const account = accountMap.get(line.account_id);
        return [account?.code, account?.name];
      })].join(" ").toLocaleLowerCase("ro");
      return haystack.includes(normalizedSearch);
    });
  }, [accountMap, documentMap, entries, filter, linesByEntry, search]);

  const visibleLines = visibleEntries.flatMap((entry) => linesByEntry.get(entry.id) ?? []);
  const totalDebit = visibleLines.reduce((sum, line) => sum + Number(line.debit), 0);
  const totalCredit = visibleLines.reduce((sum, line) => sum + Number(line.credit), 0);
  const difference = totalDebit - totalCredit;

  function openCreateForm() {
    if (activeAccounts.length < 2) return;
    const firstAccountId = activeAccounts[0]?.id ?? "";
    setDebitAccountId(firstAccountId);
    setCreditAccountId(activeAccounts.find((account) => account.id !== firstAccountId)?.id ?? "");
    setFormError("");
    setModalOpen(true);
  }

  async function createEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericAmount = Number(amount.replace(",", "."));
    if (!description.trim() || !entryDate || !debitAccountId || !creditAccountId) return setFormError("Completați toate câmpurile obligatorii.");
    if (debitAccountId === creditAccountId) return setFormError("Contul debitat și contul creditat trebuie să fie diferite.");
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setFormError("Introduceți o sumă mai mare decât zero.");

    setSaving(true);
    setFormError("");
    const { error } = await createClient().rpc("create_journal_entry", {
      p_entry_date: entryDate,
      p_description: description.trim(),
      p_debit_account_id: debitAccountId,
      p_credit_account_id: creditAccountId,
      p_amount: numericAmount,
      p_currency: baseCurrency,
      p_source_document_id: sourceDocumentId || null,
    });
    if (error) {
      setFormError("Înregistrarea nu a putut fi salvată. Verificați datele și încercați din nou.");
      setSaving(false);
      return;
    }
    setDescription("");
    setAmount("");
    setSourceDocumentId("");
    setModalOpen(false);
    setSaving(false);
    router.refresh();
  }

  function exportCsv() {
    const rows = [["Data", "Nr.", "Descriere", "Cont", "Denumire cont", "Debit", "Credit", "Moneda", "Statut", "Document"]];
    visibleEntries.forEach((entry) => {
      const source = entry.source_document_id ? documentMap.get(entry.source_document_id) : undefined;
      (linesByEntry.get(entry.id) ?? []).forEach((line) => {
        const account = accountMap.get(line.account_id);
        rows.push([entry.entry_date, String(entry.entry_number), entry.description, account?.code ?? "", account?.name ?? "", Number(line.debit).toFixed(2), Number(line.credit).toFixed(2), line.currency, statusLabels[entry.status], source?.original_filename ?? ""]);
      });
    });
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `jurnal-operatiuni-${today()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <>
    {loadError && <p role="alert" className="mt-6 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[11px] font-bold text-rose-700">{loadError}</p>}

    <section className="mt-7 grid gap-3 sm:grid-cols-3">
      <SummaryCard label="Total debit" value={formatMoney(totalDebit, baseCurrency)} hint={`${visibleLines.filter((line) => Number(line.debit) > 0).length} linii debitoare`} icon={<ArrowDownToLine className="h-4 w-4 text-[#0a91b8]" />} />
      <SummaryCard label="Total credit" value={formatMoney(totalCredit, baseCurrency)} hint={`${visibleLines.filter((line) => Number(line.credit) > 0).length} linii creditoare`} icon={<ArrowUpFromLine className="h-4 w-4 text-violet-500" />} />
      <SummaryCard label="Control balanță" value={formatMoney(Math.abs(difference), baseCurrency)} hint={Math.abs(difference) < 0.005 ? "Debitul este egal cu creditul" : "Există o diferență de verificat"} icon={<Landmark className="h-4 w-4 text-emerald-500" />} valueClass={Math.abs(difference) < 0.005 ? "text-emerald-600" : "text-rose-600"} />
    </section>

    {activeAccounts.length < 2 && <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[11px] font-extrabold text-amber-900">Mai este necesar un cont activ</p><p className="mt-1 text-[10px] font-medium text-amber-700">O operațiune contabilă are nevoie de un cont debitat și unul creditat.</p></div><Link href="/settings/accounts" className="focus-ring inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-amber-900 px-4 text-[10px] font-extrabold text-white hover:bg-amber-800">Deschide planul de conturi</Link></div>}

    <div className="card-shadow mt-4 flex flex-col gap-3 rounded-2xl border border-[#e8ebf2] bg-white p-3 lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-1 lg:pb-0">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`focus-ring whitespace-nowrap rounded-lg px-3.5 py-2 text-[10px] font-bold transition-colors ${filter === item ? "bg-[#0b1838] text-white" : "text-slate-500 hover:bg-slate-50"}`}>{item === "all" ? "Toate" : statusLabels[item]}</button>)}</div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center"><div className="relative min-w-0 flex-1 sm:w-[260px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Caută operațiuni, conturi..." className="focus-ring h-10 w-full rounded-xl border border-[#e5e9f0] bg-[#fafbfc] pl-9 pr-3 text-[11px] font-medium text-[#0b1838] placeholder:text-slate-400" /></div><button onClick={exportCsv} disabled={visibleEntries.length === 0} className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dfe4ec] bg-white px-4 text-[10px] font-extrabold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><Download className="h-4 w-4" />Exportă CSV</button><button onClick={openCreateForm} disabled={activeAccounts.length < 2} className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0b1838] px-4 text-[10px] font-extrabold text-white hover:bg-[#142754] disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-4 w-4" />Operațiune nouă</button></div>
    </div>

    <JournalTable entries={visibleEntries} allEntryCount={entries.length} linesByEntry={linesByEntry} accountMap={accountMap} documentMap={documentMap} activeAccountsCount={activeAccounts.length} onCreate={openCreateForm} />

    {modalOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b1838]/45 p-4 backdrop-blur-sm" onMouseDown={(event) => event.currentTarget === event.target && !saving && setModalOpen(false)}><form onSubmit={createEntry} className="animate-float-in max-h-[calc(100vh-2rem)] w-full max-w-[650px] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-extrabold tracking-tight text-[#0b1838]">Operațiune contabilă nouă</h2><p className="mt-1 text-[11px] font-medium text-slate-400">Înregistrarea se salvează ca ciornă, cu debitul egal cu creditul.</p></div><button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 disabled:opacity-40" aria-label="Închide"><X className="h-5 w-5" /></button></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2"><span className="mb-2 block text-[11px] font-extrabold text-[#0b1838]">Descrierea operațiunii *</span><input required maxLength={300} value={description} onChange={(event) => setDescription(event.target.value)} className={inputClass} placeholder="Ex.: Achitarea facturii furnizorului" /></label>
        <label className="block"><span className="mb-2 block text-[11px] font-extrabold text-[#0b1838]">Data *</span><span className="relative block"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} className={`${inputClass} pl-10`} /></span></label>
        <label className="block"><span className="mb-2 block text-[11px] font-extrabold text-[#0b1838]">Suma ({baseCurrency}) *</span><input required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className={inputClass} placeholder="0,00" /></label>
        <AccountSelect label="Cont debitat *" hint="Unde intră valoarea" value={debitAccountId} onChange={setDebitAccountId} accounts={activeAccounts} />
        <AccountSelect label="Cont creditat *" hint="De unde provine valoarea" value={creditAccountId} onChange={setCreditAccountId} accounts={activeAccounts} />
        <label className="block sm:col-span-2"><span className="mb-2 block text-[11px] font-extrabold text-[#0b1838]">Document-sursă <span className="font-medium text-slate-400">(opțional)</span></span><select value={sourceDocumentId} onChange={(event) => setSourceDocumentId(event.target.value)} className={inputClass}><option value="">Fără document asociat</option>{documents.map((document) => <option key={document.id} value={document.id}>{document.document_number ? `${document.document_number} — ` : ""}{document.original_filename}</option>)}</select></label>
      </div>
      <div className="mt-5 rounded-2xl bg-[#f4fbfd] px-4 py-3 text-[10px] font-semibold leading-5 text-[#087a9d]">Sistemul va crea automat două linii egale: una în debit și una în credit. Astfel, jurnalul rămâne echilibrat.</div>
      {formError && <p role="alert" className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[10px] font-bold text-rose-700">{formError}</p>}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="focus-ring h-10 rounded-xl border border-[#dfe4ec] px-5 text-[10px] font-extrabold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Anulează</button><button disabled={saving} className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0b1838] px-5 text-[10px] font-extrabold text-white hover:bg-[#142754] disabled:opacity-40">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{saving ? "Se salvează..." : "Salvează ciorna"}</button></div>
    </form></div>}
  </>;
}

function SummaryCard({ label, value, hint, icon, valueClass = "text-[#0b1838]" }: { label: string; value: string; hint: string; icon: React.ReactNode; valueClass?: string }) {
  return <article className="card-shadow rounded-2xl border border-[#e8ebf2] bg-white p-5"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>{icon}</div><p className={`mt-2 text-xl font-extrabold tracking-[-0.04em] ${valueClass}`}>{value}</p><p className="mt-2 text-[9px] font-bold text-slate-400">{hint}</p></article>;
}

function AccountSelect({ label, hint, value, onChange, accounts }: { label: string; hint: string; value: string; onChange: (value: string) => void; accounts: Account[] }) {
  return <label className="block"><span className="mb-2 block text-[11px] font-extrabold text-[#0b1838]">{label}</span><select required value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.code} — {account.name}</option>)}</select><span className="mt-1.5 block text-[9px] font-semibold text-slate-400">{hint}</span></label>;
}

function JournalTable({ entries, allEntryCount, linesByEntry, accountMap, documentMap, activeAccountsCount, onCreate }: { entries: Entry[]; allEntryCount: number; linesByEntry: Map<string, Line[]>; accountMap: Map<string, Account>; documentMap: Map<string, Document>; activeAccountsCount: number; onCreate: () => void }) {
  const visibleLineCount = entries.reduce((sum, entry) => sum + (linesByEntry.get(entry.id)?.length ?? 0), 0);
  return <section className="card-shadow mt-4 overflow-hidden rounded-2xl border border-[#e8ebf2] bg-white">
    {entries.length === 0 ? <div className="grid min-h-[330px] place-items-center px-6 text-center"><div><ReceiptText className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 text-sm font-extrabold text-[#0b1838]">{allEntryCount === 0 ? "Jurnalul este gol" : "Nu există rezultate"}</h2><p className="mx-auto mt-2 max-w-md text-[11px] leading-5 text-slate-400">{allEntryCount === 0 ? "Adăugați prima operațiune contabilă. Fiecare înregistrare va avea automat un debit și un credit egale." : "Schimbați filtrul sau termenul de căutare."}</p>{allEntryCount === 0 && activeAccountsCount >= 2 && <button onClick={onCreate} className="focus-ring mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#0b1838] px-4 text-[10px] font-extrabold text-white"><Plus className="h-4 w-4" />Adaugă prima operațiune</button>}</div></div> : <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead><tr className="border-b border-[#e9ecf2] bg-[#fbfcfd] text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400"><th className="px-5 py-4">Data / Nr.</th><th className="px-3 py-4">Descriere</th><th className="px-3 py-4">Cont contabil</th><th className="px-3 py-4 text-right">Debit</th><th className="px-3 py-4 text-right">Credit</th><th className="px-3 py-4">Document</th><th className="px-5 py-4">Statut</th></tr></thead><tbody className="divide-y divide-[#eef0f5]">
      {entries.flatMap((entry) => {
        const source = entry.source_document_id ? documentMap.get(entry.source_document_id) : undefined;
        return (linesByEntry.get(entry.id) ?? []).map((line, index) => {
          const account = accountMap.get(line.account_id);
          const first = index === 0;
          return <tr key={line.id} className={first ? "border-t border-[#dfe4ec]" : "bg-[#fcfdfe]"}><td className="px-5 py-3.5 align-top">{first && <><span className="block text-[11px] font-extrabold text-[#0b1838]">{formatDate(entry.entry_date)}</span><span className="mt-1 block font-mono text-[9px] font-bold text-[#0a8fb7]">OP-{String(entry.entry_number).padStart(5, "0")}</span></>}</td><td className="max-w-[270px] px-3 py-3.5 align-top">{first && <p className="text-[11px] font-bold leading-5 text-slate-700">{entry.description}</p>}</td><td className="px-3 py-3.5 align-top"><span className="block font-mono text-[10px] font-extrabold text-[#0787ad]">{account?.code ?? "—"}</span><span className="mt-1 block max-w-[220px] text-[10px] font-semibold text-slate-500">{account?.name ?? "Cont indisponibil"}</span></td><td className="px-3 py-3.5 text-right align-top text-[11px] font-extrabold text-[#0b1838]">{Number(line.debit) > 0 ? formatMoney(Number(line.debit), line.currency) : "—"}</td><td className="px-3 py-3.5 text-right align-top text-[11px] font-extrabold text-[#0b1838]">{Number(line.credit) > 0 ? formatMoney(Number(line.credit), line.currency) : "—"}</td><td className="max-w-[180px] px-3 py-3.5 align-top">{first && (source ? <span className="flex items-start gap-2 text-[9px] font-bold text-slate-500"><FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="truncate" title={source.original_filename}>{source.document_number || source.original_filename}</span></span> : <span className="text-[9px] font-semibold text-slate-300">Înregistrare manuală</span>)}</td><td className="px-5 py-3.5 align-top">{first && <span className={`inline-flex rounded-full px-2.5 py-1 text-[8px] font-extrabold ${statusClasses[entry.status]}`}>{statusLabels[entry.status]}</span>}</td></tr>;
        });
      })}
    </tbody></table></div>}
    <div className="flex items-center justify-between border-t border-[#eef0f5] px-5 py-3.5 text-[10px] font-semibold text-slate-400"><span>{entries.length} operațiuni</span><span>{visibleLineCount} linii contabile</span></div>
  </section>;
}
