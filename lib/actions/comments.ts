"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PerfumeComment } from "@/lib/types";

// Pobierz wszystkie komentarze dla perfum
export async function getComments(
  perfumeId: string,
): Promise<PerfumeComment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("perfume_comments")
    .select("*")
    .eq("perfume_id", perfumeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching comments:", error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Pobierz dane użytkowników
  const commentsWithUsers = await Promise.all(
    data.map(async (comment) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url")
        .eq("id", comment.user_id)
        .single();

      return {
        ...comment,
        user_name:
          profile?.full_name || profile?.email?.split("@")[0] || "Użytkownik",
        user_email: profile?.email,
        user_avatar: profile?.avatar_url,
      };
    }),
  );

  return commentsWithUsers as PerfumeComment[];
}

// Sprawdź ile komentarzy użytkownik już dodał do tych perfum
export async function getUserCommentCount(perfumeId: string): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("perfume_comments")
    .select("*", { count: "exact", head: true })
    .eq("perfume_id", perfumeId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error counting comments:", error);
    return 0;
  }

  return count || 0;
}

// Dodaj komentarz
export async function addComment(
  perfumeId: string,
  comment: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Nie jesteś zalogowany" };
    }

    // Walidacja długości komentarza
    if (!comment.trim() || comment.length > 500) {
      return {
        success: false,
        error: "Komentarz musi mieć od 1 do 500 znaków",
      };
    }

    // Sprawdź limit
    const count = await getUserCommentCount(perfumeId);
    if (count >= 5) {
      return { success: false, error: "Osiągnięto limit 5 komentarzy" };
    }

    // Dodaj komentarz
    const { data: newComment, error: insertError } = await supabase
      .from("perfume_comments")
      .insert({
        perfume_id: perfumeId,
        user_id: user.id,
        comment: comment.trim(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error adding comment:", insertError);
      return { success: false, error: insertError.message };
    }

    console.log("✅ Comment added:", newComment.id);

    // Pobierz dane perfum i właściciela
    const { data: perfume } = await supabase
      .from("perfumes")
      .select("name, user_id")
      .eq("id", perfumeId)
      .single();

    // Wyślij notyfikację do właściciela perfum (jeśli to nie jego komentarz)
    if (perfume && perfume.user_id !== user.id) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: perfume.user_id,
          from_user_id: user.id,
          type: "new_comment",
          title: "Nowy komentarz!",
          message: `Skomentował Twoje perfumy: ${perfume.name}`,
          perfume_id: perfumeId,
          is_read: false,
        });

      if (notifError) {
        console.error("Error creating comment notification:", notifError);
      } else {
        console.log("✅ Comment notification created");
      }
    }

    revalidatePath(`/perfume/${perfumeId}`);
    return { success: true };
  } catch (error) {
    console.error("Unexpected error in addComment:", error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

// Usuń komentarz
export async function deleteComment(
  commentId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Nie jesteś zalogowany" };
    }

    // Pobierz perfume_id przed usunięciem (do revalidacji)
    const { data: comment } = await supabase
      .from("perfume_comments")
      .select("perfume_id")
      .eq("id", commentId)
      .single();

    const { error } = await supabase
      .from("perfume_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id); // RLS zapewnia że można usunąć tylko swój

    if (error) {
      console.error("Error deleting comment:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Comment deleted:", commentId);

    if (comment) {
      revalidatePath(`/perfume/${comment.perfume_id}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in deleteComment:", error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}
