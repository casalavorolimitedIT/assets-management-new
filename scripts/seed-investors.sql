-- ============================================================
-- Investor Seed – Casalavoro Limited, White Crust Ltd,
--                 Rich Oak Ltd, Oak Rief Ltd
--
-- Run this in the Supabase SQL Editor (service-role access).
--
-- What it does:
--   1. Creates a placeholder auth.users entry per investor.
--   2. Upserts a public.profiles row with compliance JSON.
--
-- After running, fix auth accounts:
--   npx tsx scripts/fix-seeded-users.ts
--   (password for all seeded accounts: Casalavoro2025!)
--
-- CALCULATION RULES:
--   • custom_rate  = annual_rate × (tenor_months / 12)
--     (flat rate over full tenor — this is what the app stores)
--   • monthly_amount_figures = principal investment balance
--   • monthly_interest = principal × (annual_rate / 12)
--     = principal × custom_rate / tenor_months
--   • has_withholding_tax = true  where Excel shows "10%"
--                         = false where Excel shows "Nil"
--   • total_interest_paid = verified paid amount from sheet
--   • interest_due_bd = previous-year accrued interest owed
--   • Companies: Casalavoro Limited | White Crust Ltd |
--               Rich Oak Ltd | Oak Rief Ltd
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


-- ============================================================
-- CASALAVORO LIMITED
-- ============================================================

-- 1. ABDULRASHEED NAFISAT
-- REIF | 25% pa | 12M | End of Tenor | ₦1,000,000 | WHT: 10%
-- monthly_interest = 1,000,000 × 0.25/12 = 20,833.33
-- interest_due_bd = 18,750 (previous year accrued)
SELECT _seed_investor(
  'abdulrasheed.nafisat@casalavoro.import',
  'Abdulrasheed', 'Nafisat', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.25,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-11-24","due_date":"2026-11-24","monthly_amount_figures":1000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true,"interest_due_bd":18750.00},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.25,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-11-24","due_date":"2026-11-24","monthly_amount_figures":1000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true,"interest_due_bd":18750.00}]
  }'::jsonb
);

-- 2. ADETUTU ORIYOMI YEMISI
-- REIF | 36% pa | 24M | Monthly | ₦325,000,000 | WHT: Nil
-- monthly_interest = 325,000,000 × 0.36/12 = 9,750,000.00
-- custom_rate = 0.36 × 24/12 = 0.72
SELECT _seed_investor(
  'adetutu.yemisi@casalavoro.import',
  'Adetutu Oriyomi', 'Yemisi', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"24 Months","custom_rate":0.72,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-05-30","due_date":"2027-05-29","monthly_amount_figures":325000000,"investment_company":"Casalavoro Limited","has_withholding_tax":false},
    "investment_plans":[{"plan":"reif","tenor":"24 Months","custom_rate":0.72,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-05-30","due_date":"2027-05-29","monthly_amount_figures":325000000,"investment_company":"Casalavoro Limited","has_withholding_tax":false}]
  }'::jsonb
);


-- 3. ALFRED IDANWEKHAI (3 plans)
-- Plan A: Casalavoro | REIF | 30% pa | 12M | Upfront | ₦2,500,000 | WHT: 10%
--   monthly_interest = 2,500,000 × 0.30/12 = 62,500 | custom_rate = 0.30
-- Plan B: Casalavoro | REIF | 30% pa | 12M | Upfront | ₦14,000,000 | WHT: 10%
--   monthly_interest = 14,000,000 × 0.30/12 = 350,000 | custom_rate = 0.30
-- Plan C: White Crust Ltd | REIF | 30% pa | 5M | End of Tenor | ₦13,251,612.90 | WHT: 10%
--   monthly_interest = 13,251,612.90 × 0.30/12 = 331,290.32 | custom_rate = 0.30×5/12 = 0.125
SELECT _seed_investor(
  'alfred.idanwekhai@casalavoro.import',
  'Alfred', 'Idanwekhai', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-12-31","due_date":"2026-12-30","monthly_amount_figures":2500000,"investment_company":"Casalavoro Limited","has_withholding_tax":true,"total_interest_paid":675000},
    "investment_plans":[
      {"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-12-31","due_date":"2026-12-30","monthly_amount_figures":2500000,"investment_company":"Casalavoro Limited","has_withholding_tax":true,"total_interest_paid":675000},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-05-21","due_date":"2027-05-31","monthly_amount_figures":14000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true,"total_interest_paid":3780000},
      {"plan":"reif","tenor":"5 Months","custom_rate":0.125,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-08-01","due_date":"2026-12-31","monthly_amount_figures":13251612.90,"investment_company":"White Crust Ltd","has_withholding_tax":true}
    ]
  }'::jsonb
);

-- 4. ARAFAT OYINDAMOLA AWOJOBI
-- Premium Plus | 20% pa | 12M | End of Tenor | ₦100,000 | WHT: 10%
-- monthly_interest = 100,000 × 0.20/12 = 1,666.67 | custom_rate = 0.20
-- interest_due_bd = 3,000
SELECT _seed_investor(
  'arafat.awojobi@casalavoro.import',
  'Arafat Oyindamola', 'Awojobi', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"premium_plus","tenor":"12 Months","custom_rate":0.20,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-10-27","due_date":"2026-10-26","monthly_amount_figures":100000,"investment_company":"Casalavoro Limited","has_withholding_tax":true,"interest_due_bd":3000.00},
    "investment_plans":[{"plan":"premium_plus","tenor":"12 Months","custom_rate":0.20,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-10-27","due_date":"2026-10-26","monthly_amount_figures":100000,"investment_company":"Casalavoro Limited","has_withholding_tax":true,"interest_due_bd":3000.00}]
  }'::jsonb
);


-- 5. ARISTOTLE ONUMO (2 plans, each ₦10M balance after ₦10M liquidation each)
-- Plan A: Casalavoro | REIF | 24% pa | 12M | Upfront | ₦10,000,000 | WHT: 10%
--   monthly_interest = 10,000,000 × 0.24/12 = 200,000 | custom_rate = 0.24
-- Plan B: Casalavoro | REIF | 26% pa | 12M | Upfront | ₦10,000,000 | WHT: 10%
--   monthly_interest = 10,000,000 × 0.26/12 = 216,666.67 | custom_rate = 0.26
SELECT _seed_investor(
  'aristotle.onumo@casalavoro.import',
  'Aristotle', 'Onumo', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-08-06","due_date":"2026-08-31","monthly_amount_figures":10000000,"liquidation":10000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true},
    "investment_plans":[
      {"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-08-06","due_date":"2026-08-31","monthly_amount_figures":10000000,"liquidation":10000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.26,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-03-06","due_date":"2026-03-31","monthly_amount_figures":10000000,"liquidation":10000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true,"total_interest_paid":2340000}
    ]
  }'::jsonb
);

-- 6. CHIDIMMA GODFREY ONYEBUKWA (2 plans)
-- Plan A: Casalavoro | REIF | 30% pa | 12M | Monthly | ₦15,000,000 | WHT: 10%
--   monthly_interest = 15,000,000 × 0.30/12 = 375,000.00 | custom_rate = 0.30
-- Plan B: Casalavoro | REIF | 25.46% pa | 12M | Monthly | ₦2,000,000 | WHT: 10%
--   monthly_interest = 2,000,000 × 0.2546/12 = 42,433.33 | custom_rate = 0.2546
SELECT _seed_investor(
  'chidimma.onyebukwa@casalavoro.import',
  'Chidimma Godfrey', 'Onyebukwa', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-12-31","due_date":"2026-12-31","monthly_amount_figures":15000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true},
    "investment_plans":[
      {"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-12-31","due_date":"2026-12-31","monthly_amount_figures":15000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.2546,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-01-16","due_date":"2027-01-31","monthly_amount_figures":2000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true}
    ]
  }'::jsonb
);


-- 7. DEBORAH OLUWASEUN WILLIAMS
-- Casalavoro | REIF | 24% pa | 12M | End of Tenor | ₦10,000,000 | WHT: 10%
-- monthly_interest = 10,000,000 × 0.24/12 = 200,000.00 | custom_rate = 0.24
SELECT _seed_investor(
  'deborah.williams@casalavoro.import',
  'Deborah Oluwaseun', 'Williams', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-02-24","due_date":"2026-02-28","monthly_amount_figures":10000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-02-24","due_date":"2026-02-28","monthly_amount_figures":10000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true}]
  }'::jsonb
);

