"use server";

import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PerfumeSearchResult } from "@/lib/fragrance-api";
import type { ToTryPerfume } from "@/lib/types";

function mapRow(row: Record<string, unknown>): ToTryPerfume {
  return {
    id: row.id as string,
    source_id: row.source_id as string,
    name: row.name as string,
    brand: row.brand as string,
    year: (row.year as number | null) ?? null,
    rating: (row.rating as number | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    notes: (row.notes as string[]) || [],
    categories: (row.categories as string[]) || [],
    description: (row.description as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

const TABLE_MISSING_ERROR =
  "Brakuje tabeli to_try_list. Uruchom skrypt 006-create-to-try-table.sql w bazie danych.";

// Zwraca listę "Chcę spróbować" zalogowanego użytkownika.
export async function getToTryList(): Promise<ToTryPerfume[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("to_try_list")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching to-try list:", error);
    return [];
  }

  return (data as Record<string, unknown>[]).map(mapRow);
}

// Dodaje perfumę z zewnętrznego API do listy "Chcę spróbować".
export async function addToTryList(
  result: PerfumeSearchResult,
): Promise<{ success: boolean; error?: string; item?: ToTryPerfume }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("to_try_list")
    .insert({
      user_id: user.id,
      source_id: result.id,
      name: result.name,
      brand: result.brand,
      year: result.year,
      rating: result.rating,
      image_url: result.image,
      notes: result.notes || [],
      categories: result.categories || [],
      description: result.description || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding to to-try list:", error);
    if (error.code === "42P01") {
      return { success: false, error: TABLE_MISSING_ERROR };
    }
    if (error.code === "23505") {
      return { success: false, error: "Ten zapach jest już na Twojej liście" };
    }
    return { success: false, error: error.message };
  }

  revalidateTag("to-try");
  return { success: true, item: mapRow(data as Record<string, unknown>) };
}

// Usuwa pozycję z listy "Chcę spróbować".
export async function removeToTryItem(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("to_try_list")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error removing to-try item:", error);
    return { success: false, error: error.message };
  }

  revalidateTag("to-try");
  return { success: true };
}
