import { Download, ReceiptText } from "lucide-react";

import { PageHeader } from "@/components/page-header";

const totals = [
  { label: "Total debits", value: "0.00", hint: "0 lines" },
  { label: "Total credits", value: "0.00", hint: "0 lines" },
  { label: "Balance check", value: "0.00", hint: "No entries" },
];

export default function LedgerPage() {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <PageHeader eyebrow="Accounting records" title="General ledger" description="Trace every posting back to its source document, rule and approval." actions={<button disabled className="flex h-10 cursor-not-allowed items-center gap-2 rounded-xl bg-[#0b1838] px-4 text-xs font-bold text-white opacity-40"><Download className="h-4 w-4" />Export ledger</button>} />

      <section className="mt-7 grid gap-3 sm:grid-cols-3">
        {totals.map((item) => <article key={item.label} className="card-shadow rounded-2xl border border-[#e8ebf2] bg-white p-5"><p className="text-[10px] font-bold text-slate-400">{item.label}</p><p className="mt-2 text-xl font-extrabold tracking-[-0.04em] text-[#0b1838]">{item.value}</p><p className="mt-2 text-[9px] font-bold text-slate-400">{item.hint}</p></article>)}
      </section>

      <section className="card-shadow mt-4 grid min-h-[360px] place-items-center rounded-2xl border border-[#e8ebf2] bg-white p-6 text-center">
        <div><ReceiptText className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 text-sm font-extrabold text-[#0b1838]">No ledger entries</h2><p className="mx-auto mt-2 max-w-md text-[11px] leading-5 text-slate-400">Posted accounting entries will appear here after the database and posting workflow are connected.</p></div>
      </section>
    </div>
  );
}