-- 8. Firdaous Umar
-- Casalavoro | REIF | 40% pa | 12M | End of Tenor | ₦40,000,000 | WHT: 10%
-- monthly_interest = 40,000,000 × 0.40/12 = 1,333,333.33 | custom_rate = 0.40
SELECT _seed_investor(
  'firdaous.umar@casalavoro.import',
  'Firdaous', 'Umar', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.40,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-01-01","due_date":"2026-12-31","monthly_amount_figures":40000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.40,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-01-01","due_date":"2026-12-31","monthly_amount_figures":40000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true}]
  }'::jsonb
);

-- 9. MARIAM AANIMASAUN
-- Casalavoro | REIF | 36% pa | 12M | Upfront | ₦10,962,518.48 | WHT: Nil
-- monthly_interest = 10,962,518.48 × 0.36/12 = 328,875.55 | custom_rate = 0.36
-- total_interest_paid = 3,946,506.65 (upfront disbursed)
SELECT _seed_investor(
  'mariam.animasaun@casalavoro.import',
  'Mariam', 'Animasaun', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.36,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-02-01","due_date":"2027-01-31","monthly_amount_figures":10962518.48,"investment_company":"Casalavoro Limited","has_withholding_tax":false,"total_interest_paid":3946506.65},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.36,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-02-01","due_date":"2027-01-31","monthly_amount_figures":10962518.48,"investment_company":"Casalavoro Limited","has_withholding_tax":false,"total_interest_paid":3946506.65}]
  }'::jsonb
);


-- 10. MARIAM BOLUWATIFE ISHIAKA
-- Casalavoro | REIF | 24% pa | 6M | End of Tenor | ₦1,500,000 | WHT: 10%
-- monthly_interest = 1,500,000 × 0.24/12 = 30,000.00 | custom_rate = 0.24×6/12 = 0.12
SELECT _seed_investor(
  'mariamb.ishiaka@casalavoro.import',
  'Mariam Boluwatife', 'Ishiaka', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"6 Months","custom_rate":0.12,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-02-27","due_date":"2026-08-31","monthly_amount_figures":1500000,"investment_company":"Casalavoro Limited","has_withholding_tax":true},
    "investment_plans":[{"plan":"reif","tenor":"6 Months","custom_rate":0.12,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-02-27","due_date":"2026-08-31","monthly_amount_figures":1500000,"investment_company":"Casalavoro Limited","has_withholding_tax":true}]
  }'::jsonb
);

-- 11. OLADOKUN OPEYEMI IBRAHIM
-- Casalavoro | REIF | 30% pa | 12M | Monthly | ₦1,000,000 balance (₦4,000,000 liquidated) | WHT: 10%
-- monthly_interest = 1,000,000 × 0.30/12 = 25,000.00 | custom_rate = 0.30
-- liquidation = 4,000,000 | total_interest_paid = 303,750
SELECT _seed_investor(
  'oladokun.ibrahim@casalavoro.import',
  'Oladokun Opeyemi', 'Ibrahim', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-10-24","due_date":"2026-10-31","monthly_amount_figures":1000000,"liquidation":4000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true,"total_interest_paid":303750},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-10-24","due_date":"2026-10-31","monthly_amount_figures":1000000,"liquidation":4000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true,"total_interest_paid":303750}]
  }'::jsonb
);


-- 12. OLADOKUN ISMAIL ADEDEJI
-- Casalavoro | REIF | 28% pa | 12M | Upfront | ₦3,000,000 | WHT: 10%
-- monthly_interest = 3,000,000 × 0.28/12 = 70,000.00 | custom_rate = 0.28
-- total_interest_paid = 882,903.22 (upfront disbursed)
SELECT _seed_investor(
  'oladokun.adedeji@casalavoro.import',
  'Oladokun Ismail', 'Adedeji', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.28,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-05-12","due_date":"2027-05-31","monthly_amount_figures":3000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true,"total_interest_paid":882903.22},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.28,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-05-12","due_date":"2027-05-31","monthly_amount_figures":3000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true,"total_interest_paid":882903.22}]
  }'::jsonb
);

-- 13. OLARINOYE CATHERINE STEPHEN (2 plans)
-- Plan A: Casalavoro | REIF | 30% pa | 11M | Monthly | ₦6,000,000 | WHT: 10%
--   monthly_interest = 6,000,000 × 0.30/12 = 150,000.00 | custom_rate = 0.30×11/12 = 0.275
-- Plan B: Casalavoro | REIF | 30% pa | 12M | Monthly | ₦12,000,000 | WHT: 10%
--   monthly_interest = 12,000,000 × 0.30/12 = 300,000.00 | custom_rate = 0.30
SELECT _seed_investor(
  'olarinoye.stephen@casalavoro.import',
  'Olarinoye Catherine', 'Stephen', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"11 Months","custom_rate":0.275,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-04-30","due_date":"2027-03-31","monthly_amount_figures":6000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true},
    "investment_plans":[
      {"plan":"reif","tenor":"11 Months","custom_rate":0.275,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-04-30","due_date":"2027-03-31","monthly_amount_figures":6000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2024-04-18","due_date":"2024-04-30","monthly_amount_figures":12000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true}
    ]
  }'::jsonb
);

-- 14. SALIMAT OMOTAYO
-- Casalavoro | REIF | 28% pa | 12M | Monthly | ₦600,000 | WHT: 10%
-- monthly_interest = 600,000 × 0.28/12 = 14,000.00 | custom_rate = 0.28
SELECT _seed_investor(
  'salimat.omotayo@casalavoro.import',
  'Salimat', 'Omotayo', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.28,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-11-01","due_date":"2026-11-30","monthly_amount_figures":600000,"investment_company":"Casalavoro Limited","has_withholding_tax":true},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.28,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-11-01","due_date":"2026-11-30","monthly_amount_figures":600000,"investment_company":"Casalavoro Limited","has_withholding_tax":true}]
  }'::jsonb
);


-- 15. SHEMAU RIDWAN MUHAMMED (2 plans)
-- Plan A: Casalavoro | REIF | 25.67% pa | 12M | End of Tenor | ₦3,000,000 | WHT: 10%
--   monthly_interest = 3,000,000 × 0.2567/12 = 64,175.00 | custom_rate = 0.2567
-- Plan B: Casalavoro | REIF | 25.67% pa | 12M | End of Tenor | ₦2,000,000 | WHT: 10%
--   monthly_interest = 2,000,000 × 0.2567/12 = 42,783.33 | custom_rate = 0.2567
SELECT _seed_investor(
  'shemau.muhammed@casalavoro.import',
  'Shemau Ridwan', 'Muhammed', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.2567,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-03-09","due_date":"2027-03-31","monthly_amount_figures":3000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true},
    "investment_plans":[
      {"plan":"reif","tenor":"12 Months","custom_rate":0.2567,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-03-09","due_date":"2027-03-31","monthly_amount_figures":3000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.2567,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-03-25","due_date":"2027-03-31","monthly_amount_figures":2000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true}
    ]
  }'::jsonb
);

