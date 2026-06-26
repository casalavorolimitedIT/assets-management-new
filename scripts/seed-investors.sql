-- ============================================================
-- Investor Seed – Casalavoro Limited & White Crust Ltd
-- Run this in the Supabase SQL Editor (service-role access).
--
-- What it does:
--   1. Creates a placeholder auth.users entry per investor
--      (needed for the profiles FK constraint).
--   2. Upserts a public.profiles row with compliance JSON.
--
-- After running this, run the fix script to replace the
-- placeholder auth entries with proper GoTrue accounts:
--   npx tsx scripts/fix-seeded-users.ts
--   (password for all seeded accounts: Casalavoro2025!)
--
-- To add more investors: append more SELECT _seed_investor(…)
-- calls, re-run this file, then re-run the fix script.
-- The fix script skips users that already have valid accounts.
--
-- Notes:
--   • Rates stored as flat rate over full tenor
--       custom_rate = pdf_annual_rate × (tenor_months / 12)
--   • OLADIMEJI AND SONS uses "Quarterly" mode_of_interest.
--   • All dates are taken directly from the PDF as-is.
--   • Bio/bank/personal fields are blank – fill via admin UI.
-- ============================================================


-- ── Helper function ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION _seed_investor(
  p_email      TEXT,
  p_first_name TEXT,
  p_last_name  TEXT,
  p_title      TEXT,
  p_compliance JSONB
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Create a placeholder auth user only if none exists for this email
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    v_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, is_sso_user
    ) VALUES (
      v_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      p_email,
      crypt('Casalavoro2025!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      false, false
    );
  ELSE
    SELECT id INTO v_id FROM auth.users WHERE email = p_email;
  END IF;

  INSERT INTO public.profiles (
    id, email, title, first_name, last_name, other_name,
    phone, "isVerified", compliance, metamap_status, role
  ) VALUES (
    v_id, p_email, p_title, p_first_name, p_last_name, NULL,
    '', true, p_compliance, NULL, 'USER'
  )
  ON CONFLICT (id) DO UPDATE SET
    compliance    = EXCLUDED.compliance,
    "isVerified"  = true,
    first_name    = EXCLUDED.first_name,
    last_name     = EXCLUDED.last_name;
END;
$$;


-- ── Blank placeholder for bio / bank / personal ──────────────
-- (reused in every compliance JSON below)
-- bio_data, bank_details, personal_info are empty strings;
-- admin can fill them through the profile editor.


-- ============================================================
-- CASALAVORO LIMITED INVESTORS
-- ============================================================

-- 1. ABDULRASHEED NAFISAT
-- REIF | 12M | 25% pa | End of Tenor | ₦1,000,000 | B/D ₦18,750
SELECT _seed_investor(
  'abdulrasheed.nafisat@casalavoro.import',
  'Abdulrasheed', 'Nafisat', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.25,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-11-24","due_date":"2026-11-24","monthly_amount_figures":1000000,"investment_company":"Casalavoro Limited","interest_due_bd":18750.00},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.25,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-11-24","due_date":"2026-11-24","monthly_amount_figures":1000000,"investment_company":"Casalavoro Limited","interest_due_bd":18750.00}]
  }'::jsonb
);

