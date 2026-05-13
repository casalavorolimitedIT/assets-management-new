import InvestmentDetailsAdmin from "@/components/custom/investments/InvestmentDetailsAdmin";
import UserTransactions from "@/components/custom/transactions/UserTransactions";
import { createClient } from "@/lib/supabase/server";
import React from "react";

const transactions = async () => {
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
        <UserTransactions />
      ) : (
        <InvestmentDetailsAdmin profile={profile} />
      )}
    </>
  );
};

export default transactions;
