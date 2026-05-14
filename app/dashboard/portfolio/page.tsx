import AdminPortfolio from "@/components/custom/portfolio/AdminPortfolio";
import UserPortfolio from "@/components/custom/portfolio/UserPortfolio";
import { isAdminRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const portfolioDetails = async () => {
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
        <AdminPortfolio />
      ) : (
        <UserPortfolio />
      )}
    </>
  );
};

export default portfolioDetails;
