import { NotifType, User } from "@/app/dashboard/broadcast/page";
import { NOTIF_TYPES } from "@/types";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Info,
  LinkIcon,
  Loader2,
  Send,
} from "lucide-react";
import { useState } from "react";

const PREVIEW_CLS: Record<NotifType, string> = {
  info: "bg-blue-50 border-blue-200 text-blue-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  error: "bg-red-50 border-red-200 text-red-900",
};

function NotifTypeIcon({ type }: { type: NotifType }) {
  const cls = "w-4 h-4 flex-shrink-0 mt-0.5";
  if (type === "success")
    return <CheckCircle2 className={cls} aria-hidden="true" />;
  if (type === "error" || type === "warning")
    return <AlertCircle className={cls} aria-hidden="true" />;
  return <Info className={cls} aria-hidden="true" />;
}

function Field({
  label,
  id,
  hint,
  children,
}: {
  label: string;
  id: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

// ── Send button ───────────────────────────────────────────────────────────────

function SendButton({
  sending,
  disabled,
  onClick,
  icon: Icon,
  label,
  loadingLabel,
}: {
  sending: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  loadingLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || sending}
      aria-disabled={disabled || sending}
      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-900 text-white
        rounded-lg text-sm font-semibold hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed
        transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900"
    >
      {sending ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        <Icon className="w-4 h-4" aria-hidden="true" />
      )}
      {sending ? loadingLabel : label}
    </button>
  );
}

// ── Recipients Preview ────────────────────────────────────────────────────────

function RecipientsPreview({ users }: { users: User[] }) {
  if (users.length === 0) return null;
  return (
    <div
      aria-label={`${users.length} recipient${users.length !== 1 ? "s" : ""} selected`}
      className="p-3 bg-slate-50 border border-slate-200 rounded-lg"
    >
      <p className="text-xs text-slate-500 font-medium mb-2">
        Sending to {users.length} recipient{users.length !== 1 ? "s" : ""}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {users.slice(0, 5).map((u) => (
          <span
            key={u.id}
            className="text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 truncate max-w-50"
          >
            {u.email}
          </span>
        ))}
        {users.length > 5 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-400">
            +{users.length - 5} more
          </span>
        )}
      </div>
    </div>
  );
}

// ── Email Form ────────────────────────────────────────────────────────────────

export function EmailForm({
  selectedUsers,
  onSend,
  sending,
}: {
  selectedUsers: User[];
  onSend: (subject: string, body: string) => Promise<void>;
  sending: boolean;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  return (
    <div className="space-y-5">
      <Field label="Subject" id="email-subject">
        <input
          id="email-subject"
          type="text"
          placeholder="Your subject line…"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field
        label="Message body"
        id="email-body"
      >
        <textarea
          id="email-body"
          rows={7}
          placeholder="Write your message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={`${inputCls} resize-none font-mono leading-relaxed`}
        />
      </Field>

      <RecipientsPreview users={selectedUsers} />

      <SendButton
        sending={sending}
        disabled={!subject.trim() || !body.trim() || selectedUsers.length === 0}
        onClick={() => onSend(subject, body)}
        icon={Send}
        label={`Send to ${selectedUsers.length} recipient${selectedUsers.length !== 1 ? "s" : ""}`}
        loadingLabel="Sending…"
      />
    </div>
  );
}

export function NotificationForm({
  selectedUsers,
  onSend,
  sending,
}: {
  selectedUsers: User[];
  onSend: (
    title: string,
    message: string,
    type: string,
    link: string,
  ) => Promise<void>;
  sending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotifType>("info");
  const [link, setLink] = useState("");

  return (
    <div className="space-y-5">
      {/* Type picker */}
      <fieldset>
        <legend className="block text-sm font-medium text-slate-700 mb-2">
          Notification type
        </legend>
        <div className="grid grid-cols-4 gap-2" role="group">
          {NOTIF_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={type === t.value}
              onClick={() => setType(t.value)}
              className={`px-2 py-2 rounded-lg text-xs font-semibold border transition
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                ${type === t.value ? t.active : t.idle}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <Field label="Title" id="notif-title">
        <input
          id="notif-title"
          type="text"
          placeholder="Notification title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="Message" id="notif-message">
        <textarea
          id="notif-message"
          rows={4}
          placeholder="Notification message…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${inputCls} resize-none`}
        />
      </Field>

      {/* Live preview */}
      {(title || message) && (
        <div
          role="region"
          aria-label="Notification preview"
          className={`flex gap-3 p-4 rounded-xl border ${PREVIEW_CLS[type]}`}
        >
          <NotifTypeIcon type={type} />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-50 mb-1">
              Preview
            </p>
            {title && (
              <p className="font-semibold text-sm leading-snug">{title}</p>
            )}
            {message && <p className="text-xs opacity-75 mt-0.5">{message}</p>}
            {link && (
              <p className="text-xs opacity-40 mt-1.5 truncate">→ {link}</p>
            )}
          </div>
        </div>
      )}

      <RecipientsPreview users={selectedUsers} />

      <SendButton
        sending={sending}
        disabled={
          !title.trim() || !message.trim() || selectedUsers.length === 0
        }
        onClick={() => onSend(title, message, type, link)}
        icon={Bell}
        label={`Notify ${selectedUsers.length} user${selectedUsers.length !== 1 ? "s" : ""}`}
        loadingLabel="Sending…"
      />
    </div>
  );
}
