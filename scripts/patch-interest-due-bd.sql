-- ============================================================
-- Patch: Add interest_due_bd to seeded investor plans
-- Run this in the Supabase SQL Editor (service-role access).
--
-- Values taken directly from the PDF schedule column
-- "INTEREST DUE B/D" (interest owed from prior periods).
-- Only investors with a non-zero B/D are listed here.
--
-- How it works:
--   jsonb_set patches the compliance JSONB in place without
--   touching any other fields. The fourth argument (true) means
--   "create the key if it doesn't already exist".
-- ============================================================


-- 1. ABDULRASHEED NAFISAT — ₦18,750.00 B/D (plan[0])
UPDATE public.profiles
SET compliance = jsonb_set(
    jsonb_set(
        compliance,
        '{investment_plans,0,interest_due_bd}',
        '18750.00'::jsonb,
        true
    ),
    '{investment_plan,interest_due_bd}',
    '18750.00'::jsonb,
    true
)
WHERE email = 'abdulrasheed.nafisat@casalavoro.import';


-- 2. ARAFAT OYINDAMOLA AWOJOBI — ₦3,000.00 B/D (plan[0])
UPDATE public.profiles
SET compliance = jsonb_set(
    jsonb_set(
        compliance,
        '{investment_plans,0,interest_due_bd}',
        '3000.00'::jsonb,
        true
    ),
    '{investment_plan,interest_due_bd}',
    '3000.00'::jsonb,
    true
)
WHERE email = 'arafat.awojobi@casalavoro.import';


-- 3. DEBORAH OLUWASEUN WILLIAMS — ₦49,507,270.79 B/D
--    This is on plan[1] (White Crust, 48M plan started 2023-03-22).
--    plan[0] (Casalavoro) has zero B/D so is left unchanged.
UPDATE public.profiles
SET compliance = jsonb_set(
    compliance,
    '{investment_plans,1,interest_due_bd}',
    '49507270.79'::jsonb,
    true
)
WHERE email = 'deborah.williams@casalavoro.import';


-- 4. OLADIMEJI AND SONS NIGERIA LTD — ₦6,927,083.33 B/D (plan[0])
UPDATE public.profiles
SET compliance = jsonb_set(
    jsonb_set(
        compliance,
        '{investment_plans,0,interest_due_bd}',
        '6927083.33'::jsonb,
        true
    ),
    '{investment_plan,interest_due_bd}',
    '6927083.33'::jsonb,
    true
)
WHERE email = 'oladimeji.sons@casalavoro.import';


-- 5. Akintunde Williams — ₦360,000.00 B/D (plan[0])
UPDATE public.profiles
SET compliance = jsonb_set(
    jsonb_set(
        compliance,
        '{investment_plans,0,interest_due_bd}',
        '360000.00'::jsonb,
        true
    ),
    '{investment_plan,interest_due_bd}',
    '360000.00'::jsonb,
    true
)
WHERE email = 'akintunde.williams@whitecrust.import';


-- 6. ANIEFIOK IMEH IDIONG — ₦16,666.67 B/D
--    plan[0] = Premium Plus (started 2022-11-01, the long-running one).
--    plan[1] = REIF (started 2024-01-30) has zero B/D.
UPDATE public.profiles
SET compliance = jsonb_set(
    jsonb_set(
        compliance,
        '{investment_plans,0,interest_due_bd}',
        '16666.67'::jsonb,
        true
    ),
    '{investment_plan,interest_due_bd}',
    '16666.67'::jsonb,
    true
)
WHERE email = 'aniefiok.idiong@whitecrust.import';


-- 7. Comfort Okekwue — ₦100,000.00 B/D
--    plan[0] = Premium Plus 30M (started 2024-01-02).
--    plan[1] (started 2026-05-11) has zero B/D.
UPDATE public.profiles
SET compliance = jsonb_set(
    jsonb_set(
        compliance,
        '{investment_plans,0,interest_due_bd}',
        '100000.00'::jsonb,
        true
    ),
    '{investment_plan,interest_due_bd}',
    '100000.00'::jsonb,
    true
)
WHERE email = 'comfort.okekwue@whitecrust.import';


-- 8. Daku Kpanache — ₦100,000.00 B/D (plan[0])
UPDATE public.profiles
SET compliance = jsonb_set(
    jsonb_set(
        compliance,
        '{investment_plans,0,interest_due_bd}',
        '100000.00'::jsonb,
        true
    ),
    '{investment_plan,interest_due_bd}',
    '100000.00'::jsonb,
    true
)
WHERE email = 'daku.kpanache@whitecrust.import';


-- ── Verification query ────────────────────────────────────────
-- Run this afterwards to confirm all 8 updates landed:
SELECT
    email,
    (compliance -> 'investment_plan' ->> 'interest_due_bd')::numeric  AS bd_plan,
    jsonb_path_query_array(
        compliance,
        '$.investment_plans[*].interest_due_bd'
    ) AS bd_plans_array
FROM public.profiles
WHERE email IN (
    'abdulrasheed.nafisat@casalavoro.import',
    'arafat.awojobi@casalavoro.import',
    'deborah.williams@casalavoro.import',
    'oladimeji.sons@casalavoro.import',
    'akintunde.williams@whitecrust.import',
    'aniefiok.idiong@whitecrust.import',
    'comfort.okekwue@whitecrust.import',
    'daku.kpanache@whitecrust.import'
)
ORDER BY email;
