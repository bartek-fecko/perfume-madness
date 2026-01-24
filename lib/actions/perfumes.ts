"use server";

import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  Perfume,
  PerfumeCategory,
  SortOption,
  SortDirection,
} from "@/lib/types";

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

// NOWA FUNKCJA - Pobierz wszystkich użytkowników
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
  console.log("🔐 Current user:", user?.email);
  if (!user) return [];

  // Pobierz wszystkich użytkowników z profiles
  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url");

  console.log("👥 Fetched profiles:", users?.length, "Error:", error);
  if (!users) return [];

  // Pobierz użytkowników których obserwujesz
  const { data: following } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = new Set(following?.map((f) => f.following_id) || []);

  // Policz perfumy dla każdego użytkownika
  const usersWithCounts = await Promise.all(
    users
      .filter((u) => u.id !== user.id) // Ukryj siebie z listy
      .map(async (u) => {
        const { data: perfumes } = await supabase
          .from("perfumes")
          .select("id")
          .eq("user_id", u.id);

        const perfumeCount = perfumes?.length || 0;
        console.log(`👤 User ${u.email}: ${perfumeCount} perfumes`);

        return {
          ...u,
          perfume_count: perfumeCount,
          is_following: followingIds.has(u.id),
        };
      }),
  );

  // Sortuj: najpierw obserwowani, potem po liczbie perfum
  return usersWithCounts.sort((a, b) => {
    if (a.is_following && !b.is_following) return -1;
    if (!a.is_following && b.is_following) return 1;
    return b.perfume_count - a.perfume_count;
  });
}

// NOWA FUNKCJA - Pobierz perfumy konkretnego użytkownika
// Pobierz perfumy od obserwowanych użytkowników (stara funkcjonalność)
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

  // Get users I follow
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

// NOWA FUNKCJA - Pobierz dane użytkownika
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

  // Sprawdź czy obserwujesz tego użytkownika
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
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
    console.error("Error creating perfume:", error);
    return { success: false, error: error.message };
  }

  // Notify followers
  const { data: followers } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("following_id", user.id);

  if (followers && followers.length > 0) {
    const notifications = followers.map((f) => ({
      user_id: f.follower_id,
      type: "new_perfume" as const,
      message: `Added a new perfume: ${perfume.name}`,
      related_perfume_id: data.id,
      from_user_id: user.id,
    }));

    await supabase.from("notifications").insert(notifications);
  }

  revalidateTag("perfumes");
  return { success: true, perfume: data as Perfume };
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

  const { error } = await supabase
    .from("perfumes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting perfume:", error);
    return { success: false, error: error.message };
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
