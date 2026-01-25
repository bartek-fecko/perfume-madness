"use server";

import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  Perfume,
  PerfumeCategory,
  SortOption,
  SortDirection,
} from "@/lib/types";

export async function createPerfume(perfume: {
  name: string;
  brand: string;
  price: number;
  rating: number;
  description?: string;
  notes: string[];
  categories: string[];
  image_url?: string;
}): Promise<{ success: boolean; error?: string; perfume?: Perfume }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("🔐 User authenticated:", user?.email);

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("perfumes")
      .insert({
        ...perfume,
        user_id: user.id,
        is_favorite: false,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating perfume:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Perfume created:", data.id);
    console.log("🔑 Current user ID:", user.id);

    // Notify followers
    const { data: followers, error: followersError } = await supabase
      .from("user_follows")
      .select("follower_id")
      .eq("following_id", user.id);

    console.log("👥 Found followers:", followers?.length || 0);

    if (followersError) {
      console.error("❌ Error fetching followers:", followersError);
    }

    if (followers && followers.length > 0) {
      console.log("📧 Preparing to create", followers.length, "notifications");

      const notifications = followers.map((f) => ({
        user_id: f.follower_id,
        from_user_id: user.id,
        type: "new_perfume",
        title: "Nowe perfumy!",
        message: `Dodał nowe perfumy: ${perfume.name}`,
        perfume_id: data.id,
        is_read: false,
      }));

      console.log(
        "📧 Notification payload:",
        JSON.stringify(notifications[0], null, 2),
      );

      const { data: notifData, error: notifError } = await supabase
        .from("notifications")
        .insert(notifications)
        .select();

      if (notifError) {
        console.error("❌ Error creating notifications:", notifError);
        console.error("❌ Error code:", notifError.code);
        console.error("❌ Error message:", notifError.message);
        console.error("❌ Error details:", notifError.details);
        console.error("❌ Error hint:", notifError.hint);
      } else {
        console.log(
          "✅ Notifications created successfully:",
          notifData?.length,
        );
      }
    } else {
      console.log("ℹ️ No followers to notify");
    }

    revalidateTag("perfumes");
    return { success: true, perfume: data as Perfume };
  } catch (err) {
    console.error("💥 Unexpected error in createPerfume:", err);
    return { success: false, error: "Unexpected error occurred" };
  }
}

// Reszta funkcji bez zmian...
export async function getPerfumes(options: {
  category?: PerfumeCategory;
  search?: string;
  sortBy?: SortOption;
  sortDirection?: SortDirection;
  userId?: string;
  favoritesOnly?: boolean;
}): Promise<Perfume[]> {
  const supabase = await createClient();

  let query = supabase.from("perfumes").select("*");

  if (options.userId) {
    query = query.eq("user_id", options.userId);
  }

  if (options.category && options.category !== "All") {
    query = query.contains("categories", [options.category]);
  }

  if (options.search) {
    query = query.or(
      `name.ilike.%${options.search}%,brand.ilike.%${options.search}%,notes.cs.{${options.search}}`,
    );
  }

  if (options.favoritesOnly) {
    query = query.eq("is_favorite", true);
  }

  const sortBy = options.sortBy || "created_at";
  const sortDirection = options.sortDirection || "desc";
  query = query.order(sortBy, { ascending: sortDirection === "asc" });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching perfumes:", error);
    return [];
  }

  return data as Perfume[];
}

export async function getAllUsers(): Promise<
  {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    perfume_count: number;
    is_following: boolean;
  }[]
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url");

  if (!users) return [];

  const { data: following } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = new Set(following?.map((f) => f.following_id) || []);

  const usersWithCounts = await Promise.all(
    users
      .filter((u) => u.id !== user.id)
      .map(async (u) => {
        const { data: perfumes } = await supabase
          .from("perfumes")
          .select("id")
          .eq("user_id", u.id);

        return {
          ...u,
          perfume_count: perfumes?.length || 0,
          is_following: followingIds.has(u.id),
        };
      }),
  );

  return usersWithCounts.sort((a, b) => {
    if (a.is_following && !b.is_following) return -1;
    if (!a.is_following && b.is_following) return 1;
    return b.perfume_count - a.perfume_count;
  });
}

