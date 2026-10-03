import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { createClient } from "@/utils/supabase/server";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const userId = data.claims.sub;
  const email = typeof data.claims.email === "string" ? data.claims.email : "";
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name,company_name,idno,base_currency")
    .eq("id", userId)
    .maybeSingle();

  const fallbackName = email.split("@")[0] || "Cont";

  return (
    <AppShell
      account={{ name: profile?.display_name?.trim() || fallbackName, email }}
      workspace={{
        companyName: profile?.company_name?.trim() || "",
        idno: profile?.idno?.trim() || "",
        baseCurrency: profile?.base_currency || "MDL",
      }}
    >
      {children}
    </AppShell>
  );
}
