"use client";

import React from "react"

import { cn } from "@/lib/utils";
import {
  Flower2,
  TreePine,
  Wind,
  Sun,
  Flame,
  Candy,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import type { PerfumeCategory } from "@/lib/types";

const categories: { id: PerfumeCategory; name: string; icon: React.ElementType }[] = [
  { id: "All", name: "Wszystkie", icon: LayoutGrid },
  { id: "Kwiatowe", name: "Kwiatowe", icon: Flower2 },
  { id: "Drzewne", name: "Drzewne", icon: TreePine },
  { id: "Świeże", name: "Świeże", icon: Wind },
  { id: "Cytrusowe", name: "Cytrusowe", icon: Sun },
  { id: "Korzenne", name: "Korzenne", icon: Flame },
  { id: "Słodkie", name: "Słodkie", icon: Candy },
  { id: "Orientalne", name: "Orientalne", icon: Sparkles },
];

interface CategorySidebarProps {
  selectedCategory: PerfumeCategory;
  onSelectCategory: (category: PerfumeCategory) => void;
  categoryCounts: Record<string, number>;
}

export function CategorySidebar({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}: CategorySidebarProps) {
  return (
    <aside className="w-52 shrink-0 bg-sidebar border-r border-sidebar-border h-full overflow-y-auto">
      <nav className="p-3 pt-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground px-2 mb-3">
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
                  onClick={() => onSelectCategory(category.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                    isSelected
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      isSelected
                        ? "text-sidebar-primary"
                        : "text-muted-foreground"
                    )}
                  />
                  <span className="font-medium flex-1 text-left">
                    {category.name}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded-md min-w-[24px] text-center",
                      isSelected
                        ? "bg-sidebar-primary/10 text-sidebar-primary"
                        : "bg-muted text-muted-foreground"
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
    </aside>
  );
}
