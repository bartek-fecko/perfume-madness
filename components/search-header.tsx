"use client";

import {
  Search,
  Plus,
  ArrowUpDown,
  SlidersHorizontal,
} from "lucide-react";
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
          className="h-9 gap-2 md:hidden flex-1 sm:flex-none"
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
            className="h-9 gap-2 flex-1 sm:flex-none min-w-0 md:hidden"
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
        className="h-9 w-9 shrink-0 md:hidden"
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
          className="h-9 gap-2 flex-1 sm:flex-none"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span className="sm:hidden">Dodaj</span>
          <span className="hidden sm:inline">Dodaj perfumy</span>
        </Button>
      )}
    </div>
  );
}
