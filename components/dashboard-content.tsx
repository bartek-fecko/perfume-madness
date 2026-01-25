"use client";

import { useState, useCallback, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CategorySidebar } from "@/components/category-sidebar";
import { SearchHeader } from "@/components/search-header";
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
  selectedUserProfile,
}: DashboardContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md px-6">
          {/* Logo na górze */}
          <div className="relative w-54 h-54 rounded-full overflow-hidden mx-auto mb-6 bg-primary/10">
            <Image
              src="/logo.jpg"
              alt="PerfumeMadness logo"
              fill
              className="object-contain"
            />
          </div>

          {/* Tekst powitalny */}
          <h2 className="text-3xl font-semibold text-foreground mb-4">
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
    <div className="flex h-full">
      <CategorySidebar
        selectedCategory={category}
        onSelectCategory={handleCategoryChange}
        categoryCounts={initialCategoryCounts}
      />

      <main
        className={`flex-1 p-6 overflow-y-auto transition-opacity ${isPending ? "opacity-70" : ""}`}
      >
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

        {viewMode === "my" ? (
          // MY COLLECTION VIEW
          <>
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

            <PerfumeGrid perfumes={initialPerfumes} isOwner={true} />
          </>
        ) : selectedUserId ? (
          // USER'S COLLECTION VIEW
          <>
            {/* Back Button */}
            <button
              onClick={handleBackToExplore}
              className="mb-6 mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Wróć do listy użytkowników
            </button>

            {/* User Header */}
            {selectedUserProfile && (
              <div className="mb-6 flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
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
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground">
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
                <FollowButton
                  userId={selectedUserId}
                  initialIsFollowing={selectedUserProfile.is_following}
                />
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

            <PerfumeGrid perfumes={initialPerfumes} isOwner={false} />
          </>
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