-- 2. ADETUTU ORIYOMI YEMISI
-- REIF | 24M | 36% pa → flat 0.72 | Monthly | ₦325,000,000
SELECT _seed_investor(
  'adetutu.yemisi@casalavoro.import',
  'Adetutu Oriyomi', 'Yemisi', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"24 Months","custom_rate":0.72,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-05-30","due_date":"2027-05-29","monthly_amount_figures":325000000,"total_interest_paid":48038709.69,"investment_company":"Casalavoro Limited"},
    "investment_plans":[{"plan":"reif","tenor":"24 Months","custom_rate":0.72,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-05-30","due_date":"2027-05-29","monthly_amount_figures":325000000,"total_interest_paid":48038709.69,"investment_company":"Casalavoro Limited"}]
  }'::jsonb
);

-- 3. ALFRED IDANWEKHAI  (3 plans across both companies)
-- Plan A: Casalavoro REIF 12M 30% Upfront ₦2,500,000
-- Plan B: Casalavoro REIF 12M 30% Upfront ₦14,000,000
-- Plan C: White Crust REIF 23M 30% pa → flat 0.575 End of Tenor ₦13,251,612.90
SELECT _seed_investor(
  'alfred.idanwekhai@casalavoro.import',
  'Alfred', 'Idanwekhai', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-12-31","due_date":"2026-12-31","monthly_amount_figures":2500000,"total_interest_paid":675000,"investment_company":"Casalavoro Limited"},
    "investment_plans":[
      {"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-12-31","due_date":"2026-12-31","monthly_amount_figures":2500000,"total_interest_paid":675000,"investment_company":"Casalavoro Limited"},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-05-21","due_date":"2027-05-31","monthly_amount_figures":14000000,"total_interest_paid":3780000,"investment_company":"Casalavoro Limited"},
      {"plan":"reif","tenor":"23 Months","custom_rate":0.575,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-01-08","due_date":"2026-12-31","monthly_amount_figures":13251612.90,"total_interest_paid":1400806.45,"investment_company":"White Crust Limited"}
    ]
  }'::jsonb
);

-- 4. ARAFAT OYINDAMOLA AWOJOBI
-- Premium Plus | 12M | 20% pa | End of Tenor | ₦100,000 | B/D ₦3,000
SELECT _seed_investor(
  'arafat.awojobi@casalavoro.import',
  'Arafat Oyindamola', 'Awojobi', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"premium_plus","tenor":"12 Months","custom_rate":0.20,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-10-27","due_date":"2026-10-31","monthly_amount_figures":100000,"investment_company":"Casalavoro Limited","interest_due_bd":3000.00},
    "investment_plans":[{"plan":"premium_plus","tenor":"12 Months","custom_rate":0.20,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-10-27","due_date":"2026-10-31","monthly_amount_figures":100000,"investment_company":"Casalavoro Limited","interest_due_bd":3000.00}]
  }'::jsonb
);

-- 5. ARISTOTLE ONUMO  (2 plans)
-- Plan A: REIF 12M 24% Upfront ₦10,000,000
-- Plan B: REIF 24M 26% pa → flat 0.52 Upfront ₦10,000,000
SELECT _seed_investor(
  'aristotle.onumo@casalavoro.import',
  'Aristotle', 'Onumo', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-08-06","due_date":"2026-08-31","monthly_amount_figures":10000000,"investment_company":"Casalavoro Limited"},
    "investment_plans":[
      {"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-08-06","due_date":"2026-08-31","monthly_amount_figures":10000000,"investment_company":"Casalavoro Limited"},
      {"plan":"reif","tenor":"24 Months","custom_rate":0.52,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-03-06","due_date":"2027-03-31","monthly_amount_figures":10000000,"total_interest_paid":2340000,"investment_company":"Casalavoro Limited"}
    ]
  }'::jsonb
);

-- 6. CHIDIMMA GODFREY ONYEBUKWA  (2 plans)
-- Plan A: REIF 12M 30% Monthly ₦15,000,000
-- Plan B: REIF 12M 25.46% Monthly ₦2,000,000
SELECT _seed_investor(
  'chidimma.onyebukwa@casalavoro.import',
  'Chidimma Godfrey', 'Onyebukwa', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-12-31","due_date":"2026-12-30","monthly_amount_figures":15000000,"total_interest_paid":1687500,"investment_company":"Casalavoro Limited"},
    "investment_plans":[
      {"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-12-31","due_date":"2026-12-30","monthly_amount_figures":15000000,"total_interest_paid":1687500,"investment_company":"Casalavoro Limited"},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.2546,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-01-16","due_date":"2027-01-31","monthly_amount_figures":2000000,"total_interest_paid":152777.80,"investment_company":"Casalavoro Limited"}
    ]
  }'::jsonb
);

-- 7. DEBORAH OLUWASEUN WILLIAMS  (2 plans across both companies)
-- Plan A: Casalavoro REIF 12M 24% End of Tenor ₦10,000,000
-- Plan B: White Crust REIF 48M 24% pa → flat 0.96 End of Tenor ₦192,900,000 | B/D ₦49,507,270.79
SELECT _seed_investor(
  'deborah.williams@casalavoro.import',
  'Deborah Oluwaseun', 'Williams', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-02-24","due_date":"2027-02-28","monthly_amount_figures":10000000,"investment_company":"Casalavoro Limited"},
    "investment_plans":[
      {"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-02-24","due_date":"2027-02-28","monthly_amount_figures":10000000,"investment_company":"Casalavoro Limited"},
      {"plan":"reif","tenor":"48 Months","custom_rate":0.96,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2023-03-22","due_date":"2027-03-31","monthly_amount_figures":192900000,"liquidation":26000000,"investment_company":"White Crust Limited","interest_due_bd":49507270.79}
    ]
  }'::jsonb
);

-- 8. MARIAM ANIMASAUN
-- REIF | 12M | 36% pa | Upfront | ₦10,962,518.48
SELECT _seed_investor(
  'mariam.animasaun@casalavoro.import',
  'Mariam', 'Animasaun', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.36,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-02-01","due_date":"2027-01-31","monthly_amount_figures":10962518.48,"total_interest_paid":3946506.65,"investment_company":"Casalavoro Limited"},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.36,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-02-01","due_date":"2027-01-31","monthly_amount_figures":10962518.48,"total_interest_paid":3946506.65,"investment_company":"Casalavoro Limited"}]
  }'::jsonb
);

