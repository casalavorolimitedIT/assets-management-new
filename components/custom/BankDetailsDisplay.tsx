import { Building2, Copy, Check, CreditCard } from "lucide-react";
import { useState } from "react";

const BankDetailsDisplay = () => {
  const [copiedField, setCopiedField] = useState(null);

  const bankDetails = {
    bankName: "TAJ BANK",
    accountName: "CASALAVORO LIMITED",
    accountNumber: "0005041005",
  };

  const handleCopy = (text: any, field: any) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="">
      {/* Card Container */}
      <div className="border-primary rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-black/10 backdrop-blur-sm px-6 py-4 border-b border-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/20 rounded-lg">
              <Building2 className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="text-black font-semibold text-sm">
                Bank Information
              </h3>
              <p className="text-black/70 text-xs">Transfer Details</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Bank Name */}
          <div className="space-y-1">
            <label className="text-black/70 text-xs font-medium uppercase tracking-wider">
              Bank Name
            </label>
            <div className="flex items-center justify-between p-3 bg-black/10 rounded-lg border border-black/20">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-black/60" />
                <span className="text-black font-medium text-sm">
                  {bankDetails.bankName}
                </span>
              </div>
              <button
                onClick={() => handleCopy(bankDetails.bankName, "bankName")}
                className="p-1.5 hover:bg-black/20 rounded-lg transition-colors"
              >
                {copiedField === "bankName" ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-black/60 hover:text-black" />
                )}
              </button>
            </div>
          </div>

          {/* Account Name */}
          <div className="space-y-1">
            <label className="text-black/70 text-xs font-medium uppercase tracking-wider">
              Account Name
            </label>
            <div className="flex items-center justify-between p-3 bg-black/10 rounded-lg border border-black/20">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-black/60" />
                <span className="text-black font-medium text-sm">
                  {bankDetails.accountName}
                </span>
              </div>
              <button
                onClick={() => handleCopy(bankDetails.accountName, "accountName")}
                className="p-1.5 hover:bg-black/20 rounded-lg transition-colors"
              >
                {copiedField === "accountName" ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-black/60 hover:text-black" />
                )}
              </button>
            </div>
          </div>

          {/* Account Number */}
          <div className="space-y-1">
            <label className="text-black/70 text-xs font-medium uppercase tracking-wider">
              Account Number
            </label>
            <div className="flex items-center justify-between p-3 bg-black/10 rounded-lg border border-black/20">
              <div className="flex items-center gap-2">
                <span className="text-black font-mono text-lg font-bold tracking-wider">
                  {bankDetails.accountNumber}
                </span>
              </div>
              <button
                onClick={() =>
                  handleCopy(bankDetails.accountNumber, "accountNumber")
                }
                className="p-1.5 hover:bg-black/20 rounded-lg transition-colors"
              >
                {copiedField === "accountNumber" ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-black/60 hover:text-black" />
                )}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/20"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-primary text-black/60">
                Bank Transfer Only
              </span>
            </div>
          </div>

          {/* Note */}
          <div className="text-center">
            <p className="text-black/60 text-xs">
              Please use the account details above to make your transfer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankDetailsDisplay;
