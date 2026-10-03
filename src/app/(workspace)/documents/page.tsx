import { Download, UploadCloud } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DocumentInbox } from "@/features/documents/document-inbox";

export default function DocumentsPage() {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <PageHeader eyebrow="Document inbox" title="Documents" description="Upload, process and review every source document in one place." actions={<><button className="focus-ring flex h-10 items-center gap-2 rounded-xl border border-[#e1e5ed] bg-white px-3.5 text-xs font-bold text-slate-600 hover:bg-slate-50"><Download className="h-4 w-4" />Export</button><button className="focus-ring flex h-10 items-center gap-2 rounded-xl bg-[#0b1838] px-4 text-xs font-bold text-white hover:bg-[#142754]"><UploadCloud className="h-4 w-4" />Upload</button></>} />
      <DocumentInbox />
    </div>
  );
}
