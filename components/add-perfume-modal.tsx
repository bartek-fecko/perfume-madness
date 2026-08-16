"use client";

import React from "react";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Star, StarHalf, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createPerfume, getUserBrands } from "@/lib/actions/perfumes";
import { BrandCombobox } from "@/components/brand-combobox";
import { WearSeasonsField } from "@/components/wear-seasons-field";
import { DragDropNotesEditor } from "@/components/drag-drop-notes-editor";
import { resolveNoteImage } from "@/lib/notes-dictionary";
import { cn } from "@/lib/utils";
import type { PerfumeNotes, FragranceNote } from "@/lib/types";

const categories = [
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

function AddPerfumeNotesEditor({
  notes,
  setNotes,
}: {
  notes: PerfumeNotes;
  setNotes: React.Dispatch<React.SetStateAction<PerfumeNotes>>;
}) {
  const [newNoteName, setNewNoteName] = useState("");
  const [newNoteImage, setNewNoteImage] = useState("");
  const [activeSection, setActiveSection] = useState<"top" | "heart" | "base">("top");
  const notePreview = newNoteImage.trim() || resolveNoteImage(newNoteName);

  const addNote = (section: "top" | "heart" | "base") => {
    if (!newNoteName.trim()) return;
    const newNote: FragranceNote = {
      name: newNoteName.trim(),
      image_url: newNoteImage.trim() || undefined,
    };
    setNotes((prev) => ({
      ...prev,
      [section]: [...prev[section], newNote],
    }));
    setNewNoteName("");
    setNewNoteImage("");
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">Nuty zapachowe</Label>
      
      {/* Add note form */}
      <div className="p-3 bg-muted/30 rounded-lg border border-border">
        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <select
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value as "top" | "heart" | "base")}
            className="px-2 py-1.5 bg-background border border-border rounded text-xs"
          >
            <option value="top">Nuty głowy (Top)</option>
            <option value="heart">Nuty serca (Heart)</option>
            <option value="base">Nuty bazy (Base)</option>
          </select>
          <Input
            value={newNoteName}
            onChange={(e) => setNewNoteName(e.target.value)}
            placeholder="Nazwa nuty (np. Bergamotka)"
            className="flex-1"
          />
          <Input
            value={newNoteImage}
            onChange={(e) => setNewNoteImage(e.target.value)}
            placeholder="URL obrazu (opcjonalnie)"
            className="flex-1"
          />
          {notePreview && (
            <div className="relative w-10 h-10 flex-shrink-0 self-center">
              <img
                src={notePreview}
                alt={newNoteName}
                className="w-full h-full object-cover rounded border border-border"
              />
            </div>
          )}
          <Button
            onClick={() => addNote(activeSection)}
            disabled={!newNoteName.trim()}
            className="w-full sm:w-auto"
            size="sm"
          >
            Dodaj
          </Button>
        </div>
      </div>

      {/* Current notes */}
      <DragDropNotesEditor notes={notes} onChange={setNotes} />
    </div>
  );
}

interface PerfumeSearchResult {
  id: string;
  name: string;
  brand: string;
  year: number | null;
  rating: number | null;
  image: string | null;
  notes: string[];
  notesWithDetails?: {
    name: string;
    enName: string;
    intensity: number;
    imageUrl?: string;
    category?: string;
  }[];
  categories: string[];
  description: string;
}

