import { CircleCheck, Clock3, ScanSearch, TriangleAlert } from "lucide-react";
import type { DocumentStatus } from "@/types/accounting";

const styles: Record<DocumentStatus, string> = {
  Ready: "bg-sky-50 text-sky-700 border-sky-100",
  "Needs review": "bg-amber-50 text-amber-700 border-amber-100",
  Posted: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Processing: "bg-violet-50 text-violet-700 border-violet-100",
};

const icons = { Ready: CircleCheck, "Needs review": TriangleAlert, Posted: CircleCheck, Processing: Clock3 } satisfies Record<DocumentStatus, typeof ScanSearch>;

export function StatusPill({ status }: { status: DocumentStatus }) {
  const Icon = icons[status];
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${styles[status]}`}><Icon className="h-3.5 w-3.5" />{status}</span>;
}
