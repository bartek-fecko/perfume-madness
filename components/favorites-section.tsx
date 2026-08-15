import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Perfume } from "@/lib/types";

interface FavoritesSectionProps {
  favorites: Perfume[];
  readOnly?: boolean;
}

export function FavoritesSection({ favorites, readOnly = false }: FavoritesSectionProps) {
  if (favorites.length === 0) return null;

  return (
    <Card className="border-border/70 bg-card p-0 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
      <CardContent className="p-3 sm:p-4">
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
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {favorites.slice(0, 5).map((perfume) => (
            <Link
              href={`/perfume/${perfume.id}${readOnly ? "?readonly=true" : ""}`}
              key={perfume.id}
              className={cn(
                "shrink-0 flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/40 border border-border/70",
                "hover:border-primary/30 transition-all duration-200 cursor-pointer hover:bg-secondary/60"
              )}
            >
              <div className="relative w-10 h-10 rounded-md overflow-hidden bg-white">
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
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide truncate max-w-[110px]">
                  {perfume.brand}
                </p>
                <p className="font-medium text-foreground text-sm truncate max-w-[110px]">
                  {perfume.name}
                </p>
              </div>
            </Link>
          ))}
          {favorites.length > 5 && (
            <div
              className={cn(
                "shrink-0 px-4 py-3 rounded-lg bg-muted/60 border border-border/70",
                "flex items-center justify-center min-w-[100px]"
              )}
            >
              <span className="text-sm font-medium text-muted-foreground">
                +{favorites.length - 5} więcej
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
