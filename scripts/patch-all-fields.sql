-- ============================================================
-- Patch: Add due_date, liquidation, total_interest_paid
--        to all seeded investor plans.
--
-- Run this in the Supabase SQL Editor (service-role access).
-- Safe to re-run — jsonb_set is idempotent.
--
-- Fields added:
--   due_date            – explicit contract maturity date from PDF
--   liquidation         – principal already returned (2 investors)
--   total_interest_paid – interest disbursed as of the PDF snapshot
--
-- Note: total_interest_paid reflects the PDF tracking period
-- (B/D payments + Jan–May 2026 disbursements), not the full
-- lifetime interest over the tenor.
-- ============================================================

-- Helper: patch a single-plan investor
-- (updates both investment_plan and investment_plans[0])
-- ============================================================


-- ── CASALAVORO LIMITED ──────────────────────────────────────

-- 1. ABDULRASHEED NAFISAT
--    due: 2026-11-24 | paid: 0
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2026-11-24"', true),
    '{investment_plan,due_date}', '"2026-11-24"', true)
WHERE email = 'abdulrasheed.nafisat@casalavoro.import';

-- 2. ADETUTU ORIYOMI YEMISI
--    due: 2027-05-29 | paid: 48,038,709.69
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2027-05-29"', true),
    '{investment_plans,0,total_interest_paid}', '48038709.69'::jsonb, true),
    '{investment_plan,due_date}', '"2027-05-29"', true)
WHERE email = 'adetutu.yemisi@casalavoro.import';
UPDATE public.profiles
SET compliance = jsonb_set(compliance,
    '{investment_plan,total_interest_paid}', '48038709.69'::jsonb, true)
WHERE email = 'adetutu.yemisi@casalavoro.import';

-- 3a. ALFRED IDANWEKHAI – plan[0] Casalavoro A
--     due: 2026-12-31 | paid: 675,000
-- 3b. plan[1] Casalavoro B
--     due: 2027-05-31 | paid: 3,780,000
-- 3c. plan[2] White Crust
--     due: 2026-12-31 | paid: 1,400,806.45
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2026-12-31"', true),
    '{investment_plans,0,total_interest_paid}', '675000'::jsonb, true),
    '{investment_plans,1,due_date}', '"2027-05-31"', true),
    '{investment_plans,1,total_interest_paid}', '3780000'::jsonb, true),
    '{investment_plans,2,due_date}', '"2026-12-31"', true),
    '{investment_plans,2,total_interest_paid}', '1400806.45'::jsonb, true),
    '{investment_plan,due_date}', '"2026-12-31"', true)
WHERE email = 'alfred.idanwekhai@casalavoro.import';
UPDATE public.profiles
SET compliance = jsonb_set(compliance,
    '{investment_plan,total_interest_paid}', '675000'::jsonb, true)
WHERE email = 'alfred.idanwekhai@casalavoro.import';

-- 4. ARAFAT OYINDAMOLA AWOJOBI
--    due: 2026-10-31 | paid: 0
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2026-10-31"', true),
    '{investment_plan,due_date}', '"2026-10-31"', true)
WHERE email = 'arafat.awojobi@casalavoro.import';

-- 5a. ARISTOTLE ONUMO – plan[0]
--     due: 2026-08-31 | upfront paid 2025 (total_interest_paid omitted – already has_paid)
-- 5b. plan[1]
--     due: 2027-03-31 | paid: 2,340,000
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2026-08-31"', true),
    '{investment_plans,1,due_date}', '"2027-03-31"', true),
    '{investment_plans,1,total_interest_paid}', '2340000'::jsonb, true),
    '{investment_plan,due_date}', '"2026-08-31"', true)
WHERE email = 'aristotle.onumo@casalavoro.import';

