"use client";

import { Search, Plus, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SortOption, SortDirection } from "@/lib/types";

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddPerfume: () => void;
  activeTab: "my" | "following";
  onTabChange: (tab: "my" | "following") => void;
  sortBy: SortOption;
  sortDirection: SortDirection;
  onSortChange: (sortBy: SortOption, direction: SortDirection) => void;
  hasFollowingNotification: boolean;
  isLoggedIn: boolean;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "created_at", label: "Data dodania" },
  { value: "name", label: "Nazwa" },
  { value: "price", label: "Cena" },
  { value: "rating", label: "Ocena" },
];

export function SearchHeader({
  searchQuery,
  onSearchChange,
  onAddPerfume,
  activeTab,
  onTabChange,
  sortBy,
  sortDirection,
  onSortChange,
  hasFollowingNotification,
  isLoggedIn,
}: SearchHeaderProps) {
  const currentSortLabel = sortOptions.find((o) => o.value === sortBy)?.label || "Data dodania";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Szukaj perfum po nazwie, marce lub nutach..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 bg-card border-border/50"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 gap-2 bg-transparent">
              <ArrowUpDown className="w-4 h-4" />
              {currentSortLabel}
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
          className="h-10 w-10 bg-transparent"
          onClick={() => onSortChange(sortBy, sortDirection === "asc" ? "desc" : "asc")}
        >
          {sortDirection === "asc" ? "↑" : "↓"}
        </Button>

        {isLoggedIn && activeTab === "my" && (
          <Button onClick={onAddPerfume} className="h-10 gap-2">
            <Plus className="w-4 h-4" />
            Dodaj perfumy
          </Button>
        )}
      </div>

      <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => onTabChange("my")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === "my"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Moje perfumy
        </button>
        <button
          type="button"
          onClick={() => onTabChange("following")}
          className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === "following"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Obserwowani
          {hasFollowingNotification && activeTab !== "following" && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          )}
        </button>
      </div>
    </div>
  );
}
