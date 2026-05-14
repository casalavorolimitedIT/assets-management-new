import AdminTransactions from "@/components/custom/transactions/AdminTransactions";
import UserTransactions from "@/components/custom/transactions/UserTransactions";
import { isAdminRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

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
      {isAdminRole(profile?.role) ? (
        <AdminTransactions />
      ) : (
        <UserTransactions />
      )}
    </>
  );
};

export default transactions;
