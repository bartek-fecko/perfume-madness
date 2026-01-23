import Link from "next/link";
import Image from "next/image";
import { Star, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Perfume } from "@/lib/types";

interface FavoritesSectionProps {
  favorites: Perfume[];
}

export function FavoritesSection({ favorites }: FavoritesSectionProps) {
  if (favorites.length === 0) return null;

  return (
    <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent p-0 mt-4">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-accent/10">
              <Star className="w-4 h-4 text-accent fill-accent" />
            </div>
            <h3 className="font-semibold text-foreground">Ulubione perfumy</h3>
            <span className="text-sm text-muted-foreground">
              ({favorites.length})
            </span>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {favorites.slice(0, 5).map((perfume) => (
            <Link
              href={`/perfume/${perfume.id}`}
              key={perfume.id}
              className={cn(
                "shrink-0 flex items-center gap-3 px-3 py-2 rounded-lg bg-card border border-border/50",
                "hover:border-accent/30 transition-colors cursor-pointer"
              )}
            >
              <div className="relative w-10 h-10 rounded-md overflow-hidden bg-secondary/50">
                <Image
                  src={perfume.image_url || "/placeholder.svg"}
                  alt={perfume.name}
                  fill
                  className="object-cover"
                  loading="lazy"
                  sizes="40px"
                  quality={75}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {perfume.brand}
                </p>
                <p className="font-medium text-foreground text-sm truncate max-w-[100px]">
                  {perfume.name}
                </p>
              </div>
            </Link>
          ))}
          {favorites.length > 5 && (
            <div
              className={cn(
                "shrink-0 px-4 py-3 rounded-lg bg-secondary/50 border border-border/50",
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