-- 6a. CHIDIMMA GODFREY ONYEBUKWA – plan[0]
--     due: 2026-12-30 | paid: 1,687,500
-- 6b. plan[1]
--     due: 2027-01-31 | paid: 152,777.80
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2026-12-30"', true),
    '{investment_plans,0,total_interest_paid}', '1687500'::jsonb, true),
    '{investment_plans,1,due_date}', '"2027-01-31"', true),
    '{investment_plans,1,total_interest_paid}', '152777.80'::jsonb, true),
    '{investment_plan,due_date}', '"2026-12-30"', true)
WHERE email = 'chidimma.onyebukwa@casalavoro.import';
UPDATE public.profiles
SET compliance = jsonb_set(compliance,
    '{investment_plan,total_interest_paid}', '1687500'::jsonb, true)
WHERE email = 'chidimma.onyebukwa@casalavoro.import';

-- 7a. DEBORAH OLUWASEUN WILLIAMS – plan[0] Casalavoro
--     due: 2027-02-28 | paid: 0
-- 7b. plan[1] White Crust
--     due: 2027-03-31 | liquidation: 26,000,000 | paid: 0
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2027-02-28"', true),
    '{investment_plans,1,due_date}', '"2027-03-31"', true),
    '{investment_plans,1,liquidation}', '26000000'::jsonb, true),
    '{investment_plan,due_date}', '"2027-02-28"', true)
WHERE email = 'deborah.williams@casalavoro.import';

-- 8. MARIAM ANIMASAUN
--    due: 2027-01-31 | paid: 3,946,506.65
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2027-01-31"', true),
    '{investment_plans,0,total_interest_paid}', '3946506.65'::jsonb, true),
    '{investment_plan,due_date}', '"2027-01-31"', true)
WHERE email = 'mariam.animasaun@casalavoro.import';
UPDATE public.profiles
SET compliance = jsonb_set(compliance,
    '{investment_plan,total_interest_paid}', '3946506.65'::jsonb, true)
WHERE email = 'mariam.animasaun@casalavoro.import';

-- 9. MARIAM BOLUWATIFE ISHIAKA
--    due: 2026-08-31 | paid: 0
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2026-08-31"', true),
    '{investment_plan,due_date}', '"2026-08-31"', true)
WHERE email = 'mariamb.ishiaka@casalavoro.import';

-- 10. OLADIMEJI AND SONS NIGERIA LTD
--     due: 2026-11-25 | paid: 41,562,499.99
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2026-11-25"', true),
    '{investment_plans,0,total_interest_paid}', '41562499.99'::jsonb, true),
    '{investment_plan,due_date}', '"2026-11-25"', true)
WHERE email = 'oladimeji.sons@casalavoro.import';
UPDATE public.profiles
SET compliance = jsonb_set(compliance,
    '{investment_plan,total_interest_paid}', '41562499.99'::jsonb, true)
WHERE email = 'oladimeji.sons@casalavoro.import';

-- 11. OLADOKUN OPEYEMI IBRAHIM
--     due: 2026-10-31 | liquidation: 4,000,000 | paid: 303,750
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2026-10-31"', true),
    '{investment_plans,0,liquidation}', '4000000'::jsonb, true),
    '{investment_plans,0,total_interest_paid}', '303750'::jsonb, true),
    '{investment_plan,due_date}', '"2026-10-31"', true)
WHERE email = 'oladokun.ibrahim@casalavoro.import';
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(compliance,
    '{investment_plan,liquidation}', '4000000'::jsonb, true),
    '{investment_plan,total_interest_paid}', '303750'::jsonb, true)
WHERE email = 'oladokun.ibrahim@casalavoro.import';

-- 12. OLADOKUN ISMAIL ADEDEJI
--     due: 2027-05-31 | paid: 882,903.22
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2027-05-31"', true),
    '{investment_plans,0,total_interest_paid}', '882903.22'::jsonb, true),
    '{investment_plan,due_date}', '"2027-05-31"', true)
WHERE email = 'oladokun.adedeji@casalavoro.import';
UPDATE public.profiles
SET compliance = jsonb_set(compliance,
    '{investment_plan,total_interest_paid}', '882903.22'::jsonb, true)