-- 16. WILFRED MWAKAPWA (2 plans)
-- Plan A: Casalavoro | REIF | 24% pa | 12M | Upfront | ₦15,000,000 | WHT: 10%
--   monthly_interest = 15,000,000 × 0.24/12 = 300,000.00 | custom_rate = 0.24
-- Plan B: Casalavoro | REIF | 24% pa | 12M | Upfront | ₦13,000,000 | WHT: 10%
--   monthly_interest = 13,000,000 × 0.24/12 = 260,000.00 | custom_rate = 0.24
SELECT _seed_investor(
  'wilfred.mwakapwa@casalavoro.import',
  'Wilfred', 'Mwakapwa', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-07-27","due_date":"2026-07-31","monthly_amount_figures":15000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true},
    "investment_plans":[
      {"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-07-27","due_date":"2026-07-31","monthly_amount_figures":15000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-10-10","due_date":"2026-10-31","monthly_amount_figures":13000000,"investment_company":"Casalavoro Limited","has_withholding_tax":true}
    ]
  }'::jsonb
);



-- ============================================================
-- WHITE CRUST LTD
-- ============================================================

-- 17. ADEYEMO OLANIKE (2 plans)
-- Plan A: White Crust Ltd | Premium Investment | 12% pa compounding | 12M | End of Tenor | ₦100,000 | WHT: Nil
--   monthly_interest = 100,000 × 0.12/12 = 1,000.00 | custom_rate = 0.12
-- Plan B: White Crust Ltd | Premium Plus | 20% pa | 8M | End of Tenor | ₦200,000 | WHT: Nil
--   monthly_interest = 200,000 × 0.20/12 = 3,333.33 | custom_rate = 0.20×8/12 = 0.1333
SELECT _seed_investor(
  'adeyemo.olanike@whitecrust.import',
  'Adeyemo', 'Olanike', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"premium","tenor":"12 Months","custom_rate":0.12,"mode_of_payment":"Bank Transfer","mode_of_interest":"Compounding","monthly_amount_words":"","monthly_payment_date":"2026-02-10","due_date":"2027-01-31","monthly_amount_figures":100000,"investment_company":"White Crust Ltd","has_withholding_tax":false},
    "investment_plans":[
      {"plan":"premium","tenor":"12 Months","custom_rate":0.12,"mode_of_payment":"Bank Transfer","mode_of_interest":"Compounding","monthly_amount_words":"","monthly_payment_date":"2026-02-10","due_date":"2027-01-31","monthly_amount_figures":100000,"investment_company":"White Crust Ltd","has_withholding_tax":false},
      {"plan":"premium_plus","tenor":"8 Months","custom_rate":0.1333,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-05-12","due_date":"2027-01-31","monthly_amount_figures":200000,"investment_company":"White Crust Ltd","has_withholding_tax":false}
    ]
  }'::jsonb
);

-- 18. AHIABA OSIAN ATTAH
-- White Crust Ltd | REIF | 30% pa | 12M | End of Tenor | ₦15,000,000 | WHT: 10%
-- monthly_interest = 15,000,000 × 0.30/12 = 375,000.00 | custom_rate = 0.30
-- total_interest_paid = 2,133,870.93
SELECT _seed_investor(
  'ahiaba.attah@whitecrust.import',
  'Ahiaba Osian', 'Attah', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-08-21","due_date":"2026-08-31","monthly_amount_figures":15000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"total_interest_paid":2133870.93},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-08-21","due_date":"2026-08-31","monthly_amount_figures":15000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"total_interest_paid":2133870.93}]
  }'::jsonb
);


-- 19. Akintunde Williams
-- White Crust Ltd | REIF | 24% pa | 12M | End of Tenor | ₦5,000,000 | WHT: 10%
-- monthly_interest = 5,000,000 × 0.24/12 = 100,000.00 | custom_rate = 0.24
-- interest_due_bd = 360,000
SELECT _seed_investor(
  'akintunde.williams@whitecrust.import',
  'Akintunde', 'Williams', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-09-01","due_date":"2025-08-31","monthly_amount_figures":5000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"interest_due_bd":360000.00},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-09-01","due_date":"2025-08-31","monthly_amount_figures":5000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"interest_due_bd":360000.00}]
  }'::jsonb
);

-- 20. ANIEFIOK IMEH IDIONG (3 plans across White Crust Ltd & Rich Oak Ltd)
-- Plan A: White Crust Ltd | Premium Plus | 20% pa | 48M | End of Tenor | ₦1,000,000 | WHT: Nil
--   monthly_interest = 1,000,000 × 0.20/12 = 16,666.67 | custom_rate = 0.20×48/12 = 0.80
--   interest_due_bd = 16,666.67
-- Plan B: White Crust Ltd | REIF | 20% pa | 36M | End of Tenor | ₦1,000,000 | WHT: Nil
--   monthly_interest = 1,000,000 × 0.20/12 = 16,666.67 | custom_rate = 0.20×36/12 = 0.60
--   total_interest_paid = 200,000
-- Plan C: Rich Oak Ltd | REIF | 18% pa | 12M | Monthly | ₦7,000,000 | WHT: Nil
--   monthly_interest = 7,000,000 × 0.18/12 = 105,000.00 | custom_rate = 0.18
--   total_interest_paid = 525,000
SELECT _seed_investor(
  'aniefiok.idiong@whitecrust.import',
  'Aniefiok Imeh', 'Idiong', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"premium_plus","tenor":"48 Months","custom_rate":0.80,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2022-11-01","due_date":"2026-10-31","monthly_amount_figures":1000000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"interest_due_bd":16666.67},
    "investment_plans":[
      {"plan":"premium_plus","tenor":"48 Months","custom_rate":0.80,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2022-11-01","due_date":"2026-10-31","monthly_amount_figures":1000000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"interest_due_bd":16666.67},
      {"plan":"reif","tenor":"36 Months","custom_rate":0.60,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2024-01-30","due_date":"2027-01-31","monthly_amount_figures":1000000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"total_interest_paid":200000},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.18,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-01-01","due_date":"2026-12-31","monthly_amount_figures":7000000,"investment_company":"Rich Oak Ltd","has_withholding_tax":false,"total_interest_paid":525000}
    ]
  }'::jsonb
);


-- 21. Audu Paul Inalegwu (3 plans)
-- Plan A: White Crust Ltd | REIF | 25% pa | 12M | Upfront | ₦1,950,000 | WHT: 10%
--   monthly_interest = 1,950,000 × 0.25/12 = 40,625.00 | custom_rate = 0.25
-- Plan B: White Crust Ltd | REIF | 25% pa | 12M | Upfront | ₦1,250,000 | WHT: 10%
--   monthly_interest = 1,250,000 × 0.25/12 = 26,041.67 | custom_rate = 0.25
--   total_interest_paid = 292,968
-- Plan C: White Crust Ltd | REIF | 24% pa | 12M | Upfront | ₦1,000,000 | WHT: 10%
--   monthly_interest = 1,000,000 × 0.24/12 = 20,000.00 | custom_rate = 0.24
--   total_interest_paid = 228,193.55
SELECT _seed_investor(
  'audu.inalegwu@whitecrust.import',
  'Audu Paul', 'Inalegwu', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.25,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-11-06","due_date":"2026-10-31","monthly_amount_figures":1950000,"investment_company":"White Crust Ltd","has_withholding_tax":true},
    "investment_plans":[
      {"plan":"reif","tenor":"12 Months","custom_rate":0.25,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2025-11-06","due_date":"2026-10-31","monthly_amount_figures":1950000,"investment_company":"White Crust Ltd","has_withholding_tax":true},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.25,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-02-13","due_date":"2027-02-28","monthly_amount_figures":1250000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"total_interest_paid":292968},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-04-04","due_date":"2027-03-31","monthly_amount_figures":1000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"total_interest_paid":228193.55}
    ]
  }'::jsonb
);

