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

const metrics = [
  { label: "Revenue", value: "0", currency: "—", icon: WalletCards, color: "text-[#0a9c71]", iconBg: "bg-emerald-50" },
  { label: "Expenses", value: "0", currency: "—", icon: TrendingDown, color: "text-[#6d4df4]", iconBg: "bg-violet-50" },
  { label: "Documents", value: "0", currency: "processed", icon: FileCheck2, color: "text-[#087da3]", iconBg: "bg-sky-50" },
  { label: "Needs attention", value: "0", currency: "documents", icon: TriangleAlert, color: "text-[#bd7000]", iconBg: "bg-amber-50" },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <PageHeader
        eyebrow="Financial overview"
        title="Welcome to FinPilot"
        description="Connect your business data to start building a verified accounting workspace."
        actions={<Link href="/documents" className="focus-ring flex h-10 items-center gap-2 rounded-xl bg-[#0b1838] px-4 text-xs font-bold text-white hover:bg-[#142754]"><UploadCloud className="h-4 w-4" />Upload document</Link>}
      />

      <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="card-shadow animate-float-in rounded-2xl border border-[#e8ebf2] bg-white p-5" style={{ animationDelay: `${index * 55}ms` }}>
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${metric.iconBg} ${metric.color}`}><Icon className="h-[18px] w-[18px]" /></span>
              <p className="mt-4 text-[11px] font-bold text-slate-500">{metric.label}</p>
              <div className="mt-1.5 flex items-end gap-2"><span className="text-[26px] font-extrabold tracking-[-0.04em] text-[#0b1838]">{metric.value}</span><span className="pb-1 text-[10px] font-bold text-slate-400">{metric.currency}</span></div>
              <p className="mt-3 text-[10px] font-medium text-slate-400">No data available</p>
            </article>
          );
        })}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
        <article className="card-shadow grid min-h-[310px] place-items-center rounded-2xl border border-[#e8ebf2] bg-white p-6 text-center">
          <div><FileText className="mx-auto h-9 w-9 text-slate-300" /><h2 className="mt-4 text-[15px] font-extrabold text-[#0b1838]">No financial activity yet</h2><p className="mx-auto mt-2 max-w-md text-[11px] leading-5 text-slate-400">Revenue, expenses and cash flow will appear after documents and ledger entries are stored in the backend.</p></div>
        </article>

        <article className="card-shadow rounded-2xl border border-[#e8ebf2] bg-[#0b1838] p-5 text-white sm:p-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Bot className="h-5 w-5 text-[#27d2f3]" /></span>
          <h2 className="mt-5 text-lg font-extrabold tracking-[-0.02em]">Ask your financial data</h2>
          <p className="mt-2 text-[11px] leading-5 text-blue-100/65">Copilot will become available when verified ledger entries are connected.</p>
          <Link href="/copilot" className="mt-6 flex items-center gap-2 text-[10px] font-extrabold text-[#29d2f2] hover:text-white">Open AI Copilot <ArrowRight className="h-3.5 w-3.5" /></Link>
        </article>
      </section>

      <section className="card-shadow mt-4 grid min-h-[220px] place-items-center rounded-2xl border border-[#e8ebf2] bg-white p-6 text-center">
        <div><FileCheck2 className="mx-auto h-9 w-9 text-slate-300" /><h2 className="mt-4 text-[14px] font-extrabold text-[#0b1838]">No recent documents</h2><p className="mt-2 text-[10px] text-slate-400">Your document activity will appear here.</p><Link href="/documents" className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#0783aa]">Go to documents <ArrowRight className="h-3.5 w-3.5" /></Link></div>
      </section>
    </div>
  );
}
