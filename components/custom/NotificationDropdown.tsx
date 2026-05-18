"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  XCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

const TYPE_CONFIG = {
  info: {
    icon: Info,
    bg: "bg-blue-50",
    iconColor: "text-blue-500",
    dot: "bg-blue-500",
  },
  success: {
    icon: Sparkles,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    dot: "bg-emerald-500",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50",
    iconColor: "text-amber-500",
    dot: "bg-amber-500",
  },
  error: {
    icon: XCircle,
    bg: "bg-red-50",
    iconColor: "text-red-500",
    dot: "bg-red-500",
  },
};

interface NotificationDropdownProps {
  userId: string;
  isAdmin?: boolean;
}

export function NotificationDropdown({
  userId,
  isAdmin = false,
}: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, loading, markAsRead, markAllAsRead } =
    useNotifications(userId, isAdmin);
  const visibleNotifications = notifications;

  const unreadCount = visibleNotifications.filter(
    (n: Notification) => !n.read,
  ).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell
          className={`size-5 transition-all duration-200 ${
            open ? "rotate-12 text-[#ff6900]" : "hover:-rotate-12"
          }`}
        />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#ff6900] text-[10px] font-bold text-white leading-none animate-in zoom-in-50 duration-200">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/60 z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in-0 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-[#fff1e6] px-1.5 py-0.5 text-[10px] font-semibold text-[#ff6900]">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs font-medium text-[#ff6900] hover:text-[#e55f00] transition-colors"
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-105 overflow-y-auto divide-y divide-zinc-50">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="size-5 animate-spin text-zinc-400" />
              </div>
            ) : visibleNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <div className="size-10 rounded-full bg-zinc-100 flex items-center justify-center">
                  <Bell className="size-5 text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-500">
                  All caught up!
                </p>
                <p className="text-xs text-zinc-400">No notifications yet</p>
              </div>
            ) : (
              visibleNotifications.map((n: Notification) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={markAsRead}
                  onClose={() => setOpen(false)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification: n,
  onRead,
  onClose,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onClose: () => void;
}) {
  const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info;
  const Icon = config.icon;

  const handleClick = () => {
    if (!n.read) onRead(n.id);
    if (n.href) onClose();
  };

  const content = (
    <div
      className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 cursor-pointer ${
        !n.read ? "bg-[#fffaf7]" : ""
      }`}
      onClick={handleClick}
    >
      {/* Icon */}
      <div
        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${config.bg}`}
      >
        <Icon className={`size-4 ${config.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm font-medium leading-snug ${n.read ? "text-zinc-600" : "text-zinc-900"}`}
          >
            {n.title}
          </p>
          {!n.read && (
            <span
              className={`mt-1 size-2 shrink-0 rounded-full ${config.dot}`}
            />
          )}
        </div>
        <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{n.message}</p>
        <p className="mt-1 text-[10px] text-zinc-400">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Mark read button */}
      {!n.read && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRead(n.id);
          }}
          className="mt-0.5 shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          title="Mark as read"
        >
          <Check className="size-3.5" />
        </button>
      )}
    </div>
  );

  return n.href ? <Link href={n.href}>{content}</Link> : content;
}
