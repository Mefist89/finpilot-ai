"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Bot, Check, CircleAlert, Eye, EyeOff, FileCheck2, Loader2, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";

const demoCredentials = {
  email: "admin@finpilot.ai",
  password: "demo2026",
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedEmail = String(formData.get("email") ?? "").trim();
    const submittedPassword = String(formData.get("password") ?? "");
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: submittedEmail, password: submittedPassword, remember }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.message ?? "Unable to sign in. Check your credentials.");
        return;
      }

      const storage = remember ? window.localStorage : window.sessionStorage;
      storage.setItem("finpilot_demo_session", JSON.stringify(result.user));
      router.replace("/dashboard");
    } catch {
      setError("The sign-in service is unavailable. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function useDemoAccount() {
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
    setError("");
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(420px,0.94fr)_minmax(520px,1.06fr)]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#081632] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div aria-hidden className="absolute -left-32 -top-36 h-[430px] w-[430px] rounded-full border border-cyan-300/10 bg-cyan-400/[0.04]" />
        <div aria-hidden className="absolute -bottom-44 -right-28 h-[520px] w-[520px] rounded-full border border-violet-300/10 bg-violet-400/[0.04]" />
        <div aria-hidden className="absolute right-[12%] top-[18%] h-2 w-2 rounded-full bg-[#22d3f5] shadow-[0_0_28px_7px_rgba(34,211,245,0.28)]" />

        <div className="relative z-10">
          <Link href="/login" aria-label="FinPilot AI home" className="inline-block rounded-xl bg-white px-4 py-2.5">
            <Image src="/finpilot-logo.png" alt="FinPilot AI" width={202} height={67} className="h-auto w-[180px]" priority />
          </Link>
        </div>

        <div className="relative z-10 max-w-[560px] py-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.07] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-200"><Sparkles className="h-3.5 w-3.5" />Autonomous accounting</span>
          <h1 className="mt-7 text-[44px] font-extrabold leading-[1.08] tracking-[-0.045em] xl:text-[52px]">Your books, always<br /><span className="text-[#2bd1f2]">ready and explainable.</span></h1>
          <p className="mt-6 max-w-[490px] text-sm font-medium leading-7 text-blue-100/65">FinPilot turns source documents into verified accounting entries, while you stay in control of every exception and approval.</p>

          <div className="mt-10 grid max-w-[520px] gap-3 sm:grid-cols-3">
            {[{ icon: FileCheck2, value: "87%", label: "automated" }, { icon: ShieldCheck, value: "100%", label: "traceable" }, { icon: Bot, value: "24/7", label: "copilot" }].map((item) => <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-sm"><item.icon className="h-5 w-5 text-[#2bd1f2]" /><strong className="mt-4 block text-xl font-extrabold tracking-[-0.04em]">{item.value}</strong><span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-blue-100/45">{item.label}</span></div>)}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[9px] font-semibold text-blue-100/35"><span>© 2026 FinPilot AI</span><span className="flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5" />Encrypted · Auditable · Tenant-isolated</span></div>
      </section>

      <section className="flex min-h-screen flex-col bg-[#f8f9fc]">
        <header className="flex h-[76px] items-center justify-between px-5 sm:px-9 lg:justify-end">
          <Link href="/login" aria-label="FinPilot AI home" className="rounded-lg bg-white px-3 py-2 shadow-sm lg:hidden"><Image src="/finpilot-logo.png" alt="FinPilot AI" width={160} height={53} className="h-auto w-[138px]" priority /></Link>
          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400"><ShieldCheck className="h-4 w-4 text-emerald-500" />Secure workspace</div>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-9 lg:pb-[76px]">
          <div className="w-full max-w-[440px] animate-float-in">
            <div className="mb-7">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#0a91b8]">Welcome back</p>
              <h2 className="mt-2.5 text-[30px] font-extrabold tracking-[-0.045em] text-[#0b1838] sm:text-[34px]">Sign in to FinPilot</h2>
              <p className="mt-2 text-xs font-medium text-slate-500">Access your company’s accounting workspace.</p>
            </div>

            <form onSubmit={submit} className="card-shadow rounded-3xl border border-[#e5e8ef] bg-white p-6 sm:p-8" noValidate>
              <label htmlFor="email" className="block text-[10px] font-extrabold text-[#0b1838]">Email address</label>
              <div className="relative mt-2">
                <Mail className="absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-400" />
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" className="focus-ring h-12 w-full rounded-xl border border-[#dfe4eb] bg-[#fbfcfe] pl-11 pr-4 text-[12px] font-semibold text-[#0b1838] outline-none placeholder:font-medium placeholder:text-slate-400 focus:border-[#13bfe9]" />
              </div>

              <div className="mt-5 flex items-center justify-between"><label htmlFor="password" className="text-[10px] font-extrabold text-[#0b1838]">Password</label><button type="button" className="text-[9px] font-extrabold text-[#0788ae] hover:underline">Forgot password?</button></div>
              <div className="relative mt-2">
                <LockKeyhole className="absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-400" />
                <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="focus-ring h-12 w-full rounded-xl border border-[#dfe4eb] bg-[#fbfcfe] pl-11 pr-12 text-[12px] font-semibold text-[#0b1838] outline-none placeholder:font-medium placeholder:text-slate-400 focus:border-[#13bfe9]" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="focus-ring absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>

              <label className="mt-4 inline-flex cursor-pointer items-center gap-2.5 text-[10px] font-semibold text-slate-500"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 rounded accent-[#0b1838]" />Keep me signed in on this device</label>

              {error && <div role="alert" aria-live="polite" className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-3 text-[10px] font-semibold leading-4 text-rose-700"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

              <button type="submit" disabled={pending} className="focus-ring mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b1838] text-[11px] font-extrabold text-white shadow-[0_10px_24px_rgba(11,24,56,0.18)] transition-all hover:bg-[#142754] disabled:cursor-not-allowed disabled:opacity-45">{pending ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</> : <>Sign in to workspace <ArrowRight className="h-4 w-4" /></>}</button>

              <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-slate-100" /><span className="text-[8px] font-extrabold uppercase tracking-[0.16em] text-slate-300">Hackathon demo</span><span className="h-px flex-1 bg-slate-100" /></div>

              <button type="button" onClick={useDemoAccount} className="focus-ring flex w-full items-center gap-3 rounded-xl border border-[#dcecf1] bg-[#f4fbfd] px-3.5 py-3 text-left hover:border-[#b6dfeb]">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-[#0793ba] shadow-sm"><Sparkles className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><b className="block text-[10px] text-[#0b1838]">Use demo account</b><span className="mt-0.5 block truncate text-[9px] font-medium text-slate-400">admin@finpilot.ai · demo2026</span></span>
                <Check className={`h-4 w-4 ${email === demoCredentials.email && password === demoCredentials.password ? "text-emerald-500" : "text-slate-300"}`} />
              </button>
            </form>

            <p className="mt-6 text-center text-[9px] font-medium leading-4 text-slate-400">By signing in, you agree to FinPilot’s <button className="font-bold text-slate-600 hover:underline">Terms of Service</button> and <button className="font-bold text-slate-600 hover:underline">Privacy Policy</button>.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
