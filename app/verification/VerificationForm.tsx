"use client";

import React from "react";
import Script from "next/script";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  User,
  FileText,
  TrendingUp,
  Landmark,
  Check,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ScanFace,
  PartyPopper,
  Banknote,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { ImageUpload } from "@/components/custom/ImageUpload";
import { insertTransaction } from "@/hooks/insert-transaction";
import BankDetailsDisplay from "@/components/custom/BankDetailsDisplay";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "mati-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          clientid?: string;
          flowid?: string;
          metadata?: string;
        },
        HTMLElement
      >;
    }
  }
}

type InvestmentPlan = "premium_plus" | "premium" | "reif" | "";

interface FormValues {
  // Step 1
  nationality: string;
  meansOfId: string;
  idNumber: string;
  occupation: string;
  jobTitle: string;
  gender: string;
  employerName: string;
  officeAddress: string;
  // Step 2
  employmentType: string[];
  passportPhoto: File | null;
  email: string;
  phone: string;
  dateOfBirth: string;
  stateOfOrigin: string;
  lga: string;
  nextOfKin: string;
  nextOfKinPhone: string;
  nextOfKinAddress: string;
  signature: File | null;
  // Step 3
  skipInvestmentPlan: boolean;
  investmentCompany: string;
  investmentPlan: InvestmentPlan;
  ppInvestmentType: string;
  ppAmountFigures: string;
  ppAmountWords: string;
  ppTenor: string;
  ppModeOfPayment: string;
  ppModeOfInterest: string;
  prMonthlyAmountFigures: string;
  prMonthlyAmountWords: string;
  reifTenor: string;
  prTenor: string;
  prMonthlyPaymentDate: string;
  reifUnits: string;
  reifTotalFigures: string;
  reifTotalWords: string;
  reifModeOfPayment: string;
  reifModeOfInterest: string;
  // Step 4
  bankName: string;
  accountName: string;
  accountNumber: string;
}

const FILE_FIELDS: (keyof FormValues)[] = ["passportPhoto", "signature"];

const DRAFT_KEY = "verification_form_draft";

type DraftValues = Omit<FormValues, "passportPhoto" | "signature"> & {
  passportPhoto: null;
  signature: null;
};

function saveDraft(values: FormValues): void {
  try {
    const draft: DraftValues = {
      ...(Object.fromEntries(
        Object.entries(values).filter(
          ([k]) => !FILE_FIELDS.includes(k as keyof FormValues),
        ),
      ) as Omit<FormValues, "passportPhoto" | "signature">),
      passportPhoto: null,
      signature: null,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Silently ignore
  }
}

function loadDraft(): Partial<DraftValues> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<DraftValues>;
  } catch {
    return null;
  }
}

function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

const STEPS = [
  { id: 1, label: "Personal Info", icon: User },
  { id: 2, label: "Bio Data", icon: FileText },
  { id: 3, label: "Investment Plan", icon: TrendingUp },
  { id: 4, label: "Bank Details", icon: Landmark },
  { id: 5, label: "Make Transfer", icon: Banknote },
];

const MEANS_OF_ID = [
  "Digital NIN Slip",
  "NIN ID Card",
  "NIN Slip",
  "Voter's Card",
  "International Passport",
  "Driver's Licence",
];
const GENDERS = ["Male", "Female"];
const EMPLOYMENT_TYPES = [
  { value: "salaried", label: "Salaried Worker" },
  { value: "business", label: "Businessman / Businesswoman" },
  { value: "nysc", label: "NYSC" },
  { value: "student", label: "Student" },
  { value: "others", label: "Others" },
];
const TENORS = [
  "3 Months",
  "6 Months",
  "12 Months",
  "18 Months",
  "24 Months",
  "36 Months",
];
const PAYMENT_MODES = ["Bank Transfer", "Cheque", "Cash"];
const INTEREST_MODES = ["Upfront", "Monthly", "End of Tenor"];
const INVESTMENT_COMPANIES = ["Casalavoro Limited", "White Crust Limited"];
const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;

const step1Schema = Yup.object({
  nationality: Yup.string().required("Nationality is required"),
  meansOfId: Yup.string().required("Means of identification is required"),
  idNumber: Yup.string()
    .min(4, "Enter a valid ID number")
    .required("ID number is required"),
  occupation: Yup.string().required("Occupation is required"),
  jobTitle: Yup.string().required("Job title / status is required"),
  gender: Yup.string().required("Gender is required"),
  employerName: Yup.string().required("Employer / business name is required"),
  officeAddress: Yup.string().required("Address is required"),
});

const step2Schema = Yup.object({
  employmentType: Yup.array().min(1, "Select at least one employment status"),
  passportPhoto: Yup.mixed<File>().required("Passport photograph is required"),
  phone: Yup.string()
    .matches(phoneRegex, "Enter a valid phone number")
    .required("Phone number is required"),
  dateOfBirth: Yup.string().required("Date of birth is required"),
  stateOfOrigin: Yup.string().required("State of origin is required"),
  lga: Yup.string().required("LGA is required"),
  nextOfKin: Yup.string().required("Next of kin name is required"),
  nextOfKinPhone: Yup.string()
    .matches(phoneRegex, "Enter a valid phone number")
    .required("Next of kin phone is required"),
  nextOfKinAddress: Yup.string().required("Next of kin address is required"),
  signature: Yup.mixed<File>().required("Signature is required"),
});

