"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  created_at: string;
  forAdmin: boolean | null;
  href?: string;
}

export function useNotifications(userId: string, isAdmin = false) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchNotifications = useCallback(async () => {
    const { data, error } = isAdmin
      ? await supabase
          .from("notifications")
          .select("*")
          .eq("forAdmin", true)
          .order("created_at", { ascending: false })
          .limit(10)
      : await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .eq("forAdmin", false)
          .order("created_at", { ascending: false })
          .limit(10);

    if (!error && data) setNotifications(data);
    console.log(data)
    setLoading(false);
  }, [userId, isAdmin, supabase]);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${isAdmin ? "admin" : userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: isAdmin ? "forAdmin=eq.true" : `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === payload.new.id ? (payload.new as Notification) : n,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) =>
              prev.filter((n) => n.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications, supabase]);

  const markAsRead = useCallback(
    async (id: string) => {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id)
        .eq("user_id", userId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    },
    [userId, supabase],
  );

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!unreadIds.length) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds)
      .eq("user_id", userId);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [notifications, userId, supabase]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead };
}
