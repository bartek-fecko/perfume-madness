"use server";

import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function followUser(followingId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  if (user.id === followingId) {
    return { success: false, error: "Cannot follow yourself" };
  }

  const { error } = await supabase
    .from("user_follows")
    .insert({
      follower_id: user.id,
      following_id: followingId,
    });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Already following this user" };
    }
    console.error("Error following user:", error);
    return { success: false, error: error.message };
  }

  // Create notification for the followed user
  await supabase.from("notifications").insert({
    user_id: followingId,
    type: "follow",
    message: "Started following you",
    from_user_id: user.id,
  });

  revalidateTag("follows", "max");
  return { success: true };
}

export async function unfollowUser(followingId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
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

  revalidateTag("follows", "max");
  return { success: true };
}

export async function getFollowingUsers(): Promise<string[]> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", user.id);

  return data?.map(f => f.following_id) || [];
}

export async function isFollowing(followingId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("user_follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", followingId)
    .single();

  return !!data;
}
