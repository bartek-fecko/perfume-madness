"use server";

export interface Perfume {
  id: string;
  user_id: string;
  name: string;
  brand: string;
  price: number;
  rating: number;
  description: string | null;
  notes: string[];
  categories: string[];
  image_url: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
  user_avatar?: string;
}

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export type PerfumeCategory =
  | "All"
  | "Kwiatowe"
  | "Drzewne"
  | "Świeże"
  | "Cytrusowe"
  | "Korzenne"
  | "Słodkie"
  | "Orientalne";

export type SortOption = "price" | "rating" | "name" | "created_at";
export type SortDirection = "asc" | "desc";

export interface PerfumeFilters {
  category: PerfumeCategory;
  search: string;
  sortBy: SortOption;
  sortDirection: SortDirection;
  viewMode: "my" | "following";
}

export interface PerfumeComment {
  id: string;
  perfume_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
  user_email?: string;
}

// lib/types.ts - dodaj do istniejących typów

export interface PerfumeComment {
  id: string;
  perfume_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  // Pola pobierane dynamicznie z profiles:
  user_name?: string;
  user_avatar?: string;
  user_email?: string;
}

// lib/types.ts - dodaj do istniejących typów

export interface PerfumeComment {
  id: string;
  perfume_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  // Pola pobierane dynamicznie z profiles:
  user_name?: string;
  user_avatar?: string;
  user_email?: string;
}

// Rozszerz istniejący typ Notification - ZAMIEŃ cały typ
export interface Notification {
  id: string;
  user_id: string;
  from_user_id?: string;
  type: "follow" | "new_perfume" | "perfume_deleted" | "new_comment";
  title: string;
  message?: string;
  perfume_id?: string;
  is_read: boolean;
  created_at: string;
  // Dodatkowe pola pobierane dynamicznie:
  perfume_name?: string;
  from_user_name?: string;
  from_user_avatar?: string;
}
