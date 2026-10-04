"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, FileImage, FileSpreadsheet, FileText, Filter, LoaderCircle, MoreHorizontal, Pencil, Save, Search, SlidersHorizontal, Trash2, UploadCloud, X } from "lucide-react";
import type { DocumentRecord } from "@/types/accounting";
import { StatusPill } from "@/components/status-pill";
import { EXPORT_DOCUMENTS_EVENT, OPEN_DOCUMENT_UPLOAD_EVENT } from "@/features/documents/document-toolbar-actions";

const filters = ["All", "Ready", "Needs review", "Processing", "Posted"] as const;
const filterLabels = { All: "Toate", Ready: "Verificate", "Needs review": "Necesită verificare", Processing: "În procesare", Posted: "Contabilizate" } as const;
const documentTypeLabels = { Invoice: "Factură fiscală", Receipt: "Bon fiscal", "Bank statement": "Extras bancar" } as const;

type Extraction = {
  issue_date: string;
  currency: string;
  supplier: { name: string };
  total_amount: number;
  confidence: number;
};

type EditForm = {
  original_filename: string;
  document_number: string;
  counterparty_name: string;
  counterparty_tax_id: string;
  issue_date: string;
  due_date: string;
  currency: string;
  subtotal: string;
  vat_amount: string;
  total_amount: string;
};

function formatDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "—";
  return new Intl.DateTimeFormat("ro-MD", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("ro-MD", { style: "currency", currency: currency || "MDL", currencyDisplay: "code", minimumFractionDigits: 2 }).format(Number(value));
}

