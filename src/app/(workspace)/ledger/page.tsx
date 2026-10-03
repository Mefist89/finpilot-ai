import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { OperationJournal } from "@/features/ledger/operation-journal";
import { createClient } from "@/utils/supabase/server";

export default async function LedgerPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/login");
  }

  const [accountsResult, entriesResult, linesResult, documentsResult, profileResult] = await Promise.all([
    supabase.from("accounts").select("id,code,name,account_type,is_active").order("code"),
    supabase.from("ledger_entries").select("id,entry_number,entry_date,description,status,source_document_id,created_at").order("entry_date", { ascending: false }).order("entry_number", { ascending: false }),
    supabase.from("ledger_lines").select("id,entry_id,account_id,line_number,debit,credit,currency").order("line_number"),
    supabase.from("documents").select("id,original_filename,document_number,issue_date,status").order("created_at", { ascending: false }).limit(100),
    supabase.from("profiles").select("base_currency").eq("id", userData.user.id).maybeSingle(),
  ]);

  const loadError = [accountsResult.error, entriesResult.error, linesResult.error, documentsResult.error].some(Boolean)
    ? "Unele date din jurnal nu au putut fi încărcate. Reîncărcați pagina."
    : "";

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <PageHeader eyebrow="Registre contabile" title="Jurnalul operațiunilor" description="Înregistrați fiecare operațiune prin debit și credit și păstrați legătura cu documentul-sursă." />
      <OperationJournal accounts={accountsResult.data ?? []} documents={documentsResult.data ?? []} entries={entriesResult.data ?? []} lines={linesResult.data ?? []} baseCurrency={profileResult.data?.base_currency ?? "MDL"} loadError={loadError} />
    </div>
  );
}
