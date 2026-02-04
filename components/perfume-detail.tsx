"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Star,
  Edit2,
  Save,
  X,
  Trash2,
  MessageSquare,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import {
  updatePerfume,
  deletePerfume,
  toggleFavorite,
} from "@/lib/actions/perfumes";
import { addComment, deleteComment } from "@/lib/actions/comments";
import { cn } from "@/lib/utils";
import type { Perfume, PerfumeComment } from "@/lib/types";

const allCategories = [
  "Kwiatowe",
  "Drzewne",
  "Świeże",
  "Cytrusowe",
  "Korzenne",
  "Słodkie",
  "Orientalne",
  "Aromatyczne",
  "Skórzane",
  "Zielone",
  "Fougère",
  "Ambrowe",
  "Piżmowe",
  "Wodne",
];

interface PerfumeDetailProps {
  perfume: Perfume;
  isReadOnly: boolean;
  initialComments: PerfumeComment[];
  currentUserId: string | null;
  userCommentCount: number;
}

// Funkcja do normalizacji URL/BASE64
function normalizeImageUrl(url?: string) {
  if (!url) return null;
  if (url.startsWith("data:image/")) return url;

  // prosty check dla "gołego" Base64 bez prefixu
  if (/^[A-Za-z0-9+/=]+$/.test(url)) return `data:image/png;base64,${url}`;

  // próba URL
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

export function PerfumeDetail({
  perfume,
  isReadOnly,
  initialComments,
  currentUserId,
  userCommentCount: initialUserCommentCount,
}: PerfumeDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Perfume edit states
  const [name, setName] = useState(perfume.name);
  const [brand, setBrand] = useState(perfume.brand);
  const [price, setPrice] = useState(perfume.price.toString());
  const [rating, setRating] = useState(perfume.rating);
  const [hoverRating, setHoverRating] = useState(0);
  const [description, setDescription] = useState(perfume.description || "");
  const [notes, setNotes] = useState(perfume.notes?.join(", ") || "");
  const [categories, setCategories] = useState<string[]>(
    perfume.categories || [],
  );
  const [imageUrl, setImageUrl] = useState(perfume.image_url || "");
  const [isFavorite, setIsFavorite] = useState(perfume.is_favorite);

  // Comments states
  const [newComment, setNewComment] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [localCommentCount, setLocalCommentCount] = useState(
    initialUserCommentCount,
  );

  const remainingComments = Math.max(0, 5 - localCommentCount);
  const canComment = currentUserId && remainingComments > 0;

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updatePerfume(perfume.id, {
        name,
        brand,
        price: Number.parseFloat(price),
        rating,
        description: description || undefined,
        notes: notes
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean),
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
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const handleStarClick = (value: number) => setRating(value);

  const isValidPreviewUrl =
    imageUrl?.startsWith("http://") ||
    imageUrl?.startsWith("https://") ||
    imageUrl?.startsWith("data:image/");

  const renderStarButton = (starValue: number) => {
    const displayRating = hoverRating > 0 ? hoverRating : rating;
    const isFull = displayRating >= starValue;
    const isHalf = displayRating === starValue - 0.5;

    return (
      <div key={starValue} className="relative inline-block">
        <Star className="w-6 h-6 text-gray-300" />
        <div className="absolute inset-0 flex">
          <button
            type="button"
            onClick={() => handleStarClick(starValue - 0.5)}
            onMouseEnter={() => setHoverRating(starValue - 0.5)}
            className="w-1/2 h-full relative overflow-hidden group z-10"
          >
            <Star
              className={cn(
                "w-6 h-6 absolute left-0 top-0 transition-all",
                isHalf || isFull
                  ? "text-amber-400 fill-amber-400"
                  : "text-transparent group-hover:text-amber-200 group-hover:fill-amber-200",
              )}
            />
          </button>

          <button
            type="button"
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            className="w-1/2 h-full relative overflow-hidden group z-10"
          >
            <Star
              className={cn(
                "w-6 h-6 absolute right-0 top-0 transition-all",
                isFull
                  ? "text-amber-400 fill-amber-400"
                  : "text-transparent group-hover:text-amber-200 group-hover:fill-amber-200",
              )}
            />
          </button>
        </div>
      </div>
    );
  };

  const renderDisplayStars = (ratingValue: number) => {
    return Array.from({ length: 5 }).map((_, i) => {
      const starValue = i + 1;
      const isFull = ratingValue >= starValue;
      const isHalf = ratingValue >= starValue - 0.5 && ratingValue < starValue;

      return (
        <div key={i} className="relative inline-block">
          {isHalf ? (
            <>
              <Star className="w-5 h-5 text-border" />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: "10px" }}
              >
                <Star className="w-5 h-5 text-accent fill-accent" />
              </div>
            </>
          ) : (
            <Star
              className={cn(
                "w-5 h-5",
                isFull ? "text-accent fill-accent" : "text-border",
              )}
            />
          )}
        </div>
      );
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim() || newComment.length > 500) {
      setCommentError("Komentarz musi mieć od 1 do 500 znaków");
      return;
    }

    setCommentError(null);
    startTransition(async () => {
      const result = await addComment(perfume.id, newComment);
      if (result.success) {
        setNewComment("");
        setLocalCommentCount((prev) => prev + 1);
        router.refresh();
      } else {
        setCommentError(result.error || "Nie udało się dodać komentarza");
      }
    });
  };

  const handleDeleteComment = (commentId: string) => {
    startTransition(async () => {
      const result = await deleteComment(commentId);
      if (result.success) {
        setLocalCommentCount((prev) => prev - 1);
        router.refresh();
      } else {
        setCommentError(result.error || "Nie udało się usunąć komentarza");
      }
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "teraz";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m temu`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h temu`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d temu`;
    return date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
    });
  };

  const previewImage = normalizeImageUrl(imageUrl);

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
                      Ta akcja nie może zostać cofnięta. To trwale usunie &quot;
                      {perfume.name}&quot; z Twojej kolekcji.
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
              <Button
                onClick={handleSave}
                className="gap-2"
                disabled={isPending}
              >
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
          {/* IMAGE SECTION */}
          <div className="relative aspect-square bg-secondary/30 rounded-2xl overflow-hidden">
            {isEditing ? (
              <div className="absolute inset-0 p-4 flex flex-col">
                <div className="mb-4">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    URL lub Base64 obrazu
                  </label>
                  <Input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/perfume.jpg lub Base64"
                  />
                </div>
                {imageUrl && isValidPreviewUrl ? (
                  <div className="flex-1 relative rounded-lg overflow-hidden">
                    <Image
                      key={imageUrl} // <-- dodaj to
                      src={imageUrl}
                      alt={name || "Podgląd"}
                      fill
                      className="object-cover"
                      loading="lazy"
                      quality={85}
                      unoptimized
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                    {imageUrl
                      ? "Wpisz pełny URL lub Base64 zaczynający się od http://, https:// lub data:image/"
                      : "Wklej URL obrazu powyżej"}
                  </div>
                )}
              </div>
            ) : (
              <Image
                src={normalizeImageUrl(perfume.image_url) || "/placeholder.svg"}
                alt={`${perfume.name} by ${perfume.brand}`}
                fill
                className="object-cover"
                priority
                unoptimized
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
                  isFavorite
                    ? "text-accent"
                    : "text-muted-foreground hover:text-accent",
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

          {/* DETAILS SECTION */}
          <div className="space-y-6">
            {/* Brand + Name */}
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
                <div
                  className="flex gap-1"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((star) => renderStarButton(star))}
                  <span className="ml-2 text-muted-foreground">
                    {rating > 0 ? rating.toFixed(1) : ""}
                  </span>
                </div>
              ) : (
                <>
                  {renderDisplayStars(perfume.rating)}
                  <span className="text-muted-foreground ml-1">
                    {perfume.rating.toFixed(1)}
                  </span>
                </>
              )}
            </div>

            {/* Price */}
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="text-3xl font-bold w-40"
                />
                <span className="text-3xl font-bold">PLN</span>
              </div>
            ) : (
              <p className="text-3xl font-bold text-foreground">
                {perfume.price} PLN
              </p>
            )}

            {/* Categories */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                Kategorie
              </h3>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((cat) => (
                    <label
                      key={cat}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors",
                        categories.includes(cat)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50",
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
              <h3 className="text-sm font-medium text-foreground mb-2">
                Nuty zapachowe
              </h3>
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

        <div className="mt-12 border-t border-border pt-8">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">
              Komentarze ({initialComments.length})
            </h2>
          </div>

          {/* Add Comment Form */}
          {currentUserId && (
            <div className="mb-8 p-4 bg-muted/30 rounded-xl border border-border">
              <Textarea
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  setCommentError(null);
                }}
                placeholder="Dodaj komentarz..."
                rows={3}
                maxLength={500}
                disabled={isPending || !canComment}
                className="mb-3 resize-none"
              />
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-muted-foreground">
                    {newComment.length}/500 znaków
                  </span>
                  <span className="text-muted-foreground ml-4">
                    • Pozostało{" "}
                    <span
                      className={
                        remainingComments === 0
                          ? "text-destructive font-medium"
                          : "text-primary font-medium"
                      }
                    >
                      {remainingComments}/5
                    </span>{" "}
                    komentarzy
                  </span>
                </div>
                <Button
                  onClick={handleAddComment}
                  disabled={isPending || !newComment.trim() || !canComment}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isPending ? "Wysyłanie..." : "Wyślij"}
                </Button>
              </div>
              {commentError && (
                <p className="text-sm text-destructive mt-2">{commentError}</p>
              )}
              {remainingComments === 0 && (
                <p className="text-sm text-destructive mt-2">
                  Osiągnięto limit 5 komentarzy dla tych perfum
                </p>
              )}
            </div>
          )}

          {!currentUserId && (
            <div className="mb-8 p-4 bg-muted/30 rounded-xl border border-border text-center">
              <p className="text-sm text-muted-foreground">
                Zaloguj się, aby dodać komentarz
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {initialComments.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Brak komentarzy. Bądź pierwszy!
                </p>
              </div>
            ) : (
              initialComments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 bg-card border border-border rounded-xl hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 border border-border flex-shrink-0">
                      <AvatarImage
                        src={comment.user_avatar || "/placeholder.svg"}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {comment.user_name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground">
                            {comment.user_name}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            • {formatTimeAgo(comment.created_at)}
                          </span>
                        </div>

                        {currentUserId === comment.user_id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Usunąć komentarz?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Ta akcja nie może zostać cofnięta.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteComment(comment.id)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Usuń
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>

                      <p className="text-sm text-foreground leading-relaxed break-words">
                        {comment.comment}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
