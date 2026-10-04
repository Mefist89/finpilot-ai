import { PageHeader } from "@/components/page-header";
import { DocumentInbox } from "@/features/documents/document-inbox";
import { DocumentToolbarActions } from "@/features/documents/document-toolbar-actions";
import type { DocumentRecord } from "@/types/accounting";
import { createClient } from "@/utils/supabase/server";

function status(value: string): DocumentRecord["status"] {
  if (value === "posted") return "Posted";
  if (value === "ready") return "Ready";
  if (["uploaded", "processing"].includes(value)) return "Processing";
  return "Needs review";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ro-MD", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function formatMoney(value: number | null, currency: string | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("ro-MD", { style: "currency", currency: currency || "MDL", currencyDisplay: "code", minimumFractionDigits: 2 }).format(Number(value));
}

export default async function DocumentsPage({ searchParams }: PageProps<"/documents">) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("documents").select("id,original_filename,document_type,document_number,counterparty_name,counterparty_tax_id,issue_date,due_date,currency,subtotal,vat_amount,total_amount,status,confidence").order("created_at", { ascending: false });
  const documents: DocumentRecord[] = (data ?? []).map((document) => ({
    id: document.id,
    fileName: document.original_filename,
    type: document.document_type === "receipt" ? "Receipt" : document.document_type === "bank_statement" ? "Bank statement" : "Invoice",
    counterparty: document.counterparty_name || "—",
    date: formatDate(document.issue_date),
    amount: formatMoney(document.total_amount, document.currency),
    status: status(document.status),
    confidence: document.confidence === null ? 0 : Math.round(Number(document.confidence) * 100),
    documentNumber: document.document_number || "",
    counterpartyTaxId: document.counterparty_tax_id || "",
    issueDate: document.issue_date || "",
    dueDate: document.due_date || "",
    currency: document.currency || "MDL",
    subtotal: document.subtotal === null ? null : Number(document.subtotal),
    vatAmount: document.vat_amount === null ? null : Number(document.vat_amount),
    totalAmount: document.total_amount === null ? null : Number(document.total_amount),
  }));

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <PageHeader eyebrow="Registrul documentelor" title="Documente" description="Încărcați, procesați și verificați toate documentele primare într-un singur loc." actions={<DocumentToolbarActions />} />
      <DocumentInbox initialDocuments={documents} initialUploadOpen={params.upload === "1"} />
    </div>
  );
}