export function DocumentInbox({ initialDocuments }: { initialDocuments: DocumentRecord[] }) {
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingDocument, setEditingDocument] = useState<DocumentRecord | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<DocumentRecord | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const openUpload = () => setUploadOpen(true);
    const exportDocuments = () => {
      const statusLabels: Record<DocumentRecord["status"], string> = { Ready: "Verificat", "Needs review": "Necesită verificare", Processing: "În procesare", Posted: "Contabilizat" };
      const rows = documents.map((doc) => [doc.id, doc.fileName, documentTypeLabels[doc.type], doc.counterparty, doc.date, doc.amount, `${doc.confidence}%`, statusLabels[doc.status]]);
      const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
      const csv = [["ID", "Document", "Tip", "Partener", "Data", "Suma", "Nivel de încredere", "Statut"], ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
      const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `registrul-documentelor-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    };

    window.addEventListener(OPEN_DOCUMENT_UPLOAD_EVENT, openUpload);
    window.addEventListener(EXPORT_DOCUMENTS_EVENT, exportDocuments);
    return () => {
      window.removeEventListener(OPEN_DOCUMENT_UPLOAD_EVENT, openUpload);
      window.removeEventListener(EXPORT_DOCUMENTS_EVENT, exportDocuments);
    };
  }, [documents]);

  const visible = documents.filter((doc) => (filter === "All" || doc.status === filter) && `${doc.fileName} ${doc.counterparty}`.toLowerCase().includes(search.toLowerCase()));

  async function addFile(file?: File) {
    if (!file) return;
    setUploadError("");
    setUploadSuccess("");
    setUploading(true);
    const body = new FormData();
    body.set("file", file);

    try {
      const response = await fetch("/api/v1/invoices/extract", { method: "POST", body });
      const result = await response.json() as { documentId?: string; extraction?: Extraction; message?: string };
      if (!response.ok || !result.documentId || !result.extraction) {
        setUploadError(result.message || "Documentul nu a putut fi analizat.");
        return;
      }
      const extraction = result.extraction;
      setDocuments((current) => [{
        id: result.documentId!,
        fileName: file.name,
        type: "Invoice",
        counterparty: extraction.supplier.name || "—",
        date: formatDate(extraction.issue_date),
        amount: formatMoney(extraction.total_amount, extraction.currency),
        status: "Needs review",
        confidence: Math.round(extraction.confidence * 100),
        documentNumber: "",
        counterpartyTaxId: "",
        issueDate: extraction.issue_date,
        dueDate: "",
        currency: extraction.currency || "MDL",
        subtotal: null,
        vatAmount: null,
        totalAmount: extraction.total_amount,
      }, ...current.filter((document) => document.id !== result.documentId)]);
      setUploadSuccess(`Documentul ${file.name} a fost încărcat și analizat. Verificați datele extrase înainte de contabilizare.`);
      setUploadOpen(false);
    } catch {
      setUploadError("Conexiunea cu serviciul de analiză a eșuat. Încercați din nou.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function startEditing(document: DocumentRecord) {
    setOpenMenuId(null);
    setActionError("");
    setEditingDocument(document);
    setEditForm({
      original_filename: document.fileName,
      document_number: document.documentNumber,
      counterparty_name: document.counterparty === "—" ? "" : document.counterparty,
      counterparty_tax_id: document.counterpartyTaxId,
      issue_date: document.issueDate,
      due_date: document.dueDate,
      currency: document.currency,
      subtotal: document.subtotal?.toString() ?? "",
      vat_amount: document.vatAmount?.toString() ?? "",
      total_amount: document.totalAmount?.toString() ?? "",
    });
  }

  async function saveDocument() {
    if (!editingDocument || !editForm) return;
    setSaving(true);
    setActionError("");
    try {
      const response = await fetch(`/api/v1/documents/${editingDocument.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const result = await response.json() as { document?: {
        original_filename: string;
        document_number: string | null;
        counterparty_name: string | null;
        counterparty_tax_id: string | null;
        issue_date: string | null;
        due_date: string | null;
        currency: string | null;
        subtotal: number | null;
        vat_amount: number | null;
        total_amount: number | null;
      }; message?: string };
      if (!response.ok || !result.document) {
        setActionError(result.message || "Documentul nu a putut fi actualizat.");
        return;
      }
      const updated = result.document;
      setDocuments((current) => current.map((document) => document.id === editingDocument.id ? {
        ...document,
        fileName: updated.original_filename,
        documentNumber: updated.document_number || "",
        counterparty: updated.counterparty_name || "—",
        counterpartyTaxId: updated.counterparty_tax_id || "",
        issueDate: updated.issue_date || "",
        dueDate: updated.due_date || "",
        date: updated.issue_date ? formatDate(updated.issue_date) : "—",
        currency: updated.currency || "MDL",
        subtotal: updated.subtotal === null ? null : Number(updated.subtotal),
        vatAmount: updated.vat_amount === null ? null : Number(updated.vat_amount),
        totalAmount: updated.total_amount === null ? null : Number(updated.total_amount),
        amount: updated.total_amount === null ? "—" : formatMoney(Number(updated.total_amount), updated.currency || "MDL"),
      } : document));
      setEditingDocument(null);
      setEditForm(null);
      setActionMessage("Datele documentului au fost actualizate.");
    } catch {
      setActionError("Conexiunea a eșuat. Încercați din nou.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDocument() {
    if (!deletingDocument) return;
    setDeleting(true);
    setActionError("");
    try {
      const response = await fetch(`/api/v1/documents/${deletingDocument.id}`, { method: "DELETE" });
      const result = await response.json() as { deleted?: boolean; message?: string };
      if ((!response.ok && response.status !== 207) || !result.deleted) {
        setActionError(result.message || "Documentul nu a putut fi șters.");
        return;
      }
      setDocuments((current) => current.filter((document) => document.id !== deletingDocument.id));
      setDeletingDocument(null);
      setActionMessage(result.message || "Documentul a fost șters.");
    } catch {
      setActionError("Conexiunea a eșuat. Încercați din nou.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#e8ebf2] bg-white p-3 card-shadow lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`focus-ring whitespace-nowrap rounded-lg px-3.5 py-2 text-[11px] font-bold transition-colors ${filter === item ? "bg-[#0b1838] text-white" : "text-slate-500 hover:bg-slate-50"}`}>{filterLabels[item]}</button>)}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 lg:w-[250px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Caută în registru..." className="focus-ring h-9 w-full rounded-lg border border-[#e5e9f0] bg-[#fafbfc] pl-9 pr-3 text-[11px] font-medium text-[#0b1838] placeholder:text-slate-400" />
          </div>
          <button className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-[#e5e9f0] text-slate-500 hover:bg-slate-50" aria-label="Filtre"><SlidersHorizontal className="h-4 w-4" /></button>
        </div>
      </div>

      {uploadSuccess && <div role="status" className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-[11px] font-semibold leading-5 text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span className="flex-1">{uploadSuccess}</span><button onClick={() => setUploadSuccess("")} aria-label="Închide mesajul" className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-100"><X className="h-3.5 w-3.5" /></button></div>}
      {actionMessage && <div role="status" className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-[11px] font-semibold leading-5 text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span className="flex-1">{actionMessage}</span><button onClick={() => setActionMessage("")} aria-label="Închide mesajul" className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-100"><X className="h-3.5 w-3.5" /></button></div>}
      {actionError && !editingDocument && !deletingDocument && <div role="alert" className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-[11px] font-semibold leading-5 text-red-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span className="flex-1">{actionError}</span><button onClick={() => setActionError("")} aria-label="Închide mesajul" className="rounded-lg p-1 text-red-500 hover:bg-red-100"><X className="h-3.5 w-3.5" /></button></div>}

      <div className="card-shadow mt-4 overflow-hidden rounded-2xl border border-[#e8ebf2] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead><tr className="border-b border-[#e9ecf2] bg-[#fbfcfd] text-[9px] font-extrabold uppercase tracking-[0.13em] text-slate-400"><th className="w-10 px-5 py-4"><input type="checkbox" aria-label="Selectează toate" className="accent-[#0b1838]" /></th><th className="px-3 py-4">Document</th><th className="px-3 py-4">Tip</th><th className="px-3 py-4">Partener</th><th className="px-3 py-4">Data</th><th className="px-3 py-4">Suma</th><th className="px-3 py-4">Nivel de încredere</th><th className="px-3 py-4">Statut</th><th className="w-12 px-3 py-4" /></tr></thead>
            <tbody className="divide-y divide-[#f0f2f6]">
              {visible.map((doc) => {
                const Icon = doc.type === "Receipt" ? FileImage : doc.type === "Bank statement" ? FileSpreadsheet : FileText;
                return (
                  <tr key={doc.id} className="group text-[11px] transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-4"><input type="checkbox" aria-label={`Selectează ${doc.fileName}`} className="accent-[#0b1838]" /></td>
                    <td className="px-3 py-4"><Link href={`/documents/${doc.id}`} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef8fb] text-[#0a8fb7]"><Icon className="h-[18px] w-[18px]" /></span><span><span className="block max-w-[210px] truncate font-extrabold text-[#0b1838]">{doc.fileName}</span><span className="mt-0.5 block text-[9px] font-medium text-slate-400">{doc.id}</span></span></Link></td>
                    <td className="px-3 py-4 font-semibold text-slate-500">{documentTypeLabels[doc.type]}</td>
                    <td className="px-3 py-4 font-bold text-slate-600">{doc.counterparty}</td>
                    <td className="px-3 py-4 font-semibold text-slate-500">{doc.date}</td>
                    <td className="px-3 py-4 font-extrabold text-[#0b1838]">{doc.amount}</td>
                    <td className="px-3 py-4"><div className="flex items-center gap-2"><div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${doc.confidence >= 95 ? "bg-emerald-500" : doc.confidence >= 80 ? "bg-sky-500" : "bg-amber-500"}`} style={{ width: `${doc.confidence}%` }} /></div><span className="font-bold text-slate-500">{doc.confidence ? `${doc.confidence}%` : "—"}</span></div></td>
                    <td className="px-3 py-4"><Link href={`/documents/${doc.id}`} aria-label={`Deschide ${doc.fileName} pentru verificare`} className="focus-ring inline-flex rounded-full"><StatusPill status={doc.status} /></Link></td>
                    <td className="relative px-3 py-4">
                      <button onClick={() => setOpenMenuId((current) => current === doc.id ? null : doc.id)} aria-expanded={openMenuId === doc.id} className={`rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700 ${openMenuId === doc.id ? "bg-white text-slate-700 opacity-100 shadow-sm" : "opacity-0 group-hover:opacity-100 focus:opacity-100"}`} aria-label={`Mai multe opțiuni pentru ${doc.fileName}`}><MoreHorizontal className="h-4 w-4" /></button>
                      {openMenuId === doc.id && <div className="absolute right-3 top-12 z-30 w-36 overflow-hidden rounded-xl border border-[#e5e9f0] bg-white p-1.5 shadow-[0_12px_35px_rgba(11,24,56,0.16)]">
                        <button onClick={() => startEditing(doc)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[11px] font-bold text-[#0b1838] hover:bg-slate-50"><Pencil className="h-3.5 w-3.5 text-[#0a91b8]" />Editare</button>
                        <button onClick={() => { setOpenMenuId(null); setActionError(""); setDeletingDocument(doc); }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[11px] font-bold text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" />Ștergere</button>
                      </div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && <div className="grid place-items-center px-6 py-16 text-center"><FileText className="h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-extrabold text-[#0b1838]">Nu există încă documente</p><p className="mt-1 text-[11px] text-slate-400">Documentele încărcate vor apărea aici.</p></div>}
        <div className="flex items-center justify-between border-t border-[#eef0f5] px-5 py-3.5 text-[10px] font-semibold text-slate-400"><span>{documents.length} {documents.length === 1 ? "document" : "documente"}</span></div>
      </div>

      <button onClick={() => setUploadOpen(true)} className="focus-ring fixed bottom-7 right-6 z-10 flex h-12 items-center gap-2 rounded-xl bg-[#0b1838] px-5 text-xs font-extrabold text-white shadow-[0_12px_30px_rgba(11,24,56,0.24)] hover:bg-[#142754] lg:right-9"><UploadCloud className="h-[18px] w-[18px]" />Încarcă document</button>

      {uploadOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b1838]/45 p-4 backdrop-blur-sm" onMouseDown={(event) => event.currentTarget === event.target && setUploadOpen(false)}>
          <div className="animate-float-in w-full max-w-[540px] rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between"><div><h2 className="text-lg font-extrabold tracking-tight text-[#0b1838]">Încarcă un document</h2><p className="mt-1 text-[11px] font-medium text-slate-400">FinPilot va extrage, verifica și clasifica datele.</p></div><button onClick={() => setUploadOpen(false)} aria-label="Închide" className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><X className="h-5 w-5" /></button></div>
            <button disabled={uploading} onClick={() => inputRef.current?.click()} className="mt-6 grid w-full place-items-center rounded-2xl border-2 border-dashed border-[#b9dfea] bg-[#f4fbfd] px-5 py-12 text-center transition-colors hover:border-[#15afd6] hover:bg-[#eefafd] disabled:cursor-wait disabled:opacity-65">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#0a91b8] shadow-sm">{uploading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}</span><span className="mt-4 text-[13px] font-extrabold text-[#0b1838]">{uploading ? "FinPilot analizează documentul..." : "Trageți fișierul aici sau selectați-l"}</span><span className="mt-1.5 text-[10px] font-semibold text-slate-400">PDF, JPG, JPEG sau PNG · maximum 20 MB</span>
            </button>
            <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" disabled={uploading} onChange={(e) => void addFile(e.target.files?.[0])} />
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-[10px] font-semibold text-slate-500"><Filter className="h-4 w-4 text-[#0a91b8]" /><span>Detectarea duplicatelor și protecția datelor sensibile sunt active.</span><ChevronDown className="ml-auto h-3.5 w-3.5" /></div>
            {uploadError && <div role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-bold text-amber-700">{uploadError}</div>}
          </div>
        </div>
      )}

      {editingDocument && editForm && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#0b1838]/45 p-4 backdrop-blur-sm" onMouseDown={(event) => event.currentTarget === event.target && !saving && setEditingDocument(null)}>
          <div className="animate-float-in my-6 w-full max-w-[650px] rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between"><div><h2 className="text-lg font-extrabold tracking-tight text-[#0b1838]">Editare document</h2><p className="mt-1 text-[11px] font-medium text-slate-400">Corectați datele extrase din document.</p></div><button disabled={saving} onClick={() => setEditingDocument(null)} aria-label="Închide" className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 disabled:opacity-50"><X className="h-5 w-5" /></button></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Denumire afișată *</span><input value={editForm.original_filename} onChange={(event) => setEditForm({ ...editForm, original_filename: event.target.value })} className="focus-ring h-11 w-full rounded-xl border border-[#dfe4ec] px-3.5 text-xs font-semibold text-[#0b1838]" /></label>
              <label><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Numărul documentului</span><input value={editForm.document_number} onChange={(event) => setEditForm({ ...editForm, document_number: event.target.value })} className="focus-ring h-11 w-full rounded-xl border border-[#dfe4ec] px-3.5 text-xs font-semibold text-[#0b1838]" /></label>
              <label><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">IDNO / Cod fiscal</span><input value={editForm.counterparty_tax_id} onChange={(event) => setEditForm({ ...editForm, counterparty_tax_id: event.target.value })} className="focus-ring h-11 w-full rounded-xl border border-[#dfe4ec] px-3.5 text-xs font-semibold text-[#0b1838]" /></label>
              <label className="sm:col-span-2"><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Partener *</span><input value={editForm.counterparty_name} onChange={(event) => setEditForm({ ...editForm, counterparty_name: event.target.value })} className="focus-ring h-11 w-full rounded-xl border border-[#dfe4ec] px-3.5 text-xs font-semibold text-[#0b1838]" /></label>
              <label><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Data emiterii</span><input type="date" value={editForm.issue_date} onChange={(event) => setEditForm({ ...editForm, issue_date: event.target.value })} className="focus-ring h-11 w-full rounded-xl border border-[#dfe4ec] px-3.5 text-xs font-semibold text-[#0b1838]" /></label>
              <label><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Data scadenței</span><input type="date" value={editForm.due_date} onChange={(event) => setEditForm({ ...editForm, due_date: event.target.value })} className="focus-ring h-11 w-full rounded-xl border border-[#dfe4ec] px-3.5 text-xs font-semibold text-[#0b1838]" /></label>
              <label><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Subtotal</span><input type="number" min="0" step="0.01" value={editForm.subtotal} onChange={(event) => setEditForm({ ...editForm, subtotal: event.target.value })} className="focus-ring h-11 w-full rounded-xl border border-[#dfe4ec] px-3.5 text-xs font-semibold text-[#0b1838]" /></label>
              <label><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">TVA</span><input type="number" min="0" step="0.01" value={editForm.vat_amount} onChange={(event) => setEditForm({ ...editForm, vat_amount: event.target.value })} className="focus-ring h-11 w-full rounded-xl border border-[#dfe4ec] px-3.5 text-xs font-semibold text-[#0b1838]" /></label>
              <label><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Total *</span><input type="number" min="0" step="0.01" value={editForm.total_amount} onChange={(event) => setEditForm({ ...editForm, total_amount: event.target.value })} className="focus-ring h-11 w-full rounded-xl border border-[#dfe4ec] px-3.5 text-xs font-semibold text-[#0b1838]" /></label>
              <label><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Moneda *</span><input maxLength={3} value={editForm.currency} onChange={(event) => setEditForm({ ...editForm, currency: event.target.value.toUpperCase() })} className="focus-ring h-11 w-full rounded-xl border border-[#dfe4ec] px-3.5 text-xs font-semibold uppercase text-[#0b1838]" /></label>
            </div>
            {actionError && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] font-bold text-red-700">{actionError}</div>}
            <div className="mt-6 flex justify-end gap-2"><button disabled={saving} onClick={() => setEditingDocument(null)} className="rounded-xl border border-[#dfe4ec] px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Anulează</button><button disabled={saving} onClick={() => void saveDocument()} className="flex items-center gap-2 rounded-xl bg-[#0b1838] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#142754] disabled:cursor-wait disabled:opacity-65">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Se salvează..." : "Salvează"}</button></div>
          </div>
        </div>
      )}

      {deletingDocument && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b1838]/45 p-4 backdrop-blur-sm" onMouseDown={(event) => event.currentTarget === event.target && !deleting && setDeletingDocument(null)}>
          <div className="animate-float-in w-full max-w-[440px] rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600"><Trash2 className="h-5 w-5" /></div>
            <h2 className="mt-5 text-lg font-extrabold tracking-tight text-[#0b1838]">Ștergeți documentul?</h2>
            <p className="mt-2 text-[11px] font-medium leading-5 text-slate-500">Fișierul <strong className="text-[#0b1838]">{deletingDocument.fileName}</strong> și datele extrase vor fi eliminate. Operațiunile contabile deja create vor fi păstrate.</p>
            {actionError && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] font-bold text-red-700">{actionError}</div>}
            <div className="mt-6 flex justify-end gap-2"><button disabled={deleting} onClick={() => setDeletingDocument(null)} className="rounded-xl border border-[#dfe4ec] px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Anulează</button><button disabled={deleting} onClick={() => void deleteDocument()} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-65">{deleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}{deleting ? "Se șterge..." : "Șterge documentul"}</button></div>
          </div>
        </div>
      )}
    </>
  );
}
