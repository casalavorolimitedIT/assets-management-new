import InvestmentDetails from "@/components/custom/investments/InvestmentDetails";
import InvestmentDetailsAdmin from "@/components/custom/investments/InvestmentDetailsAdmin";
import { isAdminRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const InvestmentPage = async () => {
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
        <InvestmentDetailsAdmin />
      ) : (
        <InvestmentDetails />
      )}
    </>
  );
};

export default InvestmentPage;
