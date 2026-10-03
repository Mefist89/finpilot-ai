import {
  BellRing,
  Building2,
  ChevronRight,
  Landmark,
  Languages,
  Settings2,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";

const sections = [
  { icon: Building2, title: "Company profile", description: "Legal name, IDNO, fiscal year and base currency" },
  { icon: Landmark, title: "Chart of accounts", description: "Account structure and category mappings" },
  { icon: SlidersHorizontal, title: "Automation policy", description: "Confidence thresholds and approval rules" },
  { icon: UserRound, title: "People & permissions", description: "Roles, access and reviewer assignments" },
  { icon: Languages, title: "Language & region", description: "Interface language and accounting locale" },
  { icon: BellRing, title: "Notifications", description: "Review alerts and processing summaries" },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <PageHeader eyebrow="Workspace configuration" title="Settings" description="Configure your company and accounting policies." />
      <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_310px]">
        <section className="card-shadow overflow-hidden rounded-2xl border border-[#e8ebf2] bg-white">
          <div className="border-b border-[#eef0f5] px-5 py-4"><h2 className="text-[13px] font-extrabold text-[#0b1838]">Workspace settings</h2></div>
          <div className="divide-y divide-[#f0f2f6]">
            {sections.map((section) => <button key={section.title} className="group flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-50"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef8fb] text-[#0a8fb7]"><section.icon className="h-[18px] w-[18px]" /></span><span className="min-w-0 flex-1"><b className="block text-[11px] text-[#0b1838]">{section.title}</b><span className="mt-1 block text-[9px] font-medium text-slate-400">{section.description}</span></span><span className="hidden text-[9px] font-bold text-slate-400 sm:block">Not configured</span><ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" /></button>)}
          </div>
        </section>

        <aside className="card-shadow h-fit rounded-2xl border border-[#e8ebf2] bg-white p-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600"><Settings2 className="h-5 w-5" /></span>
          <h2 className="mt-4 text-sm font-extrabold text-[#0b1838]">Setup required</h2>
          <p className="mt-2 text-[10px] leading-5 text-slate-500">Company, policy, security and notification settings will be stored after the backend schema is created.</p>
        </aside>
      </div>
    </div>
  );
}