-- 22. CHARA DIGITAL AGENCY
-- White Crust Ltd | REIF | 28% pa | 12M | Upfront | ₦10,000,000 | WHT: 10%
-- monthly_interest = 10,000,000 × 0.28/12 = 233,333.33 | custom_rate = 0.28
-- total_interest_paid = 2,520,000
SELECT _seed_investor(
  'chara.agency@whitecrust.import',
  'Chara Digital', 'Agency', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.28,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-04-01","due_date":"2027-03-31","monthly_amount_figures":10000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"total_interest_paid":2520000},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.28,"mode_of_payment":"Bank Transfer","mode_of_interest":"Upfront","monthly_amount_words":"","monthly_payment_date":"2026-04-01","due_date":"2027-03-31","monthly_amount_figures":10000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"total_interest_paid":2520000}]
  }'::jsonb
);


-- 23. Christopher Ogbonna
-- White Crust Ltd | REIF | 36% pa | 36M | Monthly | ₦100,000,000 | WHT: 10%
-- monthly_interest = 100,000,000 × 0.36/12 = 3,000,000.00 | custom_rate = 0.36×36/12 = 1.08
-- total_interest_paid = 11,550,000
SELECT _seed_investor(
  'christopher.ogbonna@whitecrust.import',
  'Christopher', 'Ogbonna', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"36 Months","custom_rate":1.08,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2024-03-01","due_date":"2027-02-28","monthly_amount_figures":100000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"total_interest_paid":11550000},
    "investment_plans":[{"plan":"reif","tenor":"36 Months","custom_rate":1.08,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2024-03-01","due_date":"2027-02-28","monthly_amount_figures":100000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"total_interest_paid":11550000}]
  }'::jsonb
);

-- 24. Comfort Okekwue (2 plans)
-- Plan A: White Crust Ltd | REIF | 20% pa | 30M | End of Tenor | ₦500,000 | WHT: Nil
--   monthly_interest = 500,000 × 0.20/12 = 8,333.33 | custom_rate = 0.20×30/12 = 0.50
--   interest_due_bd = 100,000
-- Plan B: White Crust Ltd | REIF | 20% pa | 18M | End of Tenor | ₦100,000 | WHT: Nil
--   monthly_interest = 100,000 × 0.20/12 = 1,666.67 | custom_rate = 0.20×18/12 = 0.30
SELECT _seed_investor(
  'comfort.okekwue@whitecrust.import',
  'Comfort', 'Okekwue', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"30 Months","custom_rate":0.50,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2024-01-02","due_date":"2026-06-30","monthly_amount_figures":500000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"interest_due_bd":100000.00},
    "investment_plans":[
      {"plan":"reif","tenor":"30 Months","custom_rate":0.50,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2024-01-02","due_date":"2026-06-30","monthly_amount_figures":500000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"interest_due_bd":100000.00},
      {"plan":"reif","tenor":"18 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-05-11","due_date":"2027-11-30","monthly_amount_figures":100000,"investment_company":"White Crust Ltd","has_withholding_tax":false}
    ]
  }'::jsonb
);


-- 25. Daku Kpanache
-- White Crust Ltd | REIF | 20% pa | 36M | End of Tenor | ₦500,000 | WHT: Nil
-- monthly_interest = 500,000 × 0.20/12 = 8,333.33 | custom_rate = 0.20×36/12 = 0.60
-- interest_due_bd = 100,000
SELECT _seed_investor(
  'daku.kpanache@whitecrust.import',
  'Daku', 'Kpanache', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"36 Months","custom_rate":0.60,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2024-02-29","due_date":"2027-02-28","monthly_amount_figures":500000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"interest_due_bd":100000.00},
    "investment_plans":[{"plan":"reif","tenor":"36 Months","custom_rate":0.60,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2024-02-29","due_date":"2027-02-28","monthly_amount_figures":500000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"interest_due_bd":100000.00}]
  }'::jsonb
);

-- 26. Deborah Raji
-- White Crust Ltd | REIF | 24% pa | 48M | End of Tenor | ₦166,900,000 balance (₦26,000,000 liquidated) | WHT: 10%
-- monthly_interest = 166,900,000 × 0.24/12 = 3,338,000.00 | custom_rate = 0.24×48/12 = 0.96
-- interest_due_bd = 44,556,543.71 | liquidation = 26,000,000
SELECT _seed_investor(
  'deborah.raji@whitecrust.import',
  'Deborah', 'Raji', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"48 Months","custom_rate":0.96,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2023-03-22","due_date":"2027-03-31","monthly_amount_figures":166900000,"liquidation":26000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"interest_due_bd":44556543.71},
    "investment_plans":[{"plan":"reif","tenor":"48 Months","custom_rate":0.96,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2023-03-22","due_date":"2027-03-31","monthly_amount_figures":166900000,"liquidation":26000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"interest_due_bd":44556543.71}]
  }'::jsonb
);


-- 27. Ekanem Christiana
-- White Crust Ltd | REIF | 36% pa | 36M | Monthly | ₦30,000,000 | WHT: Nil
-- monthly_interest = 30,000,000 × 0.36/12 = 900,000.00 | custom_rate = 0.36×36/12 = 1.08
-- total_interest_paid = 4,500,000
SELECT _seed_investor(
  'ekanem.christiana@whitecrust.import',
  'Ekanem', 'Christiana', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"36 Months","custom_rate":1.08,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2024-02-16","due_date":"2027-02-28","monthly_amount_figures":30000000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"total_interest_paid":4500000},
    "investment_plans":[{"plan":"reif","tenor":"36 Months","custom_rate":1.08,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2024-02-16","due_date":"2027-02-28","monthly_amount_figures":30000000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"total_interest_paid":4500000}]
  }'::jsonb
);

-- 28. Emeka Faith Okeke
-- White Crust Ltd | REIF | 20% pa | 12M | End of Tenor | ₦1,000,000 | WHT: Nil
-- monthly_interest = 1,000,000 × 0.20/12 = 16,666.67 | custom_rate = 0.20
-- interest_due_bd = 66,666.67
SELECT _seed_investor(
  'emeka.okeke@whitecrust.import',
  'Emeka Faith', 'Okeke', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.20,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-08-23","due_date":"2026-08-31","monthly_amount_figures":1000000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"interest_due_bd":66666.67},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.20,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-08-23","due_date":"2026-08-31","monthly_amount_figures":1000000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"interest_due_bd":66666.67}]
  }'::jsonb
);


-- 29. Enegbo Kate
-- White Crust Ltd | REIF | 30% pa | 38M | Monthly | ₦22,000,000 | WHT: 10%
-- monthly_interest = 22,000,000 × 0.30/12 = 550,000.00 | custom_rate = 0.30×38/12 = 0.95
-- total_interest_paid = 2,308,645.16
SELECT _seed_investor(
  'enegbo.kate@whitecrust.import',
  'Enegbo', 'Kate', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"38 Months","custom_rate":0.95,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2024-02-09","due_date":"2027-04-30","monthly_amount_figures":22000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"total_interest_paid":2308645.16},
    "investment_plans":[{"plan":"reif","tenor":"38 Months","custom_rate":0.95,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2024-02-09","due_date":"2027-04-30","monthly_amount_figures":22000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"total_interest_paid":2308645.16}]
  }'::jsonb
);

-- 30. Erebe Okpe John
-- White Crust Ltd | REIF | 25% pa | 12M | End of Tenor | ₦3,500,000 | WHT: 10%
-- monthly_interest = 3,500,000 × 0.25/12 = 72,916.67 | custom_rate = 0.25
SELECT _seed_investor(
  'erebe.john@whitecrust.import',
  'Erebe Okpe', 'John', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.25,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-01-29","due_date":"2027-01-29","monthly_amount_figures":3500000,"investment_company":"White Crust Ltd","has_withholding_tax":true},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.25,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-01-29","due_date":"2027-01-29","monthly_amount_figures":3500000,"investment_company":"White Crust Ltd","has_withholding_tax":true}]
  }'::jsonb
);


