import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  Building2,
  FileSearch,
  FileText,
  Landmark,
  LockKeyhole,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";

const workflow = [
  {
    icon: UploadCloud,
    step: "01",
    title: "Încarcă documentele",
    description: "Adaugă facturi, bonuri, extrase bancare și alte documente contabile în spațiul de lucru.",
  },
  {
    icon: FileSearch,
    step: "02",
    title: "Verifică informațiile",
    description: "FinPilot pregătește datele pentru verificare, astfel încât erorile să poată fi observate înainte de înregistrare.",
  },
  {
    icon: BadgeCheck,
    step: "03",
    title: "Confirmă înregistrările",
    description: "Documentele verificate devin baza registrului contabil și a rapoartelor financiare.",
  },
];

const modules = [
  { icon: BarChart3, title: "Tablou de bord", description: "O imagine de ansamblu asupra veniturilor, cheltuielilor, documentelor și elementelor care necesită atenție." },
  { icon: FileText, title: "Documente", description: "Locul în care sunt încărcate, urmărite și verificate documentele primare." },
  { icon: Landmark, title: "Jurnalul operațiunilor", description: "Registrul înregistrărilor contabile, conectat la documentele care au generat fiecare operațiune." },
  { icon: Bot, title: "Copilot AI", description: "Asistent pentru întrebări despre datele financiare și explicarea informațiilor din spațiul de lucru." },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <PageHeader
        eyebrow="Centru de ajutor"
        title="Despre FinPilot AI"
        description="Un spațiu de lucru pentru organizarea documentelor, verificarea datelor și pregătirea evidenței contabile."
      />

      <section className="card-shadow mt-7 overflow-hidden rounded-2xl border border-[#e8ebf2] bg-white">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eaf9fd] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#087da3]"><Bot className="h-3.5 w-3.5" />Contabilitate asistată de AI</span>
            <h2 className="mt-5 max-w-2xl text-2xl font-extrabold leading-tight text-[#0b1838] sm:text-3xl">Mai puțină muncă repetitivă. Mai mult control asupra datelor financiare.</h2>
            <p className="mt-4 max-w-2xl text-[12px] leading-6 text-slate-500">FinPilot AI centralizează documentele companiei și pregătește informațiile necesare pentru evidența contabilă. Aplicația este concepută pentru un singur utilizator, fără roluri sau permisiuni complicate.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/documents" className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl bg-[#0b1838] px-4 text-xs font-extrabold text-white hover:bg-[#142754]">Încarcă un document<ArrowRight className="h-4 w-4" /></Link>
              <Link href="/settings/company" className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe4ec] bg-white px-4 text-xs font-extrabold text-[#0b1838] hover:bg-slate-50"><Building2 className="h-4 w-4" />Profilul companiei</Link>
            </div>
          </div>

          <div className="rounded-2xl bg-[#0b1838] p-6 text-white">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-[#21d4f6]"><LockKeyhole className="h-5 w-5" /></span>
            <h3 className="mt-5 text-base font-extrabold">Datele companiei tale</h3>
            <p className="mt-2 text-[11px] leading-5 text-blue-100/75">Profilul companiei, planul de conturi și documentele sunt păstrate în baza de date și sunt accesibile numai utilizatorului autentificat.</p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#0a8fb7]">Cum funcționează</p>
          <h2 className="mt-2 text-lg font-extrabold text-[#0b1838]">De la document la evidență contabilă</h2>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {workflow.map((item) => (
            <article key={item.step} className="card-shadow rounded-2xl border border-[#e8ebf2] bg-white p-5">
              <div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef8fb] text-[#0a8fb7]"><item.icon className="h-[18px] w-[18px]" /></span><span className="text-[10px] font-extrabold text-slate-300">{item.step}</span></div>
              <h3 className="mt-5 text-sm font-extrabold text-[#0b1838]">{item.title}</h3>
              <p className="mt-2 text-[10px] leading-5 text-slate-500">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#0a8fb7]">Secțiunile aplicației</p>
          <h2 className="mt-2 text-lg font-extrabold text-[#0b1838]">Unde găsești fiecare funcție</h2>
        </div>
        <div className="card-shadow mt-4 grid overflow-hidden rounded-2xl border border-[#e8ebf2] bg-white md:grid-cols-2">
          {modules.map((item, index) => (
            <article key={item.title} className={`flex gap-4 p-5 sm:p-6 ${index < 2 ? "border-b border-[#eef0f5]" : ""} ${index % 2 === 0 ? "md:border-r md:border-[#eef0f5]" : ""}`}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef8fb] text-[#0a8fb7]"><item.icon className="h-[18px] w-[18px]" /></span>
              <div><h3 className="text-[12px] font-extrabold text-[#0b1838]">{item.title}</h3><p className="mt-2 text-[10px] leading-5 text-slate-500">{item.description}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="card-shadow mt-8 flex flex-col gap-4 rounded-2xl border border-[#dcecf1] bg-[#effbfe] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div><h2 className="text-sm font-extrabold text-[#0b1838]">Primii pași recomandați</h2><p className="mt-2 text-[10px] leading-5 text-slate-500">Completează profilul companiei, verifică planul de conturi și apoi încarcă primul document.</p></div>
        <Link href="/settings" className="focus-ring inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0b1838] px-4 text-xs font-extrabold text-white hover:bg-[#142754]">Deschide setările<ArrowRight className="h-4 w-4" /></Link>
      </section>
    </div>
  );
}
