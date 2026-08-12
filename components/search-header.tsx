"use client";

import { Search, Plus, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SortOption, SortDirection, PerfumeCategory } from "@/lib/types";

export interface FilterToolbarProps {
  sortBy: SortOption;
  sortDirection: SortDirection;
  onSortChange: (sortBy: SortOption, direction: SortDirection) => void;
  onAddPerfume: () => void;
  activeTab: "my" | "explore";
  isLoggedIn: boolean;
  onOpenCategories?: () => void;
  selectedCategory?: PerfumeCategory;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "created_at", label: "Data dodania" },
  { value: "name", label: "Nazwa" },
  { value: "price", label: "Cena" },
  { value: "rating", label: "Ocena" },
];

export function FilterToolbar({
  sortBy,
  sortDirection,
  onSortChange,
  onAddPerfume,
  activeTab,
  isLoggedIn,
  onOpenCategories,
  selectedCategory,
}: FilterToolbarProps) {
  const currentSortLabel =
    sortOptions.find((o) => o.value === sortBy)?.label || "Data dodania";

  return (
    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
      {onOpenCategories && (
        <Button
          variant="outline"
          className="h-10 gap-2 bg-card md:bg-transparent md:hidden flex-1 sm:flex-none"
          onClick={onOpenCategories}
        >
          <SlidersHorizontal className="w-4 h-4 shrink-0" />
          <span className="truncate">
            {selectedCategory && selectedCategory !== "All"
              ? selectedCategory
              : "Kategorie"}
          </span>
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-10 gap-2 bg-card md:bg-transparent flex-1 sm:flex-none min-w-0"
          >
            <ArrowUpDown className="w-4 h-4 shrink-0" />
            <span className="truncate">{currentSortLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onSortChange(option.value, sortDirection)}
              className={sortBy === option.value ? "bg-accent" : ""}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0 bg-card md:bg-transparent"
        onClick={() =>
          onSortChange(sortBy, sortDirection === "asc" ? "desc" : "asc")
        }
        aria-label={
          sortDirection === "asc" ? "Sortuj malejąco" : "Sortuj rosnąco"
        }
      >
        {sortDirection === "asc" ? "↑" : "↓"}
      </Button>

      {isLoggedIn && activeTab === "my" && (
        <Button
          onClick={onAddPerfume}
          className="h-10 gap-2 flex-1 sm:flex-none"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="sm:hidden">Dodaj</span>
          <span className="hidden sm:inline">Dodaj perfumy</span>
        </Button>
      )}
    </div>
  );
}

interface SearchHeaderProps extends FilterToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onTabChange: (tab: "my" | "explore") => void;
  hasFollowingNotification: boolean;
}

export function SearchHeader({
  searchQuery,
  onSearchChange,
  onTabChange,
  hasFollowingNotification,
  activeTab,
  ...filterProps
}: SearchHeaderProps) {
  return (
    <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 md:pt-6 mb-3 md:mb-0">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Szukaj po marce lub nazwie..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 bg-card border-border/50"
          />
        </div>

        <div className="hidden md:block md:shrink-0">
          <FilterToolbar activeTab={activeTab} {...filterProps} />
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg w-full sm:w-fit">
        <button
          type="button"
          onClick={() => onTabChange("my")}
          className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === "my"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Moje perfumy
        </button>
        <button
          type="button"
          onClick={() => onTabChange("explore")}
          className={`relative flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === "explore"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Użytkownicy
          {hasFollowingNotification && activeTab !== "explore" && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          )}
        </button>
      </div>
    </div>
  );
}
