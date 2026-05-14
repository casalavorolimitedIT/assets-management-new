import InvestmentDetailsAdmin from "@/components/custom/investments/InvestmentDetailsAdmin";
import UserPortfolio from "@/components/custom/portfolio/UserPortfolio";
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
      {profile.role === "USER" ? (
        <UserPortfolio />
      ) : (
        <InvestmentDetailsAdmin profile={profile} />
      )}
    </>
  );
};

export default portfolioDetails;