const step3Schema = Yup.object({
  investmentCompany: Yup.string().required("Investment company is required"),
  investmentPlan: Yup.string()
    .oneOf(["premium_plus", "premium", "reif"], "Select an investment plan")
    .required("Select an investment plan"),
  ppAmountFigures: Yup.string().when("investmentPlan", {
    is: "premium_plus",
    then: (s) =>
      s
        .required("Amount (figures) is required")
        .test(
          "min-amount",
          "Premium Plus minimum amount is ₦100,000",
          (value) => !value || Number(value) >= 100000,
        ),
  }),
  ppAmountWords: Yup.string().when("investmentPlan", {
    is: "premium_plus",
    then: (s) => s.required("Amount (words) is required"),
  }),
  ppTenor: Yup.string().when("investmentPlan", {
    is: "premium_plus",
    then: (s) => s.required("Tenor is required"),
  }),
  ppModeOfPayment: Yup.string().when("investmentPlan", {
    is: "premium_plus",
    then: (s) => s.required("Mode of payment is required"),
  }),
  ppModeOfInterest: Yup.string().when("investmentPlan", {
    is: "premium_plus",
    then: (s) => s.required("Mode of interest repayment is required"),
  }),
  prMonthlyAmountFigures: Yup.string().when("investmentPlan", {
    is: "premium",
    then: (s) =>
      s
        .required("Monthly amount (figures) is required")
        .test(
          "min-amount",
          "Premium minimum amount is ₦100,000",
          (value) => !value || Number(value) >= 100000,
        ),
  }),
  prMonthlyAmountWords: Yup.string().when("investmentPlan", {
    is: "premium",
    then: (s) => s.required("Monthly amount (words) is required"),
  }),
  prTenor: Yup.string().when("investmentPlan", {
    is: "premium",
    then: (s) => s.required("Tenor is required"),
  }),
  prMonthlyPaymentDate: Yup.string().when("investmentPlan", {
    is: "premium",
    then: (s) => s.required("Monthly payment date is required"),
  }),
  reifTenor: Yup.string().when("investmentPlan", {
    is: "reif",
    then: (s) => s.required("Tenor is required"),
  }),
  reifUnits: Yup.string().when("investmentPlan", {
    is: "reif",
    then: (s) => s.required("Number of units is required"),
  }),
  reifTotalFigures: Yup.string().when("investmentPlan", {
    is: "reif",
    then: (s) =>
      s
        .required("Total investment (figures) is required")
        .test(
          "min-amount",
          "REIF minimum amount is ₦500,000",
          (value) => !value || Number(value) >= 500000,
        ),
  }),
  reifTotalWords: Yup.string().when("investmentPlan", {
    is: "reif",
    then: (s) => s.required("Total investment (words) is required"),
  }),
  reifModeOfPayment: Yup.string().when("investmentPlan", {
    is: "reif",
    then: (s) => s.required("Mode of payment is required"),
  }),
  reifModeOfInterest: Yup.string().when("investmentPlan", {
    is: "reif",
    then: (s) => s.required("Mode of interest repayment is required"),
  }),
});

const step4Schema = Yup.object({
  bankName: Yup.string().required("Bank name is required"),
  accountName: Yup.string().required("Account name is required"),
  accountNumber: Yup.string()
    .matches(/^\d{10}$/, "Account number must be exactly 10 digits")
    .required("Account number is required"),
});

const stepSchemas = [step1Schema, step2Schema, step3Schema, step4Schema];

async function uploadFile(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  path: string,
  file: File,
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function getExtension(file: File): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  return map[file.type] ?? ".jpg";
}