-- 9. MARIAM BOLUWATIFE ISHIAKA
-- REIF | 6M | 24% pa → flat 0.12 | End of Tenor | ₦1,500,000
SELECT _seed_investor(
  'mariamb.ishiaka@casalavoro.import',
  'Mariam Boluwatife', 'Ishiaka', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"6 Months","custom_rate":0.12,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-02-27","due_date":"2026-08-31","monthly_amount_figures":1500000,"investment_company":"Casalavoro Limited"},
    "investment_plans":[{"plan":"reif","tenor":"6 Months","custom_rate":0.12,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-02-27","due_date":"2026-08-31","monthly_amount_figures":1500000,"investment_company":"Casalavoro Limited"}]
  }'::jsonb
);

-- 10. OLADIMEJI AND SONS NIGERIA LTD
-- REIF | 12M | 35% pa | Quarterly | ₦250,000,000 | B/D ₦6,927,083.33
SELECT _seed_investor(
  'oladimeji.sons@casalavoro.import',
  'Oladimeji And Sons Nigeria', 'Ltd', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.35,"mode_of_payment":"Bank Transfer","mode_of_interest":"Quarterly","monthly_amount_words":"","monthly_payment_date":"2025-11-26","due_date":"2026-11-25","monthly_amount_figures":250000000,"total_interest_paid":41562499.99,"investment_company":"Casalavoro Limited","interest_due_bd":6927083.33},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.35,"mode_of_payment":"Bank Transfer","mode_of_interest":"Quarterly","monthly_amount_words":"","monthly_payment_date":"2025-11-26","due_date":"2026-11-25","monthly_amount_figures":250000000,"total_interest_paid":41562499.99,"investment_company":"Casalavoro Limited","interest_due_bd":6927083.33}]
  }'::jsonb
);

-- 11. OLADOKUN OPEYEMI IBRAHIM
-- REIF | 12M | 30% pa | Monthly | ₦5,000,000
SELECT _seed_investor(
  'oladokun.ibrahim@casalavoro.import',
  'Oladokun Opeyemi', 'Ibrahim', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-10-24","due_date":"2026-10-31","monthly_amount_figures":5000000,"liquidation":4000000,"total_interest_paid":303750,"investment_company":"Casalavoro Limited"},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-10-24","due_date":"2026-10-31","monthly_amount_figures":5000000,"liquidation":4000000,"total_interest_paid":303750,"investment_company":"Casalavoro Limited"}]
  }'::jsonb
);

-- 12. OLADOKUN ISMAIL ADEDEJI  (different person from #11)
-- REIF | 12M | 28% pa | Upfront | ₦3,000,000
SELECT _seed_investor(
  'oladokun.adedeji@casalavoro.import',
  'Oladokun Ismail', 'Adedeji', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.28,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-05-12","due_date":"2027-05-31","monthly_amount_figures":3000000,"total_interest_paid":882903.22,"investment_company":"Casalavoro Limited"},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.28,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-05-12","due_date":"2027-05-31","monthly_amount_figures":3000000,"total_interest_paid":882903.22,"investment_company":"Casalavoro Limited"}]
  }'::jsonb
);

