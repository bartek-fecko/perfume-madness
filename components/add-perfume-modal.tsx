"use client";

import React from "react";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, Star, StarHalf } from "lucide-react";
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
import { createPerfume } from "@/lib/actions/perfumes";
import { cn } from "@/lib/utils";

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
  const [notes, setNotes] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    setNotes("");
    setSelectedCategories([]);
    setImageUrl("");
    setErrors({});
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
        notes: notes
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean),
        categories: selectedCategories,
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
    setErrors((prev) => ({ ...prev, rating: undefined }));
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa perfum *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Bleu de Chanel"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marka *</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="np. Chanel"
                className={errors.brand ? "border-destructive" : ""}
              />
              {errors.brand && (
                <p className="text-xs text-destructive">{errors.brand}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="space-y-2">
            <Label htmlFor="notes">
              Nuty zapachowe (oddzielone przecinkami)
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bergamotka, Wanilia, Sandałowiec"
            />
          </div>

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
