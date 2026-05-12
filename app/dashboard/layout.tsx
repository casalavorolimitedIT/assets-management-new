import { redirectIfNotAuthenticated } from "@/lib/redirect/redirectIfNotAuthenticated";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/custom/dashboard/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfNotAuthenticated();

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, title")
    .eq("id", authData.user?.id)
    .single();

  const displayName =
    profile?.first_name && profile?.last_name
      ? `${profile.title ? profile.title + " " : ""}${profile.first_name} ${profile.last_name}`
      : (authData.user?.email ?? "User");

  return (
    <DashboardShell
      user={{
        name: displayName,
        email: authData.user?.email ?? "",
        initials:
          (profile?.first_name?.[0]?.toUpperCase() ?? "") +
          (profile?.last_name?.[0]?.toUpperCase() ?? "") || "U",
      }}
    >
      {children}
    </DashboardShell>
  );
}
