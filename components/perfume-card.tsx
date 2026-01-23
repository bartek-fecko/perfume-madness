"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Perfume } from "@/lib/types";

interface PerfumeCardProps {
  perfume: Perfume;
  isOwner: boolean;
  onToggleFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function PerfumeCard({
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

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-border/50 bg-card">
      <CardContent className="p-0">
        <div className="relative aspect-[4/3] bg-secondary/30 overflow-hidden">
          <Image
            src={image_url || "/placeholder.svg"}
            alt={`${name} by ${brand}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            quality={85}
          />
          {isOwner && onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite(id);
              }}
              className={cn(
                "absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 bg-card/80 backdrop-blur-sm",
                is_favorite
                  ? "text-accent"
                  : "text-muted-foreground hover:text-accent",
              )}
              aria-label={
                is_favorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"
              }
            >
              <Star className={cn("w-4 h-4", is_favorite && "fill-current")} />
            </button>
          )}
          {!isOwner && is_favorite && (
            <div className="absolute top-2 right-2 p-1.5 rounded-full bg-card/80 backdrop-blur-sm text-accent">
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
            <h3 className="font-semibold text-foreground text-sm leading-tight truncate hover:text-primary transition-colors">
              {name}
            </h3>
          </Link>

          <div className="flex items-center gap-0.5 mt-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-3 h-3",
                  i < rating ? "text-accent fill-accent" : "text-border",
                )}
              />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">
              {rating.toFixed(1)}
            </span>
          </div>

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
              ${price}
            </span>
            {!isOwner && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Tylko do odczytu
              </Badge>
            )}
          </div>

          {isOwner && onDelete && (
            <div className="mt-2 -mb-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs"
                  >
                    <Trash2 className="w-3 h-3 mr-1.5" />
                    Usuń
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Usunąć perfumy?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ta akcja nie może zostać cofnięta. To trwale usunie &quot;
                      {name}&quot; z Twojej kolekcji.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Usuń
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
