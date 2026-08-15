import { Suspense } from "react";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  getPerfumes,
  getAllUsers,
  getUserPerfumes,
  getUserProfile,
  getCategoryCounts,
  getBrandPositions,
} from "@/lib/actions/perfumes";
import { DashboardContent } from "@/components/dashboard-content";
import type {
  PerfumeCategory,
  SortOption,
  SortDirection,
  Perfume,
} from "@/lib/types";

interface PageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    dir?: string;
    view?: string;
    user?: string; // ID wybranego użytkownika
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const category = (params.category || "All") as PerfumeCategory;
  const search = params.search || "";
  const sortBy = (params.sort || "created_at") as SortOption;
  const sortDirection = (params.dir || "desc") as SortDirection;
  const viewMode = (params.view || "my") as "my" | "explore"; // Zmieniono z "following" na "explore"
  const selectedUserId = params.user;

  // Fetch data server-side
  let perfumes: Perfume[] = [];
  let categoryCounts: Record<string, number> = {};
  let favorites: Perfume[] = [];
  let users: any[] = [];
  let selectedUserProfile: any = null;
  let brandOrder: Record<string, number> = {};

  if (user) {
    if (viewMode === "my") {
      // TRYB: Moja kolekcja
      console.log("📦 Loading MY collection");
      [perfumes, categoryCounts, favorites, brandOrder] = await Promise.all([
        getPerfumes({ userId: user.id }),
        getCategoryCounts(user.id),
        getPerfumes({ userId: user.id, favoritesOnly: true }),
        getBrandPositions(user.id),
      ]);
    } else if (selectedUserId) {
      // TRYB: Kolekcja wybranego użytkownika
      console.log("👤 Loading user collection:", selectedUserId);
      [perfumes, selectedUserProfile, categoryCounts, favorites, brandOrder] =
        await Promise.all([
          getUserPerfumes(selectedUserId, {}),
          getUserProfile(selectedUserId),
          getCategoryCounts(selectedUserId),
          getPerfumes({ userId: selectedUserId, favoritesOnly: true }),
          getBrandPositions(selectedUserId),
        ]);
    } else {
      // TRYB: Lista użytkowników do eksploracji
      console.log("🌐 Loading users list");
      users = await getAllUsers();
      console.log("👥 Found users:", users.length);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent
          user={user}
          initialPerfumes={perfumes}
          initialFavorites={favorites}
          initialCategoryCounts={categoryCounts}
          initialCategory={category}
          initialSearch={search}
          initialSortBy={sortBy}
          initialSortDirection={sortDirection}
          initialViewMode={viewMode}
          initialUsers={users}
          selectedUserId={selectedUserId}
          selectedUserProfile={selectedUserProfile}
          initialBrandOrder={brandOrder}
        />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="h-16 shrink-0 bg-card border-b border-border sticky top-0 z-50" />
      <div className="flex w-full max-w-[1600px] mx-auto">
        <aside className="hidden md:block w-56 shrink-0 p-2 pt-3 sticky top-[4.0625rem] self-start h-[calc(100vh-4.0625rem)]">
            <div className="flex flex-col h-full bg-card border border-border/70 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-3">
              <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-7 bg-muted rounded-lg animate-pulse mb-1.5"
                />
              ))}
            </div>
          </aside>
          <main className="flex-1 min-w-0 px-3 pb-4 sm:px-4 sm:pb-5 pt-3 sm:pt-4">
            <div className="h-9 w-full bg-card border border-border/70 rounded-lg animate-pulse mb-3" />
            <div className="h-20 w-full bg-card border border-border/70 rounded-lg animate-pulse mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          </main>
      </div>
    </div>
  );
}
