"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, BarChart3, Bot, FileText, Lightbulb, Loader2, MessageCircleQuestion, ReceiptText, ShieldCheck, Sparkles, TrendingUp, UserRound } from "lucide-react";

type Source = { id: string; label: string; type: "document" | "entry" };
type Message = { role: "user" | "assistant"; text: string; amount?: string; sources?: Source[]; bullets?: string[] };

const suggestions = [
  { icon: BarChart3, text: "Summarize the current reporting period" },
  { icon: ReceiptText, text: "Show unpaid supplier invoices" },
  { icon: TrendingUp, text: "Explain recent cost changes" },
  { icon: MessageCircleQuestion, text: "Which documents need review?" },
];

export function CopilotChat({ initialQuery = "" }: { initialQuery?: string }) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "Connect a verified ledger and document source before asking financial questions." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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
      setMessages((current) => [...current, { role: "assistant", text: response.ok ? result.answer : result.message ?? "Copilot is not available yet.", amount: result.amount, bullets: result.bullets, sources: result.sources }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "I couldn’t reach the analytics service. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    if (initialQuery && !sentInitial.current) {
      sentInitial.current = true;
      void ask(initialQuery);
    }
  }, [initialQuery, ask]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void ask(input);
  }

  return (
    <div className="grid min-h-[calc(100vh-122px)] lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden border-r border-[#e7eaf1] bg-white p-5 lg:block">
        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b1838] px-4 py-3 text-[11px] font-extrabold text-white hover:bg-[#142754]"><Sparkles className="h-4 w-4" />New conversation</button>
        <p className="mt-6 px-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Suggested questions</p>
        <div className="mt-3 space-y-1.5">{suggestions.map((suggestion) => <button key={suggestion.text} onClick={() => void ask(suggestion.text)} className="group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left text-[10px] font-semibold leading-4 text-slate-500 hover:bg-[#f4fafc] hover:text-[#0b1838]"><suggestion.icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#0893ba]" />{suggestion.text}</button>)}</div>
        <div className="mt-7 rounded-2xl border border-[#dcecf1] bg-[#f4fbfd] p-4"><div className="flex items-center gap-2 text-[10px] font-extrabold text-[#087da3]"><ShieldCheck className="h-4 w-4" />Verified answers</div><p className="mt-2 text-[9px] leading-4 text-slate-500">Numeric answers are calculated by the backend from posted entries — never guessed in chat.</p></div>
      </aside>

      <section className="flex min-w-0 flex-col bg-[#f8f9fc]">
        <div className="border-b border-[#e7eaf1] bg-white px-5 py-4 sm:px-8"><div className="mx-auto flex max-w-[920px] items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0b1838] text-[#25d0f2]"><Bot className="h-5 w-5" /></span><div><h1 className="text-[14px] font-extrabold text-[#0b1838]">FinPilot Copilot</h1><p className="mt-0.5 flex items-center gap-1.5 text-[9px] font-semibold text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-slate-300" />Waiting for a connected data source</p></div></div></div>

        <div className="flex-1 overflow-y-auto px-4 py-7 sm:px-8">
          <div className="mx-auto max-w-[920px] space-y-6">
            {messages.map((message, index) => <div key={index} className={`animate-float-in flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#0b1838] text-[#25d0f2]"><Bot className="h-4 w-4" /></span>}
              <div className={`max-w-[720px] ${message.role === "user" ? "rounded-2xl rounded-tr-md bg-[#0b1838] px-4 py-3 text-white" : "w-full"}`}>
                {message.role === "assistant" ? <div className="card-shadow rounded-2xl rounded-tl-md border border-[#e5e8ef] bg-white p-4 sm:p-5"><p className="text-[11px] font-medium leading-5 text-slate-600">{message.text}</p>{message.amount && <p className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-[#0b1838]">{message.amount}</p>}{message.bullets && <div className="mt-4 grid gap-2 sm:grid-cols-3">{message.bullets.map((bullet) => { const [label, value] = bullet.split("|"); return <div key={bullet} className="rounded-xl bg-[#f7f9fc] p-3"><span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">{label}</span><b className="mt-1 block text-[10px] text-[#0b1838]">{value}</b></div>; })}</div>}{message.sources && <div className="mt-4 border-t border-[#edf0f4] pt-3"><p className="mb-2 text-[8px] font-extrabold uppercase tracking-[0.13em] text-slate-400">Sources</p><div className="flex flex-wrap gap-2">{message.sources.map((source) => <Link key={source.id} href={source.type === "document" ? `/documents/${source.id}` : "/ledger"} className="flex items-center gap-1.5 rounded-lg border border-[#e1e5ec] bg-white px-2.5 py-1.5 text-[8px] font-extrabold text-[#087da3] hover:border-sky-200 hover:bg-sky-50">{source.type === "document" ? <FileText className="h-3 w-3" /> : <ReceiptText className="h-3 w-3" />}{source.label}</Link>)}</div></div>}</div> : <p className="text-[11px] font-semibold leading-5">{message.text}</p>}
              </div>
              {message.role === "user" && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#dff7fd] text-[#087da3]"><UserRound className="h-4 w-4" /></span>}
            </div>)}
            {loading && <div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0b1838] text-[#25d0f2]"><Bot className="h-4 w-4" /></span><div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-[#e5e8ef] bg-white px-4 py-3 text-[10px] font-semibold text-slate-400"><Loader2 className="h-4 w-4 animate-spin text-[#0a91b8]" />Checking verified records…</div></div>}
          </div>
        </div>

        <div className="border-t border-[#e7eaf1] bg-white p-4 sm:px-8 sm:py-5">
          <form onSubmit={submit} className="mx-auto max-w-[920px]"><div className="flex items-end gap-2 rounded-2xl border border-[#dfe4eb] bg-white p-2 shadow-[0_8px_30px_rgba(23,42,84,0.08)] focus-within:border-[#13bfe9] focus-within:ring-2 focus-within:ring-cyan-100"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void ask(input); } }} rows={1} placeholder="Ask about expenses, invoices or your ledger..." className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-[11px] font-medium leading-5 text-[#0b1838] outline-none placeholder:text-slate-400" /><button disabled={!input.trim() || loading} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0b1838] text-white hover:bg-[#142754] disabled:cursor-not-allowed disabled:opacity-35" aria-label="Send question"><ArrowUp className="h-4 w-4" /></button></div><p className="mt-2 flex items-center justify-center gap-1.5 text-[8px] font-semibold text-slate-400"><Lightbulb className="h-3 w-3" />Copilot can make mistakes. Verify important decisions using the linked sources.</p></form>
        </div>
      </section>
    </div>
  );
}
