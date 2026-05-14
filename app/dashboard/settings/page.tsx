import InvestmentDetailsAdmin from "@/components/custom/investments/InvestmentDetailsAdmin";
import Settings from "@/components/custom/settings/Settings";
import { isAdminRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const settings = async () => {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.user?.id)
    .single();

  return (
    <>
      {isAdminRole(profile?.role) ? (
        <InvestmentDetailsAdmin profile={profile} />
      ) : (
        <Settings />
      )}
    </>
  );
};

export default settings;
