import InvestmentDetailsAdmin from "@/components/custom/investments/InvestmentDetailsAdmin";
import Settings from "@/components/custom/settings/Settings";
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
      {profile.role === "USER" ? (
        <Settings />
      ) : (
        <InvestmentDetailsAdmin profile={profile} />
      )}
    </>
  );
};

export default settings;
