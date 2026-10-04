"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowUp, BarChart3, Bot, FileCheck2, FileText, Lightbulb, Loader2, Mic, ReceiptText, ShieldCheck, Tags, Trash2, UserRound, X } from "lucide-react";

export type Source = { id: string; label: string; type: "document" | "entry" | "invoice" | "price"; href: string };
export type Message = { role: "user" | "assistant"; text: string; amount?: string; sources?: Source[]; bullets?: string[] };

const welcomeMessage: Message = { role: "assistant", text: "Datele contabile sunt conectate. Alegeți o întrebare sugerată sau formulați o întrebare proprie." };

const suggestions = [
  { icon: BarChart3, text: "Creează un rezumat al perioadei curente" },
  { icon: Tags, text: "Ajută-mă să creez prețurile de vânzare" },
  { icon: FileCheck2, text: "Verifică documentele care necesită atenție" },
  { icon: ReceiptText, text: "Afișează facturile neachitate ale furnizorilor" },
];

export function CopilotChat({ initialQuery = "", initialMessages = [] }: { initialQuery?: string; initialMessages?: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages.length > 0 ? initialMessages : [welcomeMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const sentInitial = useRef(false);

  const ask = useCallback(async (question: string) => {
    const clean = question.trim();
    if (!clean || loading) return;
    setMessages((current) => [...current, { role: "user", text: clean }]);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/v1/copilot/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: clean }) });
      const result = await response.json();
      setMessages((current) => [...current, { role: "assistant", text: response.ok ? result.answer : result.message ?? "FinPilot nu este disponibil momentan.", amount: result.amount, bullets: result.bullets, sources: result.sources }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "Serviciul de analiză nu poate fi accesat. Încercați din nou." }]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    if (initialQuery && !sentInitial.current) {
      sentInitial.current = true;
      void ask(initialQuery);
      window.history.replaceState(null, "", "/copilot");
    }
  }, [initialQuery, ask]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(input);
  }

  async function deleteConversation() {
    setDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch("/api/v1/copilot/history", { method: "DELETE" });
      const result = await response.json() as { deleted?: boolean; message?: string };
      if (!response.ok || !result.deleted) {
        setDeleteError(result.message || "Conversația nu a putut fi ștearsă.");
        return;
      }
      setMessages([welcomeMessage]);
      setInput("");
      setDeleteOpen(false);
    } catch {
      setDeleteError("Conexiunea a eșuat. Încercați din nou.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-122px)] lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden border-r border-[#e7eaf1] bg-white p-5 lg:block">
        <Link href="/copilot/audio" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b1838] px-4 py-3 text-[11px] font-extrabold text-white hover:bg-[#142754]"><Mic className="h-4 w-4" />Conversație audio</Link>
        <p className="mt-6 px-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Întrebări sugerate</p>
        <div className="mt-3 space-y-1.5">{suggestions.map((suggestion) => <button key={suggestion.text} onClick={() => void ask(suggestion.text)} className="group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-[10px] font-semibold leading-4 text-slate-500 hover:bg-[#f4fafc] hover:text-[#0b1838]"><suggestion.icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#0893ba]" />{suggestion.text}</button>)}</div>
        <div className="mt-7 rounded-2xl border border-[#dcecf1] bg-[#f4fbfd] p-4"><div className="flex items-center gap-2 text-[10px] font-extrabold text-[#087da3]"><ShieldCheck className="h-4 w-4" />Răspunsuri verificate</div><p className="mt-2 text-[9px] leading-4 text-slate-500">Valorile numerice sunt calculate din operațiunile contabilizate și nu sunt estimate în conversație.</p></div>
      </aside>

      <section className="flex min-w-0 flex-col bg-[#f8f9fc]">
        <div className="border-b border-[#e7eaf1] bg-white px-5 py-4 sm:px-8"><div className="mx-auto flex max-w-[920px] items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0b1838] text-[#25d0f2]"><Bot className="h-5 w-5" /></span><div><h1 className="text-[14px] font-extrabold text-[#0b1838]">FinPilot AI</h1><p className="mt-0.5 flex items-center gap-1.5 text-[9px] font-semibold text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Conectat la datele contabile</p></div><button onClick={() => { setDeleteError(""); setDeleteOpen(true); }} disabled={loading || messages.length === 1 && messages[0] === welcomeMessage} className="ml-auto flex items-center gap-2 rounded-xl border border-[#e1e5ec] px-3 py-2.5 text-[10px] font-extrabold text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Șterge conversația"><Trash2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Șterge conversația</span></button></div></div>

        <div className="flex-1 overflow-y-auto px-4 py-7 sm:px-8">
          <div className="mx-auto max-w-[920px] space-y-6">
            {messages.map((message, index) => <div key={index} className={`animate-float-in flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#0b1838] text-[#25d0f2]"><Bot className="h-4 w-4" /></span>}
              <div className={`max-w-[720px] ${message.role === "user" ? "rounded-2xl rounded-tr-md bg-[#0b1838] px-4 py-3 text-white" : "w-full"}`}>
                {message.role === "assistant" ? <div className="card-shadow rounded-2xl rounded-tl-md border border-[#e5e8ef] bg-white p-4 sm:p-5"><p className="text-[11px] font-medium leading-5 text-slate-600">{message.text}</p>{message.amount && <p className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-[#0b1838]">{message.amount}</p>}{message.bullets && <div className="mt-4 grid gap-2 sm:grid-cols-3">{message.bullets.map((bullet) => { const [label, value] = bullet.split("|"); return <div key={bullet} className="rounded-xl bg-[#f7f9fc] p-3"><span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">{label}</span><b className="mt-1 block text-[10px] text-[#0b1838]">{value}</b></div>; })}</div>}{message.sources && message.sources.length > 0 && <div className="mt-4 border-t border-[#edf0f4] pt-3"><p className="mb-2 text-[8px] font-extrabold uppercase tracking-[0.13em] text-slate-400">Surse și acțiuni</p><div className="flex flex-wrap gap-2">{message.sources.map((source) => <Link key={`${source.type}-${source.id}`} href={source.href} className="flex items-center gap-1.5 rounded-lg border border-[#e1e5ec] bg-white px-2.5 py-1.5 text-[8px] font-extrabold text-[#087da3] hover:border-sky-200 hover:bg-sky-50">{source.type === "document" ? <FileText className="h-3 w-3" /> : source.type === "price" ? <Tags className="h-3 w-3" /> : <ReceiptText className="h-3 w-3" />}{source.label}</Link>)}</div></div>}</div> : <p className="text-[11px] font-semibold leading-5">{message.text}</p>}
              </div>
              {message.role === "user" && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#dff7fd] text-[#087da3]"><UserRound className="h-4 w-4" /></span>}
            </div>)}
            {loading && <div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0b1838] text-[#25d0f2]"><Bot className="h-4 w-4" /></span><div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-[#e5e8ef] bg-white px-4 py-3 text-[10px] font-semibold text-slate-400"><Loader2 className="h-4 w-4 animate-spin text-[#0a91b8]" />Se verifică înregistrările…</div></div>}
          </div>
        </div>

        <div className="border-t border-[#e7eaf1] bg-white p-4 sm:px-8 sm:py-5">
          <form onSubmit={submit} className="mx-auto max-w-[920px]"><div className="flex items-end gap-2 rounded-2xl border border-[#dfe4eb] bg-white p-2 shadow-[0_8px_30px_rgba(23,42,84,0.08)] focus-within:border-[#13bfe9] focus-within:ring-2 focus-within:ring-cyan-100"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void ask(input); } }} rows={1} placeholder="Întrebați despre cheltuieli, facturi sau jurnal..." className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-[11px] font-medium leading-5 text-[#0b1838] outline-none placeholder:text-slate-400" /><button disabled={!input.trim() || loading} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0b1838] text-white hover:bg-[#142754] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Trimite întrebarea"><ArrowUp className="h-4 w-4" /></button></div><p className="mt-2 flex items-center justify-center gap-1.5 text-[8px] font-semibold text-slate-400"><Lightbulb className="h-3 w-3" />FinPilot poate greși. Verificați deciziile importante utilizând sursele asociate.</p></form>
        </div>
      </section>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b1838]/45 p-4 backdrop-blur-sm" onMouseDown={(event) => event.currentTarget === event.target && !deleting && setDeleteOpen(false)}>
          <div className="animate-float-in w-full max-w-[430px] rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600"><Trash2 className="h-5 w-5" /></span><button disabled={deleting} onClick={() => setDeleteOpen(false)} aria-label="Închide" className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 disabled:opacity-50"><X className="h-5 w-5" /></button></div>
            <h2 className="mt-5 text-lg font-extrabold tracking-tight text-[#0b1838]">Ștergeți conversația?</h2>
            <p className="mt-2 text-[11px] font-medium leading-5 text-slate-500">Toate întrebările și răspunsurile FinPilot salvate în acest cont vor fi șterse definitiv. Documentele și datele contabile nu vor fi afectate.</p>
            {deleteError && <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] font-bold text-red-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{deleteError}</div>}
            <div className="mt-6 flex justify-end gap-2"><button disabled={deleting} onClick={() => setDeleteOpen(false)} className="rounded-xl border border-[#dfe4ec] px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Anulează</button><button disabled={deleting} onClick={() => void deleteConversation()} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-65">{deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}{deleting ? "Se șterge..." : "Șterge conversația"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
