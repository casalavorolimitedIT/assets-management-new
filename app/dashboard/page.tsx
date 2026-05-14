import ComplianceCheck from "@/components/custom/ComplianceCheck";
import AdminDashboard from "@/components/custom/dashboard/AdminDashboard";
import { DashboardContent } from "@/components/custom/dashboard/DashboardContent";
import { isAdminRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.user?.id)
    .single();

  const isAdmin = isAdminRole(profile?.role);
  const isVerified = profile?.isVerified ?? false;

  const firstName =
    profile?.first_name ?? authData.user?.email?.split("@")[0] ?? "there";

  return (
    <>
      {!isAdmin && !isVerified && <ComplianceCheck />}
      {isAdmin ? (
        <AdminDashboard />
      ) : (
        <DashboardContent
          firstName={firstName}
          profile={profile}
          compliance={profile?.compliance ?? null}
          isVerified={isVerified}
        />
      )}
    </>
  );
}
