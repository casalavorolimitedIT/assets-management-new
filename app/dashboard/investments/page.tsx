import InvestmentDetails from "@/components/custom/investments/InvestmentDetails";
import InvestmentDetailsAdmin from "@/components/custom/investments/InvestmentDetailsAdmin";
import { createClient } from "@/lib/supabase/server";
import React from "react";

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
      {profile.role === "USER" ? (
        <InvestmentDetails profile={profile} />
      ) : (
        <InvestmentDetailsAdmin profile={profile} />
      )}
    </>
  );
};

export default InvestmentPage;