export async function getFollowingPerfumes(options: {
  category?: PerfumeCategory;
  search?: string;
  sortBy?: SortOption;
  sortDirection?: SortDirection;
}): Promise<Perfume[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: following } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", user.id);

  if (!following || following.length === 0) return [];

  const followingIds = following.map((f) => f.following_id);

  let query = supabase.from("perfumes").select("*").in("user_id", followingIds);

  if (options.category && options.category !== "All") {
    query = query.contains("categories", [options.category]);
  }

  if (options.search) {
    query = query.or(
      `name.ilike.%${options.search}%,brand.ilike.%${options.search}%`,
    );
  }

  const sortBy = options.sortBy || "created_at";
  const sortDirection = options.sortDirection || "desc";
  query = query.order(sortBy, { ascending: sortDirection === "asc" });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching following perfumes:", error);
    return [];
  }

  return data as Perfume[];
}

export async function getUserPerfumes(
  userId: string,
  options: {
    category?: PerfumeCategory;
    search?: string;
    sortBy?: SortOption;
    sortDirection?: SortDirection;
  },
): Promise<Perfume[]> {
  const supabase = await createClient();

  let query = supabase.from("perfumes").select("*").eq("user_id", userId);

  if (options.category && options.category !== "All") {
    query = query.contains("categories", [options.category]);
  }

  if (options.search) {
    query = query.or(
      `name.ilike.%${options.search}%,brand.ilike.%${options.search}%`,
    );
  }

  const sortBy = options.sortBy || "created_at";
  const sortDirection = options.sortDirection || "desc";
  query = query.order(sortBy, { ascending: sortDirection === "asc" });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching user perfumes:", error);
    return [];
  }

  return data as Perfume[];
}

export async function getUserProfile(userId: string): Promise<{
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_following: boolean;
} | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const { data: followData } = await supabase
    .from("user_follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", userId)
    .single();

  return {
    ...profile,
    is_following: !!followData,
  };
}

export async function getPerfumeById(id: string): Promise<Perfume | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("perfumes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching perfume:", error);
    return null;
  }

  return data as Perfume;
}

export async function updatePerfume(
  id: string,
  updates: Partial<{
    name: string;
    brand: string;
    price: number;
    rating: number;
    description: string;
    notes: string[];
    categories: string[];
    image_url: string;
    is_favorite: boolean;
  }>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("perfumes")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating perfume:", error);
    return { success: false, error: error.message };
  }

  revalidateTag("perfumes");
  return { success: true };
}

export async function deletePerfume(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Pobierz dane perfum przed usunięciem (do notyfikacji)
  const { data: perfume } = await supabase
    .from("perfumes")
    .select("name, brand")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!perfume) {
    return { success: false, error: "Perfume not found" };
  }

  const { error } = await supabase
    .from("perfumes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting perfume:", error);
    return { success: false, error: error.message };
  }

  console.log("✅ Perfume deleted:", id);

  // Notify followers about deletion
  const { data: followers } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("following_id", user.id);

  if (followers && followers.length > 0) {
    console.log("📧 Notifying", followers.length, "followers about deletion");

    const notifications = followers.map((f) => ({
      user_id: f.follower_id,
      from_user_id: user.id,
      type: "perfume_deleted",
      title: "Perfumy usunięte",
      message: `Usunął perfumy: ${perfume.name} by ${perfume.brand}`,
      is_read: false,
    }));

    const { error: notifError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notifError) {
      console.error("❌ Error creating deletion notifications:", notifError);
    } else {
      console.log("✅ Deletion notifications created");
    }
  }

  revalidateTag("perfumes");
  return { success: true };
}

export async function toggleFavorite(
  id: string,
): Promise<{ success: boolean; isFavorite?: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: perfume } = await supabase
    .from("perfumes")
    .select("is_favorite")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!perfume) {
    return { success: false, error: "Perfume not found" };
  }

  const newFavoriteState = !perfume.is_favorite;

  const { error } = await supabase
    .from("perfumes")
    .update({
      is_favorite: newFavoriteState,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error toggling favorite:", error);
    return { success: false, error: error.message };
  }

  revalidateTag("perfumes");
  return { success: true, isFavorite: newFavoriteState };
}

export async function getCategoryCounts(
  userId: string,
): Promise<Record<string, number>> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("perfumes")
    .select("categories")
    .eq("user_id", userId);

  if (!data) return {};

  const counts: Record<string, number> = { All: data.length };
  const categories = [
    "Kwiatowe",
    "Drzewne",
    "Świeże",
    "Cytrusowe",
    "Korzenne",
    "Słodkie",
    "Orientalne",
  ];

  const categoryMap = new Map<string, number>();
  categories.forEach((cat) => categoryMap.set(cat, 0));

  data.forEach((p) => {
    if (p.categories && Array.isArray(p.categories)) {
      p.categories.forEach((cat: string) => {
        if (categoryMap.has(cat)) {
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
        }
      });
    }
  });

  categories.forEach((cat) => {
    counts[cat] = categoryMap.get(cat) || 0;
  });

  return counts;
}
