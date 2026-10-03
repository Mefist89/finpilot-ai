"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, Bot, ChevronDown, CircleHelp, FileText, LayoutDashboard, Menu, ReceiptText, Search, Settings, ShieldCheck, Sparkles, X } from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Documents", href: "/documents", icon: FileText, badge: "3" },
  { label: "Ledger", href: "/ledger", icon: ReceiptText },
  { label: "AI Copilot", href: "/copilot", icon: Bot },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (href: string) => href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-[#0b1838]/35 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[244px] flex-col border-r border-[#e8ebf2] bg-white transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[78px] items-center justify-between border-b border-[#eef0f5] px-5">
          <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="focus-ring rounded-lg">
            <Image src="/finpilot-logo.png" alt="FinPilot AI" width={178} height={59} className="h-auto w-[162px]" priority />
          </Link>
          <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
        </div>

        <div className="px-4 pt-5">
          <button className="focus-ring flex w-full items-center gap-3 rounded-xl border border-[#e6e9f0] bg-[#fbfcfe] px-3 py-3 text-left hover:border-slate-300">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0b1838] text-xs font-extrabold text-white">N</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-extrabold text-[#0b1838]">Nordic Retail SRL</span><span className="mt-0.5 block text-[10px] font-medium text-slate-400">IDNO 1026600038192</span></span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <nav className="mt-6 flex-1 space-y-1.5 px-3">
          <p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Workspace</p>
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`focus-ring flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-bold transition-colors ${active ? "bg-[#eaf9fd] text-[#087da3]" : "text-[#5e687c] hover:bg-slate-50 hover:text-[#0b1838]"}`}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 2} /><span className="flex-1">{item.label}</span>
                {item.badge && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#ffedcf] px-1 text-[10px] font-extrabold text-[#b36600]">{item.badge}</span>}
              </Link>
            );
          })}

          <p className="px-3 pb-2 pt-6 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Manage</p>
          <Link href="/settings" onClick={() => setMobileOpen(false)} className={`focus-ring flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-bold transition-colors ${isActive("/settings") ? "bg-[#eaf9fd] text-[#087da3]" : "text-[#5e687c] hover:bg-slate-50 hover:text-[#0b1838]"}`}><Settings className="h-[18px] w-[18px]" />Settings</Link>
        </nav>

        <div className="m-3 rounded-2xl bg-[#0b1838] p-4 text-white">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold"><Sparkles className="h-4 w-4 text-[#21d4f6]" />AI automation</div>
          <p className="text-[11px] leading-4.5 text-blue-100/75">21 of 24 documents processed automatically this month.</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[87%] rounded-full bg-[#20c9ef]" /></div>
        </div>
      </aside>

      <div className="lg:pl-[244px]">
        <header className="sticky top-0 z-20 flex h-[78px] items-center border-b border-[#e8ebf2] bg-white/95 px-4 backdrop-blur-md sm:px-7 lg:px-9">
          <button className="mr-3 rounded-lg p-2 text-slate-500 hover:bg-slate-50 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <div className="relative hidden w-full max-w-[360px] md:block">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input aria-label="Search" placeholder="Search documents, entries, suppliers..." className="focus-ring h-10 w-full rounded-xl border border-[#e5e9f0] bg-[#fafbfc] pl-10 pr-4 text-xs font-medium text-[#0b1838] placeholder:text-slate-400" />
          </div>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
            <button className="focus-ring hidden items-center gap-2 rounded-xl border border-[#e5e9f0] px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 sm:flex"><CircleHelp className="h-4 w-4" />Help</button>
            <button className="focus-ring relative rounded-xl border border-[#e5e9f0] p-2.5 text-slate-500 hover:bg-slate-50" aria-label="Notifications"><Bell className="h-[18px] w-[18px]" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#6d4df4] ring-2 ring-white" /></button>
            <div className="ml-1 h-8 w-px bg-slate-200" />
            <button className="focus-ring flex items-center gap-2 rounded-xl p-1.5 text-left hover:bg-slate-50">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#dff7fd] text-xs font-extrabold text-[#07799e]">AV</span>
              <span className="hidden sm:block"><span className="block text-[11px] font-extrabold text-[#0b1838]">Ana Vlas</span><span className="block text-[9px] font-semibold text-slate-400">Administrator</span></span>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>
          </div>
        </header>
        <main className="min-h-[calc(100vh-78px)]">{children}</main>
        <footer className="flex items-center justify-between border-t border-[#e8ebf2] bg-white px-5 py-4 text-[10px] font-semibold text-slate-400 sm:px-9"><span>FinPilot AI · Demo workspace</span><span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />Data protected · Audit trail active</span></footer>
      </div>
    </div>
  );
}
