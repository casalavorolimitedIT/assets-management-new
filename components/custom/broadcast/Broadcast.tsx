import { Tab } from "@/app/dashboard/broadcast/page";
import { Banknote, Bell, Mail } from "lucide-react";

export function TabSwitcher({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Broadcast channel"
      className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 gap-1"
    >
      {(["email", "notification", "transaction"] as Tab[]).map((tab) => {
        const Icon =
          tab === "email" ? Mail : tab === "notification" ? Bell : Banknote;
        const isActive = active === tab;
        return (
          <button
            key={tab}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1
              ${isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {tab === "email"
              ? "Email"
              : tab === "notification"
                ? "Notification"
                : "Transaction"}
          </button>
        );
      })}
    </div>
  );
}
