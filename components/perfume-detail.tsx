"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Star,
  Edit2,
  Save,
  X,
  Trash2,
  Flower2,
} from "lucide-react";
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
import {
  updatePerfume,
  deletePerfume,
  toggleFavorite,
} from "@/lib/actions/perfumes";
import { SiteHeader } from "@/components/site-header";
import { WearSeasonsField } from "@/components/wear-seasons-field";
import { DragDropNotesEditor } from "@/components/drag-drop-notes-editor";
import { wearLabel, wearIcon, wearColorClass } from "@/lib/wear-options";
import { cn } from "@/lib/utils";
import { resolveNoteImage } from "@/lib/notes-dictionary";
import { categoryColor } from "@/lib/category-colors";
import type { Perfume, PerfumeComment, User, PerfumeNotes, FragranceNote } from "@/lib/types";

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
  user: User | null;
  children?: React.ReactNode;
}

// Funkcja do normalizacji URL/BASE64
function normalizeImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("data:image/")) return url;

  // prosty check dla "gołego" Base64 bez prefixu
  if (/^[A-Za-z0-9+/=]+$/.test(url)) return `data:image/png;base64,${url}`;

  // próba URL
  try {
    new URL(url);
    return url;
  } catch {
    return undefined;
  }
}

// Fragrantica-style notes pyramid: notes in each category arranged side by
// side (flex-wrap), with a "pyramid" size gradient (heart = biggest).
function NotesPyramid({
  top,
  heart,
  base,
}: {
  top: FragranceNote[];
  heart: FragranceNote[];
  base: FragranceNote[];
}) {
  const sections = [
    {
      label: "Nuty głowy",
      color: "#facc15",
      notes: top,
      imgClass: "w-10 h-10 sm:w-12 sm:h-12",
    },
    {
      label: "Nuty serca",
      color: "#f472b6",
      notes: heart,
      imgClass: "w-16 h-16 sm:w-20 sm:h-20",
    },
    {
      label: "Nuty bazy",
      color: "#a78bfa",
      notes: base,
      imgClass: "w-11 h-11 sm:w-14 sm:h-14",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
      {sections.map((section) => (
        <div
          key={section.label}
          className="rounded-2xl border border-border bg-card/50 p-4 sm:p-5 flex flex-col"
          style={{ borderTopWidth: 3, borderTopColor: section.color }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: section.color }}
            />
            <h4 className="text-sm sm:text-base font-semibold text-foreground capitalize">
              {section.label}
            </h4>
            <span className="text-xs text-muted-foreground">
              ({section.notes.length})
            </span>
          </div>
          {section.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak nut</p>
          ) : (
            <div className="flex flex-wrap justify-center items-end gap-3">
              {section.notes.map((note, index) => {
                const imageUrl =
                  normalizeImageUrl(note.image_url) || resolveNoteImage(note.name);
                return (
                  <div
                    key={`${section.label}-${index}`}
                    className="group relative flex flex-col items-center text-center gap-1.5"
                    title={note.name}
                  >
                    <div
                      className={`relative flex-shrink-0 overflow-hidden rounded-md ring-1 ring-border/60 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:ring-primary/40 ${section.imgClass}`}
                    >
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={note.name}
                          fill
                          className="object-cover"
                          unoptimized
                          sizes="96px"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-muted flex items-center justify-center">
                          <Flower2 className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] sm:text-sm font-medium text-foreground leading-tight whitespace-normal sm:whitespace-nowrap">
                      {note.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Notes editor component for edit mode
interface NotesEditorProps {
  notesTop: FragranceNote[];
  setNotesTop: React.Dispatch<React.SetStateAction<FragranceNote[]>>;
  notesHeart: FragranceNote[];
  setNotesHeart: React.Dispatch<React.SetStateAction<FragranceNote[]>>;
  notesBase: FragranceNote[];
  setNotesBase: React.Dispatch<React.SetStateAction<FragranceNote[]>>;
}

function NotesEditor({
  notesTop,
  setNotesTop,
  notesHeart,
  setNotesHeart,
  notesBase,
  setNotesBase,
}: NotesEditorProps) {
  const [newNoteName, setNewNoteName] = useState("");
  const [newNoteImage, setNewNoteImage] = useState("");
  const [activeSection, setActiveSection] = useState<"top" | "heart" | "base">("top");

  const addNote = (section: "top" | "heart" | "base") => {
    if (!newNoteName.trim()) return;
    const newNote: FragranceNote = {
      name: newNoteName.trim(),
      image_url: newNoteImage.trim() || undefined,
    };
    if (section === "top") setNotesTop((prev) => [...prev, newNote]);
    else if (section === "heart") setNotesHeart((prev) => [...prev, newNote]);
    else setNotesBase((prev) => [...prev, newNote]);
    setNewNoteName("");
    setNewNoteImage("");
  };

  return (
    <div className="space-y-4">
      {/* Add note form */}
      <div className="p-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value as "top" | "heart" | "base")}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
          >
            <option value="top">Nuty głowy (Top)</option>
            <option value="heart">Nuty serca (Heart)</option>
            <option value="base">Nuty bazy (Base)</option>
          </select>
          <Input
            value={newNoteName}
            onChange={(e) => setNewNoteName(e.target.value)}
            placeholder="Nazwa nuty (np. Bergamotka, Wanilia)"
            className="flex-1"
          />
          <Input
            value={newNoteImage}
            onChange={(e) => setNewNoteImage(e.target.value)}
            placeholder="URL obrazu lub Base64 (opcjonalnie)"
            className="flex-1"
          />
          <Button
            onClick={() => addNote(activeSection)}
            disabled={!newNoteName.trim()}
            className="w-full sm:w-auto"
            size="sm"
          >
            Dodaj nutę
          </Button>
        </div>
      </div>

      {/* Current notes */}
      <DragDropNotesEditor
        notes={{ top: notesTop, heart: notesHeart, base: notesBase }}
        onChange={(next) => {
          setNotesTop(next.top);
          setNotesHeart(next.heart);
          setNotesBase(next.base);
        }}
      />
    </div>
  );
}

export function PerfumeDetail({
  perfume,
  isReadOnly,
  initialComments: _initialComments,
  currentUserId: _currentUserId,
  userCommentCount: _initialUserCommentCount,
  user,
  children,
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
  const [notesTop, setNotesTop] = useState<FragranceNote[]>(perfume.notes?.top || []);
  const [notesHeart, setNotesHeart] = useState<FragranceNote[]>(perfume.notes?.heart || []);
  const [notesBase, setNotesBase] = useState<FragranceNote[]>(perfume.notes?.base || []);
  const [categories, setCategories] = useState<string[]>(
    perfume.categories || [],
  );
  const [wearSeasons, setWearSeasons] = useState<string[]>(
    perfume.wear_seasons || [],
  );
  const [imageUrl, setImageUrl] = useState(perfume.image_url || "");
  const [isFavorite, setIsFavorite] = useState(perfume.is_favorite);

  // Scroll to comments if hash is #comments (comments are streamed via Suspense)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#comments") {
      setTimeout(() => {
        document
          .getElementById("comments")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 400);
    }
  }, []);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updatePerfume(perfume.id, {
        name,
        brand,
        price: Number.parseFloat(price),
        rating,
        description: description || undefined,
        notes: {
          top: notesTop,
          heart: notesHeart,
          base: notesBase,
        },
        categories,
        wear_seasons: wearSeasons,
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
    setNotesTop(perfume.notes?.top || []);
    setNotesHeart(perfume.notes?.heart || []);
    setNotesBase(perfume.notes?.base || []);
    setCategories(perfume.categories || []);
    setWearSeasons(perfume.wear_seasons || []);
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
              <Star className="w-5 h-5 text-muted-foreground/40" />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: "10px" }}
              >
                <Star className="w-5 h-5 text-primary fill-primary" />
              </div>
            </>
          ) : (
            <Star
              className={cn(
                "w-5 h-5",
                isFull ? "text-primary fill-primary" : "text-muted-foreground/40",
              )}
            />
          )}
        </div>
      );
    });
  };

  const previewImage = normalizeImageUrl(imageUrl) ?? undefined;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader
        user={user}
        searchQuery=""
        onSearchChange={() => {}}
        hideSearch
      />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <button
            type="button"
            onClick={() => {
              // jeśli historia ma wpis (przyszedł z siatki), wróć; inaczej idź na główną bez bounce przez dashboard
              if (typeof window !== "undefined" && window.history.length > 2) {
                router.back();
                // fallback: jeśli back nie zadziała w 300ms (np. brak historii), push na /
                setTimeout(() => {
                  if (window.location.pathname.startsWith("/perfume/")) {
                    router.push("/");
                  }
                }, 300);
              } else {
                router.push("/");
              }
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors self-start"
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            <span className="text-sm sm:text-base">Powrót do kolekcji</span>
          </button>

          {!isReadOnly && !isEditing && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="gap-2 bg-transparent flex-1 sm:flex-none"
              >
                <Edit2 className="w-4 h-4" />
                Edytuj
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 text-destructive hover:text-destructive bg-transparent flex-1 sm:flex-none"
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
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="gap-2 bg-transparent flex-1 sm:flex-none"
                disabled={isPending}
              >
                <X className="w-4 h-4" />
                Anuluj
              </Button>
              <Button
                onClick={handleSave}
                className="gap-2 flex-1 sm:flex-none"
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

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:gap-10">
          {/* IMAGE SECTION */}
          <div className="relative aspect-[3/4] bg-secondary/30 rounded-xl overflow-hidden">
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
                      className="object-contain"
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
                className="object-contain"
                priority
                unoptimized
                quality={90}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 420px"
              />
            )}

            {!isReadOnly && !isEditing && (
              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-label={
                  isFavorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"
                }
                className={cn(
                  "absolute top-4 right-4 p-3 rounded-full bg-card/90 backdrop-blur-sm shadow-md border border-border/70 transition-colors hover:scale-105",
                  isFavorite
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary",
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
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-1 tracking-tight">
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
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
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
                  {perfume.categories?.map((cat) => {
                    const cc = categoryColor(cat);
                    return (
                      <Badge
                        key={cat}
                        className="border-transparent"
                        style={{
                          backgroundColor: cc.color,
                          color: cc.text,
                        }}
                      >
                        {cat}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes removed from details column — now full-width section below */}

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

            {/* Kiedy nosić */}
            {isEditing ? (
              <WearSeasonsField
                value={wearSeasons}
                onChange={setWearSeasons}
              />
            ) : (
              wearSeasons.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">
                    Kiedy nosić
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {wearSeasons.map((ws) => {
                      const Icon = wearIcon(ws);
                      return (
                        <Badge
                          key={ws}
                          variant="outline"
                          className={wearColorClass(ws)}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {wearLabel(ws)}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Notes — full-width section */}
        <div className="mt-8 sm:mt-10">
          <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
            <Flower2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              Nuty zapachowe
            </h2>
          </div>
          {isEditing ? (
            <NotesEditor
              notesTop={notesTop}
              setNotesTop={setNotesTop}
              notesHeart={notesHeart}
              setNotesHeart={setNotesHeart}
              notesBase={notesBase}
              setNotesBase={setNotesBase}
            />
          ) : (
            <NotesPyramid
              top={perfume.notes?.top || []}
              heart={perfume.notes?.heart || []}
              base={perfume.notes?.base || []}
            />
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
