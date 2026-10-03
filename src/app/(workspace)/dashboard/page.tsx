import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bot, CalendarDays, ChevronDown, CircleCheck, Clock3, FileCheck2, FileText, TrendingDown, TriangleAlert, UploadCloud, WalletCards } from "lucide-react";
import { documents } from "@/lib/mock-data";
import { StatusPill } from "@/components/status-pill";
import { PageHeader } from "@/components/page-header";

const metrics = [
  { label: "Revenue", value: "126,800", currency: "MDL", change: "+8.1%", trend: "up", hint: "vs. last month", icon: WalletCards, color: "text-[#0a9c71]", iconBg: "bg-emerald-50" },
  { label: "Expenses", value: "84,320", currency: "MDL", change: "+12.4%", trend: "up", hint: "vs. last month", icon: TrendingDown, color: "text-[#6d4df4]", iconBg: "bg-violet-50" },
  { label: "Documents", value: "24", currency: "processed", change: "87%", trend: "auto", hint: "automated", icon: FileCheck2, color: "text-[#087da3]", iconBg: "bg-sky-50" },
  { label: "Needs attention", value: "3", currency: "documents", change: "Review", trend: "warn", hint: "queue", icon: TriangleAlert, color: "text-[#bd7000]", iconBg: "bg-amber-50" },
];

