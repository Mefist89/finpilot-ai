"use client";

import { ArrowLeft, Building2, CheckCircle2, LoaderCircle, Pencil, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { createClient } from "@/utils/supabase/client";

type CompanyValues = {
  companyName: string;
  idno: string;
  vatCode: string;
  baseCurrency: string;
  fiscalYearStart: number;
};

type CompanyProfileFormProps = {
  userId: string;
  initialValues: CompanyValues;
};

const months = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];

export function CompanyProfileForm({ userId, initialValues }: CompanyProfileFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [savedValues, setSavedValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(!initialValues.companyName.trim());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isDirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(savedValues), [values, savedValues]);

  function updateValue<Key extends keyof CompanyValues>(key: Key, value: CompanyValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
    setMessage("");
    setError("");
  }

  async function saveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const companyName = values.companyName.trim();

    if (companyName.length < 2 || companyName.length > 160) {
      setError("Denumirea companiei trebuie să conțină între 2 și 160 de caractere.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const normalized = {
      ...values,
      companyName,
      idno: values.idno.trim(),
      vatCode: values.vatCode.trim(),
      baseCurrency: values.baseCurrency.toUpperCase(),
    };
    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("profiles")
      .update({
        company_name: normalized.companyName,
        idno: normalized.idno || null,
        vat_code: normalized.vatCode || null,
        base_currency: normalized.baseCurrency,
        fiscal_year_start: normalized.fiscalYearStart,
      })
      .eq("id", userId);

    if (saveError) {
      setError("Profilul companiei nu a putut fi salvat. Încercați din nou.");
    } else {
      setValues(normalized);
      setSavedValues(normalized);
      setMessage("Profilul companiei a fost salvat cu succes.");
      setEditing(false);
      router.refresh();
    }

    setSaving(false);
  }

  const inputClass = "focus-ring h-11 w-full rounded-xl border border-[#dfe4ec] bg-white px-3.5 text-xs font-semibold text-[#0b1838] placeholder:text-slate-400";

  function cancelEditing() {
    setValues(savedValues);
    setError("");
    setMessage("");
    setEditing(false);
  }

  if (!editing) {
    const details = [
      { label: "Denumirea juridică a companiei", value: savedValues.companyName },
      { label: "IDNO", value: savedValues.idno || "Necompletat" },
      { label: "Cod TVA", value: savedValues.vatCode || "Necompletat" },
      { label: "Moneda de bază", value: savedValues.baseCurrency },
      { label: "Începutul exercițiului financiar", value: months[savedValues.fiscalYearStart - 1] ?? "Ianuarie" },
    ];

    return (
      <section className="card-shadow mt-7 overflow-hidden rounded-2xl border border-[#e8ebf2] bg-white">
        <div className="flex items-center justify-between border-b border-[#eef0f5] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-[13px] font-extrabold text-[#0b1838]">Datele companiei</h2>
            <p className="mt-1 text-[9px] font-medium text-slate-400">Informații juridice și contabile salvate pentru această companie</p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef8fb] text-[#0a8fb7]"><Building2 className="h-[18px] w-[18px]" /></span>
        </div>

        {message && <p role="status" className="mx-5 mt-5 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[10px] font-bold text-emerald-700 sm:mx-6"><CheckCircle2 className="h-4 w-4" />{message}</p>}

        <div className="grid gap-x-10 gap-y-7 px-5 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          {details.map((detail, index) => (
            <div key={detail.label} className={index === 0 ? "sm:col-span-2 lg:col-span-3" : ""}>
              <span className="block text-[8px] font-extrabold uppercase tracking-[0.12em] text-slate-400">{detail.label}</span>
              <span className={`mt-2 block break-words text-[12px] font-extrabold leading-5 ${detail.value === "Necompletat" ? "text-slate-400" : "text-[#0b1838]"}`}>{detail.value}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f5] bg-[#fbfcfd] px-5 py-4 sm:px-6">
          <Link href="/settings" className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl px-2 text-xs font-bold text-slate-500 hover:text-[#0b1838]"><ArrowLeft className="h-4 w-4" />Înapoi la setări</Link>
          <button type="button" onClick={() => { setEditing(true); setMessage(""); }} className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe4ec] bg-white px-4 text-xs font-extrabold text-[#0b1838] hover:bg-slate-50"><Pencil className="h-4 w-4" />Modifică datele companiei</button>
        </div>
      </section>
    );
  }

  return (
    <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <form onSubmit={saveCompany} className="card-shadow overflow-hidden rounded-2xl border border-[#e8ebf2] bg-white">
        <div className="border-b border-[#eef0f5] px-5 py-4 sm:px-6">
          <h2 className="text-[13px] font-extrabold text-[#0b1838]">Date juridice și contabile</h2>
          <p className="mt-1 text-[10px] font-medium text-slate-400">Câmpurile marcate cu * sunt obligatorii.</p>
        </div>

        <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-6">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-[11px] font-extrabold text-[#0b1838]">Denumirea juridică a companiei *</span>
            <input required maxLength={160} value={values.companyName} onChange={(event) => updateValue("companyName", event.target.value)} className={inputClass} placeholder="Exemplu SRL" />
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-extrabold text-[#0b1838]">IDNO</span>
            <input maxLength={30} value={values.idno} onChange={(event) => updateValue("idno", event.target.value)} className={inputClass} placeholder="1000000000000" />
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-extrabold text-[#0b1838]">Cod TVA</span>
            <input maxLength={30} value={values.vatCode} onChange={(event) => updateValue("vatCode", event.target.value)} className={inputClass} placeholder="Cod de înregistrare TVA" />
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-extrabold text-[#0b1838]">Moneda de bază *</span>
            <select value={values.baseCurrency} onChange={(event) => updateValue("baseCurrency", event.target.value)} className={inputClass}>
              <option value="MDL">MDL — Leu moldovenesc</option>
              <option value="EUR">EUR — Euro</option>
              <option value="USD">USD — Dolar american</option>
              <option value="RON">RON — Leu românesc</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-extrabold text-[#0b1838]">Începutul exercițiului financiar *</span>
            <select value={values.fiscalYearStart} onChange={(event) => updateValue("fiscalYearStart", Number(event.target.value))} className={inputClass}>
              {months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
            </select>
          </label>

          {error && <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[10px] font-bold text-rose-700 sm:col-span-2">{error}</p>}
          {message && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[10px] font-bold text-emerald-700 sm:col-span-2"><CheckCircle2 className="h-4 w-4" />{message}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#eef0f5] bg-[#fbfcfd] px-5 py-4 sm:px-6">
          <button type="button" onClick={cancelEditing} className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl px-2 text-xs font-bold text-slate-500 hover:text-[#0b1838]"><X className="h-4 w-4" />Anulează</button>
          <button disabled={saving || !isDirty} className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl bg-[#0b1838] px-5 text-xs font-extrabold text-white hover:bg-[#142754] disabled:cursor-not-allowed disabled:opacity-40">
            {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? "Se salvează..." : "Salvează compania"}
          </button>
        </div>
      </form>

      <aside className="card-shadow h-fit rounded-2xl border border-[#e8ebf2] bg-white p-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef8fb] text-[#0a8fb7]"><Building2 className="h-5 w-5" /></span>
        <h2 className="mt-4 text-sm font-extrabold text-[#0b1838]">Profilul companiei</h2>
        <p className="mt-2 text-[10px] leading-5 text-slate-500">Aceste date sunt păstrate în siguranță și utilizate în documente, rapoarte și registre contabile.</p>
      </aside>
    </div>
  );
}