WHERE email = 'oladokun.adedeji@casalavoro.import';

-- 13a. OLARINOYE CATHERINE STEPHEN – plan[0]
--      due: 2027-03-31 | paid: 135,000
-- 13b. plan[1]
--      due: 2024-04-30 | paid: 1,470,000
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2027-03-31"', true),
    '{investment_plans,0,total_interest_paid}', '135000'::jsonb, true),
    '{investment_plans,1,due_date}', '"2024-04-30"', true),
    '{investment_plans,1,total_interest_paid}', '1470000'::jsonb, true),
    '{investment_plan,due_date}', '"2027-03-31"', true)
WHERE email = 'olarinoye.stephen@casalavoro.import';
UPDATE public.profiles
SET compliance = jsonb_set(compliance,
    '{investment_plan,total_interest_paid}', '135000'::jsonb, true)
WHERE email = 'olarinoye.stephen@casalavoro.import';

-- 14. SALIMAT OMOTAYO
--     due: 2026-11-30 | paid: 63,000
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2026-11-30"', true),
    '{investment_plans,0,total_interest_paid}', '63000'::jsonb, true),
    '{investment_plan,due_date}', '"2026-11-30"', true)
WHERE email = 'salimat.omotayo@casalavoro.import';
UPDATE public.profiles
SET compliance = jsonb_set(compliance,
    '{investment_plan,total_interest_paid}', '63000'::jsonb, true)
WHERE email = 'salimat.omotayo@casalavoro.import';

-- 15a. SHEMAU RIDWAN MUHAMMED – plan[0]
--      due: 2027-03-31 | paid: 0
-- 15b. plan[1]
--      due: 2027-03-31 | paid: 0
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2027-03-31"', true),
    '{investment_plans,1,due_date}', '"2027-03-31"', true),
    '{investment_plan,due_date}', '"2027-03-31"', true)
WHERE email = 'shemau.muhammed@casalavoro.import';

-- 16a. WILFRED MWAKAPWA – plan[0]
--      due: 2026-07-31 | upfront paid 2025
-- 16b. plan[1]
--      due: 2026-10-31 | upfront paid 2025
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2026-07-31"', true),
    '{investment_plans,1,due_date}', '"2026-10-31"', true),
    '{investment_plan,due_date}', '"2026-07-31"', true)
WHERE email = 'wilfred.mwakapwa@casalavoro.import';


-- ── WHITE CRUST LIMITED ─────────────────────────────────────

-- 17a. ADEYEMO OLANIKE – plan[0] Premium
--      due: 2027-01-31 | paid: 0
-- 17b. plan[1] Premium Plus
--      due: 2027-01-31 | paid: 0
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2027-01-31"', true),
    '{investment_plans,1,due_date}', '"2027-01-31"', true),
    '{investment_plan,due_date}', '"2027-01-31"', true)
WHERE email = 'adeyemo.olanike@whitecrust.import';

-- 18. AHIABA OSIAN ATTAH
--     due: 2026-08-31 | paid: 2,133,870.93
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2026-08-31"', true),
    '{investment_plans,0,total_interest_paid}', '2133870.93'::jsonb, true),
    '{investment_plan,due_date}', '"2026-08-31"', true)
WHERE email = 'ahiaba.attah@whitecrust.import';
UPDATE public.profiles
SET compliance = jsonb_set(compliance,
    '{investment_plan,total_interest_paid}', '2133870.93'::jsonb, true)
WHERE email = 'ahiaba.attah@whitecrust.import';

-- 19. Akintunde Williams
--     due: 2025-08-31 (as per PDF — appears to be prior-year maturity)
--     paid: 0
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2025-08-31"', true),
    '{investment_plan,due_date}', '"2025-08-31"', true)
WHERE email = 'akintunde.williams@whitecrust.import';