interface AddPerfumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddPerfumeModal({ isOpen, onClose }: AddPerfumeModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState<PerfumeNotes>({ top: [], heart: [], base: [] });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [wearSeasons, setWearSeasons] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<PerfumeSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestCounter = useRef(0);
  const suppressSearch = useRef(false);
  const lastSearchAt = useRef(0);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const SEARCH_DEBOUNCE_MS = 700;
  const SEARCH_MIN_INTERVAL_MS = 2500;

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    getUserBrands().then((brands) => {
      if (!cancelled) setBrandOptions(brands);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => nameInputRef.current?.focus(), 50);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    const trimmed = name.trim();

    if (suppressSearch.current) {
      suppressSearch.current = false;
      setSearchLoading(false);
      return;
    }

    if (trimmed.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    setSearchError(null);
    setSearchLoading(true);

    const requestId = ++requestCounter.current;

    // Debounce + minimalny odstęp między zapytaniami (limity API)
    const waitUntil =
      Math.max(
        SEARCH_DEBOUNCE_MS,
        lastSearchAt.current + SEARCH_MIN_INTERVAL_MS - Date.now(),
      );

    searchTimeout.current = setTimeout(async () => {
      lastSearchAt.current = Date.now();
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/perfume-search?q=${encodeURIComponent(trimmed)}`,
        );
        if (requestId !== requestCounter.current) return;
        if (res.status === 429) {
          setSearchError(
            "Osiągnięto limit wyszukiwania. Odczekaj chwilę i spróbuj ponownie.",
          );
          return;
        }
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (requestId !== requestCounter.current) return;
        setSearchResults(data.results || []);
        setShowSearchResults(true);
      } catch {
        if (requestId !== requestCounter.current) return;
        setSearchError("Nie udało się wyszukać perfum");
      } finally {
        if (requestId === requestCounter.current) setSearchLoading(false);
      }
    }, waitUntil);
  }, [name]);

const handleSelectResult = (result: PerfumeSearchResult) => {
    suppressSearch.current = true;
    setShowSearchResults(false);
    setSearchError(null);
    setName(result.name);
    setBrand(result.brand);

    const applyNotes = (notesData: PerfumeSearchResult) => {
      if (notesData.notesWithDetails && notesData.notesWithDetails.length > 0) {
        // API returns notes in order: TOP -> HEART -> BASE
        // Use category to determine section (heuristic classification from API)
        const top: { name: string; image_url?: string }[] = [];
        const heart: { name: string; image_url?: string }[] = [];
        const base: { name: string; image_url?: string }[] = [];

        for (const n of notesData.notesWithDetails) {
          const cat = n.category || "";
          const noteObj = { name: n.name, image_url: n.imageUrl };
          
          // Same heuristic as API: Cytrusowe/Zielone/Aromatyczne/Świeże -> TOP
          // Kwiatowe/Korzenne/Orientalne -> HEART  
          // Drzewne/Piżmowe/Słodkie/Ambrowe/Skórzane/Mchowe -> BASE
          if (["Cytrusowe", "Zielone", "Aromatyczne", "Świeże", "Owocowe"].includes(cat)) {
            top.push(noteObj);
          } else if (["Kwiatowe", "Korzenne", "Orientalne"].includes(cat)) {
            heart.push(noteObj);
          } else {
            base.push(noteObj);
          }
        }

        // Fallback: if any section empty, distribute proportionally
        if (top.length === 0 && heart.length === 0 && base.length === 0) {
          const sortedNotes = [...notesData.notesWithDetails].sort((a, b) => b.intensity - a.intensity);
          const topCount = Math.max(1, Math.ceil(sortedNotes.length * 0.3));
          const heartCount = Math.max(1, Math.ceil(sortedNotes.length * 0.4));
          top.push(...sortedNotes.slice(0, topCount).map(n => ({ name: n.name, image_url: n.imageUrl })));
          heart.push(...sortedNotes.slice(topCount, topCount + heartCount).map(n => ({ name: n.name, image_url: n.imageUrl })));
          base.push(...sortedNotes.slice(topCount + heartCount).map(n => ({ name: n.name, image_url: n.imageUrl })));
        }

        setNotes({ top, heart, base });
      } else if (notesData.notes.length > 0) {
        setNotes({
          top: notesData.notes.map((n) => ({ name: n, image_url: undefined })),
          heart: [],
          base: [],
        });
      }
      if (notesData.image) setImageUrl(notesData.image);
      if (notesData.description) setDescription(notesData.description);
      if (notesData.categories.length > 0)
        setSelectedCategories(notesData.categories);
    };

    applyNotes(result);
    setErrors({});
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Nazwa jest wymagana";
    if (!brand.trim()) newErrors.brand = "Marka jest wymagana";
    if (!price || Number.parseFloat(price) <= 0)
      newErrors.price = "Wymagana prawidłowa cena";
    if (rating === 0) newErrors.rating = "Ocena jest wymagana";
    if (selectedCategories.length === 0)
      newErrors.categories = "Wymagana przynajmniej jedna kategoria";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setName("");
    setBrand("");
    setPrice("");
    setRating(0);
    setHoverRating(0);
    setDescription("");
    setNotes({ top: [], heart: [], base: [] });
    setSelectedCategories([]);
    setWearSeasons([]);
    setImageUrl("");
    setErrors({});
    setSearchResults([]);
    setShowSearchResults(false);
    setSearchLoading(false);
    setSearchError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      const result = await createPerfume({
        name: name.trim(),
        brand: brand.trim(),
        price: Number.parseFloat(price),
        rating,
        description: description.trim() || undefined,
        notes: notes,
        categories: selectedCategories,
        wear_seasons: wearSeasons,
        image_url: imageUrl.trim() || undefined,
      });

      if (result.success) {
        resetForm();
        onClose();
        // Refresh the page to show the new perfume
        router.refresh();
      } else {
        setErrors({ submit: result.error || "Nie udało się dodać perfum" });
      }
    });
  };

  const handleStarClick = (value: number) => {
    setRating(value);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.rating;
      return next;
    });
  };

  const renderStarButton = (starValue: number) => {
    const displayRating = hoverRating > 0 ? hoverRating : rating;
    const isFull = displayRating >= starValue;
    const isHalf = displayRating === starValue - 0.5;

    return (
      <div key={starValue} className="relative inline-block">
        {/* Background star (empty/gray) */}
        <Star className="w-6 h-6 text-gray-300" />

        {/* Foreground star overlay */}
        <div className="absolute inset-0 flex">
          {/* Left half button */}
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

          {/* Right half button */}
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dodaj nowe perfumy</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.submit && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL obrazu</Label>
            <Input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/perfume.jpg"
            />
            {imageUrl && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa perfum *</Label>
              <div
                className="relative"
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setShowSearchResults(false);
                  }
                }}
              >
                <Input
                  id="name"
                  ref={nameInputRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setShowSearchResults(false);
                  }}
                  placeholder="np. Aventus, Sauvage..."
                  className={cn(
                    "pr-9",
                    errors.name ? "border-destructive" : "",
                  )}
                />
                {searchLoading ? (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                ) : (
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                )}

                {showSearchResults && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden">
                    <div className="overflow-hidden overscroll-contain">
                      {searchResults.length === 0 && !searchLoading ? (
                        <p className="p-4 text-base text-muted-foreground">
                          Brak wyników
                        </p>
                      ) : (
                        searchResults.map((result) => (
                          <button
                            key={result.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectResult(result)}
                            className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-accent transition-colors"
                          >
                            <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden bg-muted">
                              {result.image ? (
                                <img
                                  src={result.image}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className="text-base font-medium truncate"
                                title={`${result.name}${result.year ? ` (${result.year})` : ""}`}
                              >
                                {result.name}
                              </p>
                              <p
                                className="text-sm text-muted-foreground truncate"
                                title={result.brand}
                              >
                                {result.brand}
                                {result.year ? ` · ${result.year}` : ""}
                              </p>
                              {result.notes.length > 0 ? (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {result.notes.slice(0, 4).join(", ")}
                                </p>
                              ) : null}
                            </div>
                            {result.rating ? (
                              <span className="text-sm font-semibold text-amber-500 shrink-0">
                                ★ {result.rating.toFixed(1)}
                              </span>
                            ) : null}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
              {searchError && (
                <p className="text-xs text-destructive">{searchError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Wpisz przynajmniej 3 znaki, aby wyszukać perfumy w bazie
                Fragplace i automatycznie uzupełnić dane.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marka *</Label>
              <BrandCombobox
                value={brand}
                onChange={(newBrand) => {
                  setBrand(newBrand);
                  setErrors((prev) => {
                    const { brand: _brand, ...rest } = prev;
                    return rest;
                  });
                }}
                brands={brandOptions}
                hasError={!!errors.brand}
              />
              {errors.brand && (
                <p className="text-xs text-destructive">{errors.brand}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Cena (PLN) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="450"
                className={errors.price ? "border-destructive" : ""}
              />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Ocena *</Label>
              <div className="flex items-center gap-1 pt-2">
                <div
                  className="flex gap-1"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((star) => renderStarButton(star))}
                </div>
                <span className="ml-3 text-sm font-medium text-foreground">
                  {rating > 0 ? rating.toFixed(1) : ""}
                </span>
              </div>
              {errors.rating && (
                <p className="text-xs text-destructive">{errors.rating}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Kategorie * (wybierz przynajmniej jedną)</Label>
            <div
              className={cn(
                "grid grid-cols-2 gap-2 p-3 border rounded-lg",
                errors.categories ? "border-destructive" : "border-border",
              )}
            >
              {categories.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedCategories.includes(cat)}
                    onCheckedChange={() => toggleCategory(cat)}
                  />
                  <span className="text-sm">{cat}</span>
                </label>
              ))}
            </div>
            {errors.categories && (
              <p className="text-xs text-destructive">{errors.categories}</p>
            )}
          </div>

          <AddPerfumeNotesEditor notes={notes} setNotes={setNotes} />

          <WearSeasonsField value={wearSeasons} onChange={setWearSeasons} />

          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Krótki opis perfum..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-transparent"
            >
              Anuluj
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Dodawanie..." : "Dodaj perfumy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
