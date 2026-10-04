import Link from "next/link";
import {
  ArrowRight,
  Bot,
  FileCheck2,
  FileText,
  TrendingDown,
  TriangleAlert,
  UploadCloud,
  WalletCards,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import type { Json } from "@/types/database";
import { createClient } from "@/utils/supabase/server";

function jsonRecord(value: Json | undefined): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizedId(value: Json | undefined) {
  return typeof value === "string" ? value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : "";
}

function documentDirection(metadata: Json, companyIds: Set<string>): "purchase" | "sale" | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const supplier = jsonRecord(metadata.supplier);
  const customer = jsonRecord(metadata.customer);
  if ([supplier.tax_id, supplier.vat_code].some((value) => companyIds.has(normalizedId(value)))) return "sale";
  if ([customer.tax_id, customer.vat_code].some((value) => companyIds.has(normalizedId(value)))) return "purchase";
  return metadata.direction === "sale" ? "sale" : metadata.direction === "purchase" ? "purchase" : null;
}

function documentCounterparty(metadata: Json, direction: "purchase" | "sale" | null, fallback: string | null) {
  const root = jsonRecord(metadata);
  const party = jsonRecord(direction === "sale" ? root.customer : root.supplier);
  return typeof party.name === "string" && party.name.trim() ? party.name : fallback || "Partener neidentificat";
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("ro-MD", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + ` ${currency}`;
}

function date(value: string) {
  return new Intl.DateTimeFormat("ro-MD", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
}

const statusLabels: Record<string, string> = { uploaded: "Încărcat", processing: "În procesare", needs_review: "Necesită verificare", ready: "Verificat", posted: "Contabilizat", failed: "Eroare", rejected: "Respins" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data: documents }, { data: userData }] = await Promise.all([
    supabase.from("documents").select("id,original_filename,counterparty_name,issue_date,currency,total_amount,status,metadata,created_at").order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);
  const { data: profile } = userData.user ? await supabase.from("profiles").select("base_currency,idno,vat_code").eq("id", userData.user.id).maybeSingle() : { data: null };
  const baseCurrency = profile?.base_currency || "MDL";
  const companyIds = new Set([profile?.idno, profile?.vat_code].map((value) => normalizedId(value)).filter(Boolean));
  const allDocuments = documents ?? [];
  const validDocuments = allDocuments.filter((document) => !["failed", "rejected"].includes(document.status) && document.currency === baseCurrency);
  const revenue = validDocuments.filter((document) => documentDirection(document.metadata, companyIds) === "sale").reduce((sum, document) => sum + Number(document.total_amount ?? 0), 0);
  const expenses = validDocuments.filter((document) => documentDirection(document.metadata, companyIds) === "purchase").reduce((sum, document) => sum + Number(document.total_amount ?? 0), 0);
  const attention = allDocuments.filter((document) => ["needs_review", "failed"].includes(document.status)).length;
  const verified = allDocuments.filter((document) => ["ready", "posted"].includes(document.status)).length;
  const metrics = [
    { label: "Venituri", value: money(revenue, baseCurrency), currency: "facturi emise", note: revenue ? "Calculat din documentele încărcate" : "Nu există facturi emise", icon: WalletCards, color: "text-[#0a9c71]", iconBg: "bg-emerald-50" },
    { label: "Cheltuieli", value: money(expenses, baseCurrency), currency: "facturi primite", note: expenses ? "Calculat din documentele încărcate" : "Nu există facturi primite", icon: TrendingDown, color: "text-[#6d4df4]", iconBg: "bg-violet-50" },
    { label: "Documente", value: String(allDocuments.length), currency: "înregistrate", note: `${verified} verificate sau contabilizate`, icon: FileCheck2, color: "text-[#087da3]", iconBg: "bg-sky-50" },
    { label: "Necesită atenție", value: String(attention), currency: attention === 1 ? "document" : "documente", note: attention ? "În așteptarea verificării" : "Totul este în regulă", icon: TriangleAlert, color: "text-[#bd7000]", iconBg: "bg-amber-50" },
  ];
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <PageHeader
        eyebrow="Situație financiară"
        title="Bine ați venit în FinPilot"
        description="Conectați datele companiei pentru a crea o evidență contabilă verificată."
        actions={<Link href="/documents" className="focus-ring flex h-10 items-center gap-2 rounded-xl bg-[#0b1838] px-4 text-xs font-bold text-white hover:bg-[#142754]"><UploadCloud className="h-4 w-4" />Încarcă document</Link>}
      />

      <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="card-shadow animate-float-in rounded-2xl border border-[#e8ebf2] bg-white p-5" style={{ animationDelay: `${index * 55}ms` }}>
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${metric.iconBg} ${metric.color}`}><Icon className="h-[18px] w-[18px]" /></span>
              <p className="mt-4 text-[11px] font-bold text-slate-500">{metric.label}</p>
              <div className="mt-1.5 flex flex-wrap items-end gap-2"><span className="text-[22px] font-extrabold tracking-[-0.04em] text-[#0b1838]">{metric.value}</span><span className="pb-1 text-[10px] font-bold text-slate-400">{metric.currency}</span></div>
              <p className="mt-3 text-[10px] font-medium text-slate-400">{metric.note}</p>
            </article>
          );
        })}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
        <article className="card-shadow min-h-[310px] rounded-2xl border border-[#e8ebf2] bg-white p-6">
          {allDocuments.length === 0 ? <div className="grid min-h-[260px] place-items-center text-center"><div><FileText className="mx-auto h-9 w-9 text-slate-300" /><h2 className="mt-4 text-[15px] font-extrabold text-[#0b1838]">Nu există încă activitate financiară</h2><p className="mx-auto mt-2 max-w-md text-[11px] leading-5 text-slate-400">Veniturile și cheltuielile vor apărea după încărcarea documentelor.</p></div></div> : <div><p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#0a91b8]">Rezumat financiar</p><h2 className="mt-2 text-[16px] font-extrabold text-[#0b1838]">Situația documentelor încărcate</h2><div className="mt-7 space-y-5"><div><div className="flex justify-between text-[11px] font-bold"><span className="text-slate-500">Facturi primite</span><span className="text-[#0b1838]">{money(expenses, baseCurrency)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${expenses + revenue > 0 ? Math.max(4, expenses / (expenses + revenue) * 100) : 0}%` }} /></div></div><div><div className="flex justify-between text-[11px] font-bold"><span className="text-slate-500">Facturi emise</span><span className="text-[#0b1838]">{money(revenue, baseCurrency)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${expenses + revenue > 0 ? Math.max(4, revenue / (expenses + revenue) * 100) : 0}%` }} /></div></div><div className="grid grid-cols-2 gap-3 pt-2"><div className="rounded-xl bg-sky-50 p-4"><p className="text-[9px] font-bold text-sky-700">Verificate</p><p className="mt-1 text-xl font-extrabold text-[#0b1838]">{verified}</p></div><div className="rounded-xl bg-amber-50 p-4"><p className="text-[9px] font-bold text-amber-700">De verificat</p><p className="mt-1 text-xl font-extrabold text-[#0b1838]">{attention}</p></div></div></div></div>}
        </article>

        <article className="card-shadow rounded-2xl border border-[#e8ebf2] bg-[#0b1838] p-5 text-white sm:p-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Bot className="h-5 w-5 text-[#27d2f3]" /></span>
          <h2 className="mt-5 text-lg font-extrabold tracking-[-0.02em]">Analizați datele financiare</h2>
          <p className="mt-2 text-[11px] leading-5 text-blue-100/65">Copilotul va utiliza numai operațiunile contabile verificate.</p>
          <Link href="/copilot" className="mt-6 flex items-center gap-2 text-[10px] font-extrabold text-[#29d2f2] hover:text-white">Deschide Copilot AI <ArrowRight className="h-3.5 w-3.5" /></Link>
        </article>
      </section>

      <section className="card-shadow mt-4 overflow-hidden rounded-2xl border border-[#e8ebf2] bg-white">
        <div className="flex items-center justify-between border-b border-[#edf0f4] px-5 py-4"><div><h2 className="text-[13px] font-extrabold text-[#0b1838]">Documente recente</h2><p className="mt-1 text-[9px] text-slate-400">Ultimele documente încărcate în FinPilot</p></div><Link href="/documents" className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#0783aa]">Vezi toate <ArrowRight className="h-3.5 w-3.5" /></Link></div>
        {allDocuments.length === 0 ? <div className="grid min-h-[170px] place-items-center p-6 text-center"><div><FileCheck2 className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-[10px] text-slate-400">Nu există documente recente.</p></div></div> : <div className="divide-y divide-[#eef0f5]">{allDocuments.slice(0, 5).map((document) => { const direction = documentDirection(document.metadata, companyIds); return <Link key={document.id} href={`/documents/${document.id}`} className="grid gap-2 px-5 py-4 hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_180px_130px_150px] sm:items-center"><div className="min-w-0"><p className="truncate text-[11px] font-extrabold text-[#0b1838]">{document.original_filename}</p><p className="mt-1 truncate text-[9px] text-slate-400">{documentCounterparty(document.metadata, direction, document.counterparty_name)}</p></div><span className="text-[10px] font-semibold text-slate-500">{document.issue_date ? date(document.issue_date) : date(document.created_at)}</span><span className="text-[10px] font-extrabold text-[#0b1838] sm:text-right">{document.total_amount === null ? "—" : money(Number(document.total_amount), document.currency || baseCurrency)}</span><span className={`justify-self-start rounded-full px-2.5 py-1 text-[9px] font-extrabold sm:justify-self-end ${document.status === "needs_review" ? "bg-amber-50 text-amber-700" : document.status === "failed" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{statusLabels[document.status] || document.status}</span></Link>; })}</div>}
      </section>
    </div>
  );
}
