import { FAQ } from "@/app/dashboard/help/page";

export const sections = [
  {
    id: "obligations",
    number: "1",
    title: "Obligations of the Parties",
    clauses: [
      {
        ref: "1.1",
        text: "The Parties shall perform their obligations in relation to this Agreement as prescribed herein.",
      },
      {
        ref: "1.2",
        text: "Parties shall not assign their interest or obligations in the Investment Agreement except with the written consent of the other, and subject to the terms of this agreement.",
      },
      {
        ref: "1.3",
        text: "Parties shall be solely responsible for their respective obligations under this Investment Agreement.",
      },
      {
        ref: "1.4",
        text: "Parties shall keep records of payment made with respect to this Agreement and make effort to share with the other party where requested.",
      },
    ],
  },
  {
    id: "roi",
    number: "2",
    title: "Return on Investment",
    body: "The Investment sum will return at the rate agreed by the parties and shall be payable into the investor's designated bank account on or before the last workday of each Month.",
  },
  {
    id: "lodgement",
    number: "3",
    title: "Investment Lodgement or Payment",
    clauses: [
      {
        ref: "3.1",
        text: "Investor shall provide the Investment Amount to the Fund Manager and be entitled to a repayment as agreed herein.",
      },
      {
        ref: "3.2",
        text: "Investor shall only pay the Investment Amount into the Fund Manager's account or an Account in the name of the Fund Manager provided by the Fund Manager, which the Fund Manager will acknowledge receipt of upon execution of the Investment certificate.",
      },
    ],
  },
  {
    id: "fund-manager",
    number: "4",
    title: "Obligations of the Fund Manager",
    clauses: [
      {
        ref: "4.1",
        text: "The Fund Manager shall utilize the Investment Amount judiciously in line with its routine business.",
      },
      {
        ref: "4.2",
        text: "Fund Manager shall ensure to put in place measures to mitigate risk or default in the cause of its business, including but not limited to:",
        sub: [
          { ref: "4.2.1", text: "Insurance cover over loans." },
          {
            ref: "4.2.2",
            text: "Repayment deduction from source processes, i.e. as provided by Remita or IPPIS or any other efficient means.",
          },
          {
            ref: "4.2.3",
            text: "Ensure preliminary checks on borrowers, such as verification of cash flow on borrower's bank account statement, as appropriate.",
          },
        ],
      },
      {
        ref: "4.3",
        text: "The Fund Manager shall liquidate or repay any and all outstanding sum on the Investment Amount as and at when due.",
      },
    ],
  },
  {
    id: "repayment",
    number: "5",
    title: "Repayment or Liquidation of Investment",
    clauses: [
      {
        ref: "5.1",
        text: "The Fund Manager shall liquidate the investment and pay back the Investor the full Investment Amount on expiry of the term under this Agreement, forming the duration of this Agreement.",
      },
      {
        ref: "5.2",
        text: "The Investor may however and without notice demand for an immediate liquidation of the full Investment sum where the Fund Manager defaults in his obligations under this agreement.",
      },
      {
        ref: "5.3",
        text: "Any unscheduled liquidation request shall be made in writing and subject to the unscheduled liquidation administrative charges on the investment amount indicated in 5.4 below; and such liquidation of investment shall be made within one (1) calendar month subject to availability of funds to make such unscheduled liquidation.",
      },
      {
        ref: "5.4",
        text: "Unscheduled Liquidation will attract the following charges:",
        sub: [
          {
            ref: "5.4.1",
            text: "Within 50% of the Investment Tenor — All of interest incurred till date of pre-liquidation.",
          },
          {
            ref: "5.4.2",
            text: "Above 50% but within 80% of the investment tenor — 70% of interest incurred till date of pre-liquidation.",
          },
          {
            ref: "5.4.3",
            text: "Above 80% but within 100% of the Investment tenor — 50% of interest incurred till date of pre-liquidation.",
          },
        ],
      },
    ],
  },
  {
    id: "rollover",
    number: "6",
    title: "Investment Roll Over",
    body: "Upon maturity of investment and in absence of clear or express instructions, the principal and any accrued interest will be rolled over at a prevailing rate for a further six (6) month tenor.",
  },
  {
    id: "variation",
    number: "7",
    title: "Variation",
    body: "It is hereby understood that the terms and conditions herein will not be varied, altered and or modified, except in writing and mutually agreed to by the Parties.",
  },
  {
    id: "severability",
    number: "8",
    title: "Severability",
    body: "It is understood that if any provision of this Investment Agreement becomes illegal, invalid or unenforceable in any respect, the legality, validity and enforceability of the other provisions of this Investment Agreement will not in any way be affected or impaired.",
  },
  {
    id: "entire-agreement",
    number: "9",
    title: "Entire Agreement",
    body: "It is expressly agreed and understood that this Investment Agreement constitutes the only agreement between the Parties and supersedes all prior agreements and understandings (oral or written) between the Parties.",
  },
  {
    id: "waiver",
    number: "10",
    title: "Waiver",
    body: "Any waiver by any Party hereto of any breach of this Investment Agreement of any kind or character whatsoever by the other Party, whether such waiver is direct or implied, will not be construed as a continuing waiver or consent to any subsequent breach of this Agreement on the part of the other party.",
  },
  {
    id: "notices",
    number: "11",
    title: "Notices",
    body: "Any notice required to be served pursuant to the terms of this contract shall be in writing and can either be hand-delivered, sent by registered post, courier, facsimile and or electronic mails. Such notice shall be sufficiently and properly served upon delivery if hand delivered. If sent by courier, three (3) days after same is properly addressed, prepaid and deposited with the courier company. If the notice is sent by facsimile or electronic mails, it will be deemed as having been properly served upon transmission and due receipt of answerback. Any notice required to be given hereunder shall be addressed to the address of each Party as stated herein, or such other address as a Party may communicate to the other Party.",
  },
  {
    id: "aml",
    number: "12",
    title: "Anti-Money Laundering",
    body: "Neither party has (i) violated or is in violation of any applicable anti-money laundering law or (ii) engaged or engages in any transaction, investment, undertaking or activity that conceals the identity, source or destination of the proceeds from any category of offenses designated in any applicable anti-money laundering laws and regulations. Parties agree to be individually responsible for a breach of this clause and hereby indemnify the other party against any resultant loss.",
  },
  {
    id: "taxes",
    number: "13",
    title: "Taxes",
    body: "Parties will pay and be responsible individually for all material taxes, assessments, and governmental levies under this Contract.",
  },
  {
    id: "governing-law",
    number: "14",
    title: "Governing Law",
    body: "This Investment Agreement and all matters incidental thereto shall be governed and construed in accordance with the laws of the Federal Republic of Nigeria.",
  },
  {
    id: "dispute",
    number: "15",
    title: "Dispute Resolution",
    body: "Any dispute arising out of or in connection to this Investment Agreement will to the extent possible be settled amicably by negotiation and discussion between the parties. Otherwise, such dispute will be settled by Mediation. The place of dispute resolution will be Abuja, or as may be agreed between the Parties.",
  },
];


