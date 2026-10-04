"use client";

import { ArrowLeft, CircleAlert, Mic, MicOff, Send, ShieldCheck, Sparkles, Volume2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type RecognitionResultEvent = {
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
};

type RecognitionErrorEvent = { error: string };

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type RecognitionConstructor = new () => Recognition;
type AudioState = "idle" | "listening" | "ready" | "unsupported";

function normalized(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function isIncomingInvoiceExtractionCommand(value: string) {
  const command = normalized(value);
  return /(extrage|incarca|proceseaza|analizeaza)/.test(command)
    && /factur/.test(command)
    && /(intrare|primita|furnizor)/.test(command);
}

export function AudioConversation() {
  const router = useRouter();
  const recognitionRef = useRef<Recognition | null>(null);
  const transcriptRef = useRef("");
  const [state, setState] = useState<AudioState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");

  useEffect(() => () => recognitionRef.current?.stop(), []);

  function startListening() {
    const audioWindow = window as typeof window & {
      SpeechRecognition?: RecognitionConstructor;
      webkitSpeechRecognition?: RecognitionConstructor;
    };
    const RecognitionApi = audioWindow.SpeechRecognition ?? audioWindow.webkitSpeechRecognition;

    if (!RecognitionApi) {
      setState("unsupported");
      setError("Recunoașterea vocală nu este disponibilă în acest browser. Utilizați Chrome sau introduceți întrebarea manual.");
      return;
    }

    setError("");
    setInterim("");
    transcriptRef.current = transcript;
    const recognition = new RecognitionApi();
    recognition.lang = "ro-RO";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => setState("listening");
    recognition.onresult = (event) => {
      let finalText = transcriptRef.current;
      let interimText = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) finalText = `${finalText} ${result[0].transcript}`.trim();
        else interimText += result[0].transcript;
      }
      transcriptRef.current = finalText;
      setTranscript(finalText);
      setInterim(interimText);
    };
    recognition.onerror = (event) => {
      setState(transcriptRef.current ? "ready" : "idle");
      setError(event.error === "not-allowed" ? "Accesul la microfon nu a fost permis." : "Vocea nu a putut fi recunoscută. Încercați din nou.");
    };
    recognition.onend = () => {
      setInterim("");
      setState(transcriptRef.current ? "ready" : "idle");
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
  }

  function clearTranscript() {
    transcriptRef.current = "";
    setTranscript("");
    setInterim("");
    setError("");
    setState("idle");
  }

  function sendQuestion() {
    const question = transcript.trim();
    if (!question) return;
    if (isIncomingInvoiceExtractionCommand(question)) {
      router.push("/documents?upload=1&source=audio");
      return;
    }
    router.push(`/copilot?q=${encodeURIComponent(question)}`);
  }

  const listening = state === "listening";

  return (
    <div className="min-h-[calc(100vh-122px)] bg-[#f7f9fc] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <div className="mx-auto max-w-[920px]">
        <Link href="/copilot" className="focus-ring inline-flex items-center gap-2 rounded-xl px-2 py-2 text-[11px] font-extrabold text-slate-500 hover:bg-white hover:text-[#0b1838]"><ArrowLeft className="h-4 w-4" />Înapoi la conversația text</Link>

        <div className="mt-5 overflow-hidden rounded-3xl border border-[#e2e7ef] bg-white shadow-[0_18px_55px_rgba(20,39,84,0.08)]">
          <div className="border-b border-[#e9edf3] bg-[#0b1838] px-6 py-6 text-white sm:px-9">
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/10 text-[#29d2f2]"><Volume2 className="h-5 w-5" /></span><div><p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-cyan-200/70">FinPilot AI</p><h1 className="mt-1 text-xl font-extrabold tracking-[-0.03em]">Conversație audio</h1></div></div>
            <p className="mt-4 max-w-2xl text-[11px] font-medium leading-5 text-blue-100/65">Formulați întrebarea cu vocea. FinPilot transformă discursul în text, apoi verifică datele contabile și salvează răspunsul în istoricul conversațiilor.</p>
          </div>

          <div className="px-5 py-8 sm:px-9 sm:py-10">
            <div className="flex flex-col items-center text-center">
              <div className={`relative grid h-36 w-36 place-items-center rounded-full transition-colors ${listening ? "bg-cyan-50" : "bg-slate-50"}`}>
                {listening && <><span className="absolute inset-2 animate-ping rounded-full border border-cyan-300/60" /><span className="absolute inset-6 rounded-full bg-cyan-100/60" /></>}
                <button type="button" onClick={listening ? stopListening : startListening} className={`focus-ring relative z-10 grid h-20 w-20 place-items-center rounded-full text-white shadow-[0_14px_35px_rgba(11,24,56,0.22)] transition-all ${listening ? "bg-rose-500 hover:bg-rose-600" : "bg-[#0b1838] hover:scale-105 hover:bg-[#142754]"}`} aria-label={listening ? "Oprește ascultarea" : "Pornește microfonul"}>
                  {listening ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                </button>
              </div>
              <h2 className="mt-5 text-[15px] font-extrabold text-[#0b1838]">{listening ? "Ascult…" : transcript ? "Întrebarea este pregătită" : "Apăsați pentru a vorbi"}</h2>
              <p className="mt-1.5 text-[10px] font-medium text-slate-400">Limba de recunoaștere: română</p>
            </div>

            <div className="mx-auto mt-8 max-w-[720px]">
              <div className="relative rounded-2xl border border-[#e0e5ed] bg-[#fafbfd] p-4 focus-within:border-cyan-300 focus-within:ring-2 focus-within:ring-cyan-100">
                <textarea value={transcript} onChange={(event) => { transcriptRef.current = event.target.value; setTranscript(event.target.value); setState(event.target.value.trim() ? "ready" : "idle"); }} rows={4} placeholder="Textul recunoscut va apărea aici. Îl puteți corecta înainte de trimitere." className="w-full resize-none bg-transparent pr-8 text-[12px] font-medium leading-6 text-[#0b1838] outline-none placeholder:text-slate-400" />
                {transcript && <button type="button" onClick={clearTranscript} aria-label="Șterge textul" className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-4 w-4" /></button>}
                {interim && <p className="mt-2 text-[10px] italic text-slate-400">{interim}</p>}
              </div>

              {error && <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-[10px] font-semibold leading-4 text-rose-700"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

              <button type="button" disabled={!transcript.trim() || listening} onClick={sendQuestion} className="focus-ring mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b1838] text-[11px] font-extrabold text-white hover:bg-[#142754] disabled:cursor-not-allowed disabled:opacity-35"><Send className="h-4 w-4" />Trimite întrebarea către FinPilot</button>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#e7eaf0] p-3.5"><p className="flex items-center gap-2 text-[9px] font-extrabold text-[#0b1838]"><Sparkles className="h-3.5 w-3.5 text-[#0a91b8]" />Date contabile reale</p><p className="mt-1.5 text-[9px] leading-4 text-slate-400">Răspunsul este calculat din datele salvate în Supabase.</p></div>
                <div className="rounded-xl border border-[#e7eaf0] p-3.5"><p className="flex items-center gap-2 text-[9px] font-extrabold text-[#0b1838]"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />Control înainte de trimitere</p><p className="mt-1.5 text-[9px] leading-4 text-slate-400">Textul poate fi verificat și corectat înainte de analiză.</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
