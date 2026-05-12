import { createClient } from "@/lib/supabase/server";
import VerificationForm from "./VerificationForm";

export default async function VerificationPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, phone")
    .eq("id", authData.user?.id)
    .single();

  return (
    <VerificationForm
      prefillEmail={profile?.email ?? authData.user?.email ?? ""}
      prefillPhone={profile?.phone ?? ""}
    />
  );
}
