import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: {
        "x-api-gateway-secret": process.env.SUPABASE_API_GATEWAY_SECRET!,
      },
    },
  },
);

export async function GET() {
  const { data: profiles, error } = await serviceClient
    .from("profiles")
    .select("compliance")
    .eq("role", "USER");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let totalAUM = 0;
  let totalPlans = 0;

  for (const profile of profiles ?? []) {
    const c =
      typeof profile.compliance === "string"
        ? (() => {
            try {
              return JSON.parse(profile.compliance);
            } catch {
              return null;
            }
          })()
        : profile.compliance;

    const plans: any[] =
      c?.investment_plans ?? (c?.investment_plan ? [c.investment_plan] : []);

    totalPlans += plans.length;
    for (const plan of plans) {
      totalAUM += plan.total_figures ?? plan.monthly_amount_figures ?? 0;
    }
  }

  return NextResponse.json({
    totalAUM,
    totalInvestors: profiles?.length ?? 0,
    totalPlans,
  });
}