-- 31. ETALONG EMMANUEL (2 plans)
-- Plan A: White Crust Ltd | REIF | 36% pa | 36M | Monthly | ₦10,000,000 balance (₦10,000,000 liquidated) | WHT: 10%
--   monthly_interest = 10,000,000 × 0.36/12 = 300,000.00 | custom_rate = 0.36×36/12 = 1.08
--   liquidation = 10,000,000 | total_interest_paid = 2,700,000
-- Plan B: White Crust Ltd | REIF | 36% pa | 12M | Monthly | ₦10,000,000 | WHT: 10%
--   monthly_interest = 10,000,000 × 0.36/12 = 300,000.00 | custom_rate = 0.36
SELECT _seed_investor(
  'etalong.emmanuel@whitecrust.import',
  'Etalong', 'Emmanuel', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"36 Months","custom_rate":1.08,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2024-09-18","due_date":"2027-09-30","monthly_amount_figures":10000000,"liquidation":10000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"total_interest_paid":2700000},
    "investment_plans":[
      {"plan":"reif","tenor":"36 Months","custom_rate":1.08,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2024-09-18","due_date":"2027-09-30","monthly_amount_figures":10000000,"liquidation":10000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"total_interest_paid":2700000},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.36,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-05-29","due_date":"2027-05-31","monthly_amount_figures":10000000,"investment_company":"White Crust Ltd","has_withholding_tax":true}
    ]
  }'::jsonb
);

-- 32. FAITH TEMITOPE AIYEORIBE
-- White Crust Ltd | Premium Investment | 12% pa compounding | 12M | End of Tenor | ₦100,000 | WHT: Nil
-- monthly_interest = 100,000 × 0.12/12 = 1,000.00 | custom_rate = 0.12
SELECT _seed_investor(
  'faith.aiyeoribe@whitecrust.import',
  'Faith Temitope', 'Aiyeoribe', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"premium","tenor":"12 Months","custom_rate":0.12,"mode_of_payment":"Bank Transfer","mode_of_interest":"Compounding","monthly_amount_words":"","monthly_payment_date":"2026-05-28","due_date":"2027-05-27","monthly_amount_figures":100000,"investment_company":"White Crust Ltd","has_withholding_tax":false},
    "investment_plans":[{"plan":"premium","tenor":"12 Months","custom_rate":0.12,"mode_of_payment":"Bank Transfer","mode_of_interest":"Compounding","monthly_amount_words":"","monthly_payment_date":"2026-05-28","due_date":"2027-05-27","monthly_amount_figures":100000,"investment_company":"White Crust Ltd","has_withholding_tax":false}]
  }'::jsonb
);


-- 33. Folagbomi Williams
-- White Crust Ltd | REIF | 24% pa | 12M | Monthly | ₦5,000,000 | WHT: 10%
-- monthly_interest = 5,000,000 × 0.24/12 = 100,000.00 | custom_rate = 0.24
-- total_interest_paid = 450,000
SELECT _seed_investor(
  'folagbomi.williams@whitecrust.import',
  'Folagbomi', 'Williams', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-09-01","due_date":"2026-08-31","monthly_amount_figures":5000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"total_interest_paid":450000},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-09-01","due_date":"2026-08-31","monthly_amount_figures":5000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"total_interest_paid":450000}]
  }'::jsonb
);

-- 34. Friday Okekwue (3 plans)
-- Plan A: White Crust Ltd | REIF | 24% pa | 36M | End of Tenor | ₦1,000,000 | WHT: 10%
--   monthly_interest = 1,000,000 × 0.24/12 = 20,000.00 | custom_rate = 0.24×36/12 = 0.72
--   interest_due_bd = 342,000
-- Plan B: White Crust Ltd | REIF | 26.67% pa | 9M | End of Tenor | ₦1,000,000 | WHT: 10%
--   monthly_interest = 1,000,000 × 0.2667/12 = 22,225.00 | custom_rate = 0.2667×9/12 = 0.20
-- Plan C: White Crust Ltd | REIF | 26.67% pa | 8M | End of Tenor | ₦1,000,000 | WHT: 10%
--   monthly_interest = 1,000,000 × 0.2667/12 = 22,225.00 | custom_rate = 0.2667×8/12 = 0.1778
SELECT _seed_investor(
  'friday.okekwue@whitecrust.import',
  'Friday', 'Okekwue', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"36 Months","custom_rate":0.72,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2024-05-31","due_date":"2027-05-30","monthly_amount_figures":1000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"interest_due_bd":342000.00},
    "investment_plans":[
      {"plan":"reif","tenor":"36 Months","custom_rate":0.72,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2024-05-31","due_date":"2027-05-30","monthly_amount_figures":1000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"interest_due_bd":342000.00},
      {"plan":"reif","tenor":"9 Months","custom_rate":0.20,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-02-25","due_date":"2026-11-30","monthly_amount_figures":1000000,"investment_company":"White Crust Ltd","has_withholding_tax":true},
      {"plan":"reif","tenor":"8 Months","custom_rate":0.1778,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-04-01","due_date":"2026-11-30","monthly_amount_figures":1000000,"investment_company":"White Crust Ltd","has_withholding_tax":true}
    ]
  }'::jsonb
);


-- 35. IBE DOMINIC EKENE
-- White Crust Ltd | REIF | 36% pa | 12M | Monthly | ₦100,000,000 | WHT: Nil
-- monthly_interest = 100,000,000 × 0.36/12 = 3,000,000.00 | custom_rate = 0.36
-- total_interest_paid = 15,000,000
SELECT _seed_investor(
  'ibe.ekene@whitecrust.import',
  'Ibe Dominic', 'Ekene', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.36,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-10-31","due_date":"2026-10-31","monthly_amount_figures":100000000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"total_interest_paid":15000000},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.36,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-10-31","due_date":"2026-10-31","monthly_amount_figures":100000000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"total_interest_paid":15000000}]
  }'::jsonb
);

-- 36. Idiong Evelyn Imeh
-- White Crust Ltd | REIF | 20% pa | 36M | End of Tenor | ₦500,000 | WHT: Nil
-- monthly_interest = 500,000 × 0.20/12 = 8,333.33 | custom_rate = 0.20×36/12 = 0.60
-- interest_due_bd = 83,333.34
SELECT _seed_investor(
  'idiong.evelyn@whitecrust.import',
  'Idiong Evelyn', 'Imeh', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"36 Months","custom_rate":0.60,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2024-01-09","due_date":"2027-01-31","monthly_amount_figures":500000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"interest_due_bd":83333.34},
    "investment_plans":[{"plan":"reif","tenor":"36 Months","custom_rate":0.60,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2024-01-09","due_date":"2027-01-31","monthly_amount_figures":500000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"interest_due_bd":83333.34}]
  }'::jsonb
);


-- 37. Imeh Ekanem Idiong (2 plans — Rich Oak Ltd & Oak Rief Ltd)
-- Plan A: Rich Oak Ltd | REIF | 18% pa | 12M | Monthly | ₦6,000,000 | WHT: Nil
--   monthly_interest = 6,000,000 × 0.18/12 = 90,000.00 | custom_rate = 0.18
--   total_interest_paid = 450,000
-- Plan B: Oak Rief Ltd | REIF | 20% pa | 12M | Monthly | ₦1,000,000 | WHT: Nil
--   monthly_interest = 1,000,000 × 0.20/12 = 16,666.67 | custom_rate = 0.20
--   total_interest_paid = 83,500
SELECT _seed_investor(
  'imeh.idiong@richoak.import',
  'Imeh Ekanem', 'Idiong', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.18,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-01-01","due_date":"2026-12-31","monthly_amount_figures":6000000,"investment_company":"Rich Oak Ltd","has_withholding_tax":false,"total_interest_paid":450000},
    "investment_plans":[
      {"plan":"reif","tenor":"12 Months","custom_rate":0.18,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-01-01","due_date":"2026-12-31","monthly_amount_figures":6000000,"investment_company":"Rich Oak Ltd","has_withholding_tax":false,"total_interest_paid":450000},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.20,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-01-01","due_date":"2026-12-31","monthly_amount_figures":1000000,"investment_company":"Oak Rief Ltd","has_withholding_tax":false,"total_interest_paid":83500}
    ]
  }'::jsonb
);

