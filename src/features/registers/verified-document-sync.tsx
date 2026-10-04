"use client";

import { AlertTriangle, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function VerifiedDocumentSync() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function sync() {
      try {
        const response = await fetch("/api/v1/registers/sync", { method: "POST" });
        const result = await response.json() as { created?: number; linked?: number; errors?: string[]; message?: string };
        if (!response.ok) throw new Error(result.message || "Sincronizarea a eșuat.");
        if (!active) return;
        if ((result.created ?? 0) + (result.linked ?? 0) > 0) router.refresh();
        if (result.errors?.length) setError(result.errors.join(" "));
      } catch (syncError) {
        if (active) setError(syncError instanceof Error ? syncError.message : "Sincronizarea a eșuat.");
      } finally {
        if (active) setSyncing(false);
      }
    }

    void sync();
    return () => { active = false; };
  }, [router]);

  if (syncing) return <div role="status" className="mt-5 flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-[10px] font-bold text-sky-700"><LoaderCircle className="h-4 w-4 animate-spin" />Se sincronizează facturile verificate...</div>;
  if (error) return <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[10px] font-bold leading-5 text-amber-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>;
  return null;
}
