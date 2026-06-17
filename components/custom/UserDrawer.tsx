import { capitalize, currency, formatDate, planColor } from "@/types/helpers";
import { DetailRow, StatusBadge } from "./dashboard/AdminDashboard";
import { X } from "lucide-react";
import { UserProfile } from "@/types";

export const UserDrawer = ({
  user,
  onClose,
}: {
  user: UserProfile;
  onClose: () => void;
}) => {
  const compliance =
    typeof user.compliance === "string"
      ? JSON.parse(user.compliance)
      : user.compliance;
  const { bio_data, bank_details, personal_info, investment_plans } =
    compliance ?? {};
  const plans: any[] =
    investment_plans ??
    (compliance?.investment_plan ? [compliance.investment_plan] : []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <p className="font-bold text-gray-900 text-base">
              {user.title} {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Status row */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge metamap={user.metamap_status} />
            <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              {user.role}
            </span>
          </div>

          {/* Contact */}
          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Contact
            </p>
            <DetailRow label="Phone" value={user.phone} />
            <DetailRow
              label="Member since"
              value={formatDate(user.created_at)}
            />
          </section>

          {personal_info && (
            <section>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Personal
              </p>
              <DetailRow label="Gender" value={personal_info.gender} />
              <DetailRow
                label="Nationality"
                value={personal_info.nationality}
              />
              <DetailRow
                label="Means of ID"
                value={personal_info.means_of_id}
              />
              <DetailRow label="ID Number" value={personal_info.id_number} />
              <DetailRow label="Occupation" value={personal_info.occupation} />
            </section>
          )}

          {bio_data && (
            <section>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Bio
              </p>
              <DetailRow
                label="Date of Birth"
                value={formatDate(bio_data.date_of_birth)}
              />
              <DetailRow
                label="State of Origin"
                value={capitalize(bio_data.state_of_origin)}
              />
              <DetailRow label="LGA" value={capitalize(bio_data.lga)} />
              <DetailRow
                label="Employment Type"
                value={bio_data.employment_type?.map(capitalize).join(", ")}
              />
              <DetailRow
                label="Next of Kin"
                value={capitalize(bio_data.next_of_kin)}
              />
              <DetailRow label="NOK Phone" value={bio_data.next_of_kin_phone} />
              <DetailRow
                label="NOK Address"
                value={capitalize(bio_data.next_of_kin_address)}
              />
            </section>
          )}

          {personal_info && (
            <section>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Employment
              </p>
              <DetailRow label="Employer" value={personal_info.employer_name} />
              <DetailRow label="Job Title" value={personal_info.job_title} />
              <DetailRow
                label="Office Address"
                value={personal_info.office_address}
              />
            </section>
          )}

          {bank_details && (
            <section>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Bank
              </p>
              <DetailRow label="Bank" value={bank_details.bank_name} />
              <DetailRow
                label="Account Name"
                value={bank_details.account_name}
              />
              <DetailRow
                label="Account Number"
                value={bank_details.account_number}
              />
            </section>
          )}

          {plans.length > 0 && (
            <section>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Investment Plans ({plans.length})
              </p>
              {plans.map((plan, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-xl p-3 mb-2 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${planColor[plan.plan] ?? planColor.default}`}
                    >
                      {plan.plan}
                    </span>
                    <span className="text-xs text-gray-500">{plan.tenor}</span>
                  </div>
                  {plan.investment_company && (
                    <p className="text-xs font-medium text-[#ff6900] mb-1">
                      {plan.investment_company}
                    </p>
                  )}
                  <p className="text-base font-bold text-gray-900">
                    {currency(plan.total_figures)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {plan.units} units · {plan.mode_of_interest} interest ·{" "}
                    {plan.mode_of_payment}
                  </p>
                  {plan.monthly_payment_date && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Payment date: {formatDate(plan.monthly_payment_date)}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};