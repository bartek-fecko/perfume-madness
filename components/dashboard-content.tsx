"use client";

import {
  useState,
  useCallback,
  useTransition,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { CategorySidebar, CategoryNav } from "@/components/category-sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SiteHeader } from "@/components/site-header";
import { FavoritesSection } from "@/components/favorites-section";
import { CollectionStats } from "@/components/collection-stats";
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

function perfumeCountLabel(count: number) {
  return `${count} ${count === 1 ? "perfumy" : count < 5 ? "perfumy" : "perfum"}`;
}

interface ViewTabsProps {
  activeTab: "my" | "explore";
  onChange: (tab: "my" | "explore") => void;
  rightLabel: string;
}

function ViewTabs({ activeTab, onChange, rightLabel }: ViewTabsProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex gap-1 p-1 bg-card border border-border/70 rounded-lg shadow-[0_1px_3px_oklch(0_0_0/0.04)]">
        <button
          type="button"
          onClick={() => onChange("my")}
          className={`px-3 sm:px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === "my"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Moje perfumy
        </button>
        <button
          type="button"
          onClick={() => onChange("explore")}
          className={`relative px-3 sm:px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            activeTab === "explore"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Użytkownicy
        </button>
      </div>
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {rightLabel}
      </span>
    </div>
  );
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

  // Filtrowanie i sortowanie w całości po stronie klienta — natychmiastowe
  const filteredPerfumes = useMemo(() => {
    let list = [...initialPerfumes];

    if (category && category !== "All") {
      list = list.filter(
        (p) => Array.isArray(p.categories) && p.categories.includes(category),
      );
    }

    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(term) ||
          (p.brand || "").toLowerCase().includes(term),
      );
    }

    const sorted = [...list];
    switch (sortBy) {
      case "name":
        sorted.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "", "pl"),
        );
        break;
      case "price":
        sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case "rating":
        sorted.sort(
          (a, b) => (Number(a.rating) || 0) - (Number(b.rating) || 0),
        );
        break;
      default:
        sorted.sort(
          (a, b) => (Number(a.position) || 0) - (Number(b.position) || 0),
        );
    }

    if (sortDirection === "desc") sorted.reverse();

    return sorted;
  }, [initialPerfumes, category, search, sortBy, sortDirection]);

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

  const tabRightLabel = selectedUserId
    ? perfumeCountLabel(filteredPerfumes.length)
    : viewMode === "my"
      ? perfumeCountLabel(filteredPerfumes.length)
      : `${initialUsers.length} ${
          initialUsers.length === 1 ? "użytkownik" : "użytkowników"
        }`;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader user={null} searchQuery="" onSearchChange={() => {}} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md px-4 sm:px-6">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden mx-auto mb-6 ring-1 ring-border shadow-[0_8px_30px_-10px_oklch(0.42_0.09_160/0.35)]">
            <Image
              src="/logo.jpg"
              alt="PerfumeMadness logo"
              fill
              className="object-contain"
            />
          </div>

          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3 tracking-tight">
            Witaj w PerfumeMadness
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg mb-7 leading-relaxed">
            Zaloguj się przez Google, aby rozpocząć śledzenie swojej kolekcji
            perfum, odkrywać nowe zapachy i łączyć się z innymi miłośnikami
            perfum.
            </p>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader
        user={user}
        searchQuery={search}
        onSearchChange={handleSearchChange}
        filterToolbar={filterToolbarProps}
      />

      <div className="flex w-full max-w-[1600px] mx-auto">
        <CategorySidebar
          selectedCategory={category}
          onSelectCategory={handleCategoryChange}
          categoryCounts={initialCategoryCounts}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
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

      <main className="flex-1 min-w-0 px-3 pb-4 sm:px-4 sm:pb-5 pt-3 sm:pt-4">
        <ViewTabs
          activeTab={viewMode}
          onChange={handleViewModeChange}
          rightLabel={tabRightLabel}
        />

        {viewMode === "my" ? (
          // MY COLLECTION VIEW
          <div className="perfume-content">
            <CollectionStats userId={user.id} />

            {initialFavorites.length > 0 && (
              <div className="mb-3">
                <FavoritesSection favorites={initialFavorites} />
              </div>
            )}

            <div className="mb-3">
              <h2 className="text-lg font-semibold text-foreground">
                Moja kolekcja
              </h2>
            </div>

            <PerfumeGrid
              perfumes={filteredPerfumes}
              isOwner={true}
              initialBrandOrder={initialBrandOrder}
            />
          </div>
        ) : selectedUserId ? (
          // USER'S COLLECTION VIEW
          <div className="perfume-content">
            {/* Back Button */}
            <button
              onClick={handleBackToExplore}
              className="mb-4 sm:mb-5 mt-1 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 shrink-0" />
              <span className="truncate">Wróć do listy użytkowników</span>
            </button>

            {/* User Header */}
            {selectedUserProfile && (
              <div className="mb-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-card border border-border/70 rounded-lg shadow-[0_1px_3px_oklch(0_0_0/0.04)]">
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
                    {perfumeCountLabel(initialPerfumes.length)} w kolekcji
                  </p>
                </div>
                </div>
                <FollowButton
                  userId={selectedUserId}
                  initialIsFollowing={selectedUserProfile.is_following}
                />
              </div>
            )}

            <CollectionStats userId={selectedUserId} />

            {initialFavorites.length > 0 && (
              <div className="mb-3">
                <FavoritesSection favorites={initialFavorites} readOnly />
              </div>
            )}

            {/* Collection Header */}
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-foreground">
                Kolekcja użytkownika
              </h3>
            </div>

            <PerfumeGrid
              perfumes={filteredPerfumes}
              isOwner={false}
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
    </div>
  );
}
