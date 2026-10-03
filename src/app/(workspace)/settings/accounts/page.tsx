import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { ChartOfAccounts } from "@/features/settings/chart-of-accounts";
import { createClient } from "@/utils/supabase/server";

export default async function AccountsSettingsPage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/login");
  }

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id,code,name,account_type,is_active")
    .order("code");

  return (
    <div className="mx-auto max-w-[1050px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <PageHeader eyebrow="Setări" title="Plan de conturi" description="Creați și administrați conturile utilizate pentru înregistrările contabile." />
      <ChartOfAccounts userId={userData.user.id} initialAccounts={accounts ?? []} />
    </div>
  );
}