-- 38. ISHIAKA ZAINAB OLUWAFUNMILOLA
-- White Crust Ltd | Premium Plus | 12% pa compounding | 12M | End of Tenor | ₦500,000 | WHT: Nil
-- monthly_interest = 500,000 × 0.12/12 = 5,000.00 | custom_rate = 0.12
SELECT _seed_investor(
  'ishiaka.zainab@whitecrust.import',
  'Ishiaka Zainab', 'Oluwafunmilola', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"premium_plus","tenor":"12 Months","custom_rate":0.12,"mode_of_payment":"Bank Transfer","mode_of_interest":"Compounding","monthly_amount_words":"","monthly_payment_date":"2026-01-31","due_date":"2027-01-30","monthly_amount_figures":500000,"investment_company":"White Crust Ltd","has_withholding_tax":false},
    "investment_plans":[{"plan":"premium_plus","tenor":"12 Months","custom_rate":0.12,"mode_of_payment":"Bank Transfer","mode_of_interest":"Compounding","monthly_amount_words":"","monthly_payment_date":"2026-01-31","due_date":"2027-01-30","monthly_amount_figures":500000,"investment_company":"White Crust Ltd","has_withholding_tax":false}]
  }'::jsonb
);


-- 39. Iyile Theophilius Nzelak
-- White Crust Ltd | REIF | 30% pa | 12M | Monthly | ₦21,457,711.40 | WHT: Nil
-- monthly_interest = 21,457,711.40 × 0.30/12 = 536,442.79 | custom_rate = 0.30
SELECT _seed_investor(
  'iyile.nzelak@whitecrust.import',
  'Iyile Theophilius', 'Nzelak', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-09-26","due_date":"2026-09-26","monthly_amount_figures":21457711.40,"investment_company":"White Crust Ltd","has_withholding_tax":false},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-09-26","due_date":"2026-09-26","monthly_amount_figures":21457711.40,"investment_company":"White Crust Ltd","has_withholding_tax":false}]
  }'::jsonb
);

-- 40. Iyile Golria (3 plans)
-- Plan A: White Crust Ltd | REIF | 30% pa | 12M | Monthly | ₦4,000,000 | WHT: Nil
--   monthly_interest = 4,000,000 × 0.30/12 = 100,000.00 | custom_rate = 0.30
--   total_interest_paid = 500,000
-- Plan B: White Crust Ltd | REIF | 30% pa | 12M | Monthly | ₦1,000,000 | WHT: Nil
--   monthly_interest = 1,000,000 × 0.30/12 = 25,000.00 | custom_rate = 0.30
--   total_interest_paid = 125,000
-- Plan C: White Crust Ltd | REIF | 30% pa | 12M | Monthly | ₦500,000 | WHT: Nil
--   monthly_interest = 500,000 × 0.30/12 = 12,500.00 | custom_rate = 0.30
--   total_interest_paid = 25,000
SELECT _seed_investor(
  'iyile.golria@whitecrust.import',
  'Iyile', 'Golria', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-09-26","due_date":"2026-09-26","monthly_amount_figures":4000000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"total_interest_paid":500000},
    "investment_plans":[
      {"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-09-26","due_date":"2026-09-26","monthly_amount_figures":4000000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"total_interest_paid":500000},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-12-16","due_date":"2026-12-31","monthly_amount_figures":1000000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"total_interest_paid":125000},
      {"plan":"reif","tenor":"12 Months","custom_rate":0.30,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-03-11","due_date":"2027-03-31","monthly_amount_figures":500000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"total_interest_paid":25000}
    ]
  }'::jsonb
);


-- 41. Jane Salifu Grace
-- Rich Oak Ltd | REIF | 18% pa | 12M | Monthly | ₦957,000 | WHT: Nil
-- monthly_interest = 957,000 × 0.18/12 = 14,355.00 | custom_rate = 0.18
-- total_interest_paid = 71,775
SELECT _seed_investor(
  'jane.grace@richoak.import',
  'Jane Salifu', 'Grace', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.18,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-01-01","due_date":"2026-12-31","monthly_amount_figures":957000,"investment_company":"Rich Oak Ltd","has_withholding_tax":false,"total_interest_paid":71775},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.18,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-01-01","due_date":"2026-12-31","monthly_amount_figures":957000,"investment_company":"Rich Oak Ltd","has_withholding_tax":false,"total_interest_paid":71775}]
  }'::jsonb
);

-- 42. Luka Dorcas Erdoo (2 plans)
-- Plan A: White Crust Ltd | Premium Plus | 24% pa | 6M | End of Tenor | ₦600,000 | WHT: Nil
--   monthly_interest = 600,000 × 0.24/12 = 12,000.00 | custom_rate = 0.24×6/12 = 0.12
-- Plan B: White Crust Ltd | Premium Investment | 12% pa compounding | 12M | End of Tenor | ₦500,000 | WHT: Nil
--   monthly_interest = 500,000 × 0.12/12 = 5,000.00 | custom_rate = 0.12
SELECT _seed_investor(
  'luka.erdoo@whitecrust.import',
  'Luka Dorcas', 'Erdoo', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"premium_plus","tenor":"6 Months","custom_rate":0.12,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-12-30","due_date":"2026-06-30","monthly_amount_figures":600000,"investment_company":"White Crust Ltd","has_withholding_tax":false},
    "investment_plans":[
      {"plan":"premium_plus","tenor":"6 Months","custom_rate":0.12,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-12-30","due_date":"2026-06-30","monthly_amount_figures":600000,"investment_company":"White Crust Ltd","has_withholding_tax":false},
      {"plan":"premium","tenor":"12 Months","custom_rate":0.12,"mode_of_payment":"Bank Transfer","mode_of_interest":"Compounding","monthly_amount_words":"","monthly_payment_date":"2025-12-31","due_date":"2026-12-31","monthly_amount_figures":500000,"investment_company":"White Crust Ltd","has_withholding_tax":false}
    ]
  }'::jsonb
);


-- 43. Modebe Chiemelie
-- Rich Oak Ltd | REIF | 18% pa | 12M | Monthly | ₦1,500,000 balance (₦500,000 liquidated) | WHT: Nil
-- monthly_interest = 1,500,000 × 0.18/12 = 22,500.00 | custom_rate = 0.18
-- liquidation = 500,000 | total_interest_paid = 112,500
SELECT _seed_investor(
  'modebe.chiemelie@richoak.import',
  'Modebe', 'Chiemelie', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.18,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-01-01","due_date":"2026-12-31","monthly_amount_figures":1500000,"liquidation":500000,"investment_company":"Rich Oak Ltd","has_withholding_tax":false,"total_interest_paid":112500},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.18,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-01-01","due_date":"2026-12-31","monthly_amount_figures":1500000,"liquidation":500000,"investment_company":"Rich Oak Ltd","has_withholding_tax":false,"total_interest_paid":112500}]
  }'::jsonb
);

