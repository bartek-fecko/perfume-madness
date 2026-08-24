"use server";

import { revalidateTag, unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { brandGroupKey, prettifyBrandName } from "@/lib/utils";
import type {
  Perfume,
  PerfumeNotes,
  FragranceNote,
  PerfumeCategory,
  SortOption,
  SortDirection,
} from "@/lib/types";

function applyNameBrandSearch<T extends { or: (filters: string) => T }>(
  query: T,
  search?: string,
): T {
  const term = search?.trim();
  if (!term) return query;

  const escaped = term.replace(/[%_,().\\]/g, "\\$&");
  return query.or(`name.ilike.%${escaped}%,brand.ilike.%${escaped}%`);
}

export async function createPerfume(perfume: {
  name: string;
  brand: string;
  price: number;
  rating: number;
  description?: string;
  notes: PerfumeNotes;
  categories: string[];
  wear_seasons?: string[];
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
    const { data: existingPerfumes } = await supabase
      .from("perfumes")
      .select("brand, position")
      .eq("user_id", user.id);

    // Nowy perfum ląduje na końcu grupy swojej marki.
    const newBrandKey = brandGroupKey(perfume.brand);
    const sameBrandPositions = (existingPerfumes || [])
      .filter(
        (p: { brand: string; position: number }) =>
          brandGroupKey(p.brand) === newBrandKey,
      )
      .map((p: { brand: string; position: number }) => p.position);
    const position =
      sameBrandPositions.length > 0
        ? Math.max(...sameBrandPositions) + 1
        : 0;

    const { data, error } = await supabase
      .from("perfumes")
      .insert({
        name: perfume.name,
        brand: perfume.brand,
        price: perfume.price,
        rating: perfume.rating,
        description: perfume.description,
        notes_top: perfume.notes.top,
        notes_heart: perfume.notes.heart,
        notes_base: perfume.notes.base,
        categories: perfume.categories,
        wear_seasons: perfume.wear_seasons || [],
        image_url: perfume.image_url,
        user_id: user.id,
        is_favorite: false,
        position,
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
    revalidateTag("perfume");
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
    query = applyNameBrandSearch(query, options.search);
  }

  if (options.favoritesOnly) {
    query = query.eq("is_favorite", true);
  }

  const sortBy = options.sortBy || "created_at";
  const sortDirection = options.sortDirection || "desc";
  if (sortBy === "created_at") {
    query = query.order("position", { ascending: true });
  }
  query = query.order(sortBy, { ascending: sortDirection === "asc" });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching perfumes:", error);
    return [];
  }

  return (data as Record<string, unknown>[]).map(mapDbPerfumeToPerfume);
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
    query = applyNameBrandSearch(query, options.search);
  }

  const sortBy = options.sortBy || "created_at";
  const sortDirection = options.sortDirection || "desc";
  if (sortBy === "created_at") {
    query = query.order("position", { ascending: true });
  }
  query = query.order(sortBy, { ascending: sortDirection === "asc" });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching following perfumes:", error);
    return [];
  }

  return (data as Record<string, unknown>[]).map(mapDbPerfumeToPerfume);
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
    query = applyNameBrandSearch(query, options.search);
  }

  const sortBy = options.sortBy || "created_at";
  const sortDirection = options.sortDirection || "desc";
  if (sortBy === "created_at") {
    query = query.order("position", { ascending: true });
  }
  query = query.order(sortBy, { ascending: sortDirection === "asc" });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching user perfumes:", error);
    return [];
  }

  return (data as Record<string, unknown>[]).map(mapDbPerfumeToPerfume);
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

function mapDbPerfumeToPerfume(data: Record<string, unknown>): Perfume {
  return {
    ...data,
    wear_seasons: (data.wear_seasons as string[]) || [],
    notes: {
      top: (data.notes_top as FragranceNote[]) || [],
      heart: (data.notes_heart as FragranceNote[]) || [],
      base: (data.notes_base as FragranceNote[]) || [],
    },
  } as Perfume;
}

export async function getPerfumeById(id: string): Promise<Perfume | null> {
  return getCachedPerfumeById(id);
}

const getCachedPerfumeById = unstable_cache(
  async (id: string): Promise<Perfume | null> => {
    // Użyj anon klienta bez cookies() aby Next Data Cache mógł cache'ować (built-in cache)
    const supabase = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data, error } = await supabase.from("perfumes").select("*").eq("id", id).single();
    if (error) {
      console.error("Error fetching perfume:", error);
      return null;
    }
    return mapDbPerfumeToPerfume(data as Record<string, unknown>);
  },
  ["perfume-by-id"],
  { revalidate: 60, tags: ["perfume"] },
);

export async function updatePerfume(
  id: string,
  updates: Partial<{
    name: string;
    brand: string;
    price: number;
    rating: number;
    description: string;
    notes: PerfumeNotes;
    categories: string[];
    wear_seasons: string[];
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

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.brand !== undefined) updateData.brand = updates.brand;
  if (updates.price !== undefined) updateData.price = updates.price;
  if (updates.rating !== undefined) updateData.rating = updates.rating;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.categories !== undefined) updateData.categories = updates.categories;
  if (updates.wear_seasons !== undefined) updateData.wear_seasons = updates.wear_seasons;
  if (updates.image_url !== undefined) updateData.image_url = updates.image_url;
  if (updates.is_favorite !== undefined) updateData.is_favorite = updates.is_favorite;

  if (updates.notes !== undefined) {
    updateData.notes_top = updates.notes.top;
    updateData.notes_heart = updates.notes.heart;
    updateData.notes_base = updates.notes.base;
  }

  const { error } = await supabase
    .from("perfumes")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating perfume:", error);
    return { success: false, error: error.message };
  }

  revalidateTag("perfumes");
  revalidateTag("perfume");
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
  revalidateTag("perfume");
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
  revalidateTag("perfume");
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
    "Aromatyczne",
    "Skórzane",
    "Zielone",
    "Fougère",
    "Ambrowe",
    "Piżmowe",
    "Wodne",
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

