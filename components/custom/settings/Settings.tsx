"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  Calendar,
  Flag,
  MapPin,
  BadgeCheck,
  Briefcase,
  Building,
  CreditCard,
  Heart,
  Hash,
  ShieldAlert,
  Trash2,
  ChevronRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  Lock,
  Eye,
  EyeOff,
  Mail,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DeleteModal } from "../DeleteModal";
import { UserProfile } from "@/types";
import { capitalize, formatDate } from "@/types/helpers";

type SectionKey =
  | "personal"
  | "employment"
  | "bank"
  | "nextOfKin"
  | "investment";
interface RowProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
}

const Row = ({ icon, label, value }: RowProps) => (
  <div className="flex items-center justify-between py-3 px-4 border-b border-gray-100 last:border-0">
    <span className="flex items-center gap-2.5 text-sm text-gray-500 min-w-35">
      <span className="text-gray-400">{icon}</span>
      {label}
    </span>
    <span className="text-sm text-gray-400 font-medium text-right">
      {value}
    </span>
  </div>
);

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  id: SectionKey;
  expanded: SectionKey | null;
  onToggle: (id: SectionKey) => void;
}

const SectionCard = ({
  title,
  children,
  id,
  expanded,
  onToggle,
}: SectionCardProps) => {
  const isOpen = expanded === id;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm mb-3">
      <button
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
        onClick={() => onToggle(id)}
      >
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <ChevronRight
          size={16}
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
        />
      </button>
      {isOpen && <div className="border-t border-gray-100">{children}</div>}
    </div>
  );
};

const PasswordField = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "••••••••"}
          className="w-full px-3 py-2.5 pr-10 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
};