-- 13. OLARINOYE CATHERINE STEPHEN  (2 plans)
-- Plan A: REIF 11M 30% pa → flat 0.275 Monthly ₦6,000,000
-- Plan B: REIF 12M 30% Monthly ₦12,000,000  (start: 04/18/2024, due: 04/30/2024)
SELECT _seed_investor(
  'olarinoye.stephen@casalavoro.import',
  'Olarinoye Catherine', 'Stephen', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"11 Months","custom_rate":0.275,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-04-30","due_date":"2027-03-31","monthly_amount_figures":6000000,"total_interest_paid":135000,"investment_company":"Casalavoro Limited"},
    "investment_plans":[
      {"plan":"reif","tenor":"11 Months","custom_rate":0.275,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-04-30","due_date":"2027-03-31","monthly_amount_figures":6000000,"total_interest_paid":135000,"investment_company":"Casalavoro Limited"},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2024-04-18","due_date":"2024-04-30","monthly_amount_figures":12000000,"total_interest_paid":1470000,"investment_company":"Casalavoro Limited"}
    ]
  }'::jsonb
);

-- 14. SALIMAT OMOTAYO
-- REIF | 22M | 28% pa → flat 0.5133 | Monthly | ₦600,000
SELECT _seed_investor(
  'salimat.omotayo@casalavoro.import',
  'Salimat', 'Omotayo', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"22 Months","custom_rate":0.5133,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-01-11","due_date":"2026-11-30","monthly_amount_figures":600000,"total_interest_paid":63000,"investment_company":"Casalavoro Limited"},
    "investment_plans":[{"plan":"reif","tenor":"22 Months","custom_rate":0.5133,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-01-11","due_date":"2026-11-30","monthly_amount_figures":600000,"total_interest_paid":63000,"investment_company":"Casalavoro Limited"}]
  }'::jsonb
);

-- 15. SHEMAU RIDWAN MUHAMMED  (2 plans)
-- Plan A: REIF 12M 24% End of Tenor ₦3,000,000
-- Plan B: REIF 12M 24% End of Tenor ₦2,000,000
SELECT _seed_investor(
  'shemau.muhammed@casalavoro.import',
  'Shemau Ridwan', 'Muhammed', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-03-09","due_date":"2027-03-31","monthly_amount_figures":3000000,"investment_company":"Casalavoro Limited"},
    "investment_plans":[
      {"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-03-09","due_date":"2027-03-31","monthly_amount_figures":3000000,"investment_company":"Casalavoro Limited"},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-03-25","due_date":"2027-03-31","monthly_amount_figures":2000000,"investment_company":"Casalavoro Limited"}
    ]
  }'::jsonb
);

-- 16. WILFRED MWAKAPWA  (2 plans)
-- Plan A: REIF 12M 24% Upfront ₦15,000,000
-- Plan B: REIF 12M 24% Upfront ₦13,000,000
SELECT _seed_investor(
  'wilfred.mwakapwa@casalavoro.import',
  'Wilfred', 'Mwakapwa', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-07-27","due_date":"2026-07-31","monthly_amount_figures":15000000,"investment_company":"Casalavoro Limited"},
    "investment_plans":[
      {"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-07-27","due_date":"2026-07-31","monthly_amount_figures":15000000,"investment_company":"Casalavoro Limited"},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-10-10","due_date":"2026-10-31","monthly_amount_figures":13000000,"investment_company":"Casalavoro Limited"}
    ]
  }'::jsonb
);


-- ============================================================
-- WHITE CRUST LIMITED INVESTORS
-- ============================================================

