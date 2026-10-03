"use client";

import { CheckCircle2, LoaderCircle, Mail, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createClient } from "@/utils/supabase/client";

type ProfileFormProps = {
  userId: string;
  email: string;
  initialName: string;
};

export function ProfileForm({ userId, email, initialName }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const initial = (name || email || "A").trim().charAt(0).toUpperCase();

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = name.trim();

    if (displayName.length < 2 || displayName.length > 80) {
      setError("Numele trebuie să conțină între 2 și 80 de caractere.");
      setMessage("");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", userId);

    if (updateError) {
      setError("Profilul nu a putut fi salvat. Încercați din nou.");
    } else {
      setName(displayName);
      setSavedName(displayName);
      setMessage("Profilul a fost salvat cu succes.");
      router.refresh();
    }

    setSaving(false);
  }

  return (
    <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <form onSubmit={saveProfile} className="card-shadow overflow-hidden rounded-2xl border border-[#e8ebf2] bg-white">
        <div className="flex items-center gap-4 border-b border-[#eef0f5] px-5 py-5 sm:px-6">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#dff7fd] text-xl font-extrabold text-[#07799e]">{initial}</span>
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-extrabold text-[#0b1838]">{name || "Profilul dvs."}</h2>
            <p className="mt-1 truncate text-[11px] font-medium text-slate-400">{email}</p>
          </div>
        </div>

        <div className="space-y-5 px-5 py-6 sm:px-6">
          <label className="block">
            <span className="mb-2 block text-[11px] font-extrabold text-[#0b1838]">Nume și prenume</span>
            <span className="relative block">
              <UserRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={name} onChange={(event) => { setName(event.target.value); setMessage(""); setError(""); }} maxLength={80} autoComplete="name" className="focus-ring h-11 w-full rounded-xl border border-[#dfe4ec] bg-white pl-10 pr-4 text-xs font-semibold text-[#0b1838] placeholder:text-slate-400" placeholder="Numele dvs." />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-extrabold text-[#0b1838]">E-mail</span>
            <span className="relative block">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={email} readOnly className="h-11 w-full cursor-not-allowed rounded-xl border border-[#e5e9f0] bg-[#f7f9fc] pl-10 pr-4 text-xs font-semibold text-slate-500" />
            </span>
            <span className="mt-2 block text-[9px] font-medium text-slate-400">Această adresă este utilizată pentru autentificare și nu poate fi modificată aici.</span>
          </label>

          {error && <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[10px] font-bold text-rose-700">{error}</p>}
          {message && <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[10px] font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" />{message}</p>}
        </div>

        <div className="flex justify-end border-t border-[#eef0f5] bg-[#fbfcfd] px-5 py-4 sm:px-6">
          <button disabled={saving || name.trim() === savedName.trim()} className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl bg-[#0b1838] px-5 text-xs font-extrabold text-white hover:bg-[#142754] disabled:cursor-not-allowed disabled:opacity-40">
            {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {saving ? "Se salvează..." : "Salvează modificările"}
          </button>
        </div>
      </form>

      <aside className="card-shadow h-fit rounded-2xl border border-[#e8ebf2] bg-white p-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef8fb] text-[#0a8fb7]"><UserRound className="h-5 w-5" /></span>
        <h2 className="mt-4 text-sm font-extrabold text-[#0b1838]">Profil personal</h2>
        <p className="mt-2 text-[10px] leading-5 text-slate-500">Numele apare în meniul contului și identifică acțiunile înregistrate în FinPilot.</p>
      </aside>
    </div>
  );
}
