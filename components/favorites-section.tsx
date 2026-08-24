"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Perfume } from "@/lib/types";

interface FavoritesSectionProps {
  favorites: Perfume[];
  readOnly?: boolean;
}

const VISIBLE_COUNT = 2;

export function FavoritesSection({
  favorites,
  readOnly = false,
}: FavoritesSectionProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (favorites.length === 0) return null;

  const sorted = [...favorites].sort(
    (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0),
  );
  const visible = sorted.slice(0, VISIBLE_COUNT);

  const renderCard = (perfume: Perfume) => (
    <Link
      href={`/perfume/${perfume.id}${readOnly ? "?readonly=true" : ""}`}
      prefetch
      key={perfume.id}
      onClick={() => setIsModalOpen(false)}
      onMouseEnter={() => router.prefetch(`/perfume/${perfume.id}`)}
      className={cn(
        "group flex items-center gap-2 rounded-lg bg-secondary/40 border border-border/70 p-1.5",
        "hover:border-primary/30 transition-all duration-200 cursor-pointer"
      )}
    >
      <div className="relative w-10 h-10 shrink-0 rounded-md overflow-hidden bg-white dark:bg-card">
        <Image
          src={perfume.image_url || "/placeholder.svg"}
          alt={perfume.name}
          fill
          className="object-contain p-0.5"
          loading="lazy"
          sizes="40px"
          quality={75}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-foreground truncate group-hover:text-primary group-hover:underline underline-offset-2 transition-colors">
          <span className="uppercase text-muted-foreground">
            {perfume.brand}
          </span>{" "}
          {perfume.name}
        </p>
        {Number(perfume.rating) > 0 && (
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />
            <span className="text-[10px] font-medium text-muted-foreground">
              {Number(perfume.rating).toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );

  return (
    <>
      <Card className="h-full border-border/70 bg-card p-0 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <CardContent className="p-3 sm:p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Star className="w-4 h-4 text-primary fill-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base">
                Ulubione perfumy
              </h3>
              <span className="text-sm text-muted-foreground">
                ({favorites.length})
              </span>
            </div>
            {favorites.length > VISIBLE_COUNT && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(true)}
              >
                {favorites.length - VISIBLE_COUNT} więcej
              </Button>
            )}
          </div>

          <div className="h-9 flex items-center mb-3">
            <p className="text-xs text-muted-foreground">
              {readOnly
                ? "Ulubione zapachy użytkownika posortowane po ocenie"
                : "Moje ulubione zapachy posortowane po ocenie"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {visible.map(renderCard)}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Ulubione perfumy ({favorites.length})</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto -mx-6 px-6 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sorted.map(renderCard)}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
