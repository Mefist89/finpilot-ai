import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/login-form";
import { createClient } from "@/utils/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
