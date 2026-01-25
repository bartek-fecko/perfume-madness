"use server";

import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/lib/types";

export async function getNotifications(): Promise<Notification[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Pobierz nazwy perfum i dane użytkowników
  const notificationsWithDetails = await Promise.all(
    data.map(async (n) => {
      let perfume_name = undefined;
      let from_user_name = undefined;
      let from_user_avatar = undefined;

      // Pobierz nazwę perfum jeśli istnieje
      if (n.perfume_id) {
        const { data: perfume } = await supabase
          .from("perfumes")
          .select("name")
          .eq("id", n.perfume_id)
          .single();
        perfume_name = perfume?.name;
      }

      // Pobierz dane użytkownika który wywołał notyfikację
      if (n.from_user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, avatar_url")
          .eq("id", n.from_user_id)
          .single();

        if (profile) {
          from_user_name = profile.full_name || profile.email.split("@")[0];
          from_user_avatar = profile.avatar_url;
        }
      }

      return {
        ...n,
        perfume_name,
        from_user_name,
        from_user_avatar,
      };
    }),
  );

  return notificationsWithDetails as Notification[];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Error fetching notification count:", error);
    return 0;
  }

  return count || 0;
}

export async function markNotificationAsRead(
  id: string,
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error marking notification as read:", error);
    return { success: false };
  }

  revalidateTag("notifications");
  return { success: true };
}

export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false };
  }

  revalidateTag("notifications");
  return { success: true };
}