async function submitVerification(
  values: FormValues,
): Promise<{ uid: string; email: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const uid = user.id;
  const ts = Date.now();

  const [passportUrl, signatureUrl] = await Promise.all([
    values.passportPhoto
      ? uploadFile(
          supabase,
          "verifications",
          `${uid}/passport_${ts}${getExtension(values.passportPhoto)}`,
          values.passportPhoto,
        )
      : Promise.resolve(""),
    values.signature
      ? uploadFile(
          supabase,
          "verifications",
          `${uid}/signature_${ts}${getExtension(values.signature)}`,
          values.signature,
        )
      : Promise.resolve(""),
  ]);

  const investmentPlanPayload: Record<string, unknown> | null =
    values.skipInvestmentPlan
      ? null
      : {
          plan: values.investmentPlan,
          investment_company: values.investmentCompany,
          ...(values.investmentPlan === "premium_plus" && {
            amount_figures: values.ppAmountFigures
              ? Number(values.ppAmountFigures)
              : null,
            amount_words: values.ppAmountWords,
            tenor: values.ppTenor,
            mode_of_payment: values.ppModeOfPayment,
            mode_of_interest: values.ppModeOfInterest,
            monthly_amount_figures: values.ppAmountFigures
              ? Number(values.ppAmountFigures)
              : null,
            monthly_amount_words: values.ppAmountWords,
            monthly_payment_date: new Date().toISOString().split("T")[0],
          }),
          ...(values.investmentPlan === "premium" && {
            monthly_amount_figures: values.prMonthlyAmountFigures
              ? Number(values.prMonthlyAmountFigures)
              : null,
            monthly_amount_words: values.prMonthlyAmountWords,
            tenor: values.prTenor,
            monthly_payment_date: values.prMonthlyPaymentDate,
          }),
          ...(values.investmentPlan === "reif" && {
            units: values.reifUnits ? Number(values.reifUnits) : null,
            total_figures: values.reifTotalFigures
              ? Number(values.reifTotalFigures)
              : null,
            total_words: values.reifTotalWords,
            mode_of_payment: values.reifModeOfPayment,
            mode_of_interest: values.reifModeOfInterest,
            monthly_amount_figures: values.reifTotalFigures
              ? Number(values.reifTotalFigures)
              : null,
            monthly_amount_words: values.reifTotalWords,
            tenor: values.reifTenor,
            monthly_payment_date: new Date().toISOString().split("T")[0],
          }),
        };

  const compliance = {
    personal_info: {
      nationality: values.nationality,
      means_of_id: values.meansOfId,
      id_number: values.idNumber,
      occupation: values.occupation,
      job_title: values.jobTitle,
      gender: values.gender,
      employer_name: values.employerName,
      office_address: values.officeAddress,
    },
    bio_data: {
      employment_type: values.employmentType,
      passport_photo_url: passportUrl,
      phone: values.phone,
      date_of_birth: values.dateOfBirth,
      state_of_origin: values.stateOfOrigin,
      lga: values.lga,
      next_of_kin: values.nextOfKin,
      next_of_kin_phone: values.nextOfKinPhone,
      next_of_kin_address: values.nextOfKinAddress,
      signature_url: signatureUrl,
    },
    bank_details: {
      bank_name: values.bankName,
      account_name: values.accountName,
      account_number: values.accountNumber,
    },
  };

  const { data: profile, error: fetchErr } = await supabase
    .from("profiles")
    .select("compliance, first_name")
    .eq("id", uid)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  const existingPlans: Record<string, unknown>[] = Array.isArray(
    profile?.compliance?.investment_plans,
  )
    ? (profile.compliance.investment_plans as Record<string, unknown>[])
    : profile?.compliance?.investment_plan
      ? [profile.compliance.investment_plan as Record<string, unknown>]
      : [];

  const updatedCompliance = investmentPlanPayload
    ? {
        ...(profile?.compliance ?? {}),
        ...compliance,
        investment_plans: [...existingPlans, investmentPlanPayload],
        investment_plan: investmentPlanPayload,
      }
    : {
        ...(profile?.compliance ?? {}),
        ...compliance,
      };

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      compliance: updatedCompliance,
      isVerified: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", uid);

  if (updateErr) throw new Error(updateErr.message);

  if (!values.skipInvestmentPlan) {
    await insertTransaction({
      user_id: uid,
      plan: values.investmentPlan,
      amount:
        values.investmentPlan === "premium_plus"
          ? Number(values.ppAmountFigures)
          : values.investmentPlan === "premium"
            ? Number(values.prMonthlyAmountFigures)
            : Number(values.reifTotalFigures),
      amount_words:
        values.investmentPlan === "premium_plus"
          ? values.ppAmountWords
          : values.investmentPlan === "premium"
            ? values.prMonthlyAmountWords
            : values.reifTotalWords,
      tenor:
        values.investmentPlan === "premium_plus"
          ? values.ppTenor
          : values.investmentPlan === "premium"
            ? values.prTenor
            : values.reifTenor,
      mode_of_payment:
        values.investmentPlan === "premium_plus"
          ? values.ppModeOfPayment
          : values.investmentPlan === "reif"
            ? values.reifModeOfPayment
            : undefined,
      mode_of_interest:
        values.investmentPlan === "premium_plus"
          ? values.ppModeOfInterest
          : values.investmentPlan === "reif"
            ? values.reifModeOfInterest
            : undefined,
      units:
        values.investmentPlan === "reif"
          ? Number(values.reifUnits)
          : undefined,
    });
  }

  const displayName =
    profile?.first_name?.trim() || user.email?.split("@")[0] || "A user";

  const planLabels: Record<string, string> = {
    premium_plus: "Premium Plus",
    premium: "Premium",
    reif: "REIF",
  };
  const planLabel = planLabels[values.investmentPlan] ?? values.investmentPlan;

  const adminMessage = values.skipInvestmentPlan
    ? `${displayName} has completed verification and skipped the investment plan step.`
    : `${displayName} has submitted a ${planLabel} investment plan and it is pending review.`;
  const userMessage = values.skipInvestmentPlan
    ? "Your account verification is complete. You can add your investment plan later."
    : `Your ${planLabel} investment plan has been submitted successfully and is pending review.`;

  const [{ error: adminNotifErr }, { error: userNotifErr }] = await Promise.all(
    [
      supabase.from("notifications").insert({
        user_id: uid,
        title: values.skipInvestmentPlan
          ? "Verification Completed"
          : "New Investment Submitted",
        message: adminMessage,
        type: "success",
        read: false,
        forAdmin: true,
      }),
      supabase.from("notifications").insert({
        user_id: uid,
        title: values.skipInvestmentPlan
          ? "Verification Complete"
          : "Investment Submitted",
        message: userMessage,
        type: "success",
        read: false,
        forAdmin: false,
      }),
    ],
  );

  if (adminNotifErr)
    console.error("Failed to send admin notification:", adminNotifErr.message);
  if (userNotifErr)
    console.error("Failed to send user notification:", userNotifErr.message);

  return { uid, email: user.email ?? values.email };
}

const labelCls =
  "text-[0.72rem] font-medium uppercase tracking-widest text-muted-foreground mb-1.5 block";
const inputCls = "h-10 text-sm w-full";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-[0.72rem] font-medium text-destructive">
      <AlertCircle className="size-3 shrink-0" />
      {msg}
    </p>
  );
}

function FieldGroup({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className={labelCls}>{label}</Label>
      {children}
      <FieldError msg={error} />
    </div>
  );
}

function getStepFields(step: number): (keyof FormValues)[] {
  if (step === 1)
    return [
      "nationality",
      "meansOfId",
      "idNumber",
      "occupation",
      "jobTitle",
      "gender",
      "employerName",
      "officeAddress",
    ];
  if (step === 2)
    return [
      "employmentType",
      "passportPhoto",
      "phone",
      "dateOfBirth",
      "stateOfOrigin",
      "lga",
      "nextOfKin",
      "nextOfKinPhone",
      "nextOfKinAddress",
      "signature",
    ];
  if (step === 3)
    return [
      "skipInvestmentPlan",
      "investmentCompany",
      "investmentPlan",
      "ppInvestmentType",
      "ppAmountFigures",
      "ppAmountWords",
      "ppTenor",
      "ppModeOfPayment",
      "ppModeOfInterest",
      "prMonthlyAmountFigures",
      "prMonthlyAmountWords",
      "prTenor",
      "prMonthlyPaymentDate",
      "reifUnits",
      "reifTotalFigures",
      "reifTotalWords",
      "reifModeOfPayment",
      "reifModeOfInterest",
    ];
  return ["bankName", "accountName", "accountNumber"];
}

