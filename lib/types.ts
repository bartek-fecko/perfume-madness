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

export interface Notification {
  id: string;
  user_id: string;
  type: "new_perfume" | "follow" | "favorite";
  message: string;
  related_perfume_id: string | null;
  from_user_id: string | null;
  is_read: boolean;
  created_at: string;
  from_user_name?: string;
  from_user_avatar?: string;
  perfume_name?: string;
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
