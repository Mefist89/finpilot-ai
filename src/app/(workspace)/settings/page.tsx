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
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { createClient } from "@/utils/supabase/server";

const sections = [
  { icon: Building2, title: "Profilul companiei", description: "Denumire juridică, IDNO, exercițiu financiar și moneda de bază", href: "/settings/company" },
  { icon: Landmark, title: "Plan de conturi", description: "Structura conturilor și clasificarea contabilă", href: "/settings/accounts" },
  { icon: SlidersHorizontal, title: "Politica de automatizare", description: "Praguri de încredere și reguli de aprobare" },
  { icon: UserRound, title: "Utilizatori și permisiuni", description: "Roluri, acces și responsabili de verificare" },
  { icon: Languages, title: "Limbă și regiune", description: "Limba interfeței și localizarea contabilă" },
  { icon: BellRing, title: "Notificări", description: "Alerte de verificare și rezumate de procesare" },
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/login");
  }

  const [{ data: profile }, { count: accountCount }] = await Promise.all([
    supabase.from("profiles").select("company_name").eq("id", userData.user.id).maybeSingle(),
    supabase.from("accounts").select("id", { count: "exact", head: true }),
  ]);

  const statuses: Record<string, string> = {
    "Profilul companiei": profile?.company_name?.trim() ? "Configurat" : "Neconfigurat",
    "Plan de conturi": accountCount ? `${accountCount} ${accountCount === 1 ? "cont" : "conturi"}` : "Neconfigurat",
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <PageHeader eyebrow="Configurarea aplicației" title="Setări" description="Configurați compania și politicile contabile." />
      <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_310px]">
        <section className="card-shadow overflow-hidden rounded-2xl border border-[#e8ebf2] bg-white">
          <div className="border-b border-[#eef0f5] px-5 py-4"><h2 className="text-[13px] font-extrabold text-[#0b1838]">Setările spațiului de lucru</h2></div>
          <div className="divide-y divide-[#f0f2f6]">
            {sections.map((section) => {
              const content = <><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef8fb] text-[#0a8fb7]"><section.icon className="h-[18px] w-[18px]" /></span><span className="min-w-0 flex-1"><b className="block text-[11px] text-[#0b1838]">{section.title}</b><span className="mt-1 block text-[9px] font-medium text-slate-400">{section.description}</span></span><span className="hidden text-[9px] font-bold text-slate-400 sm:block">{statuses[section.title] ?? "Neconfigurat"}</span><ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" /></>;

              return section.href ? (
                <Link key={section.title} href={section.href} className="group flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-50">{content}</Link>
              ) : (
                <button key={section.title} type="button" className="group flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-50">{content}</button>
              );
            })}
          </div>
        </section>

        <aside className="card-shadow h-fit rounded-2xl border border-[#e8ebf2] bg-white p-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600"><Settings2 className="h-5 w-5" /></span>
          <h2 className="mt-4 text-sm font-extrabold text-[#0b1838]">Configurare contabilă</h2>
          <p className="mt-2 text-[10px] leading-5 text-slate-500">Completați profilul companiei și planul de conturi înainte de înregistrarea operațiunilor contabile.</p>
        </aside>
      </div>
    </div>
  );
}
