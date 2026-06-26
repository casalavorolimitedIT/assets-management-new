import { NotifType } from "@/app/dashboard/broadcast/page";

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
  investment_company?: string;
  has_paid?: boolean;
  paid_months?: number[];
  custom_rate?: number;
  interest_due_bd?: number;
  due_date?: string;
  liquidation?: number;
  total_interest_paid?: number;
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
  email_changed?: boolean;
}

// ── Notification Form ─────────────────────────────────────────────────────────

export const NOTIF_TYPES: {
  value: NotifType;
  label: string;
  active: string;
  idle: string;
}[] = [
  {
    value: "info",
    label: "Info",
    active: "bg-blue-600 text-white border-blue-600",
    idle: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  },
  {
    value: "success",
    label: "Success",
    active: "bg-emerald-600 text-white border-emerald-600",
    idle: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
  {
    value: "warning",
    label: "Warning",
    active: "bg-amber-500 text-white border-amber-500",
    idle: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
  {
    value: "error",
    label: "Error",
    active: "bg-red-600 text-white border-red-600",
    idle: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
  },
];