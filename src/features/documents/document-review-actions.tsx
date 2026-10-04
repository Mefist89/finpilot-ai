"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/utils/supabase/client";

export function DocumentReviewActions({ documentId, verified }: { documentId: string; verified: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function verify() {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase.from("documents").update({ status: "ready" }).eq("id", documentId).eq("status", "needs_review");
    if (updateError) {
      setError("Statutul documentului nu a putut fi actualizat. Încercați din nou.");
      setSaving(false);
      return;
    }
    await supabase.from("audit_events").insert({ entity_type: "document", entity_id: documentId, action: "verified", metadata: {} });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="sticky bottom-0 z-10 mt-7 border-t border-[#e5e9f0] bg-white/95 px-5 py-4 backdrop-blur-md sm:px-7">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-[11px] font-extrabold text-[#0b1838]">{verified ? "Document verificat" : "Confirmați datele extrase"}</p><p className="mt-1 text-[9px] font-medium text-slate-400">{verified ? "Documentul este pregătit pentru următorul pas contabil." : "Verificați furnizorul, data, sumele și pozițiile facturii înainte de confirmare."}</p></div>
        {verified ? <span className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-5 text-[11px] font-extrabold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Verificat</span> : <button type="button" disabled={saving} onClick={() => void verify()} className="focus-ring flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0b1838] px-5 text-[11px] font-extrabold text-white hover:bg-[#142754] disabled:cursor-wait disabled:opacity-60">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{saving ? "Se salvează..." : "Marchează ca verificat"}</button>}
        {error && <p role="alert" className="text-[10px] font-bold text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
