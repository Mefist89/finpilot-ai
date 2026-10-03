"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronDown, FileImage, FileSpreadsheet, FileText, Filter, MoreHorizontal, Search, SlidersHorizontal, UploadCloud, X } from "lucide-react";
import { documents as initialDocuments, type DocumentRecord } from "@/lib/mock-data";
import { StatusPill } from "@/components/status-pill";

const filters = ["All", "Ready", "Needs review", "Processing", "Posted"] as const;

export function DocumentInbox() {
  const [documents, setDocuments] = useState(initialDocuments);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const visible = documents.filter((doc) => (filter === "All" || doc.status === filter) && `${doc.fileName} ${doc.counterparty}`.toLowerCase().includes(search.toLowerCase()));

  function addFile(file?: File) {
    if (!file) return;
    setUploading(true);
    window.setTimeout(() => {
      const newDocument: DocumentRecord = { id: `FP-${1049 + documents.length}`, fileName: file.name, type: file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".png") ? "Receipt" : "Invoice", counterparty: "Detecting supplier…", date: "Just now", amount: "Processing…", status: "Processing", confidence: 0 };
      setDocuments((current) => [newDocument, ...current]);
      setUploading(false);
      setUploadOpen(false);
    }, 900);
  }

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#e8ebf2] bg-white p-3 card-shadow lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`focus-ring whitespace-nowrap rounded-lg px-3.5 py-2 text-[11px] font-bold transition-colors ${filter === item ? "bg-[#0b1838] text-white" : "text-slate-500 hover:bg-slate-50"}`}>{item}{item === "Needs review" && <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700">1</span>}</button>)}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:w-[250px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inbox..." className="focus-ring h-9 w-full rounded-lg border border-[#e5e9f0] bg-[#fafbfc] pl-9 pr-3 text-[11px] font-medium text-[#0b1838] placeholder:text-slate-400" />
          </div>
          <button className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-[#e5e9f0] text-slate-500 hover:bg-slate-50" aria-label="Filters"><SlidersHorizontal className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="card-shadow mt-4 overflow-hidden rounded-2xl border border-[#e8ebf2] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead><tr className="border-b border-[#e9ecf2] bg-[#fbfcfd] text-[9px] font-extrabold uppercase tracking-[0.13em] text-slate-400"><th className="w-10 px-5 py-4"><input type="checkbox" aria-label="Select all" className="accent-[#0b1838]" /></th><th className="px-3 py-4">Document</th><th className="px-3 py-4">Type</th><th className="px-3 py-4">Counterparty</th><th className="px-3 py-4">Date</th><th className="px-3 py-4">Amount</th><th className="px-3 py-4">Confidence</th><th className="px-3 py-4">Status</th><th className="w-12 px-3 py-4" /></tr></thead>
            <tbody className="divide-y divide-[#f0f2f6]">
              {visible.map((doc) => {
                const Icon = doc.type === "Receipt" ? FileImage : doc.type === "Bank statement" ? FileSpreadsheet : FileText;
                return (
                  <tr key={doc.id} className="group text-[11px] transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-4"><input type="checkbox" aria-label={`Select ${doc.fileName}`} className="accent-[#0b1838]" /></td>
                    <td className="px-3 py-4"><Link href={`/documents/${doc.id}`} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef8fb] text-[#0a8fb7]"><Icon className="h-[18px] w-[18px]" /></span><span><span className="block max-w-[210px] truncate font-extrabold text-[#0b1838]">{doc.fileName}</span><span className="mt-0.5 block text-[9px] font-medium text-slate-400">{doc.id}</span></span></Link></td>
                    <td className="px-3 py-4 font-semibold text-slate-500">{doc.type}</td>
                    <td className="px-3 py-4 font-bold text-slate-600">{doc.counterparty}</td>
                    <td className="px-3 py-4 font-semibold text-slate-500">{doc.date}</td>
                    <td className="px-3 py-4 font-extrabold text-[#0b1838]">{doc.amount}</td>
                    <td className="px-3 py-4"><div className="flex items-center gap-2"><div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${doc.confidence >= 95 ? "bg-emerald-500" : doc.confidence >= 80 ? "bg-sky-500" : "bg-amber-500"}`} style={{ width: `${doc.confidence}%` }} /></div><span className="font-bold text-slate-500">{doc.confidence ? `${doc.confidence}%` : "—"}</span></div></td>
                    <td className="px-3 py-4"><StatusPill status={doc.status} /></td>
                    <td className="px-3 py-4"><button className="rounded-lg p-2 text-slate-400 opacity-0 hover:bg-white hover:text-slate-700 group-hover:opacity-100" aria-label={`More options for ${doc.fileName}`}><MoreHorizontal className="h-4 w-4" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && <div className="grid place-items-center px-6 py-16 text-center"><Search className="h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-extrabold text-[#0b1838]">No documents found</p><p className="mt-1 text-[11px] text-slate-400">Try another search or status filter.</p></div>}
        <div className="flex items-center justify-between border-t border-[#eef0f5] px-5 py-3.5 text-[10px] font-semibold text-slate-400"><span>Showing {visible.length} of {documents.length} documents</span><div className="flex items-center gap-2"><button className="rounded-lg border border-[#e5e8ef] px-2.5 py-1.5 text-slate-400">Previous</button><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#0b1838] font-bold text-white">1</span><button className="rounded-lg border border-[#e5e8ef] px-2.5 py-1.5 text-slate-600 hover:bg-slate-50">Next</button></div></div>
      </div>

      <button onClick={() => setUploadOpen(true)} className="focus-ring fixed bottom-7 right-6 z-10 flex h-12 items-center gap-2 rounded-xl bg-[#0b1838] px-5 text-xs font-extrabold text-white shadow-[0_12px_30px_rgba(11,24,56,0.24)] hover:bg-[#142754] lg:right-9"><UploadCloud className="h-[18px] w-[18px]" />Upload document</button>

      {uploadOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b1838]/45 p-4 backdrop-blur-sm" onMouseDown={(event) => event.currentTarget === event.target && setUploadOpen(false)}>
          <div className="animate-float-in w-full max-w-[540px] rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between"><div><h2 className="text-lg font-extrabold tracking-tight text-[#0b1838]">Upload a document</h2><p className="mt-1 text-[11px] font-medium text-slate-400">FinPilot will extract, validate and classify it.</p></div><button onClick={() => setUploadOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><X className="h-5 w-5" /></button></div>
            <button onClick={() => inputRef.current?.click()} className="mt-6 grid w-full place-items-center rounded-2xl border-2 border-dashed border-[#b9dfea] bg-[#f4fbfd] px-5 py-12 text-center transition-colors hover:border-[#15afd6] hover:bg-[#eefafd]">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#0a91b8] shadow-sm"><UploadCloud className="h-6 w-6" /></span><span className="mt-4 text-[13px] font-extrabold text-[#0b1838]">Drop a file here or click to browse</span><span className="mt-1.5 text-[10px] font-semibold text-slate-400">PDF, JPG, JPEG or PNG · max 20 MB</span>
            </button>
            <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => addFile(e.target.files?.[0])} />
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-[10px] font-semibold text-slate-500"><Filter className="h-4 w-4 text-[#0a91b8]" /><span>Duplicate detection and sensitive-data protection are enabled.</span><ChevronDown className="ml-auto h-3.5 w-3.5" /></div>
            {uploading && <div className="mt-4 flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 p-3 text-[11px] font-bold text-sky-700"><span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />Securing and uploading your document…</div>}
          </div>
        </div>
      )}
    </>
  );
}