const Settings = () => {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<SectionKey | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // Password update state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Email update state (one-time)
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) throw new Error("Not authenticated");

        const { data, error: dbError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (dbError) throw dbError;
        if (!data) throw new Error("Profile not found");

        const profile: UserProfile = {
          ...data,
          compliance:
            typeof data.compliance === "string"
              ? JSON.parse(data.compliance)
              : data.compliance,
        };

        setUserData(profile);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const toggleSection = (id: SectionKey) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  const handleDelete = async () => {
    if (!userData) return;
    try {
      setDeleting(true);

      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userData.id);
      if (profileError) throw profileError;

      const { error: rpcError } = await supabase.rpc("delete_user");
      if (rpcError) throw rpcError;

      await supabase.auth.signOut();
      setShowDeleteModal(false);
      setDeleted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateEmail = async () => {
    setEmailError(null);
    setEmailSuccess(false);

    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) { setEmailError("Please enter a new email address."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) { setEmailError("Please enter a valid email address."); return; }
    if (trimmed === userData?.email?.toLowerCase()) {
      setEmailError("New email must be different from your current email.");
      return;
    }

    try {
      setEmailLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated.");

      const res = await fetch("/api/update-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ newEmail: trimmed }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to update email.");

      setUserData((prev) => prev ? { ...prev, email: trimmed, email_changed: true } : prev);
      setEmailSuccess(true);
      setNewEmail("");
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : "Failed to update email.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!newPassword || !confirmPassword || !currentPassword) {
      setPasswordError("Please fill in all fields.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      setPasswordLoading(true);

      // Re-authenticate with current password to verify identity
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Unable to verify user.");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) throw new Error("Current password is incorrect.");

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to update password.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="text-primary animate-spin" />
          <p className="text-sm text-gray-500">Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <h2 className="text-base font-semibold text-gray-800 mb-1">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-orange-600 font-medium hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (deleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={28} className="text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Account deleted
          </h2>
          <p className="text-sm text-gray-500">
            Your account has been permanently removed.
          </p>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  const compliance = userData.compliance ?? {};
  const bio_data = compliance.bio_data ?? {};
  const bank_details = compliance.bank_details ?? {};
  const personal_info = compliance.personal_info ?? {};

  const fullName =
    [userData.title, userData.first_name, userData.last_name]
      .filter(Boolean)
      .join(" ") || "Unknown User";

  const initials =
    (userData.first_name?.[0] ?? "") + (userData.last_name?.[0] ?? "") || "?";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
          <div className="flex items-center gap-4 p-5 border-b border-gray-100">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-base truncate">
                {fullName}
              </p>
              <p className="text-sm text-gray-500 truncate">{userData.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {userData.metamap_status === null ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">
                    <Clock size={11} />
                    Pending verification
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={11} />
                    Verified
                  </span>
                )}
                <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  {userData.role}
                </span>
              </div>
            </div>
          </div>
          <Row
            icon={<Phone size={15} />}
            label="Phone"
            value={userData.phone || "N/A"}
          />
          <Row
            icon={<Calendar size={15} />}
            label="Member since"
            value={formatDate(userData.created_at)}
          />
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
          Your details
        </p>

        <SectionCard
          title="Personal details"
          id="personal"
          expanded={expanded}
          onToggle={toggleSection}
        >
          <Row
            icon={<User size={15} />}
            label="Gender"
            value={personal_info.gender || "N/A"}
          />
          <Row
            icon={<Calendar size={15} />}
            label="Date of birth"
            value={formatDate(bio_data.date_of_birth) || "N/A"}
          />
          <Row
            icon={<Flag size={15} />}
            label="Nationality"
            value={personal_info.nationality || "N/A"}
          />
          <Row
            icon={<MapPin size={15} />}
            label="State of origin"
            value={capitalize(bio_data.state_of_origin) || "N/A"}
          />
          <Row
            icon={<MapPin size={15} />}
            label="LGA"
            value={capitalize(bio_data.lga) || "N/A"}
          />
          <Row
            icon={<BadgeCheck size={15} />}
            label="Means of ID"
            value={personal_info.means_of_id || "N/A"}
          />
          <Row
            icon={<Hash size={15} />}
            label="ID number"
            value={personal_info.id_number || "N/A"}
          />
        </SectionCard>

        <SectionCard
          title="Employment"
          id="employment"
          expanded={expanded}
          onToggle={toggleSection}
        >
          <Row
            icon={<Briefcase size={15} />}
            label="Employer"
            value={personal_info.employer_name || "N/A"}
          />
          <Row
            icon={<Briefcase size={15} />}
            label="Job title"
            value={personal_info.job_title || "N/A"}
          />
          <Row
            icon={<Building size={15} />}
            label="Office address"
            value={personal_info.office_address || "N/A"}
          />
          <Row
            icon={<CreditCard size={15} />}
            label="Employment type"
            value={
              (Array.isArray(bio_data.employment_type)
                ? bio_data.employment_type
                : []
              )
                .map(capitalize)
                .join(", ") || "—"
            }
          />
        </SectionCard>

        <SectionCard
          title="Bank details"
          id="bank"
          expanded={expanded}
          onToggle={toggleSection}
        >
          <Row
            icon={<Building size={15} />}
            label="Bank"
            value={bank_details.bank_name || "N/A"}
          />
          <Row
            icon={<User size={15} />}
            label="Account name"
            value={bank_details.account_name || "N/A"}
          />
          <Row
            icon={<Hash size={15} />}
            label="Account number"
            value={bank_details.account_number || "N/A"}
          />
        </SectionCard>

        <SectionCard
          title="Next of kin"
          id="nextOfKin"
          expanded={expanded}
          onToggle={toggleSection}
        >
          <Row
            icon={<Heart size={15} />}
            label="Name"
            value={capitalize(bio_data.next_of_kin) || "N/A"}
          />
          <Row
            icon={<Phone size={15} />}
            label="Phone"
            value={bio_data.next_of_kin_phone}
          />
          <Row
            icon={<MapPin size={15} />}
            label="Address"
            value={capitalize(bio_data.next_of_kin_address) || "N/A"}
          />
        </SectionCard>

        {/* Email update — one-time only */}
        <div className="mt-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            Email address
          </p>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail size={15} className="text-primary" />
              <span className="text-sm font-semibold text-gray-700">Update email</span>
              {userData.email_changed && (
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                  Used
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-4 ml-5.75">
              {userData.email_changed
                ? "Your email address has already been updated and cannot be changed again."
                : "You can update your email address once."}
            </p>

            {!userData.email_changed && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-500">New email address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new@example.com"
                    disabled={emailLoading}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition disabled:opacity-50"
                  />
                </div>

                {emailError && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">
                    <AlertCircle size={13} className="shrink-0" />
                    {emailError}
                  </div>
                )}

                {emailSuccess && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">
                    <CheckCircle2 size={13} className="shrink-0" />
                    Email updated. Check your new inbox for a confirmation link.
                  </div>
                )}

                <button
                  onClick={handleUpdateEmail}
                  disabled={emailLoading}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/70 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {emailLoading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
                  {emailLoading ? "Updating…" : "Update email"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Security section */}
        <div className="mt-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            Security
          </p>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={15} className="text-primary" />
              <span className="text-sm font-semibold text-gray-700">
                Update password
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <PasswordField
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Enter current password"
              />
              <PasswordField
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Min. 8 characters"
              />
              <PasswordField
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Repeat new password"
              />
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">
                <AlertCircle size={13} className="shrink-0" />
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="flex items-center gap-2 mt-3 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">
                <CheckCircle2 size={13} className="shrink-0" />
                Password updated successfully.
              </div>
            )}

            <button
              onClick={handleUpdatePassword}
              disabled={passwordLoading}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/70 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {passwordLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Lock size={15} />
              )}
              {passwordLoading ? "Updating…" : "Update password"}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="mt-6 mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            Danger zone
          </p>
          <div className="bg-red-50 rounded-2xl border border-red-100 shadow-sm p-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <ShieldAlert size={15} className="text-red-500" />
                <span className="text-sm font-semibold text-red-600">
                  Delete account
                </span>
              </div>
              <p className="text-xs text-gray-500 ml-5.75">
                Permanently removes all your data.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors shrink-0"
            >
              <Trash2 size={15} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </div>
  );
};

export default Settings;