-- 44. Ogoh Oboh (3 plans)
-- Plan A: White Crust Ltd | REIF | 25% pa | 18M | End of Tenor | ₦3,000,000 | WHT: 10%
--   monthly_interest = 3,000,000 × 0.25/12 = 62,500.00 | custom_rate = 0.25×18/12 = 0.375
-- Plan B: White Crust Ltd | REIF | 25% pa | 6M | End of Tenor | ₦2,000,000 | WHT: 10%
--   monthly_interest = 2,000,000 × 0.25/12 = 41,666.67 | custom_rate = 0.25×6/12 = 0.125
-- Plan C: White Crust Ltd | REIF | 25% pa | 6M | End of Tenor | ₦2,000,000 | WHT: 10%
--   monthly_interest = 2,000,000 × 0.25/12 = 41,666.67 | custom_rate = 0.25×6/12 = 0.125
SELECT _seed_investor(
  'ogoh.oboh@whitecrust.import',
  'Ogoh', 'Oboh', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"18 Months","custom_rate":0.375,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-02-02","due_date":"2027-07-31","monthly_amount_figures":3000000,"investment_company":"White Crust Ltd","has_withholding_tax":true},
    "investment_plans":[
      {"plan":"reif","tenor":"18 Months","custom_rate":0.375,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-02-02","due_date":"2027-07-31","monthly_amount_figures":3000000,"investment_company":"White Crust Ltd","has_withholding_tax":true},
      {"plan":"reif","tenor":"6 Months","custom_rate":0.125,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-03-23","due_date":"2026-09-30","monthly_amount_figures":2000000,"investment_company":"White Crust Ltd","has_withholding_tax":true},
      {"plan":"reif","tenor":"6 Months","custom_rate":0.125,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2026-04-15","due_date":"2026-10-31","monthly_amount_figures":2000000,"investment_company":"White Crust Ltd","has_withholding_tax":true}
    ]
  }'::jsonb
);


-- 45. Ogoh Peter (2 plans — White Crust Ltd & Rich Oak Ltd)
-- Plan A: White Crust Ltd | Premium Plus | 24% pa | 36M | Monthly | ₦1,000,000 | WHT: Nil
--   monthly_interest = 1,000,000 × 0.24/12 = 20,000.00 | custom_rate = 0.24×36/12 = 0.72
--   total_interest_paid = 100,000
-- Plan B: Rich Oak Ltd | Premium Plus | 24% pa | ~67M | Monthly | ₦700,000 | WHT: Nil
--   monthly_interest = 700,000 × 0.24/12 = 14,000.00 | custom_rate = 0.24×67/12 = 1.34
--   total_interest_paid = 70,000
SELECT _seed_investor(
  'ogoh.peter@whitecrust.import',
  'Ogoh', 'Peter', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"premium_plus","tenor":"36 Months","custom_rate":0.72,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2024-01-08","due_date":"2027-01-31","monthly_amount_figures":1000000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"total_interest_paid":100000},
    "investment_plans":[
      {"plan":"premium_plus","tenor":"36 Months","custom_rate":0.72,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2024-01-08","due_date":"2027-01-31","monthly_amount_figures":1000000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"total_interest_paid":100000},
      {"plan":"premium_plus","tenor":"67 Months","custom_rate":1.34,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2021-06-16","due_date":"2027-01-31","monthly_amount_figures":700000,"investment_company":"Rich Oak Ltd","has_withholding_tax":false,"total_interest_paid":70000}
    ]
  }'::jsonb
);

-- 46. Ogunsanya Olusegun
-- White Crust Ltd | Premium Plus | 24% pa | 36M | End of Tenor | ₦100,000 balance (₦100,000 liquidated) | WHT: Nil
-- monthly_interest = 100,000 × 0.24/12 = 2,000.00 | custom_rate = 0.24×36/12 = 0.72
-- liquidation = 100,000 | interest_due_bd = 44,000
SELECT _seed_investor(
  'ogunsanya.olusegun@whitecrust.import',
  'Ogunsanya', 'Olusegun', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"premium_plus","tenor":"36 Months","custom_rate":0.72,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2024-02-08","due_date":"2027-02-28","monthly_amount_figures":100000,"liquidation":100000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"interest_due_bd":44000.00},
    "investment_plans":[{"plan":"premium_plus","tenor":"36 Months","custom_rate":0.72,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2024-02-08","due_date":"2027-02-28","monthly_amount_figures":100000,"liquidation":100000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"interest_due_bd":44000.00}]
  }'::jsonb
);


-- 47. OLADOKUN OLAJUYI
-- White Crust Ltd | Premium Investment | 12% pa compounding | 24M | End of Tenor | ₦1,700,000 | WHT: Nil
-- For compounding: effective 2-year rate = (1.12)^2 - 1 = 0.2544
-- monthly_interest = 1,700,000 × 0.12/12 = 17,000.00 (simple monthly for display)
-- custom_rate = 0.12×24/12 = 0.24 (stored as flat; app reverses to annual)
-- interest_due_bd = 68,250.30
SELECT _seed_investor(
  'oladokun.olajuyi@whitecrust.import',
  'Oladokun', 'Olajuyi', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"premium","tenor":"24 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Compounding","monthly_amount_words":"","monthly_payment_date":"2025-02-01","due_date":"2027-02-28","monthly_amount_figures":1700000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"interest_due_bd":68250.30},
    "investment_plans":[{"plan":"premium","tenor":"24 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Compounding","monthly_amount_words":"","monthly_payment_date":"2025-02-01","due_date":"2027-02-28","monthly_amount_figures":1700000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"interest_due_bd":68250.30}]
  }'::jsonb
);

-- 48. Oluwaseun Olarinoye Joseph
-- White Crust Ltd | REIF | 30% pa | 36M | Monthly | ₦15,000,000 | WHT: Nil
-- monthly_interest = 15,000,000 × 0.30/12 = 375,000.00 | custom_rate = 0.30×36/12 = 0.90
-- total_interest_paid = 1,875,000
SELECT _seed_investor(
  'oluwaseun.joseph@whitecrust.import',
  'Oluwaseun Olarinoye', 'Joseph', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"36 Months","custom_rate":0.90,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2023-11-30","due_date":"2026-11-30","monthly_amount_figures":15000000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"total_interest_paid":1875000},
    "investment_plans":[{"plan":"reif","tenor":"36 Months","custom_rate":0.90,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2023-11-30","due_date":"2026-11-30","monthly_amount_figures":15000000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"total_interest_paid":1875000}]
  }'::jsonb
);


-- 49. Raji Tobi
-- White Crust Ltd | Premium Investment | 24% pa | 24M | End of Tenor | ₦402,422.39 | WHT: 10%
-- monthly_interest = 402,422.39 × 0.24/12 = 8,048.45 | custom_rate = 0.24×24/12 = 0.48
-- interest_due_bd = 101,410.44
SELECT _seed_investor(
  'raji.tobi@whitecrust.import',
  'Raji', 'Tobi', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"premium","tenor":"24 Months","custom_rate":0.48,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2024-11-01","due_date":"2026-10-31","monthly_amount_figures":402422.39,"investment_company":"White Crust Ltd","has_withholding_tax":true,"interest_due_bd":101410.44},
    "investment_plans":[{"plan":"premium","tenor":"24 Months","custom_rate":0.48,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2024-11-01","due_date":"2026-10-31","monthly_amount_figures":402422.39,"investment_company":"White Crust Ltd","has_withholding_tax":true,"interest_due_bd":101410.44}]
  }'::jsonb
);

-- 50. Rose Unana
-- White Crust Ltd | REIF | 36% pa | 36M | Monthly | ₦50,000,000 | WHT: Nil
-- monthly_interest = 50,000,000 × 0.36/12 = 1,500,000.00 | custom_rate = 0.36×36/12 = 1.08
-- total_interest_paid = 7,500,000
SELECT _seed_investor(
  'rose.unana@whitecrust.import',
  'Rose', 'Unana', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"36 Months","custom_rate":1.08,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2024-02-02","due_date":"2027-02-28","monthly_amount_figures":50000000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"total_interest_paid":7500000},
    "investment_plans":[{"plan":"reif","tenor":"36 Months","custom_rate":1.08,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2024-02-02","due_date":"2027-02-28","monthly_amount_figures":50000000,"investment_company":"White Crust Ltd","has_withholding_tax":false,"total_interest_paid":7500000}]
  }'::jsonb
);


-- 51. ROSEMARY ENOCK
-- White Crust Ltd | Premium Investment | 12% pa compounding | 12M | End of Tenor | ₦100,000 | WHT: Nil
-- monthly_interest = 100,000 × 0.12/12 = 1,000.00 | custom_rate = 0.12
SELECT _seed_investor(
  'rosemary.enock@whitecrust.import',
  'Rosemary', 'Enock', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"premium","tenor":"12 Months","custom_rate":0.12,"mode_of_payment":"Bank Transfer","mode_of_interest":"Compounding","monthly_amount_words":"","monthly_payment_date":"2026-05-28","due_date":"2027-05-31","monthly_amount_figures":100000,"investment_company":"White Crust Ltd","has_withholding_tax":false},
    "investment_plans":[{"plan":"premium","tenor":"12 Months","custom_rate":0.12,"mode_of_payment":"Bank Transfer","mode_of_interest":"Compounding","monthly_amount_words":"","monthly_payment_date":"2026-05-28","due_date":"2027-05-31","monthly_amount_figures":100000,"investment_company":"White Crust Ltd","has_withholding_tax":false}]
  }'::jsonb
);

-- 52. Temitope Love Ajao
-- Rich Oak Ltd | REIF | 18.48% pa | 12M | Monthly | ₦7,000,000 | WHT: Nil
-- monthly_interest = 7,000,000 × 0.1848/12 = 107,800.00 | custom_rate = 0.1848
-- total_interest_paid = 539,000
SELECT _seed_investor(
  'temitope.ajao@richoak.import',
  'Temitope Love', 'Ajao', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.1848,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-01-01","due_date":"2026-12-31","monthly_amount_figures":7000000,"investment_company":"Rich Oak Ltd","has_withholding_tax":false,"total_interest_paid":539000},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.1848,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-01-01","due_date":"2026-12-31","monthly_amount_figures":7000000,"investment_company":"Rich Oak Ltd","has_withholding_tax":false,"total_interest_paid":539000}]
  }'::jsonb
);


