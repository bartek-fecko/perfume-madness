"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, Edit2, Save, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { updatePerfume, deletePerfume, toggleFavorite } from "@/lib/actions/perfumes";
import { cn } from "@/lib/utils";
import type { Perfume } from "@/lib/types";

const allCategories = ["Kwiatowe", "Drzewne", "Świeże", "Cytrusowe", "Korzenne", "Słodkie", "Orientalne"];

interface PerfumeDetailProps {
  perfume: Perfume;
  isReadOnly: boolean;
}

export function PerfumeDetail({ perfume, isReadOnly }: PerfumeDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(perfume.name);
  const [brand, setBrand] = useState(perfume.brand);
  const [price, setPrice] = useState(perfume.price.toString());
  const [rating, setRating] = useState(perfume.rating);
  const [description, setDescription] = useState(perfume.description || "");
  const [notes, setNotes] = useState(perfume.notes?.join(", ") || "");
  const [categories, setCategories] = useState<string[]>(perfume.categories || []);
  const [imageUrl, setImageUrl] = useState(perfume.image_url || "");
  const [isFavorite, setIsFavorite] = useState(perfume.is_favorite);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updatePerfume(perfume.id, {
        name,
        brand,
        price: Number.parseFloat(price),
        rating,
        description: description || undefined,
        notes: notes.split(",").map((n) => n.trim()).filter(Boolean),
        categories,
        image_url: imageUrl || undefined,
      });

      if (result.success) {
        setIsEditing(false);
        router.refresh();
      } else {
        setError(result.error || "Nie udało się zapisać zmian");
      }
    });
  };

  const handleCancel = () => {
    setName(perfume.name);
    setBrand(perfume.brand);
    setPrice(perfume.price.toString());
    setRating(perfume.rating);
    setDescription(perfume.description || "");
    setNotes(perfume.notes?.join(", ") || "");
    setCategories(perfume.categories || []);
    setImageUrl(perfume.image_url || "");
    setIsEditing(false);
    setError(null);
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePerfume(perfume.id);
      if (result.success) {
        router.push("/");
      } else {
        setError(result.error || "Nie udało się usunąć perfum");
      }
    });
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    startTransition(async () => {
      const result = await toggleFavorite(perfume.id);
      if (!result.success) {
        setIsFavorite(perfume.is_favorite);
      }
    });
  };

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Powrót do kolekcji</span>
          </button>

          {!isReadOnly && !isEditing && (
            <div className="flex gap-2">
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="gap-2 bg-transparent"
              >
                <Edit2 className="w-4 h-4" />
                Edytuj
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 text-destructive hover:text-destructive bg-transparent"
                  >
                    <Trash2 className="w-4 h-4" />
                    Usuń
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Usunąć perfumy?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ta akcja nie może zostać cofnięta. To trwale usunie
                      &quot;{perfume.name}&quot; z Twojej kolekcji.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Usuń
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {isEditing && (
            <div className="flex gap-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="gap-2 bg-transparent"
                disabled={isPending}
              >
                <X className="w-4 h-4" />
                Anuluj
              </Button>
              <Button onClick={handleSave} className="gap-2" disabled={isPending}>
                <Save className="w-4 h-4" />
                {isPending ? "Zapisywanie..." : "Zapisz"}
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm text-destructive bg-destructive/10 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="relative aspect-square bg-secondary/30 rounded-2xl overflow-hidden">
            {isEditing ? (
              <div className="absolute inset-0 p-4">
                <Input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="URL obrazu"
                  className="mb-4"
                />
                {imageUrl && (
                  <Image
                    src={imageUrl || "/placeholder.svg"}
                    alt={name}
                    fill
                    className="object-cover rounded-lg"
                    loading="lazy"
                    quality={85}
                  />
                )}
              </div>
            ) : (
              <Image
                src={perfume.image_url || "/placeholder.svg"}
                alt={`${perfume.name} by ${perfume.brand}`}
                fill
                className="object-cover"
                priority
                quality={90}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )}

            {!isReadOnly && !isEditing && (
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={cn(
                  "absolute top-4 right-4 p-3 rounded-full bg-card/80 backdrop-blur-sm transition-colors",
                  isFavorite ? "text-accent" : "text-muted-foreground hover:text-accent"
                )}
              >
                <Star className={cn("w-6 h-6", isFavorite && "fill-current")} />
              </button>
            )}

            {isReadOnly && (
              <Badge className="absolute top-4 left-4" variant="secondary">
                Tylko do odczytu
              </Badge>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              {isEditing ? (
                <>
                  <Input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Marka"
                    className="text-sm font-medium uppercase tracking-wider mb-2"
                  />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nazwa"
                    className="text-3xl font-semibold"
                  />
                </>
              ) : (
                <>
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    {perfume.brand}
                  </p>
                  <h1 className="text-3xl font-semibold text-foreground mt-1">
                    {perfume.name}
                  </h1>
                </>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-0.5"
                    >
                      <Star
                        className={cn(
                          "w-6 h-6",
                          star <= rating
                            ? "text-accent fill-accent"
                            : "text-border hover:text-accent/50"
                        )}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-5 h-5",
                        i < perfume.rating ? "text-accent fill-accent" : "text-border"
                      )}
                    />
                  ))}
                </>
              )}
              <span className="text-muted-foreground ml-1">
                {isEditing ? rating.toFixed(1) : perfume.rating.toFixed(1)}
              </span>
            </div>

            {/* Price */}
            {isEditing ? (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="text-3xl font-bold w-32"
                />
              </div>
            ) : (
              <p className="text-3xl font-bold text-foreground">${perfume.price}</p>
            )}

            {/* Categories */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Kategorie</h3>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((cat) => (
                    <label
                      key={cat}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors",
                        categories.includes(cat)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Checkbox
                        checked={categories.includes(cat)}
                        onCheckedChange={() => toggleCategory(cat)}
                        className="hidden"
                      />
                      <span className="text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {perfume.categories?.map((cat) => (
                    <Badge key={cat} variant="secondary">
                      {cat}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Nuty zapachowe</h3>
              {isEditing ? (
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Bergamotka, Wanilia, Sandałowiec (oddzielone przecinkami)"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {perfume.notes?.map((note) => (
                    <Badge key={note} variant="outline">
                      {note}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Opis</h3>
              {isEditing ? (
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opisz zapach..."
                  rows={5}
                />
              ) : (
                <p className="text-muted-foreground leading-relaxed">
                  {perfume.description || "Brak opisu."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
