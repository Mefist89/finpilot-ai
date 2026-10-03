import { Download, UploadCloud } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DocumentInbox } from "@/features/documents/document-inbox";

export default function DocumentsPage() {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <PageHeader eyebrow="Registrul documentelor" title="Documente" description="Încărcați, procesați și verificați toate documentele primare într-un singur loc." actions={<><button className="focus-ring flex h-10 items-center gap-2 rounded-xl border border-[#e1e5ed] bg-white px-3.5 text-xs font-bold text-slate-600 hover:bg-slate-50"><Download className="h-4 w-4" />Exportă</button><button className="focus-ring flex h-10 items-center gap-2 rounded-xl bg-[#0b1838] px-4 text-xs font-bold text-white hover:bg-[#142754]"><UploadCloud className="h-4 w-4" />Încarcă</button></>} />
      <DocumentInbox />
    </div>
  );
}