-- 53. UCHECHUKWU SYLVIA EZERUO
-- White Crust Ltd | Premium Plus | 20% pa | 24M | End of Tenor | ₦600,000 | WHT: 10%
-- monthly_interest = 600,000 × 0.20/12 = 10,000.00 | custom_rate = 0.20×24/12 = 0.40
-- total_interest_paid = 45,090
SELECT _seed_investor(
  'uchechukwu.ezeruo@whitecrust.import',
  'Uchechukwu Sylvia', 'Ezeruo', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"premium_plus","tenor":"24 Months","custom_rate":0.40,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-01-24","due_date":"2027-01-31","monthly_amount_figures":600000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"total_interest_paid":45090},
    "investment_plans":[{"plan":"premium_plus","tenor":"24 Months","custom_rate":0.40,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-01-24","due_date":"2027-01-31","monthly_amount_figures":600000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"total_interest_paid":45090}]
  }'::jsonb
);

-- 54. UDUKHOMOH CHRISTIANA ESEINEME
-- White Crust Ltd | REIF & Premium | 24% pa | 12M | Monthly | ₦8,115,691.40 | WHT: 10%
-- monthly_interest = 8,115,691.40 × 0.24/12 = 162,313.83 | custom_rate = 0.24
SELECT _seed_investor(
  'udukhomoh.eseineme@whitecrust.import',
  'Udukhomoh Christiana', 'Eseineme', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-05-01","due_date":"2027-04-30","monthly_amount_figures":8115691.40,"investment_company":"White Crust Ltd","has_withholding_tax":true},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2026-05-01","due_date":"2027-04-30","monthly_amount_figures":8115691.40,"investment_company":"White Crust Ltd","has_withholding_tax":true}]
  }'::jsonb
);


-- 55. VERONICA IYABO WILLIAMS
-- White Crust Ltd | REIF | 24% pa | 12M | Monthly | ₦12,335,109.68 | WHT: 10%
-- monthly_interest = 12,335,109.68 × 0.24/12 = 246,702.19 | custom_rate = 0.24
-- total_interest_paid = 1,110,159.85
SELECT _seed_investor(
  'veronica.williams@whitecrust.import',
  'Veronica Iyabo', 'Williams', 'Mrs',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-09-01","due_date":"2026-08-31","monthly_amount_figures":12335109.68,"investment_company":"White Crust Ltd","has_withholding_tax":true,"total_interest_paid":1110159.85},
    "investment_plans":[{"plan":"reif","tenor":"12 Months","custom_rate":0.24,"mode_of_payment":"Bank Transfer","mode_of_interest":"Monthly","monthly_amount_words":"","monthly_payment_date":"2025-09-01","due_date":"2026-08-31","monthly_amount_figures":12335109.68,"investment_company":"White Crust Ltd","has_withholding_tax":true,"total_interest_paid":1110159.85}]
  }'::jsonb
);

-- 56. Williams Olatunbosun
-- White Crust Ltd | REIF | 24% pa | 48M | End of Tenor | ₦29,750,000 balance (₦8,310,000 liquidated) | WHT: 10%
-- monthly_interest = 29,750,000 × 0.24/12 = 595,000.00 | custom_rate = 0.24×48/12 = 0.96
-- liquidation = 8,310,000 | interest_due_bd = 16,557,377.42
SELECT _seed_investor(
  'williams.olatunbosun@whitecrust.import',
  'Williams', 'Olatunbosun', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"48 Months","custom_rate":0.96,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2023-03-23","due_date":"2027-03-31","monthly_amount_figures":29750000,"liquidation":8310000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"interest_due_bd":16557377.42},
    "investment_plans":[{"plan":"reif","tenor":"48 Months","custom_rate":0.96,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2023-03-23","due_date":"2027-03-31","monthly_amount_figures":29750000,"liquidation":8310000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"interest_due_bd":16557377.42}]
  }'::jsonb
);

-- 57. Zion Adache Aboh
-- White Crust Ltd | REIF | 24% pa | 8M | End of Tenor | ₦2,000,000 | WHT: 10%
-- monthly_interest = 2,000,000 × 0.24/12 = 40,000.00 | custom_rate = 0.24×8/12 = 0.16
-- interest_due_bd = 72,000
SELECT _seed_investor(
  'zion.aboh@whitecrust.import',
  'Zion Adache', 'Aboh', 'Mr',
  '{
    "bio_data":{"lga":"","phone":"","next_of_kin":"","date_of_birth":"","signature_url":"","employment_type":[],"state_of_origin":"","next_of_kin_phone":"","passport_photo_url":"","next_of_kin_address":""},
    "bank_details":{"bank_name":"","account_name":"","account_number":""},
    "personal_info":{"gender":"","id_number":"","job_title":"","occupation":"","means_of_id":"","nationality":"Nigerian","employer_name":"","office_address":""},
    "investment_plan":{"plan":"reif","tenor":"8 Months","custom_rate":0.16,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-11-01","due_date":"2026-06-30","monthly_amount_figures":2000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"interest_due_bd":72000.00},
    "investment_plans":[{"plan":"reif","tenor":"8 Months","custom_rate":0.16,"mode_of_payment":"Bank Transfer","mode_of_interest":"End of Tenor","monthly_amount_words":"","monthly_payment_date":"2025-11-01","due_date":"2026-06-30","monthly_amount_figures":2000000,"investment_company":"White Crust Ltd","has_withholding_tax":true,"interest_due_bd":72000.00}]
  }'::jsonb
);

-- ── Cleanup ──────────────────────────────────────────────────
DROP FUNCTION IF EXISTS _seed_investor;
