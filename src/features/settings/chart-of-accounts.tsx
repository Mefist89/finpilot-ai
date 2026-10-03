"use client";

import { ArrowLeft, Check, Landmark, LoaderCircle, Pencil, Plus, Power, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import type { Enums } from "@/types/database";
import { createClient } from "@/utils/supabase/client";

type AccountType = Enums<"account_type">;
type Account = {
  id: string;
  code: string;
  name: string;
  account_type: AccountType;
  is_active: boolean;
};

type ChartOfAccountsProps = {
  userId: string;
  initialAccounts: Account[];
};

const accountTypes: { value: AccountType; label: string }[] = [
  { value: "asset", label: "Active" },
  { value: "liability", label: "Datorii" },
  { value: "equity", label: "Capital propriu" },
  { value: "revenue", label: "Venituri" },
  { value: "expense", label: "Cheltuieli" },
  { value: "off_balance", label: "Extrabalanțiere" },
];

const inputClass = "focus-ring h-10 w-full rounded-xl border border-[#dfe4ec] bg-white px-3.5 text-xs font-semibold text-[#0b1838] placeholder:text-slate-400";

export function ChartOfAccounts({ userId, initialAccounts }: ChartOfAccountsProps) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("asset");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<AccountType>("asset");
  const [error, setError] = useState("");

  async function addAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = code.trim();
    const normalizedName = name.trim();

    if (!normalizedCode || !normalizedName) {
      setError("Completați codul și denumirea contului.");
      return;
    }

    setAdding(true);
    setError("");
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("accounts")
      .insert({ user_id: userId, code: normalizedCode, name: normalizedName, account_type: type })
      .select("id,code,name,account_type,is_active")
      .single();

    if (insertError) {
      setError(insertError.code === "23505" ? "Există deja un cont cu acest cod." : "Contul nu a putut fi adăugat. Încercați din nou.");
    } else {
      setAccounts((current) => [...current, data].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })));
      setCode("");
      setName("");
      setType("asset");
    }
    setAdding(false);
  }

  function beginEdit(account: Account) {
    setEditingId(account.id);
    setEditCode(account.code);
    setEditName(account.name);
    setEditType(account.account_type);
    setError("");
  }

  async function saveEdit(account: Account) {
    if (!editCode.trim() || !editName.trim()) {
      setError("Completați codul și denumirea contului.");
      return;
    }

    setPendingId(account.id);
    setError("");
    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("accounts")
      .update({ code: editCode.trim(), name: editName.trim(), account_type: editType })
      .eq("id", account.id)
      .select("id,code,name,account_type,is_active")
      .single();

    if (updateError) {
      setError(updateError.code === "23505" ? "Există deja un cont cu acest cod." : "Contul nu a putut fi actualizat.");
    } else {
      setAccounts((current) => current.map((item) => item.id === data.id ? data : item).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })));
      setEditingId(null);
    }
    setPendingId(null);
  }

  async function toggleAccount(account: Account) {
    setPendingId(account.id);
    setError("");
    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .from("accounts")
      .update({ is_active: !account.is_active })
      .eq("id", account.id)
      .select("id,code,name,account_type,is_active")
      .single();

    if (updateError) {
      setError("Statutul contului nu a putut fi modificat.");
    } else {
      setAccounts((current) => current.map((item) => item.id === data.id ? data : item));
    }
    setPendingId(null);
  }

  return (
    <div className="mt-7 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <form onSubmit={addAccount} className="card-shadow h-fit overflow-hidden rounded-2xl border border-[#e8ebf2] bg-white">
        <div className="border-b border-[#eef0f5] px-5 py-4"><h2 className="text-[13px] font-extrabold text-[#0b1838]">Adaugă un cont</h2></div>
        <div className="space-y-4 p-5">
          <label className="block"><span className="mb-2 block text-[11px] font-extrabold text-[#0b1838]">Codul contului</span><input required maxLength={30} value={code} onChange={(event) => setCode(event.target.value)} className={inputClass} placeholder="Ex.: 241" /></label>
          <label className="block"><span className="mb-2 block text-[11px] font-extrabold text-[#0b1838]">Denumirea contului</span><input required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="Ex.: Casa" /></label>
          <label className="block"><span className="mb-2 block text-[11px] font-extrabold text-[#0b1838]">Clasa contabilă</span><select value={type} onChange={(event) => setType(event.target.value as AccountType)} className={inputClass}>{accountTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <button disabled={adding} className="focus-ring flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0b1838] text-xs font-extrabold text-white hover:bg-[#142754] disabled:opacity-40">{adding ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{adding ? "Se adaugă..." : "Adaugă contul"}</button>
          <Link href="/settings" className="focus-ring flex h-9 items-center justify-center gap-2 rounded-xl text-[10px] font-bold text-slate-500 hover:text-[#0b1838]"><ArrowLeft className="h-4 w-4" />Înapoi la setări</Link>
        </div>
      </form>

      <section className="card-shadow overflow-hidden rounded-2xl border border-[#e8ebf2] bg-white">
        <div className="flex items-center justify-between border-b border-[#eef0f5] px-5 py-4">
          <div><h2 className="text-[13px] font-extrabold text-[#0b1838]">Conturi contabile</h2><p className="mt-1 text-[9px] font-medium text-slate-400">{accounts.length} {accounts.length === 1 ? "cont" : "conturi"} în planul de conturi</p></div>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef8fb] text-[#0a8fb7]"><Landmark className="h-[18px] w-[18px]" /></span>
        </div>

        {error && <p role="alert" className="m-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[10px] font-bold text-rose-700">{error}</p>}

        {accounts.length === 0 ? (
          <div className="grid min-h-56 place-items-center px-6 text-center"><div><Landmark className="mx-auto h-8 w-8 text-slate-300" /><h3 className="mt-3 text-sm font-extrabold text-[#0b1838]">Planul de conturi este gol</h3><p className="mt-2 text-[10px] text-slate-400">Adăugați primul cont contabil utilizând formularul.</p></div></div>
        ) : (
          <div>
            <div className="hidden grid-cols-[minmax(130px,1fr)_minmax(150px,1.5fr)_105px_75px_180px] gap-4 border-b border-[#e8ebf2] bg-[#f8fafc] px-5 py-3 text-[8px] font-extrabold uppercase tracking-[0.12em] text-slate-400 md:grid">
              <span>Codul contului</span>
              <span>Denumirea contului</span>
              <span>Clasa</span>
              <span>Statut</span>
              <span>Acțiuni</span>
            </div>
            <div className="divide-y divide-[#f0f2f6]">
            {accounts.map((account) => editingId === account.id ? (
              <div key={account.id} className="grid gap-4 bg-[#f8fafc] p-5 md:grid-cols-[minmax(130px,1fr)_minmax(150px,1.5fr)_105px_75px_180px] md:items-center">
                <label><span className="mb-1.5 block text-[8px] font-extrabold uppercase tracking-[0.1em] text-slate-400 md:hidden">Codul contului</span><input value={editCode} onChange={(event) => setEditCode(event.target.value)} className={inputClass} aria-label="Codul contului" /></label>
                <label><span className="mb-1.5 block text-[8px] font-extrabold uppercase tracking-[0.1em] text-slate-400 md:hidden">Denumirea contului</span><input value={editName} onChange={(event) => setEditName(event.target.value)} className={inputClass} aria-label="Denumirea contului" /></label>
                <label><span className="mb-1.5 block text-[8px] font-extrabold uppercase tracking-[0.1em] text-slate-400 md:hidden">Clasa</span><select value={editType} onChange={(event) => setEditType(event.target.value as AccountType)} className={inputClass} aria-label="Clasa contabilă">{accountTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <span className={`w-fit rounded-full px-2.5 py-1 text-[8px] font-extrabold ${account.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-200 text-slate-500"}`}>{account.is_active ? "Activ" : "Inactiv"}</span>
                <div className="flex flex-wrap gap-2"><button type="button" onClick={() => saveEdit(account)} disabled={pendingId === account.id} className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[9px] font-extrabold text-white hover:bg-emerald-700 disabled:opacity-40">{pendingId === account.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Salvează</button><button type="button" onClick={() => setEditingId(null)} className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[9px] font-extrabold text-slate-500 hover:bg-slate-50"><X className="h-3.5 w-3.5" />Anulează</button></div>
              </div>
            ) : (
              <div key={account.id} className={`grid gap-4 px-5 py-5 md:grid-cols-[minmax(130px,1fr)_minmax(150px,1.5fr)_105px_75px_180px] md:items-center ${account.is_active ? "" : "bg-slate-50/60"}`}>
                <div className="min-w-0"><span className="mb-1 block text-[8px] font-extrabold uppercase tracking-[0.1em] text-slate-400 md:hidden">Codul contului</span><span className="block break-all font-mono text-[11px] font-extrabold leading-5 text-[#0787ad]">{account.code}</span></div>
                <div className="min-w-0"><span className="mb-1 block text-[8px] font-extrabold uppercase tracking-[0.1em] text-slate-400 md:hidden">Denumirea contului</span><b className="block break-words text-[11px] leading-5 text-[#0b1838]">{account.name}</b></div>
                <div><span className="mb-1 block text-[8px] font-extrabold uppercase tracking-[0.1em] text-slate-400 md:hidden">Clasa</span><span className="inline-flex rounded-lg bg-[#eef8fb] px-2.5 py-1.5 text-[9px] font-bold text-[#07799e]">{accountTypes.find((item) => item.value === account.account_type)?.label}</span></div>
                <div><span className="mb-1 block text-[8px] font-extrabold uppercase tracking-[0.1em] text-slate-400 md:hidden">Statut</span><span className={`inline-flex rounded-full px-2.5 py-1 text-[8px] font-extrabold ${account.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-200 text-slate-500"}`}>{account.is_active ? "Activ" : "Inactiv"}</span></div>
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3 md:border-0 md:pt-0">
                  <button type="button" onClick={() => beginEdit(account)} className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[9px] font-extrabold text-slate-600 hover:border-slate-300 hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" />Modifică</button>
                  <button type="button" onClick={() => toggleAccount(account)} disabled={pendingId === account.id} className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[9px] font-extrabold text-slate-600 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40">{pendingId === account.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}{account.is_active ? "Dezactivează" : "Activează"}</button>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
