import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { PriceSheetRegister } from "@/features/prices/price-sheet-register";
import { createClient } from "@/utils/supabase/server";

export default async function PricesPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) redirect("/login");

  const [invoicesResult, invoiceItemsResult, sheetsResult, sheetItemsResult, profileResult] = await Promise.all([
    supabase.from("invoices").select("id,invoice_number,issue_date,counterparty_name,currency,total_amount,status").eq("direction", "purchase").neq("status", "cancelled").order("issue_date", { ascending: false }),
    supabase.from("invoice_items").select("id,invoice_id,line_number,product_name,sku,unit,quantity,unit_price,vat_rate").order("line_number"),
    supabase.from("price_sheets").select("id,purchase_invoice_id,sheet_number,sheet_date,status,created_at").order("sheet_date", { ascending: false }).order("sheet_number", { ascending: false }),
    supabase.from("price_sheet_items").select("id,price_sheet_id,line_number,product_name,sku,unit,quantity,purchase_price,additional_cost,markup_percent,vat_rate,sale_price").order("line_number"),
    supabase.from("profiles").select("base_currency").eq("id", userData.user.id).maybeSingle(),
  ]);

  const loadError = [invoicesResult.error, invoiceItemsResult.error, sheetsResult.error, sheetItemsResult.error].some(Boolean)
    ? "Fișele de preț nu au putut fi încărcate. Verificați dacă migrarea bazei de date este aplicată."
    : "";

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <PageHeader eyebrow="Gestiunea mărfurilor" title="Formarea prețurilor" description="Transformați prețul de achiziție din factura furnizorului în preț de vânzare documentat." />
      <PriceSheetRegister invoices={invoicesResult.data ?? []} invoiceItems={invoiceItemsResult.data ?? []} sheets={sheetsResult.data ?? []} sheetItems={sheetItemsResult.data ?? []} baseCurrency={profileResult.data?.base_currency ?? "MDL"} loadError={loadError} />
    </div>
  );
}
