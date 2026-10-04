import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/features/profile/profile-form";
import { createClient } from "@/utils/supabase/server";

async function signOut() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userData.user.id)
    .maybeSingle();

  const email = userData.user.email ?? "";
  const fallbackName = email.split("@")[0] || "Cont";

  return (
    <div className="mx-auto max-w-[980px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
      <PageHeader eyebrow="Cont" title="Profil personal" description="Modificați numele și verificați adresa de e-mail asociată contului." actions={<form action={signOut}><button type="submit" className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-xs font-extrabold text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" />Ieșire din cont</button></form>} />
      <ProfileForm userId={userData.user.id} email={email} initialName={profile?.display_name?.trim() || fallbackName} />
    </div>
  );
}