export const faqs: FAQ[] = [
  {
    category: "account",
    section: "Your account",
    q: "How do I update my personal information?",
    a: "Your personal details such as name, phone number, and address are set during onboarding. To request a change, please contact our support team with your registered email and the details you'd like to update. Some fields may require re-verification.",
  },
  {
    category: "account",
    section: "Your account",
    q: "What does my account role mean?",
    a: "Your account is assigned the USER role by default. This gives you access to your investment dashboard, compliance details, and account settings. Admin roles are reserved for internal staff and are not user-assignable.",
  },
  {
    category: "account",
    section: "Your account",
    q: "How do I delete my account?",
    a: "You can permanently delete your account from the Settings page under the Danger Zone section. Tap Delete and confirm in the modal. This removes all your personal data, compliance records, and investment plans. This action cannot be reversed, so please make sure you've withdrawn or resolved any active investments before proceeding.",
  },
  {
    category: "account",
    section: "Your account",
    q: "What happens to my data after I delete my account?",
    a: "All your profile data, compliance records (bio data, personal info, bank details, and investment plans) are permanently deleted. We do not retain any personally identifiable information after account deletion, in line with our data privacy policy.",
  },
  {
    category: "verification",
    section: "Verification & compliance",
    q: "What does 'Verified' mean on my profile?",
    a: "A Verified badge means your identity and compliance documents have been reviewed and approved by our team. This includes your means of identification (e.g. NIN ID Card), passport photo, bio data, and personal information. Verified accounts have full access to investment plans.",
  },
  {
    category: "verification",
    section: "Verification & compliance",
    q: "What documents are needed for verification?",
    a: "Verification requires a valid means of identification (NIN ID Card, international passport, or driver's licence), a passport photograph, your date of birth, state of origin, LGA, and employment details. You'll also need to provide your next of kin information and bank account details.",
  },
  {
    category: "verification",
    section: "Verification & compliance",
    q: "How long does verification take?",
    a: "Verification is typically completed within 1–3 business days after you submit all required documents. You'll receive a notification once your account status is updated. If your verification is taking longer, please contact support with your registered email.",
  },
  {
    category: "verification",
    section: "Verification & compliance",
    q: "Why do I need to provide next of kin information?",
    a: "Next of kin details are required as part of our compliance process for investment accounts. In the event of an emergency or claim, we need a designated contact person. You'll need to provide their full name, phone number, and address.",
  },
  {
    category: "investment",
    section: "Investment plans",
    q: "What is the REIF plan?",
    a: "REIF (Real Estate Investment Fund) is one of our investment products. It allows you to invest in units of a real estate fund. Each unit is priced, and you select how many units you'd like to invest in. Returns are paid based on your chosen mode of interest — monthly, quarterly, or at maturity.",
  },
  {
    category: "investment",
    section: "Investment plans",
    q: "How are investment returns paid?",
    a: "Returns are paid based on your selected mode of interest. If you chose Monthly, interest is credited to your registered bank account on your monthly payment date. Ensure your bank details are up to date to avoid missed payments.",
  },
  {
    category: "investment",
    section: "Investment plans",
    q: "Can I have multiple investment plans?",
    a: "Yes. Your account supports multiple investment plans simultaneously. Each plan has its own tenor, unit count, and payment schedule. You can view all active plans from your investment dashboard.",
  },
  {
    category: "investment",
    section: "Investment plans",
    q: "What does tenor mean?",
    a: "Tenor is the duration of your investment — for example, 12 Months means your principal is locked in for one year. At the end of the tenor, your capital is returned along with any outstanding interest, depending on your chosen mode of interest.",
  },
  {
    category: "bank",
    section: "Bank & payments",
    q: "How do I update my bank account details?",
    a: "Bank details are submitted during compliance onboarding. To update them, contact our support team. Changes to bank details require re-verification for security purposes and may take 2–5 business days to process.",
  },
  {
    category: "bank",
    section: "Bank & payments",
    q: "What payment methods are accepted?",
    a: "We currently accept Cheque as a mode of payment for investment subscriptions. Bank transfers may be available depending on your plan. Your payment method is confirmed during the onboarding process and is shown in your investment plan details.",
  },
  {
    category: "bank",
    section: "Bank & payments",
    q: "When will I receive my monthly interest payment?",
    a: "Monthly interest is credited on your monthly payment date, as specified in your investment plan. This date is set when you subscribe to a plan and remains fixed for the duration of the tenor. If a payment date falls on a weekend or public holiday, it may be processed the next business day.",
  },
  {
    category: "security",
    section: "Security & privacy",
    q: "How is my personal data protected?",
    a: "Your data is stored securely and only accessible to authorised personnel. We use encrypted connections and follow data protection best practices. Sensitive fields like your ID number, signature, and passport photo are stored in a private, access-controlled storage bucket.",
  },
  {
    category: "security",
    section: "Security & privacy",
    q: "I think my account has been compromised. What should I do?",
    a: "If you suspect unauthorised access to your account, contact our support team immediately at your registered email address. We recommend changing your password right away. Do not share your login credentials or verification codes with anyone.",
  },
];