"use client";

import React from "react";

import { cn } from "@/lib/utils";
import {
  Flower2,
  TreePine,
  Wind,
  Citrus,
  Flame,
  Candy,
  Sparkles,
  LayoutGrid,
  Leaf,
  Trees,
  Droplets,
  Sun,
  Cloud,
  Waves,
  Gem,
  MessageCircle,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  PerfumeCategory,
  SortOption,
  SortDirection,
} from "@/lib/types";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "created_at", label: "Data dodania" },
  { value: "name", label: "Nazwa" },
  { value: "price", label: "Cena" },
  { value: "rating", label: "Ocena" },
];

const categories: {
  id: PerfumeCategory;
  name: string;
  icon: React.ElementType;
}[] = [
  { id: "All", name: "Wszystkie", icon: LayoutGrid },
  { id: "Kwiatowe", name: "Kwiatowe", icon: Flower2 },
  { id: "Drzewne", name: "Drzewne", icon: TreePine },
  { id: "Świeże", name: "Świeże", icon: Wind },
  { id: "Cytrusowe", name: "Cytrusowe", icon: Citrus },
  { id: "Korzenne", name: "Korzenne", icon: Flame },
  { id: "Słodkie", name: "Słodkie", icon: Candy },
  { id: "Orientalne", name: "Orientalne", icon: Sparkles },
  { id: "Aromatyczne", name: "Aromatyczne", icon: Leaf },
  { id: "Skórzane", name: "Skórzane", icon: Gem },
  { id: "Zielone", name: "Zielone", icon: Trees },
  { id: "Fougère", name: "Fougère", icon: Droplets },
  { id: "Ambrowe", name: "Ambrowe", icon: Sun },
  { id: "Piżmowe", name: "Piżmowe", icon: Cloud },
  { id: "Wodne", name: "Wodne", icon: Waves },
];

interface CategoryNavProps {
  selectedCategory: PerfumeCategory;
  onSelectCategory: (category: PerfumeCategory) => void;
  categoryCounts: Record<string, number>;
  onItemSelect?: () => void;
}

export function CategoryNav({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  onItemSelect,
}: CategoryNavProps) {
  const handleSelect = (categoryId: PerfumeCategory) => {
    onSelectCategory(categoryId);
    onItemSelect?.();
  };

  return (
    <nav className="p-2.5 pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
        Kategorie
      </p>
      <ul className="space-y-0.5">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          const count = categoryCounts[category.id] || 0;

          return (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => handleSelect(category.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors",
                  isSelected
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isSelected
                      ? "text-sidebar-primary"
                      : "text-muted-foreground",
                  )}
                />
                <span className="font-medium flex-1 text-left">
                  {category.name}
                </span>
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded min-w-[24px] text-center",
                    isSelected
                      ? "bg-sidebar-primary/15 text-sidebar-primary font-semibold"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function CommunityFeedTeaser() {
  return (
    <div className="rounded-lg bg-secondary/50 border border-border/60 p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 rounded-md bg-primary/10">
          <MessageCircle className="w-3.5 h-3.5 text-primary" />
        </div>
        <p className="text-xs font-semibold text-foreground">
          Feed społeczności
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">
        Recenzje i nowe premiery innych kolekcjonerów. Już wkrótce.
      </p>
    </div>
  );
}

interface CategorySidebarProps {
  selectedCategory: PerfumeCategory;
  onSelectCategory: (category: PerfumeCategory) => void;
  categoryCounts: Record<string, number>;
  sortBy: SortOption;
  sortDirection: SortDirection;
  onSortChange: (sortBy: SortOption, direction: SortDirection) => void;
}

function SortBlock({
  sortBy,
  sortDirection,
  onSortChange,
}: {
  sortBy: SortOption;
  sortDirection: SortDirection;
  onSortChange: (sortBy: SortOption, direction: SortDirection) => void;
}) {
  const currentSortLabel =
    sortOptions.find((o) => o.value === sortBy)?.label || "Data dodania";

  return (
    <div className="border-t border-border/60 p-2.5">
      <div className="flex items-center gap-1.5 mb-2">
        <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">
          Sortowanie
        </span>
      </div>
      <div className="flex gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 flex-1 justify-start gap-1.5 px-2 text-xs min-w-0"
            >
              <span className="truncate">{currentSortLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
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
          className="h-8 w-8 shrink-0"
          onClick={() =>
            onSortChange(sortBy, sortDirection === "asc" ? "desc" : "asc")
          }
          aria-label={
            sortDirection === "asc" ? "Sortuj malejąco" : "Sortuj rosnąco"
          }
        >
          {sortDirection === "asc" ? "↑" : "↓"}
        </Button>
      </div>
    </div>
  );
}

export function CategorySidebar({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  sortBy,
  sortDirection,
  onSortChange,
}: CategorySidebarProps) {
  return (
    <aside className="hidden md:block w-56 shrink-0 p-2 sticky top-[4.0625rem] self-start h-[calc(100vh-4.0625rem)] overflow-y-auto">
      <div className="flex flex-col h-full bg-card border border-border/70 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-2.5 pb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            Kategorie
          </span>
        </div>

        <SortBlock
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={onSortChange}
        />

        <div className="flex-1 min-h-0 overflow-y-auto border-t border-border/60">
          <CategoryNav
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
            categoryCounts={categoryCounts}
          />
        </div>

        <div className="p-2.5 border-t border-border/60">
          <CommunityFeedTeaser />
        </div>
      </div>
    </aside>
  );
}