// Oblicza statystyki kolekcji. Wydzielone do osobnej funkcji server action,
// aby nie blokować pierwszego renderu strony - klient ładuje je asynchronicznie.
export async function getCollectionStats(userId: string): Promise<{
  total: number;
  totalValue: number;
  favoriteBrand: string;
  topNote: string;
  avgRating: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("perfumes")
    .select("brand, price, rating, notes_top, notes_heart, notes_base, is_favorite")
    .eq("user_id", userId);

  if (error || !data) {
    console.error("Error fetching collection stats:", error);
    return {
      total: 0,
      totalValue: 0,
      favoriteBrand: "",
      topNote: "",
      avgRating: 0,
    };
  }

  const total = data.length;

  const totalValue = data.reduce(
    (sum: number, p) => sum + (Number(p.price) || 0),
    0,
  );

  // Ulubiona marka = marka z największą liczbą ulubionych (is_favorite) perfum.
  let favoriteBrand = "";
  let favoriteBrandCount = 0;
  const favCounts = new Map<string, { label: string; count: number }>();
  for (const p of data) {
    if (!p.is_favorite || !p.brand) continue;
    const key = brandGroupKey(p.brand);
    const entry = favCounts.get(key) || {
      label: prettifyBrandName(p.brand),
      count: 0,
    };
    entry.count += 1;
    favCounts.set(key, entry);
    if (entry.count > favoriteBrandCount) {
      favoriteBrandCount = entry.count;
      favoriteBrand = entry.label;
    }
  }

  // Ulubiona nuta = nuta, która najczęściej pojawia się w ulubionych
  // (is_favorite) perfumach.
  const favorites = data.filter((p) => p.is_favorite);
  const noteCounts = new Map<string, number>();
  for (const p of favorites) {
    const allNotes = [
      ...(p.notes_top as FragranceNote[]) || [],
      ...(p.notes_heart as FragranceNote[]) || [],
      ...(p.notes_base as FragranceNote[]) || [],
    ];
    for (const note of allNotes) {
      const key = String(note.name).trim();
      if (!key) continue;
      noteCounts.set(key, (noteCounts.get(key) || 0) + 1);
    }
  }
  let topNote = "";
  let topNoteCount = 0;
  for (const [note, count] of noteCounts) {
    if (count > topNoteCount) {
      topNoteCount = count;
      topNote = note;
    }
  }

  const avgRating = total
    ? data.reduce((sum: number, p) => sum + (Number(p.rating) || 0), 0) /
      total
    : 0;

  return { total, totalValue, favoriteBrand, topNote, avgRating };
}

// Zwraca listę unikalnych marek z kolekcji zalogowanego użytkownika
// (do podpowiedzi w formularzu dodawania perfum). Marka pojawia się tu
// dopiero po dodaniu przynajmniej jednych perfum z tą marką - nie ma
// osobnej tabeli "brands", marki są wyprowadzane z istniejących perfum.
export async function getUserBrands(): Promise<string[]> {  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("perfumes")
    .select("brand")
    .eq("user_id", user.id);

  if (error || !data) {
    console.error("Error fetching user brands:", error);
    return [];
  }

  const brandsByKey = new Map<string, string>();
  for (const row of data) {
    if (!row.brand) continue;
    const key = brandGroupKey(row.brand);
    if (!brandsByKey.has(key)) {
      brandsByKey.set(key, prettifyBrandName(row.brand));
    }
  }

  return Array.from(brandsByKey.values()).sort((a, b) =>
    a.localeCompare(b, "pl"),
  );
}

// Zapisuje ręczną kolejność perfum w obrębie jednej marki (drag & drop
// w dialogu marki). Kolejność podana jako tablica id w docelowej kolejności.
export async function reorderPerfumes(orderedIds: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const updates = orderedIds.map((id, index) => ({
    id,
    user_id: user.id,
    position: index,
  }));

  const { error } = await supabase.from("perfumes").upsert(updates);

  if (error) {
    console.error("Error reordering perfumes:", error);
    return { success: false, error: error.message };
  }

  revalidateTag("perfumes");
  return { success: true };
}

// Zapisuje ręczną kolejność marek na siatce (drag & drop kafelków).
export async function reorderBrands(orderedKeys: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const rows = orderedKeys.map((key, index) => ({
    user_id: user.id,
    brand_key: key,
    position: index,
  }));

  const { error } = await supabase
    .from("brand_positions")
    .upsert(rows, { onConflict: "user_id,brand_key" });

  if (error) {
    console.error("Error reordering brands:", error);
    return { success: false, error: error.message };
  }

  revalidateTag("perfumes");
  return { success: true };
}

// Zwraca kolejność marek użytkownika jako mapę brand_key -> position.
export async function getBrandPositions(
  userId: string,
): Promise<Record<string, number>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("brand_positions")
    .select("brand_key, position")
    .eq("user_id", userId);

  if (error || !data) {
    console.error("Error fetching brand positions:", error);
    return {};
  }

  const map: Record<string, number> = {};
  for (const row of data) {
    map[row.brand_key] = row.position;
  }
  return map;
}