-- 17. ADEYEMO OLANIKE  (2 plans)
-- Plan A: Premium  11M 12% compounding → stored as flat 0.11 End of Tenor ₦100,000
-- Plan B: Premium Plus 8M 20% pa → flat 0.1333 End of Tenor ₦200,000
SELECT _seed_investor(
  'adeyemo.olanike@whitecrust.import',
  'Adeyemo', 'Olanike', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"premium","tenor":"11 Months","custom_rate":0.11,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-02-10","due_date":"2027-01-31","monthly_amount_figures":100000,"investment_company":"White Crust Limited"},
    "investment_plans":[
      {"plan":"premium","tenor":"11 Months","custom_rate":0.11,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-02-10","due_date":"2027-01-31","monthly_amount_figures":100000,"investment_company":"White Crust Limited"},
      {"plan":"premium_plus","tenor":"8 Months","custom_rate":0.1333,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-05-12","due_date":"2027-01-31","monthly_amount_figures":200000,"investment_company":"White Crust Limited"}
    ]
  }'::jsonb
);

-- 18. AHIABA OSIAN ATTAH
-- REIF | 12M | 30% pa | End of Tenor | ₦15,000,000
SELECT _seed_investor(
  'ahiaba.attah@whitecrust.import',
  'Ahiaba Osian', 'Attah', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-08-21","due_date":"2026-08-31","monthly_amount_figures":15000000,"total_interest_paid":2133870.93,"investment_company":"White Crust Limited"},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-08-21","due_date":"2026-08-31","monthly_amount_figures":15000000,"total_interest_paid":2133870.93,"investment_company":"White Crust Limited"}]
  }'::jsonb
);

-- 19. Akintunde Williams
-- REIF | 12M | 24% pa | End of Tenor | ₦5,000,000  (start: 09/01/2025, due: 08/31/2025) | B/D ₦360,000
SELECT _seed_investor(
  'akintunde.williams@whitecrust.import',
  'Akintunde', 'Williams', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-09-01","due_date":"2025-08-31","monthly_amount_figures":5000000,"investment_company":"White Crust Limited","interest_due_bd":360000.00},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-09-01","due_date":"2025-08-31","monthly_amount_figures":5000000,"investment_company":"White Crust Limited","interest_due_bd":360000.00}]
  }'::jsonb
);

-- 20. ANIEFIOK IMEH IDIONG  (2 plans)
-- Plan A: Premium Plus 48M 20% pa → flat 0.80 End of Tenor ₦1,000,000 | B/D ₦16,666.67
-- Plan B: REIF 36M 20% pa → flat 0.60 End of Tenor ₦1,000,000
SELECT _seed_investor(
  'aniefiok.idiong@whitecrust.import',
  'Aniefiok Imeh', 'Idiong', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"premium_plus","tenor":"48 Months","custom_rate":0.80,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2022-11-01","due_date":"2026-10-31","monthly_amount_figures":1000000,"investment_company":"White Crust Limited","interest_due_bd":16666.67},
    "investment_plans":[
      {"plan":"premium_plus","tenor":"48 Months","custom_rate":0.80,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2022-11-01","due_date":"2026-10-31","monthly_amount_figures":1000000,"investment_company":"White Crust Limited","interest_due_bd":16666.67},
      {"plan":"reif","tenor":"36 Months","custom_rate":0.60,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2024-01-30","due_date":"2027-01-31","monthly_amount_figures":1000000,"total_interest_paid":200000,"investment_company":"White Crust Limited"}
    ]
  }'::jsonb
);

-- 21. Audu Paul Inalegwu  (3 plans)
-- Plan A: REIF 12M 25% Upfront ₦1,950,000
-- Plan B: REIF 12M 25% Upfront ₦1,250,000
-- Plan C: REIF 12M 24% Upfront ₦1,000,000
SELECT _seed_investor(
  'audu.inalegwu@whitecrust.import',
  'Audu Paul', 'Inalegwu', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.25,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-11-06","due_date":"2026-10-31","monthly_amount_figures":1950000,"investment_company":"White Crust Limited"},
    "investment_plans":[
      {"plan":"reif","tenor":"12 Months","custom_rate":0.25,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-11-06","due_date":"2026-10-31","monthly_amount_figures":1950000,"investment_company":"White Crust Limited"},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.25,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-02-13","due_date":"2027-02-28","monthly_amount_figures":1250000,"total_interest_paid":292968,"investment_company":"White Crust Limited"},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-04-04","due_date":"2027-03-31","monthly_amount_figures":1000000,"total_interest_paid":228193.55,"investment_company":"White Crust Limited"}
    ]
  }'::jsonb
);

