"use client";

import { memo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Star,
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Perfume } from "@/lib/types";

interface PerfumeCardProps {
  perfume: Perfume;
  isOwner: boolean;
  onToggleFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function isValidImageUrl(url?: string | null) {
  if (!url) return false;
  if (url.startsWith("data:image/")) return true;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function formatDateAdded(iso?: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pl-PL", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 mt-1.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const isFull = rating >= starValue;
        const isHalf = rating >= starValue - 0.5 && rating < starValue;

        return (
          <div key={i} className="relative inline-block">
            {isHalf ? (
              <>
                <Star className="w-3.5 h-3.5 text-border" />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: "7px" }}
                >
                  <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                </div>
              </>
            ) : (
              <Star
                className={cn(
                  "w-3.5 h-3.5",
                  isFull ? "text-primary fill-primary" : "text-border",
                )}
              />
            )}
          </div>
        );
      })}
      <span className="text-[10px] text-muted-foreground ml-1">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export const PerfumeCard = memo(function PerfumeCard({
  perfume,
  isOwner,
  onToggleFavorite,
  onDelete,
}: PerfumeCardProps) {
  const router = useRouter();
  const {
    id,
    name,
    brand,
    price,
    rating,
    notes,
    image_url,
    is_favorite,
    created_at,
  } = perfume;

  // Flatten notes for display (top + heart + base)
  const allNotes = [
    ...(notes?.top || []),
    ...(notes?.heart || []),
    ...(notes?.base || []),
  ].map((n) => n.name);

  const imageSrc = isValidImageUrl(image_url) ? image_url! : "/placeholder.svg";
  const isDataUrl = image_url?.startsWith("data:") ?? false;
  const dateAdded = formatDateAdded(created_at);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRevealClass = cn(
    "transition-opacity duration-300",
    imageLoaded ? "opacity-100" : "opacity-0",
  );

  return (
    <Card className="group relative overflow-hidden border-border/70 bg-card rounded-lg shadow-[0_1px_3px_oklch(0_0_0/0.06)]">
      <CardContent className="p-0">
        <div className="relative aspect-square bg-secondary/40 overflow-hidden rounded-t-lg">
          {isDataUrl ? (
            <img
              src={image_url!}
              alt={`${name} by ${brand}`}
              className={`absolute inset-0 w-full h-full object-contain ${imageRevealClass}`}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
          ) : (
            <Image
              src={imageSrc}
              alt={`${name} by ${brand}`}
              fill
              className={`object-contain ${imageRevealClass}`}
              loading="eager"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
              quality={50}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
          )}

          {isOwner ? (
            <div className="absolute top-2 right-2 flex items-center gap-1">
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onToggleFavorite(id);
                  }}
                  className={cn(
                    "p-1.5 rounded-full bg-white/95 text-muted-foreground shadow-sm transition-all hover:scale-105",
                    is_favorite && "text-primary",
                  )}
                  aria-label={
                    is_favorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"
                  }
                >
                  <Star
                    className={cn("w-4 h-4", is_favorite && "fill-current")}
                  />
                </button>
              )}

              {onDelete && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="p-1.5 rounded-full bg-white/95 text-muted-foreground shadow-sm transition-all hover:scale-105 hover:text-foreground"
                      aria-label="Opcje"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/perfume/${id}`);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                      Edytuj
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(id);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Usuń
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ) : (
            is_favorite && (
              <div className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-primary backdrop-blur-sm shadow-sm">
                <Star className="w-4 h-4 fill-current" />
              </div>
            )
          )}
        </div>

        <div className="p-3">
          <p className="text-sm font-semibold text-foreground mb-0.5 truncate">
            {brand}
          </p>
          <Link
            href={`/perfume/${id}${!isOwner ? "?readonly=true" : ""}`}
            className="block w-fit"
          >
            <h3 className="font-medium text-[13px] text-foreground/80 leading-tight truncate hover:text-primary hover:underline underline-offset-2 transition-colors">
              {name}
            </h3>
          </Link>

          <StarRating rating={rating} />

          {allNotes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {allNotes.slice(0, 2).map((note, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-[10px] font-normal px-2 py-0.5"
                >
                  {note}
                </Badge>
              ))}
              {allNotes.length > 2 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-normal px-2 py-0.5"
                >
                  +{allNotes.length - 2}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/70">
            <span className="text-base font-semibold text-foreground">
              {price}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                PLN
              </span>
            </span>
            {!isOwner && (
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 text-muted-foreground"
              >
                Tylko do odczytu
              </Badge>
            )}
          </div>

          {dateAdded && (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-2.5">
              <Calendar className="w-3 h-3 shrink-0" />
              <span className="truncate">Dodano: {dateAdded}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
