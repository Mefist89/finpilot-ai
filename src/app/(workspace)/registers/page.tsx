import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { InvoiceRegisters } from "@/features/registers/invoice-registers";
import { createClient } from "@/utils/supabase/server";

export default async function RegistersPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect("/login");

  const [invoicesResult, itemsResult, profileResult] = await Promise.all([
    supabase.from("invoices").select("id,direction,invoice_number,issue_date,counterparty_name,counterparty_tax_id,currency,subtotal,vat_amount,total_amount,status,created_at").order("issue_date", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("invoice_items").select("id,invoice_id,line_number,product_name,sku,unit,quantity,unit_price,vat_rate,subtotal,vat_amount,total_amount").order("line_number"),
    supabase.from("profiles").select("base_currency").eq("id", userData.user.id).maybeSingle(),
  ]);

  const loadError = invoicesResult.error || itemsResult.error
    ? "Registrele nu au putut fi încărcate. Verificați dacă migrarea bazei de date este aplicată."
    : "";

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <PageHeader eyebrow="Evidența TVA" title="Registrele facturilor" description="Înregistrați facturile primite și emise. Registrele de procurări și vânzări se formează automat." />
      <InvoiceRegisters invoices={invoicesResult.data ?? []} items={itemsResult.data ?? []} baseCurrency={profileResult.data?.base_currency ?? "MDL"} loadError={loadError} />
    </div>
  );
}