-- 22. CHARA DIGITAL AGENCY
-- REIF | 12M | 28% pa | Upfront | ₦10,000,000
SELECT _seed_investor(
  'chara.agency@whitecrust.import',
  'Chara Digital', 'Agency', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.28,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-04-01","due_date":"2027-03-31","monthly_amount_figures":10000000,"total_interest_paid":2520000,"investment_company":"White Crust Limited"},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.28,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-04-01","due_date":"2027-03-31","monthly_amount_figures":10000000,"total_interest_paid":2520000,"investment_company":"White Crust Limited"}]
  }'::jsonb
);

-- 23. Christopher Ogbonna
-- REIF | 36M | 36% pa → flat 1.08 | Monthly | ₦100,000,000
SELECT _seed_investor(
  'christopher.ogbonna@whitecrust.import',
  'Christopher', 'Ogbonna', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"36 Months","custom_rate":1.08,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2024-03-01","due_date":"2027-02-28","monthly_amount_figures":100000000,"total_interest_paid":11550000,"investment_company":"White Crust Limited"},
    "investment_plans":[{"plan":"reif","tenor":"36 Months","custom_rate":1.08,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2024-03-01","due_date":"2027-02-28","monthly_amount_figures":100000000,"total_interest_paid":11550000,"investment_company":"White Crust Limited"}]
  }'::jsonb
);

-- 24. Comfort Okekwue  (2 plans)
-- Plan A: Premium Plus 30M 20% pa → flat 0.50 End of Tenor ₦500,000 | B/D ₦100,000
-- Plan B: Premium Plus 18M 20% pa → flat 0.30 End of Tenor ₦100,000
SELECT _seed_investor(
  'comfort.okekwue@whitecrust.import',
  'Comfort', 'Okekwue', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"premium_plus","tenor":"30 Months","custom_rate":0.50,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2024-01-02","due_date":"2026-06-30","monthly_amount_figures":500000,"investment_company":"White Crust Limited","interest_due_bd":100000.00},
    "investment_plans":[
      {"plan":"premium_plus","tenor":"30 Months","custom_rate":0.50,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2024-01-02","due_date":"2026-06-30","monthly_amount_figures":500000,"investment_company":"White Crust Limited","interest_due_bd":100000.00},
      {"plan":"premium_plus","tenor":"18 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-05-11","due_date":"2027-11-30","monthly_amount_figures":100000,"investment_company":"White Crust Limited"}
    ]
  }'::jsonb
);

-- 25. Daku Kpanache
-- Premium Plus | 36M | 20% pa → flat 0.60 | End of Tenor | ₦500,000 | B/D ₦100,000
SELECT _seed_investor(
  'daku.kpanache@whitecrust.import',
  'Daku', 'Kpanache', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"premium_plus","tenor":"36 Months","custom_rate":0.60,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2024-02-29","due_date":"2027-02-28","monthly_amount_figures":500000,"investment_company":"White Crust Limited","interest_due_bd":100000.00},
    "investment_plans":[{"plan":"premium_plus","tenor":"36 Months","custom_rate":0.60,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2024-02-29","due_date":"2027-02-28","monthly_amount_figures":500000,"investment_company":"White Crust Limited","interest_due_bd":100000.00}]
  }'::jsonb
);


-- ============================================================
-- DEMO USER  (use this account to test the full user flow)
-- Email:    demo.investor@casalavoro.import
-- Password: Casalavoro2025!
-- Has 3 plans covering all three interest modes so every
-- part of the UI can be exercised.
-- ============================================================

-- 26. DEMO INVESTOR  (3 plans — one per interest mode)
SELECT _seed_investor(
  'demo.investor@casalavoro.import',
  'Demo', 'Investor', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-08-01","monthly_amount_figures":5000000,"investment_company":"Casalavoro Limited"},
    "investment_plans":[
      {"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-08-01","monthly_amount_figures":5000000,"investment_company":"Casalavoro Limited"},
      {"plan":"reif","tenor":"24 Months","custom_rate":0.60,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-03-15","monthly_amount_figures":10000000,"investment_company":"Casalavoro Limited"},
      {"plan":"premium_plus","tenor":"18 Months","custom_rate":0.36,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-06-30","monthly_amount_figures":2500000,"investment_company":"White Crust Limited"}
    ]
  }'::jsonb
);


-- ── Cleanup ──────────────────────────────────────────────────
DROP FUNCTION IF EXISTS _seed_investor;
