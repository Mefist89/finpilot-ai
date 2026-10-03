import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { CompanyProfileForm } from "@/features/settings/company-profile-form";
import { createClient } from "@/utils/supabase/server";

export default async function CompanySettingsPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_name,idno,vat_code,base_currency,fiscal_year_start")
    .eq("id", userData.user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-[980px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <PageHeader eyebrow="Setări" title="Profilul companiei" description="Completați datele juridice și contabile utilizate în aplicație." />
      <CompanyProfileForm
        userId={userData.user.id}
        initialValues={{
          companyName: profile?.company_name ?? "",
          idno: profile?.idno ?? "",
          vatCode: profile?.vat_code ?? "",
          baseCurrency: profile?.base_currency ?? "MDL",
          fiscalYearStart: profile?.fiscal_year_start ?? 1,
        }}
      />
    </div>
  );
}
