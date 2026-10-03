import Link from "next/link";
import { ArrowDownToLine, CalendarDays, ChevronDown, Download, ExternalLink, Filter, MoreHorizontal, Search, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ledgerEntries } from "@/lib/mock-data";

export default function LedgerPage() {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <PageHeader eyebrow="Accounting records" title="General ledger" description="Trace every posting back to its source document, rule and approval." actions={<><button className="focus-ring flex h-10 items-center gap-2 rounded-xl border border-[#e1e5ed] bg-white px-3.5 text-xs font-bold text-slate-600 hover:bg-slate-50"><CalendarDays className="h-4 w-4" />September 2026<ChevronDown className="h-3.5 w-3.5" /></button><button className="focus-ring flex h-10 items-center gap-2 rounded-xl bg-[#0b1838] px-4 text-xs font-bold text-white hover:bg-[#142754]"><Download className="h-4 w-4" />Export ledger</button></>} />

      <section className="mt-7 grid gap-3 sm:grid-cols-3">
        {[{ label: "Total debits", value: "137,705.00 MDL", hint: "32 lines" }, { label: "Total credits", value: "137,705.00 MDL", hint: "32 lines" }, { label: "Balance check", value: "0.00 MDL", hint: "Ledger balanced", success: true }].map((item) => <article key={item.label} className="card-shadow rounded-2xl border border-[#e8ebf2] bg-white p-5"><p className="text-[10px] font-bold text-slate-400">{item.label}</p><p className="mt-2 text-xl font-extrabold tracking-[-0.04em] text-[#0b1838]">{item.value}</p><p className={`mt-2 text-[9px] font-bold ${item.success ? "text-emerald-600" : "text-slate-400"}`}>{item.hint}</p></article>)}
      </section>

      <div className="card-shadow mt-4 overflow-hidden rounded-2xl border border-[#e8ebf2] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#e9ecf2] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-[300px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input placeholder="Search entries or accounts..." className="focus-ring h-9 w-full rounded-lg border border-[#e5e9f0] bg-[#fafbfc] pl-9 pr-3 text-[11px] font-medium text-[#0b1838] placeholder:text-slate-400" /></div>
          <div className="flex gap-2"><button className="flex h-9 items-center gap-2 rounded-lg border border-[#e5e9f0] px-3 text-[10px] font-bold text-slate-500 hover:bg-slate-50"><Filter className="h-3.5 w-3.5" />All entries<ChevronDown className="h-3 w-3" /></button><button className="grid h-9 w-9 place-items-center rounded-lg border border-[#e5e9f0] text-slate-500 hover:bg-slate-50"><SlidersHorizontal className="h-4 w-4" /></button></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead><tr className="bg-[#fbfcfd] text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400"><th className="px-5 py-3.5">Entry</th><th className="px-3 py-3.5">Date</th><th className="px-3 py-3.5">Description / Source</th><th className="px-3 py-3.5">Debit account</th><th className="px-3 py-3.5">Credit account</th><th className="px-3 py-3.5 text-right">Amount</th><th className="px-3 py-3.5">Status</th><th className="w-10 px-3 py-3.5" /></tr></thead>
            <tbody className="divide-y divide-[#f0f2f6]">{ledgerEntries.map((entry) => <tr key={entry.id} className="group text-[10px] hover:bg-slate-50/70"><td className="px-5 py-4 font-extrabold text-[#087da3]">{entry.id}</td><td className="px-3 py-4 font-semibold text-slate-500">{entry.date}</td><td className="px-3 py-4"><b className="block text-[#0b1838]">{entry.description}</b><Link href={`/documents/${entry.source}`} className="mt-1 flex items-center gap-1 text-[8px] font-bold text-slate-400 hover:text-[#087da3]">Source: {entry.source}<ExternalLink className="h-2.5 w-2.5" /></Link></td><td className="px-3 py-4 font-semibold text-slate-600">{entry.debit}</td><td className="px-3 py-4 font-semibold text-slate-600">{entry.credit}</td><td className="px-3 py-4 text-right font-extrabold text-[#0b1838]">{entry.amount}</td><td className="px-3 py-4"><span className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${entry.status === "Posted" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-sky-100 bg-sky-50 text-sky-700"}`}>{entry.status}</span></td><td className="px-3 py-4"><button className="rounded-lg p-1.5 text-slate-400 opacity-0 hover:bg-white group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></button></td></tr>)}</tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#eef0f5] px-5 py-3.5 text-[10px] font-semibold text-slate-400"><span>5 entries · 10 accounting lines</span><button className="flex items-center gap-1.5 font-bold text-[#087da3]"><ArrowDownToLine className="h-3.5 w-3.5" />Download CSV</button></div>
      </div>
    </div>
  );
}