const chart = [
  { week: "Sep 1", income: 60, expense: 37 },
  { week: "Sep 8", income: 78, expense: 49 },
  { week: "Sep 15", income: 67, expense: 43 },
  { week: "Sep 22", income: 90, expense: 58 },
  { week: "Sep 29", income: 82, expense: 52 },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <PageHeader
        eyebrow="Financial overview"
        title="Good morning, Ana"
        description="Here’s what FinPilot has handled for Nordic Retail today."
        actions={<><button className="focus-ring flex h-10 items-center gap-2 rounded-xl border border-[#e1e5ed] bg-white px-3.5 text-xs font-bold text-slate-600 hover:bg-slate-50"><CalendarDays className="h-4 w-4" />September 2026<ChevronDown className="h-3.5 w-3.5" /></button><Link href="/documents" className="focus-ring flex h-10 items-center gap-2 rounded-xl bg-[#0b1838] px-4 text-xs font-bold text-white hover:bg-[#142754]"><UploadCloud className="h-4 w-4" />Upload document</Link></>}
      />

      <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="card-shadow animate-float-in rounded-2xl border border-[#e8ebf2] bg-white p-5" style={{ animationDelay: `${index * 55}ms` }}>
              <div className="flex items-start justify-between"><span className={`grid h-9 w-9 place-items-center rounded-xl ${metric.iconBg} ${metric.color}`}><Icon className="h-[18px] w-[18px]" /></span><button className="text-lg leading-none text-slate-300 hover:text-slate-500" aria-label={`More options for ${metric.label}`}>•••</button></div>
              <p className="mt-4 text-[11px] font-bold text-slate-500">{metric.label}</p>
              <div className="mt-1.5 flex items-end gap-2"><span className="text-[26px] font-extrabold tracking-[-0.04em] text-[#0b1838]">{metric.value}</span><span className="pb-1 text-[10px] font-bold text-slate-400">{metric.currency}</span></div>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold"><span className={metric.trend === "warn" ? "text-amber-600" : metric.trend === "up" && metric.label === "Expenses" ? "text-rose-500" : "text-emerald-600"}>{metric.change}</span><span className="font-medium text-slate-400">{metric.hint}</span></div>
            </article>
          );
        })}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
        <article className="card-shadow rounded-2xl border border-[#e8ebf2] bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div><h2 className="text-[15px] font-extrabold text-[#0b1838]">Cash flow</h2><p className="mt-1 text-[11px] font-medium text-slate-400">Income and expenses · September</p></div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#10bfe8]" />Income</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#7055e8]" />Expenses</span></div>
          </div>
          <div className="mt-7 flex h-[220px] items-end gap-3 sm:gap-6">
            {chart.map((item) => (
              <div key={item.week} className="flex h-full flex-1 flex-col justify-end">
                <div className="group flex h-[175px] items-end justify-center gap-1.5 sm:gap-2">
                  <div className="relative w-full max-w-[30px] rounded-t-lg bg-[#10bfe8] transition-all hover:bg-[#08a8ce]" style={{ height: `${item.income}%` }}><span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded-md bg-[#0b1838] px-2 py-1 text-[9px] font-bold text-white group-hover:block">{Math.round(item.income * 0.42)}k</span></div>
                  <div className="w-full max-w-[30px] rounded-t-lg bg-[#7055e8] transition-all hover:bg-[#5e44d0]" style={{ height: `${item.expense}%` }} />
                </div>
                <span className="mt-3 text-center text-[9px] font-bold text-slate-400">{item.week}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="card-shadow rounded-2xl border border-[#e8ebf2] bg-[#0b1838] p-5 text-white sm:p-6">
          <div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Bot className="h-5 w-5 text-[#27d2f3]" /></span><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-extrabold text-emerald-300">LIVE DATA</span></div>
          <h2 className="mt-5 text-lg font-extrabold tracking-[-0.02em]">Ask your financial data</h2>
          <p className="mt-2 text-[11px] leading-5 text-blue-100/65">Copilot answers from verified ledger entries and always shows its sources.</p>
          <div className="mt-5 space-y-2">
            {["What were our September expenses?", "Show unpaid supplier invoices", "Why did costs increase?"].map((question) => <Link key={question} href={`/copilot?q=${encodeURIComponent(question)}`} className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-3 text-[10px] font-semibold text-blue-50 hover:bg-white/10"><span>{question}</span><ArrowUpRight className="h-3.5 w-3.5 text-blue-200/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>)}
          </div>
          <Link href="/copilot" className="mt-5 flex items-center gap-2 text-[10px] font-extrabold text-[#29d2f2] hover:text-white">Open AI Copilot <ArrowRight className="h-3.5 w-3.5" /></Link>
        </article>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
        <article className="card-shadow overflow-hidden rounded-2xl border border-[#e8ebf2] bg-white">
          <div className="flex items-center justify-between border-b border-[#eef0f5] px-5 py-4 sm:px-6"><div><h2 className="text-[14px] font-extrabold text-[#0b1838]">Recent documents</h2><p className="mt-1 text-[10px] font-medium text-slate-400">Latest activity in your inbox</p></div><Link href="/documents" className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#0783aa] hover:text-[#0b1838]">View all <ArrowRight className="h-3.5 w-3.5" /></Link></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead><tr className="bg-[#fbfcfd] text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400"><th className="px-6 py-3">Document</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th></tr></thead>
              <tbody className="divide-y divide-[#f0f2f6]">{documents.slice(0, 4).map((doc) => <tr key={doc.id} className="text-[11px] hover:bg-slate-50/70"><td className="px-6 py-3.5"><Link href={`/documents/${doc.id}`} className="flex items-center gap-3 font-bold text-[#0b1838]"><span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-slate-500"><FileText className="h-4 w-4" /></span><span><span className="block">{doc.fileName}</span><span className="mt-0.5 block text-[9px] font-medium text-slate-400">{doc.date}</span></span></Link></td><td className="px-4 py-3.5 font-semibold text-slate-600">{doc.counterparty}</td><td className="px-4 py-3.5 font-bold text-[#0b1838]">{doc.amount}</td><td className="px-4 py-3.5"><StatusPill status={doc.status} /></td></tr>)}</tbody>
            </table>
          </div>
        </article>

        <article className="card-shadow rounded-2xl border border-[#e8ebf2] bg-white p-5 sm:p-6">
          <h2 className="text-[14px] font-extrabold text-[#0b1838]">Automation health</h2><p className="mt-1 text-[10px] font-medium text-slate-400">Last 30 days</p>
          <div className="mx-auto mt-5 grid h-[132px] w-[132px] place-items-center rounded-full" style={{ background: "conic-gradient(#10bfe8 0 87%, #edf1f5 87% 100%)" }}><div className="grid h-[104px] w-[104px] place-items-center rounded-full bg-white text-center"><div><span className="block text-[26px] font-extrabold tracking-[-0.05em] text-[#0b1838]">87%</span><span className="block text-[9px] font-bold text-slate-400">auto-processed</span></div></div></div>
          <div className="mt-5 space-y-3 border-t border-[#edf0f4] pt-4">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500"><span className="flex items-center gap-2"><CircleCheck className="h-4 w-4 text-emerald-500" />Posted automatically</span><b className="text-[#0b1838]">18</b></div>
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500"><span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-violet-500" />Processing</span><b className="text-[#0b1838]">3</b></div>
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500"><span className="flex items-center gap-2"><TriangleAlert className="h-4 w-4 text-amber-500" />Human review</span><b className="text-[#0b1838]">3</b></div>
          </div>
        </article>
      </section>
    </div>
  );
}
