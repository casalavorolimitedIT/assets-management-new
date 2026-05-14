export interface BioData {
  lga: string;
  phone: string;
  next_of_kin: string;
  date_of_birth: string;
  signature_url: string;
  employment_type: string[];
  state_of_origin: string;
  next_of_kin_phone: string;
  passport_photo_url: string;
  next_of_kin_address: string;
}

export interface BankDetails {
  bank_name: string;
  account_name: string;
  account_number: string;
}

export interface PersonalInfo {
  gender: string;
  id_number: string;
  job_title: string;
  occupation: string;
  means_of_id: string;
  nationality: string;
  employer_name: string;
  office_address: string;
}

export interface InvestmentPlan {
  plan: string;
  tenor: string;
  units: number;
  total_words: string;
  total_figures: number;
  mode_of_payment: string;
  mode_of_interest: string;
  monthly_amount_words: string;
  monthly_payment_date: string;
  monthly_amount_figures: number;
}

export interface Compliance {
  bio_data: BioData;
  bank_details: BankDetails;
  personal_info: PersonalInfo;
  investment_plan: InvestmentPlan;
  investment_plans?: InvestmentPlan[];
}

export interface UserProfile {
  id: string;
  email: string;
  title: string;
  first_name: string;
  last_name: string;
  other_name: string | null;
  phone: string;
  created_at: string;
  updated_at: string;
  isVerified: boolean;
  compliance: Compliance;
  metamap_status: string | null;
  role: string;
}
