"use client";

import { memo, useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
                <Star className="w-3 h-3 text-border" />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: "6px" }}
                >
                  <Star className="w-3 h-3 text-accent fill-accent" />
                </div>
              </>
            ) : (
              <Star
                className={cn(
                  "w-3 h-3",
                  isFull ? "text-accent fill-accent" : "text-border",
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
  const {
    id,
    name,
    brand,
    price,
    rating,
    description,
    notes,
    image_url,
    is_favorite,
    categories,
  } = perfume;

  const imageSrc = isValidImageUrl(image_url) ? image_url! : "/placeholder.svg";
  const isDataUrl = image_url?.startsWith("data:") ?? false;

  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card [content-visibility:auto] [contain-intrinsic-size:auto_320px]">
      <CardContent className="p-0">
        <div className="relative aspect-[4/3] bg-secondary/30 overflow-hidden">
          {isDataUrl ? (
            <img
              src={image_url!}
              alt={`${name} by ${brand}`}
              className="object-cover w-full h-full"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <Image
              src={imageSrc}
              alt={`${name} by ${brand}`}
              fill
              className="object-cover"
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              quality={60}
            />
          )}

          {isOwner && onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite(id);
              }}
              className={cn(
                "absolute top-2 right-2 p-1.5 rounded-full bg-card/95 text-muted-foreground",
                is_favorite && "text-accent",
              )}
              aria-label={
                is_favorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"
              }
            >
              <Star className={cn("w-4 h-4", is_favorite && "fill-current")} />
            </button>
          )}
          {!isOwner && is_favorite && (
            <div className="absolute top-2 right-2 p-1.5 rounded-full bg-card/95 text-accent">
              <Star className="w-4 h-4 fill-current" />
            </div>
          )}
        </div>

        <div className="p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
            {brand}
          </p>
          <Link
            href={`/perfume/${id}${!isOwner ? "?readonly=true" : ""}`}
            className="block"
          >
            <h3 className="font-semibold text-foreground text-sm leading-tight truncate">
              {name}
            </h3>
          </Link>

          <StarRating rating={rating} />

          {description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}

          {notes && notes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {notes.slice(0, 2).map((note) => (
                <Badge
                  key={note}
                  variant="secondary"
                  className="text-[10px] font-normal px-1.5 py-0"
                >
                  {note}
                </Badge>
              ))}
              {notes.length > 2 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-normal px-1.5 py-0"
                >
                  +{notes.length - 2}
                </Badge>
              )}
            </div>
          )}

          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {categories.slice(0, 2).map((cat) => (
                <Badge
                  key={cat}
                  variant="outline"
                  className="text-[10px] font-medium px-1.5 py-0 border-primary/30 text-primary"
                >
                  {cat}
                </Badge>
              ))}
              {categories.length > 2 && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-medium px-1.5 py-0 border-primary/30 text-primary"
                >
                  +{categories.length - 2}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
            <span className="text-base font-semibold text-foreground">
              {price} PLN
            </span>
            {!isOwner && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Tylko do odczytu
              </Badge>
            )}
          </div>

          {isOwner && onDelete && (
            <div className="mt-2 -mb-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs"
                onClick={() => onDelete(id)}
              >
                <Trash2 className="w-3 h-3 mr-1.5" />
                Usuń
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