-- 20a. ANIEFIOK IMEH IDIONG – plan[0] Premium Plus
--      due: 2026-10-31 | paid: 0
-- 20b. plan[1] REIF
--      due: 2027-01-31 | paid: 200,000
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2026-10-31"', true),
    '{investment_plans,1,due_date}', '"2027-01-31"', true),
    '{investment_plans,1,total_interest_paid}', '200000'::jsonb, true),
    '{investment_plan,due_date}', '"2026-10-31"', true)
WHERE email = 'aniefiok.idiong@whitecrust.import';

-- 21a. Audu Paul Inalegwu – plan[0]
--      due: 2026-10-31 | upfront paid 2025
-- 21b. plan[1]
--      due: 2027-02-28 | paid: 292,968
-- 21c. plan[2]
--      due: 2027-03-31 | paid: 228,193.55
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2026-10-31"', true),
    '{investment_plans,1,due_date}', '"2027-02-28"', true),
    '{investment_plans,1,total_interest_paid}', '292968'::jsonb, true),
    '{investment_plans,2,due_date}', '"2027-03-31"', true),
    '{investment_plans,2,total_interest_paid}', '228193.55'::jsonb, true),
    '{investment_plan,due_date}', '"2026-10-31"', true)
WHERE email = 'audu.inalegwu@whitecrust.import';

-- 22. CHARA DIGITAL AGENCY
--     due: 2027-03-31 | paid: 2,520,000
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2027-03-31"', true),
    '{investment_plans,0,total_interest_paid}', '2520000'::jsonb, true),
    '{investment_plan,due_date}', '"2027-03-31"', true)
WHERE email = 'chara.agency@whitecrust.import';
UPDATE public.profiles
SET compliance = jsonb_set(compliance,
    '{investment_plan,total_interest_paid}', '2520000'::jsonb, true)
WHERE email = 'chara.agency@whitecrust.import';

-- 23. Christopher Ogbonna
--     due: 2027-02-28 | paid: 11,550,000
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2027-02-28"', true),
    '{investment_plans,0,total_interest_paid}', '11550000'::jsonb, true),
    '{investment_plan,due_date}', '"2027-02-28"', true)
WHERE email = 'christopher.ogbonna@whitecrust.import';
UPDATE public.profiles
SET compliance = jsonb_set(compliance,
    '{investment_plan,total_interest_paid}', '11550000'::jsonb, true)
WHERE email = 'christopher.ogbonna@whitecrust.import';

-- 24a. Comfort Okekwue – plan[0]
--      due: 2026-06-30 | paid: 0
-- 24b. plan[1]
--      due: 2027-11-30 | paid: 0
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2026-06-30"', true),
    '{investment_plans,1,due_date}', '"2027-11-30"', true),
    '{investment_plan,due_date}', '"2026-06-30"', true)
WHERE email = 'comfort.okekwue@whitecrust.import';

-- 25. Daku Kpanache
--     due: 2027-02-28 | paid: 0
UPDATE public.profiles
SET compliance = jsonb_set(jsonb_set(
    compliance,
    '{investment_plans,0,due_date}', '"2027-02-28"', true),
    '{investment_plan,due_date}', '"2027-02-28"', true)
WHERE email = 'daku.kpanache@whitecrust.import';


-- ── Corrections (post-audit) ──────────────────────────────────

-- OLADIMEJI AND SONS: PDF specifies "Quarterly" mode_of_interest
-- but the seeded value was "End of Tenor". Fix both plan objects.
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


-- ── Verification ─────────────────────────────────────────────
SELECT
    email,
    compliance -> 'investment_plan' ->> 'due_date'             AS due_date,
    (compliance -> 'investment_plan' ->> 'liquidation')::numeric AS liquidation,
    (compliance -> 'investment_plan' ->> 'total_interest_paid')::numeric AS interest_paid,
    jsonb_path_query_array(compliance, '$.investment_plans[*].due_date') AS plan_due_dates
FROM public.profiles
WHERE role = 'USER'
ORDER BY email;
