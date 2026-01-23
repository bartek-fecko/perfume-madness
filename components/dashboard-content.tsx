"use client";

import { useState, useCallback, useTransition, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CategorySidebar } from "@/components/category-sidebar";
import { SearchHeader } from "@/components/search-header";
import { FavoritesSection } from "@/components/favorites-section";
import { PerfumeGrid } from "@/components/perfume-grid";
import { AddPerfumeModal } from "@/components/add-perfume-modal";
import type { Perfume, PerfumeCategory, SortOption, SortDirection, User } from "@/lib/types";

interface DashboardContentProps {
  user: User | null;
  initialPerfumes: Perfume[];
  initialFavorites: Perfume[];
  initialCategoryCounts: Record<string, number>;
  initialCategory: PerfumeCategory;
  initialSearch: string;
  initialSortBy: SortOption;
  initialSortDirection: SortDirection;
  initialViewMode: "my" | "following";
}

export function DashboardContent({
  user,
  initialPerfumes,
  initialFavorites,
  initialCategoryCounts,
  initialCategory,
  initialSearch,
  initialSortBy,
  initialSortDirection,
  initialViewMode,
}: DashboardContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [category, setCategory] = useState<PerfumeCategory>(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<SortOption>(initialSortBy);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  const [viewMode, setViewMode] = useState<"my" | "following">(initialViewMode);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update URL and trigger server re-fetch
  const updateFilters = useCallback(
    (updates: {
      category?: PerfumeCategory;
      search?: string;
      sortBy?: SortOption;
      sortDirection?: SortDirection;
      viewMode?: "my" | "following";
    }) => {
      const newCategory = updates.category ?? category;
      const newSearch = updates.search ?? search;
      const newSortBy = updates.sortBy ?? sortBy;
      const newSortDirection = updates.sortDirection ?? sortDirection;
      const newViewMode = updates.viewMode ?? viewMode;

      // Update local state immediately for responsiveness
      if (updates.category !== undefined) setCategory(updates.category);
      if (updates.search !== undefined) setSearch(updates.search);
      if (updates.sortBy !== undefined) setSortBy(updates.sortBy);
      if (updates.sortDirection !== undefined) setSortDirection(updates.sortDirection);
      if (updates.viewMode !== undefined) setViewMode(updates.viewMode);

      // Build URL params
      const params = new URLSearchParams();
      if (newCategory !== "All") params.set("category", newCategory);
      if (newSearch) params.set("search", newSearch);
      if (newSortBy !== "created_at") params.set("sort", newSortBy);
      if (newSortDirection !== "desc") params.set("dir", newSortDirection);
      if (newViewMode !== "my") params.set("view", newViewMode);

      // Navigate to update URL and refetch data
      startTransition(() => {
        router.push(`/?${params.toString()}`);
      });
    },
    [category, search, sortBy, sortDirection, viewMode, router]
  );

  const handleCategoryChange = (newCategory: PerfumeCategory) => {
    updateFilters({ category: newCategory });
  };

  const handleSearchChange = useCallback((newSearch: string) => {
    // Update local state immediately for responsive UI
    setSearch(newSearch);
    
    // Debounce the URL update to avoid too many requests
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      updateFilters({ search: newSearch });
    }, 500); // Wait 500ms after user stops typing
  }, [updateFilters]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSortChange = (newSortBy: SortOption, newDirection: SortDirection) => {
    updateFilters({ sortBy: newSortBy, sortDirection: newDirection });
  };

  const handleViewModeChange = (newViewMode: "my" | "following") => {
    updateFilters({ viewMode: newViewMode });
  };

  const isOwner = viewMode === "my";

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-primary font-bold">S</span>
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Witaj w Scentory
          </h2>
          <p className="text-muted-foreground mb-6">
            Zaloguj się przez Google, aby rozpocząć śledzenie swojej kolekcji perfum, odkrywać nowe zapachy i łączyć się z innymi miłośnikami perfum.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <CategorySidebar
        selectedCategory={category}
        onSelectCategory={handleCategoryChange}
        categoryCounts={initialCategoryCounts}
      />

      <main className={`flex-1 p-6 overflow-y-auto ${isPending ? "opacity-70" : ""}`}>
        <SearchHeader
          searchQuery={search}
          onSearchChange={handleSearchChange}
          onAddPerfume={() => setIsAddModalOpen(true)}
          activeTab={viewMode}
          onTabChange={handleViewModeChange}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          hasFollowingNotification={false}
          isLoggedIn={!!user}
        />

        {/* Favorites Section - only show on "my" tab when user has favorites */}
        {viewMode === "my" && initialFavorites.length > 0 && (
          <div className="mb-6">
            <FavoritesSection favorites={initialFavorites} />
          </div>
        )}

        {/* Collection Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {viewMode === "my" ? "Moja kolekcja" : "Od obserwowanych"}
          </h2>
          <span className="text-sm text-muted-foreground">
            {initialPerfumes.length} {initialPerfumes.length === 1 ? "perfumy" : initialPerfumes.length < 5 ? "perfumy" : "perfum"}
          </span>
        </div>

        {/* Perfume Grid */}
        <PerfumeGrid perfumes={initialPerfumes} isOwner={isOwner} />

        {/* Add Perfume Modal */}
        <AddPerfumeModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      </main>
    </div>
  );
}
