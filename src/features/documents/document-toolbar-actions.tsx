"use client";

import { Download, UploadCloud } from "lucide-react";

export const OPEN_DOCUMENT_UPLOAD_EVENT = "finpilot:open-document-upload";
export const EXPORT_DOCUMENTS_EVENT = "finpilot:export-documents";

export function DocumentToolbarActions() {
  return (
    <>
      <button type="button" onClick={() => window.dispatchEvent(new Event(EXPORT_DOCUMENTS_EVENT))} className="focus-ring flex h-10 items-center gap-2 rounded-xl border border-[#e1e5ed] bg-white px-3.5 text-xs font-bold text-slate-600 hover:bg-slate-50"><Download className="h-4 w-4" />Exportă</button>
      <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_DOCUMENT_UPLOAD_EVENT))} className="focus-ring flex h-10 items-center gap-2 rounded-xl bg-[#0b1838] px-4 text-xs font-bold text-white hover:bg-[#142754]"><UploadCloud className="h-4 w-4" />Încarcă</button>
    </>
  );
}
