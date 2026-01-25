"use server";

import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function followUser(
  followingId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("🔐 User authenticated:", user?.email);

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (user.id === followingId) {
      return { success: false, error: "Cannot follow yourself" };
    }

    // Sprawdź czy już obserwujesz
    const { data: existing } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", followingId)
      .single();

    if (existing) {
      return { success: false, error: "Already following this user" };
    }

    const { error } = await supabase.from("user_follows").insert({
      follower_id: user.id,
      following_id: followingId,
    });

    if (error) {
      console.error("❌ Error following user:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Follow successful, creating notification...");

    // Create notification for the followed user
    const notificationPayload = {
      user_id: followingId,
      from_user_id: user.id,
      type: "follow",
      title: "Nowy obserwujący!",
      message: "Zaczął Cię obserwować",
      is_read: false,
    };

    console.log(
      "📧 Notification payload:",
      JSON.stringify(notificationPayload, null, 2),
    );

    const { data: notifData, error: notifError } = await supabase
      .from("notifications")
      .insert(notificationPayload)
      .select();

    if (notifError) {
      console.error("❌ Error creating notification:", notifError);
      console.error("❌ Full error:", JSON.stringify(notifError, null, 2));
    } else {
      console.log("✅ Notification created successfully:", notifData);
    }

    revalidateTag("follows");
    return { success: true };
  } catch (error) {
    console.error("💥 Unexpected error in followUser:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function unfollowUser(
  followingId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", followingId);

    if (error) {
      console.error("Error unfollowing user:", error);
      return { success: false, error: error.message };
    }

    revalidateTag("follows");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error in unfollowUser:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getFollowingUsers(): Promise<string[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", user.id);

  return data?.map((f) => f.following_id) || [];
}

export async function isFollowing(followingId: string): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("user_follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", followingId)
    .single();

  return !!data;
}
