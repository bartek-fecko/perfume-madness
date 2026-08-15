"use client";

import { useState, useCallback, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CategorySidebar, CategoryNav } from "@/components/category-sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SearchHeader, FilterToolbar } from "@/components/search-header";
import { FavoritesSection } from "@/components/favorites-section";
import { PerfumeGrid } from "@/components/perfume-grid";
import { AddPerfumeModal } from "@/components/add-perfume-modal";
import { UsersExplorer } from "@/components/users-explorer";
import { FollowButton } from "@/components/follow-button";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import type {
  Perfume,
  PerfumeCategory,
  SortOption,
  SortDirection,
  User,
} from "@/lib/types";

interface DashboardContentProps {
  user: User | null;
  initialPerfumes: Perfume[];
  initialFavorites: Perfume[];
  initialCategoryCounts: Record<string, number>;
  initialCategory: PerfumeCategory;
  initialSearch: string;
  initialSortBy: SortOption;
  initialSortDirection: SortDirection;
  initialViewMode: "my" | "explore";
  initialUsers?: any[];
  selectedUserId?: string;
  initialBrandOrder?: Record<string, number>;
  selectedUserProfile?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    is_following: boolean;
  } | null;
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
  initialUsers = [],
  selectedUserId,
  initialBrandOrder = {},
  selectedUserProfile,
}: DashboardContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [category, setCategory] = useState<PerfumeCategory>(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<SortOption>(initialSortBy);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(initialSortDirection);
  const [viewMode, setViewMode] = useState<"my" | "explore">(initialViewMode);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronizuj state z props gdy się zmienią (np. po nawigacji z notyfikacji)
  useEffect(() => {
    setViewMode(initialViewMode);
    setCategory(initialCategory);
    setSearch(initialSearch);
    setSortBy(initialSortBy);
    setSortDirection(initialSortDirection);
  }, [
    initialViewMode,
    initialCategory,
    initialSearch,
    initialSortBy,
    initialSortDirection,
    selectedUserId,
  ]);

  // Update URL and trigger server re-fetch
  const updateFilters = useCallback(
    (updates: {
      category?: PerfumeCategory;
      search?: string;
      sortBy?: SortOption;
      sortDirection?: SortDirection;
      viewMode?: "my" | "explore";
      userId?: string | null;
    }) => {
      const newCategory = updates.category ?? category;
      const newSearch = updates.search ?? search;
      const newSortBy = updates.sortBy ?? sortBy;
      const newSortDirection = updates.sortDirection ?? sortDirection;
      const newViewMode = updates.viewMode ?? viewMode;

      // Zachowaj userId jeśli nie jest explicity ustawiony na null
      const newUserId =
        updates.userId !== undefined ? updates.userId : selectedUserId;

      // Update local state immediately for responsiveness
      if (updates.category !== undefined) setCategory(updates.category);
      if (updates.search !== undefined) setSearch(updates.search);
      if (updates.sortBy !== undefined) setSortBy(updates.sortBy);
      if (updates.sortDirection !== undefined)
        setSortDirection(updates.sortDirection);
      if (updates.viewMode !== undefined) setViewMode(updates.viewMode);

      // Build URL params
      const params = new URLSearchParams();
      if (newCategory !== "All") params.set("category", newCategory);
      if (newSearch) params.set("search", newSearch);
      if (newSortBy !== "created_at") params.set("sort", newSortBy);
      if (newSortDirection !== "desc") params.set("dir", newSortDirection);
      if (newViewMode !== "my") params.set("view", newViewMode);
      if (newUserId) params.set("user", newUserId);

      // Navigate to update URL and refetch data
      startTransition(() => {
        router.push(`/?${params.toString()}`);
      });
    },
    [category, search, sortBy, sortDirection, viewMode, selectedUserId, router],
  );

  const handleCategoryChange = (newCategory: PerfumeCategory) => {
    // Zachowaj selectedUserId jeśli przeglądamy czyjeś perfumy
    updateFilters({
      category: newCategory,
      userId: selectedUserId || undefined,
    });
  };

  const handleSearchChange = useCallback(
    (newSearch: string) => {
      setSearch(newSearch);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        updateFilters({ search: newSearch });
      }, 500);
    },
    [updateFilters],
  );

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSortChange = (
    newSortBy: SortOption,
    newDirection: SortDirection,
  ) => {
    updateFilters({ sortBy: newSortBy, sortDirection: newDirection });
  };

  const handleViewModeChange = (newViewMode: "my" | "explore") => {
    // Reset filters when changing view mode
    updateFilters({
      viewMode: newViewMode,
      userId: null,
      category: "All",
      search: "",
    });
  };

  const handleUserSelect = (userId: string) => {
    updateFilters({
      viewMode: "explore",
      userId,
      category: "All",
      search: "",
    });
  };

  const handleBackToExplore = () => {
    updateFilters({
      viewMode: "explore",
      userId: null,
      category: "All",
      search: "",
    });
  };

  const isOwner = viewMode === "my";
  const showFilters = viewMode === "my" || !!selectedUserId;

  const filterToolbarProps = {
    sortBy,
    sortDirection,
    onSortChange: handleSortChange,
    onAddPerfume: () => setIsAddModalOpen(true),
    activeTab: viewMode,
    isLoggedIn: !!user,
    onOpenCategories: showFilters
      ? () => setIsCategorySheetOpen(true)
      : undefined,
    selectedCategory: showFilters ? category : undefined,
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md px-4 sm:px-6">
          {/* Logo na górze */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden mx-auto mb-6 bg-primary/10">
            <Image
              src="/logo.jpg"
              alt="PerfumeMadness logo"
              fill
              className="object-contain"
            />
          </div>

          {/* Tekst powitalny */}
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">
            Witaj w PerfumeMadness
          </h2>
          <p className="text-muted-foreground mb-6">
            Zaloguj się przez Google, aby rozpocząć śledzenie swojej kolekcji
            perfum, odkrywać nowe zapachy i łączyć się z innymi miłośnikami
            perfum.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0">
      <CategorySidebar
        selectedCategory={category}
        onSelectCategory={handleCategoryChange}
        categoryCounts={initialCategoryCounts}
      />

      <Sheet open={isCategorySheetOpen} onOpenChange={setIsCategorySheetOpen}>
        <SheetContent side="left" className="w-[min(100vw-2rem,20rem)] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Kategorie perfum</SheetTitle>
          </SheetHeader>
          <CategoryNav
            selectedCategory={category}
            onSelectCategory={handleCategoryChange}
            categoryCounts={initialCategoryCounts}
            onItemSelect={() => setIsCategorySheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <main
        className={`flex-1 min-h-0 px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 md:pb-6 overflow-y-auto overscroll-y-contain touch-pan-y ${isPending ? "[&_.perfume-content]:opacity-70" : ""}`}
      >
        <SearchHeader
          searchQuery={search}
          onSearchChange={handleSearchChange}
          onTabChange={handleViewModeChange}
          hasFollowingNotification={false}
          {...filterToolbarProps}
        />

        <div className="md:hidden sticky top-0 z-30 -mx-3 px-3 py-1.5 sm:-mx-4 sm:px-4 mb-3 bg-background border-b border-border/50 isolate">
          <FilterToolbar {...filterToolbarProps} />
        </div>

        {viewMode === "my" ? (
          // MY COLLECTION VIEW
          <div className="perfume-content">
            {initialFavorites.length > 0 && (
              <div className="mb-6">
                <FavoritesSection favorites={initialFavorites} />
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Moja kolekcja
              </h2>
              <span className="text-sm text-muted-foreground">
                {initialPerfumes.length}{" "}
                {initialPerfumes.length === 1
                  ? "perfumy"
                  : initialPerfumes.length < 5
                    ? "perfumy"
                    : "perfum"}
              </span>
            </div>

            <PerfumeGrid
              perfumes={initialPerfumes}
              isOwner={true}
              sortBy={sortBy}
              initialBrandOrder={initialBrandOrder}
            />
          </div>
        ) : selectedUserId ? (
          // USER'S COLLECTION VIEW
          <div className="perfume-content">
            {/* Back Button */}
            <button
              onClick={handleBackToExplore}
              className="mb-4 sm:mb-6 mt-2 sm:mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 shrink-0" />
              <span className="truncate">Wróć do listy użytkowników</span>
            </button>

            {/* User Header */}
            {selectedUserProfile && (
              <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-card border border-border rounded-xl">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {selectedUserProfile.avatar_url ? (
                    <Image
                      src={selectedUserProfile.avatar_url}
                      alt={
                        selectedUserProfile.full_name ||
                        selectedUserProfile.email
                      }
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-xl">
                      {(selectedUserProfile.full_name ||
                        selectedUserProfile.email)[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">
                    {selectedUserProfile.full_name ||
                      selectedUserProfile.email.split("@")[0]}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {initialPerfumes.length}{" "}
                    {initialPerfumes.length === 1
                      ? "perfumy"
                      : initialPerfumes.length < 5
                        ? "perfumy"
                        : "perfum"}{" "}
                    w kolekcji
                  </p>
                </div>
                </div>
                <FollowButton
                  userId={selectedUserId}
                  initialIsFollowing={selectedUserProfile.is_following}
                />
              </div>
            )}

            {initialFavorites.length > 0 && (
              <div className="mb-6">
                <FavoritesSection favorites={initialFavorites} readOnly />
              </div>
            )}

            {/* Collection Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Kolekcja użytkownika
              </h3>
              <span className="text-sm text-muted-foreground">
                {initialPerfumes.length}{" "}
                {initialPerfumes.length === 1
                  ? "perfumy"
                  : initialPerfumes.length < 5
                    ? "perfumy"
                    : "perfum"}
              </span>
            </div>

            <PerfumeGrid
              perfumes={initialPerfumes}
              isOwner={false}
              sortBy={sortBy}
              initialBrandOrder={initialBrandOrder}
            />
          </div>
        ) : (
          // USERS EXPLORER VIEW
          <UsersExplorer users={initialUsers} onUserSelect={handleUserSelect} />
        )}

        {/* Add Perfume Modal */}
        <AddPerfumeModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      </main>
    </div>
  );
}