const ALL_PLAN_SUBFIELDS: (keyof FormValues)[] = [
  "ppInvestmentType",
  "ppAmountFigures",
  "ppAmountWords",
  "ppTenor",
  "ppModeOfPayment",
  "ppModeOfInterest",
  "prMonthlyAmountFigures",
  "prMonthlyAmountWords",
  "prTenor",
  "prMonthlyPaymentDate",
  "reifUnits",
  "reifTotalFigures",
  "reifTotalWords",
  "reifModeOfPayment",
  "reifModeOfInterest",
];

interface StepProps {
  formik: ReturnType<typeof useFormik<FormValues>>;
  fieldError: (name: keyof FormValues) => string | undefined;
}

function buildInitialValues(
  prefillEmail: string,
  prefillPhone: string,
): FormValues {
  const base: FormValues = {
    nationality: "",
    meansOfId: "",
    idNumber: "",
    occupation: "",
    jobTitle: "",
    gender: "",
    employerName: "",
    officeAddress: "",
    employmentType: [],
    passportPhoto: null,
    email: prefillEmail,
    phone: prefillPhone,
    dateOfBirth: "",
    stateOfOrigin: "",
    lga: "",
    nextOfKin: "",
    reifTenor: "",
    nextOfKinPhone: "",
    nextOfKinAddress: "",
    signature: null,
    skipInvestmentPlan: false,
    investmentCompany: "",
    investmentPlan: "",
    ppInvestmentType: "",
    ppAmountFigures: "",
    ppAmountWords: "",
    ppTenor: "",
    ppModeOfPayment: "",
    ppModeOfInterest: "",
    prMonthlyAmountFigures: "",
    prMonthlyAmountWords: "",
    prTenor: "",
    prMonthlyPaymentDate: "",
    reifUnits: "",
    reifTotalFigures: "",
    reifTotalWords: "",
    reifModeOfPayment: "",
    reifModeOfInterest: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
  };

  const draft = loadDraft();
  if (!draft) return base;

  return {
    ...base,
    ...draft,
    passportPhoto: null,
    signature: null,
    email: prefillEmail,
    phone: draft.phone || prefillPhone,
  };
}

function DraftRestoredBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-4">
      <div className="rounded-lg border border-primary/30 bg-primary/8 px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Check className="size-4 text-primary shrink-0" />
          <span className="text-foreground font-medium">Draft restored</span>
          <span className="text-muted-foreground">
            — your previously saved progress has been loaded.
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2 shrink-0"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default function VerificationForm({
  prefillEmail,
  prefillPhone,
}: {
  prefillEmail: string;
  prefillPhone: string;
}) {
  const [step, setStep] = React.useState(1);
  const [attempted, setAttempted] = React.useState(false);
  const [verifiedUser, setVerifiedUser] = React.useState<{
    uid: string;
    email: string;
  } | null>(null);
  const [metamapDone, setMetamapDone] = React.useState(false);
  const [draftRestored, setDraftRestored] = React.useState(false);
  const [bannerVisible, setBannerVisible] = React.useState(false);

  const stepRef = React.useRef(step);
  React.useEffect(() => {
    stepRef.current = step;
  }, [step]);

  React.useEffect(() => {
    const onFinished = () => setMetamapDone(true);
    const onExited = () => setMetamapDone(true);
    window.addEventListener("mati:userFinishedSdk", onFinished);
    window.addEventListener("mati:exitedSdk", onExited);
    return () => {
      window.removeEventListener("mati:userFinishedSdk", onFinished);
      window.removeEventListener("mati:exitedSdk", onExited);
    };
  }, []);

  const hasDraft = React.useMemo(() => loadDraft() !== null, []);

  React.useEffect(() => {
    if (hasDraft) {
      setDraftRestored(true);
      setBannerVisible(true);
    }
  }, [hasDraft]);

  const formik = useFormik<FormValues>({
    initialValues: buildInitialValues(prefillEmail, prefillPhone),
    validate: async (values) => {
      if (stepRef.current === 3 && values.skipInvestmentPlan) return {};
      try {
        await stepSchemas[stepRef.current - 1].validate(values, {
          abortEarly: false,
        });
        return {};
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          return err.inner.reduce<Record<string, string>>((acc, e) => {
            if (e.path) acc[e.path] = e.message;
            return acc;
          }, {});
        }
        return {};
      }
    },
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values, { setStatus }) => {
      try {
        const result = await submitVerification(values);
        clearDraft();
        setVerifiedUser(result);
      } catch (err) {
        setStatus(
          err instanceof Error
            ? err.message
            : "Submission failed. Please try again.",
        );
      }
    },
  });

  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    if (verifiedUser) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDraft(formik.values);
    }, 500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [formik.values, verifiedUser]);

  const handleNext = async () => {
    if (step === 3 && formik.values.skipInvestmentPlan) {
      setAttempted(false);
      setStep((s) => s + 1);
      return;
    }
    setAttempted(true);
    const stepFields = getStepFields(step);
    const touched = stepFields.reduce<Record<string, boolean | boolean[]>>(
      (acc, f) => {
        acc[f] = f === "employmentType" ? [true] : true;
        return acc;
      },
      {},
    );
    await formik.setTouched({ ...formik.touched, ...touched }, false);

    try {
      await stepSchemas[step - 1].validate(formik.values, {
        abortEarly: false,
      });
      await formik.setErrors({});
      setAttempted(false);
      setStep((s) => s + 1);
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const errors = err.inner.reduce<Record<string, string>>((acc, e) => {
          if (e.path) acc[e.path] = e.message;
          return acc;
        }, {});
        await formik.setErrors(errors);
      }
    }
  };

  const handleFinalSubmit = async () => {
    setAttempted(true);
    const stepFields = getStepFields(4);
    const touched = stepFields.reduce<Record<string, boolean>>((acc, f) => {
      acc[f] = true;
      return acc;
    }, {});
    await formik.setTouched({ ...formik.touched, ...touched }, false);

    try {
      await step4Schema.validate(formik.values, { abortEarly: false });
      await formik.setErrors({});
      setAttempted(false);
      setStep(5);
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const errors = err.inner.reduce<Record<string, string>>((acc, e) => {
          if (e.path) acc[e.path] = e.message;
          return acc;
        }, {});
        await formik.setErrors(errors);
      }
    }
  };

  const handleConfirmTransfer = () => {
    formik.handleSubmit();
  };

  const err = formik.errors;
  const touched = formik.touched;

  const fieldError = (name: keyof FormValues): string | undefined => {
    if (!err[name]) return undefined;
    if (attempted || touched[name]) return err[name] as string;
    return undefined;
  };

  if (verifiedUser && metamapDone) return <AllDoneScreen />;
  if (verifiedUser)
    return <MetamapScreen uid={verifiedUser.uid} email={verifiedUser.email} />;

  return (
    <div className="min-h-dvh bg-background">
      {/* Sticky header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
            <ShieldCheck className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight">
              Account Verification
            </h1>
            <p className="text-xs text-muted-foreground">
              Complete all five steps to verify your account
            </p>
          </div>
        </div>
      </div>

      {/* Draft-restored banner */}
      {bannerVisible && draftRestored && (
        <DraftRestoredBanner onDismiss={() => setBannerVisible(false)} />
      )}

      <div className="mx-auto max-w-4xl px-4 py-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* Timeline sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div
                  key={s.id}
                  className="flex lg:flex-col items-center lg:items-start gap-2 lg:gap-0 shrink-0"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className={`relative flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                        isDone
                          ? "border-primary bg-primary text-primary-foreground"
                          : isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {isDone ? (
                        <Check className="size-4" />
                      ) : (
                        <Icon className="size-4" />
                      )}
                    </div>
                    <div className="hidden lg:flex flex-col">
                      <span
                        className={`text-xs font-medium uppercase tracking-widest ${isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        Step {s.id}
                      </span>
                      <span
                        className={`text-sm font-semibold leading-tight ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {s.label}
                      </span>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`hidden lg:block ml-4 w-0.5 h-8 rounded-full transition-colors duration-200 ${step > s.id ? "bg-primary" : "bg-border"}`}
                    />
                  )}
                </div>
              );
            })}
          </nav>
          <div className="lg:hidden mt-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Step {step} of 5
            </p>
            <p className="text-sm font-semibold">{STEPS[step - 1].label}</p>
          </div>
        </aside>

        {/* Form panel */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          noValidate
        >
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-linear-to-r from-primary via-primary/60 to-transparent" />

            <div className="p-6 md:p-8">
              {step === 1 && (
                <StepOne formik={formik} fieldError={fieldError} />
              )}
              {step === 2 && (
                <StepTwo formik={formik} fieldError={fieldError} />
              )}
              {step === 3 && (
                <StepThree formik={formik} fieldError={fieldError} />
              )}
              {step === 4 && (
                <StepFour formik={formik} fieldError={fieldError} />
              )}
              {step === 5 && <StepFive />}
            </div>

            {/* Server error */}
            {formik.status && (
              <div className="mx-6 md:mx-8 mb-4 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 flex gap-2">
                <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{formik.status}</p>
              </div>
            )}

            <Separator />

            {/* Navigation */}
            <div className="flex items-center justify-between px-6 md:px-8 py-5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={step === 1}
                onClick={() => {
                  setAttempted(false);
                  setStep((s) => s - 1);
                }}
                className="gap-1.5"
              >
                <ChevronLeft className="size-4" /> Back
              </Button>

              <span className="text-xs text-muted-foreground">
                {step} / {STEPS.length}
              </span>

              {step < 4 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleNext}
                  className="gap-1.5"
                >
                  Next <ChevronRight className="size-4" />
                </Button>
              ) : step === 4 ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={formik.isSubmitting}
                  onClick={handleFinalSubmit}
                  className="gap-1.5"
                >
                  Next <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={formik.isSubmitting}
                  onClick={handleConfirmTransfer}
                  className="gap-1.5"
                >
                  {formik.isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      <Check className="size-4" /> I have made the transfer
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Step 1: Personal Info ────────────────────────────────────────────────────

function StepOne({ formik, fieldError }: StepProps) {
  const f = formik.values;

  const set = (k: keyof FormValues, v: unknown) => {
    formik.setFieldValue(k, v, false);
    formik.setFieldTouched(k, true, false);
    formik.setFieldError(k, undefined);
  };

  return (
    <div className="space-y-6">
      <StepHeader
        step={1}
        title="Personal Information"
        description="Provide your identification and employment details."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="Nationality" error={fieldError("nationality")}>
          <Input
            className={inputCls}
            placeholder="e.g. Nigerian"
            {...formik.getFieldProps("nationality")}
          />
        </FieldGroup>

        <FieldGroup
          label="Means of Identification"
          error={fieldError("meansOfId")}
        >
          <Select
            value={f.meansOfId}
            onValueChange={(v) => set("meansOfId", v)}
          >
            <SelectTrigger
              className={`${inputCls} ${fieldError("meansOfId") ? "border-destructive" : ""}`}
            >
              <SelectValue placeholder="Select ID type" />
            </SelectTrigger>
            <SelectContent>
              {MEANS_OF_ID.map((id) => (
                <SelectItem key={id} value={id}>
                  {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="ID Number" error={fieldError("idNumber")}>
          <Input
            className={inputCls}
            placeholder="Enter your ID number"
            {...formik.getFieldProps("idNumber")}
          />
        </FieldGroup>

        <FieldGroup label="Gender" error={fieldError("gender")}>
          <Select value={f.gender} onValueChange={(v) => set("gender", v)}>
            <SelectTrigger
              className={`${inputCls} ${fieldError("gender") ? "border-destructive" : ""}`}
            >
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDERS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Occupation" error={fieldError("occupation")}>
          <Input
            className={inputCls}
            placeholder="e.g. Software Engineer"
            {...formik.getFieldProps("occupation")}
          />
        </FieldGroup>

        <FieldGroup label="Status / Job Title" error={fieldError("jobTitle")}>
          <Input
            className={inputCls}
            placeholder="e.g. Senior Developer"
            {...formik.getFieldProps("jobTitle")}
          />
        </FieldGroup>

        <FieldGroup
          label="Name of Employer / Business Name"
          error={fieldError("employerName")}
        >
          <Input
            className={inputCls}
            placeholder="e.g. Acme Corp"
            {...formik.getFieldProps("employerName")}
          />
        </FieldGroup>

        <FieldGroup
          label="Office / Residential Address"
          error={fieldError("officeAddress")}
        >
          <Input
            className={inputCls}
            placeholder="Enter your address"
            {...formik.getFieldProps("officeAddress")}
          />
        </FieldGroup>
      </div>
    </div>
  );
}

// ─── Step 2: Bio Data ─────────────────────────────────────────────────────────

function StepTwo({ formik, fieldError }: StepProps) {
  const f = formik.values;

  const set = (k: keyof FormValues, v: unknown) => {
    formik.setFieldValue(k, v, false);
    formik.setFieldTouched(k, true, false);
    formik.setFieldError(k, undefined);
  };

  const toggleEmploymentType = (value: string) => {
    const next = f.employmentType.includes(value)
      ? f.employmentType.filter((v) => v !== value)
      : [...f.employmentType, value];
    formik.setFieldValue("employmentType", next, false);
    formik.setFieldTouched("employmentType", true, false);
    if (next.length > 0) formik.setFieldError("employmentType", undefined);
  };

  return (
    <div className="space-y-6">
      <StepHeader
        step={2}
        title="Bio Data"
        description="Your personal background and contact information."
      />

      {/* Employment type */}
      <div className="space-y-2">
        <Label className={labelCls}>Employment Status</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {EMPLOYMENT_TYPES.map((et) => (
            <label
              key={et.value}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors text-sm ${
                f.employmentType.includes(et.value)
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40"
              }`}
            >
              <Checkbox
                checked={f.employmentType.includes(et.value)}
                onCheckedChange={() => toggleEmploymentType(et.value)}
              />
              {et.label}
            </label>
          ))}
        </div>
        <FieldError msg={fieldError("employmentType")} />
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <ImageUpload
            id="passport-photo-upload"
            label="Passport Photograph"
            maxFiles={1}
            targetReduction={0.3}
            onChange={(files) => {
              formik.setFieldValue("passportPhoto", files[0] ?? null, false);
              formik.setFieldTouched("passportPhoto", true, false);
              if (files[0]) formik.setFieldError("passportPhoto", undefined);
            }}
            onValidationError={(msg) =>
              formik.setFieldError("passportPhoto", msg)
            }
          />
          <FieldError msg={fieldError("passportPhoto")} />
        </div>
        <div className="flex flex-col gap-1">
          <ImageUpload
            id="signature-upload"
            label="Signature Upload"
            maxFiles={1}
            targetReduction={0.3}
            onChange={(files) => {
              formik.setFieldValue("signature", files[0] ?? null, false);
              formik.setFieldTouched("signature", true, false);
              if (files[0]) formik.setFieldError("signature", undefined);
            }}
            onValidationError={(msg) => formik.setFieldError("signature", msg)}
          />
          <FieldError msg={fieldError("signature")} />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="Email Address">
          <Input
            className={`${inputCls} bg-muted/40 cursor-not-allowed`}
            value={f.email}
            readOnly
            disabled
          />
        </FieldGroup>

        <FieldGroup label="Phone Number" error={fieldError("phone")}>
          <Input
            className={inputCls}
            placeholder="+234 800 000 0000"
            {...formik.getFieldProps("phone")}
          />
        </FieldGroup>

        <FieldGroup label="Date of Birth" error={fieldError("dateOfBirth")}>
          <Input
            className={inputCls}
            type="date"
            {...formik.getFieldProps("dateOfBirth")}
          />
        </FieldGroup>

        <FieldGroup label="State of Origin" error={fieldError("stateOfOrigin")}>
          <Select
            value={f.stateOfOrigin}
            onValueChange={(v) => set("stateOfOrigin", v)}
          >
            <SelectTrigger
              className={`${inputCls} ${fieldError("stateOfOrigin") ? "border-destructive" : ""}`}
            >
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {NIGERIAN_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup
          label="LGA (Local Government Area)"
          error={fieldError("lga")}
        >
          <Input
            className={inputCls}
            placeholder="Enter your LGA"
            {...formik.getFieldProps("lga")}
          />
        </FieldGroup>
      </div>

      <Separator />

      <p className={`${labelCls} text-foreground`}>Next of Kin</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="Next of Kin Name" error={fieldError("nextOfKin")}>
          <Input
            className={inputCls}
            placeholder="Full name"
            {...formik.getFieldProps("nextOfKin")}
          />
        </FieldGroup>

        <FieldGroup
          label="Next of Kin Phone Number"
          error={fieldError("nextOfKinPhone")}
        >
          <Input
            className={inputCls}
            placeholder="+234 800 000 0000"
            {...formik.getFieldProps("nextOfKinPhone")}
          />
        </FieldGroup>

        <div className="sm:col-span-2">
          <FieldGroup
            label="Next of Kin Address"
            error={fieldError("nextOfKinAddress")}
          >
            <Input
              className={inputCls}
              placeholder="Residential address"
              {...formik.getFieldProps("nextOfKinAddress")}
            />
          </FieldGroup>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Investment Plan ──────────────────────────────────────────────────

function StepThree({ formik, fieldError }: StepProps) {
  const f = formik.values;

  const set = (k: keyof FormValues, v: unknown) => {
    formik.setFieldValue(k, v, false);
    formik.setFieldTouched(k, true, false);
    formik.setFieldError(k, undefined);
  };

  const selectPlan = (plan: InvestmentPlan) => {
    const next: InvestmentPlan = f.investmentPlan === plan ? "" : plan;
    formik.setFieldValue("investmentPlan", next, false);
    formik.setFieldTouched("investmentPlan", true, false);
    formik.setFieldError("investmentPlan", undefined);
    ALL_PLAN_SUBFIELDS.forEach((field) =>
      formik.setFieldError(field, undefined),
    );
  };

  const plans: { value: InvestmentPlan; label: string; description: string }[] =
    [
      {
        value: "premium_plus",
        label: "Premium Plus",
        description: "Fixed lump-sum investment with flexible tenor",
      },
      {
        value: "premium",
        label: "Premium",
        description: "Monthly contribution plan with scheduled payments",
      },
      {
        value: "reif",
        label: "REIF",
        description: "Real Estate Investment Fund — unit-based investment",
      },
    ];

  const skipPlan = f.skipInvestmentPlan;

  return (
    <div className="space-y-6">
      <StepHeader
        step={3}
        title="Investment Plan"
        description="Choose your preferred investment plan and fill in the details."
      />

      {/* Skip toggle */}
      <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3.5 cursor-pointer hover:bg-muted/40 transition-colors">
        <Checkbox
          checked={skipPlan}
          onCheckedChange={(checked) => {
            formik.setFieldValue("skipInvestmentPlan", !!checked, false);
          }}
          className="mt-0.5 shrink-0"
        />
        <div className="space-y-0.5">
          <p className="text-sm font-medium leading-none">
            Skip investment plan for now
          </p>
          <p className="text-xs text-muted-foreground">
            You can fill in your bank details and add an investment plan later.
          </p>
        </div>
      </label>

      {!skipPlan && (
        <>
      <FieldGroup
        label="Investment Company"
        error={fieldError("investmentCompany")}
      >
        <Select
          value={f.investmentCompany}
          onValueChange={(v) => set("investmentCompany", v)}
        >
          <SelectTrigger
            className={`${inputCls} ${fieldError("investmentCompany") ? "border-destructive" : ""}`}
          >
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent>
            {INVESTMENT_COMPANIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {plans.map((plan) => (
          <label
            key={plan.value}
            className={`flex flex-col gap-1 rounded-xl border-2 p-4 cursor-pointer transition-all ${
              f.investmentPlan === plan.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex items-center gap-2">
              <Checkbox
                checked={f.investmentPlan === plan.value}
                onCheckedChange={() => selectPlan(plan.value)}
              />
              <span className="text-sm font-semibold">{plan.label}</span>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              {plan.description}
            </p>
          </label>
        ))}
      </div>
      <FieldError msg={fieldError("investmentPlan")} />

      {/* Premium Plus */}
      {f.investmentPlan === "premium_plus" && (
        <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-5">
          <p className={`${labelCls} text-primary`}>Premium Plus Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup
              label="Investment Amount (Figures)"
              error={fieldError("ppAmountFigures")}
            >
              <Input
                className={inputCls}
                type="number"
                placeholder="e.g. 500000"
                {...formik.getFieldProps("ppAmountFigures")}
              />
            </FieldGroup>
            <div className="sm:col-span-2">
              <FieldGroup
                label="Investment Amount (Words)"
                error={fieldError("ppAmountWords")}
              >
                <Input
                  className={inputCls}
                  placeholder="e.g. Five Hundred Thousand Naira"
                  {...formik.getFieldProps("ppAmountWords")}
                />
              </FieldGroup>
            </div>
            <FieldGroup label="Investment Tenor" error={fieldError("ppTenor")}>
              <Select
                value={f.ppTenor}
                onValueChange={(v) => set("ppTenor", v)}
              >
                <SelectTrigger
                  className={`${inputCls} ${fieldError("ppTenor") ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Select tenor" />
                </SelectTrigger>
                <SelectContent>
                  {TENORS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup
              label="Mode of Payment"
              error={fieldError("ppModeOfPayment")}
            >
              <Select
                value={f.ppModeOfPayment}
                onValueChange={(v) => set("ppModeOfPayment", v)}
              >
                <SelectTrigger
                  className={`${inputCls} ${fieldError("ppModeOfPayment") ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup
              label="Mode of Interest Repayment"
              error={fieldError("ppModeOfInterest")}
            >
              <Select
                value={f.ppModeOfInterest}
                onValueChange={(v) => set("ppModeOfInterest", v)}
              >
                <SelectTrigger
                  className={`${inputCls} ${fieldError("ppModeOfInterest") ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {INTEREST_MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
          </div>
        </div>
      )}

      {/* Premium */}
      {f.investmentPlan === "premium" && (
        <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-5">
          <p className={`${labelCls} text-primary`}>Premium Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup
              label="Monthly Investment Amount (Figures)"
              error={fieldError("prMonthlyAmountFigures")}
            >
              <Input
                className={inputCls}
                type="number"
                placeholder="e.g. 50000"
                {...formik.getFieldProps("prMonthlyAmountFigures")}
              />
            </FieldGroup>
            <div className="sm:col-span-2">
              <FieldGroup
                label="Monthly Investment Amount (Words)"
                error={fieldError("prMonthlyAmountWords")}
              >
                <Input
                  className={inputCls}
                  placeholder="e.g. Fifty Thousand Naira"
                  {...formik.getFieldProps("prMonthlyAmountWords")}
                />
              </FieldGroup>
            </div>
            <FieldGroup label="Investment Tenor" error={fieldError("prTenor")}>
              <Select
                value={f.prTenor}
                onValueChange={(v) => set("prTenor", v)}
              >
                <SelectTrigger
                  className={`${inputCls} ${fieldError("prTenor") ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Select tenor" />
                </SelectTrigger>
                <SelectContent>
                  {TENORS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup
              label="Monthly Payment Date"
              error={fieldError("prMonthlyPaymentDate")}
            >
              <Input
                className={inputCls}
                type="date"
                {...formik.getFieldProps("prMonthlyPaymentDate")}
              />
            </FieldGroup>
          </div>
        </div>
      )}

      {/* REIF */}
      {f.investmentPlan === "reif" && (
        <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-5">
          <p className={`${labelCls} text-primary`}>REIF Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup
              label="Number of Investment Units"
              error={fieldError("reifUnits")}
            >
              <Input
                className={inputCls}
                type="number"
                placeholder="e.g. 10"
                {...formik.getFieldProps("reifUnits")}
              />
            </FieldGroup>
            <FieldGroup
              label="Total Investment (Figures)"
              error={fieldError("reifTotalFigures")}
            >
              <Input
                className={inputCls}
                type="number"
                placeholder="e.g. 1000000"
                {...formik.getFieldProps("reifTotalFigures")}
              />
            </FieldGroup>
            <div className="sm:col-span-2">
              <FieldGroup
                label="Total Investment (Words)"
                error={fieldError("reifTotalWords")}
              >
                <Input
                  className={inputCls}
                  placeholder="e.g. One Million Naira"
                  {...formik.getFieldProps("reifTotalWords")}
                />
              </FieldGroup>
            </div>
            <FieldGroup
              label="Investment Tenor"
              error={fieldError("reifTenor")}
            >
              <Select
                value={f.reifTenor}
                onValueChange={(v) => set("reifTenor", v)}
              >
                <SelectTrigger
                  className={`${inputCls} ${fieldError("prTenor") ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Select tenor" />
                </SelectTrigger>
                <SelectContent>
                  {TENORS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup
              label="Mode of Payment"
              error={fieldError("reifModeOfPayment")}
            >
              <Select
                value={f.reifModeOfPayment}
                onValueChange={(v) => set("reifModeOfPayment", v)}
              >
                <SelectTrigger
                  className={`${inputCls} ${fieldError("reifModeOfPayment") ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
            <FieldGroup
              label="Mode of Interest Repayment"
              error={fieldError("reifModeOfInterest")}
            >
              <Select
                value={f.reifModeOfInterest}
                onValueChange={(v) => set("reifModeOfInterest", v)}
              >
                <SelectTrigger
                  className={`${inputCls} ${fieldError("reifModeOfInterest") ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {INTEREST_MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

// ─── Step 4: Bank Details ─────────────────────────────────────────────────────

function StepFour({ formik, fieldError }: StepProps) {
  return (
    <div className="space-y-6">
      <StepHeader
        step={4}
        title="Bank Details"
        description="Provide your bank account details for investment repayment."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldGroup label="Bank Name" error={fieldError("bankName")}>
          <Input
            className={inputCls}
            placeholder="e.g. First Bank of Nigeria"
            {...formik.getFieldProps("bankName")}
          />
        </FieldGroup>

        <FieldGroup label="Account Number" error={fieldError("accountNumber")}>
          <Input
            className={inputCls}
            placeholder="10-digit account number"
            maxLength={10}
            {...formik.getFieldProps("accountNumber")}
          />
        </FieldGroup>

        <div className="sm:col-span-2">
          <FieldGroup label="Account Name" error={fieldError("accountName")}>
            <Input
              className={inputCls}
              placeholder="As it appears on your bank statement"
              {...formik.getFieldProps("accountName")}
            />
          </FieldGroup>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3">
        <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Almost there</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            After confirming your bank details, you will be shown the company
            account to transfer your investment to before final submission.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Step 5: Transfer Confirmation ───────────────────────────────────────────

function StepFive() {
  return (
    <div className="space-y-6">
      <StepHeader
        step={5}
        title="Make Your Transfer"
        description="Transfer your investment amount to the account below, then confirm."
      />

      {/* Instruction banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-amber-500" />
        <p className="text-sm text-amber-800 leading-relaxed">
          Your details have been recorded. Please make a transfer to the
          Casalavoro account below, then click{" "}
          <span className="font-semibold">"I have made the transfer"</span> to
          complete your verification.
        </p>
      </div>

      {/* Company bank details */}
      <BankDetailsDisplay />
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function StepHeader({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1 pb-2">
      <p className="text-[0.68rem] font-medium uppercase tracking-widest text-primary">
        Step {step} of 5
      </p>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// ─── MetaMap ID verification screen ──────────────────────────────────────────

function MetamapScreen({ uid, email }: { uid: string; email: string }) {
  const clientId = process.env.NEXT_PUBLIC_METAMAP_CLIENT_ID ?? "";
  const flowId = process.env.NEXT_PUBLIC_METAMAP_FLOW_ID ?? "";
  const metadata = JSON.stringify({ uid, email });

  return (
    <>
      <Script
        src="https://web-button.getmati.com/button.js"
        strategy="afterInteractive"
      />
      <div className="min-h-dvh flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-sm w-full">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
            <ScanFace className="size-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">One last step</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your form has been submitted. Please verify your identity using
              the button below. This takes about 2 minutes and requires your
              government-issued ID.
            </p>
          </div>
          <div className="flex justify-center">
            {/* @ts-expect-error mati-button is a custom element */}
            <mati-button
              clientid={clientId}
              flowid={flowId}
              metadata={metadata}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Your data is encrypted and processed securely by MetaMap.
          </p>
        </div>
      </div>
    </>
  );
}

// ─── All-done screen ──────────────────────────────────────────────────────────

function AllDoneScreen() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
          <PartyPopper className="size-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold">You&apos;re all set!</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your verification has been submitted for review. We&apos;ll update
          your account status within 1–3 business days.
        </p>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
