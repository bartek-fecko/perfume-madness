import { Suspense } from "react";
import { getCurrentUser } from "@/lib/actions/auth";
import {
  getPerfumes,
  getFollowingPerfumes,
  getCategoryCounts,
} from "@/lib/actions/perfumes";
import { TopHeader } from "@/components/top-header";
import { DashboardContent } from "@/components/dashboard-content";
import type { PerfumeCategory, SortOption, SortDirection, Perfume } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    dir?: string;
    view?: string;
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const category = (params.category || "All") as PerfumeCategory;
  const search = params.search || "";
  const sortBy = (params.sort || "created_at") as SortOption;
  const sortDirection = (params.dir || "desc") as SortDirection;
  const viewMode = (params.view || "my") as "my" | "following";

  // Fetch data server-side - parallelize all database calls for better performance
  let perfumes: Perfume[] = [];
  let categoryCounts: Record<string, number> = {};
  let favorites: Perfume[] = [];

  if (user) {
    if (viewMode === "my") {
      // Parallelize perfumes and categoryCounts queries
      [perfumes, categoryCounts, favorites] = await Promise.all([
        getPerfumes({
          userId: user.id,
          category,
          search,
          sortBy,
          sortDirection,
        }),
        getCategoryCounts(user.id),
        getPerfumes({ userId: user.id, favoritesOnly: true }),
      ]);
    } else {
      // Parallelize perfumes and favorites queries
      [perfumes, favorites] = await Promise.all([
        getFollowingPerfumes({
          category,
          search,
          sortBy,
          sortDirection,
        }),
        getPerfumes({ userId: user.id, favoritesOnly: true }),
      ]);
    }
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <TopHeader user={user} />

      <div className="flex-1 overflow-hidden">
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
          />
        </Suspense>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex h-full">
      <aside className="w-52 shrink-0 bg-sidebar border-r border-sidebar-border p-3 pt-5 h-full overflow-y-auto">
        <div className="h-4 w-20 bg-muted rounded animate-pulse mb-4" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-10 bg-muted rounded-lg animate-pulse mb-1"
          />
        ))}
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="h-10 w-full max-w-md bg-muted rounded animate-pulse mb-4" />
        <div className="h-10 w-64 bg-muted rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  );
}
