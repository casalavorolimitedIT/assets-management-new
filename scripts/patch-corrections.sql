-- ============================================================
-- Patch: Corrections identified by post-seed audit
-- Run this in the Supabase SQL Editor (service-role access).
-- Safe to re-run — jsonb_set is idempotent.
--
-- Issues fixed:
--   1. ANIEFIOK IDIONG   — investment_plan (singular) missing
--                          interest_due_bd (was only in plans[0])
--   2. COMFORT OKEKWUE   — investment_plan (singular) missing
--                          interest_due_bd (was only in plans[0])
--   3. OLADIMEJI AND SONS — mode_of_interest was "End of Tenor";
--                           PDF specifies "Quarterly"
--   4. ADEYEMO OLANIKE   — Plan A mode_of_interest was "End of Tenor";
--                           should be "Compounding" (12% compound interest)
-- ============================================================


-- 1. ANIEFIOK IMEH IDIONG — add interest_due_bd to investment_plan (singular)
UPDATE public.profiles
SET compliance = jsonb_set(
    compliance,
    '{investment_plan,interest_due_bd}',
    '16666.67'::jsonb,
    true
)
WHERE email = 'aniefiok.idiong@whitecrust.import';


-- 2. COMFORT OKEKWUE — add interest_due_bd to investment_plan (singular)
UPDATE public.profiles
SET compliance = jsonb_set(
    compliance,
    '{investment_plan,interest_due_bd}',
    '100000.00'::jsonb,
    true
)
WHERE email = 'comfort.okekwue@whitecrust.import';


-- 3. OLADIMEJI AND SONS — fix mode_of_interest to "Quarterly"
UPDATE public.profiles
SET compliance = jsonb_set(
    jsonb_set(
        compliance,
        '{investment_plans,0,mode_of_interest}',
        '"Quarterly"',
        true
    ),
    '{investment_plan,mode_of_interest}',
    '"Quarterly"',
    true
)
WHERE email = 'oladimeji.sons@casalavoro.import';


-- 4. ADEYEMO OLANIKE — fix Plan A mode_of_interest to "Compounding"
UPDATE public.profiles
SET compliance = jsonb_set(
    jsonb_set(
        compliance,
        '{investment_plans,0,mode_of_interest}',
        '"Compounding"',
        true
    ),
    '{investment_plan,mode_of_interest}',
    '"Compounding"',
    true
)
WHERE email = 'adeyemo.olanike@whitecrust.import';


-- ── Verification ─────────────────────────────────────────────
SELECT
    email,
    compliance -> 'investment_plan' ->> 'interest_due_bd'    AS bd_plan,
    compliance -> 'investment_plan' ->> 'mode_of_interest'   AS mode_plan,
    jsonb_path_query_array(
        compliance,
        '$.investment_plans[*].interest_due_bd'
    ) AS bd_plans_array,
    jsonb_path_query_array(
        compliance,
        '$.investment_plans[*].mode_of_interest'
    ) AS mode_plans_array
FROM public.profiles
WHERE email IN (
    'aniefiok.idiong@whitecrust.import',
    'comfort.okekwue@whitecrust.import',
    'oladimeji.sons@casalavoro.import',
    'adeyemo.olanike@whitecrust.import'
)
ORDER BY email;
