"use client";

import React from "react"

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, Star } from "lucide-react";
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
  const [rating, setRating] = useState(4);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Nazwa jest wymagana";
    if (!brand.trim()) newErrors.brand = "Marka jest wymagana";
    if (!price || Number.parseFloat(price) <= 0) newErrors.price = "Wymagana prawidłowa cena";
    if (selectedCategories.length === 0) newErrors.categories = "Wymagana przynajmniej jedna kategoria";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setName("");
    setBrand("");
    setPrice("");
    setRating(4);
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
        notes: notes.split(",").map((n) => n.trim()).filter(Boolean),
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
              <Label htmlFor="price">Cena ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="150"
                className={errors.price ? "border-destructive" : ""}
              />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Ocena</Label>
              <div className="flex items-center gap-1 pt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-0.5"
                  >
                    <Star
                      className={cn(
                        "w-6 h-6 transition-colors",
                        star <= rating
                          ? "text-accent fill-accent"
                          : "text-border hover:text-accent/50"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Kategorie * (wybierz przynajmniej jedną)</Label>
            <div className={cn(
              "grid grid-cols-2 gap-2 p-3 border rounded-lg",
              errors.categories ? "border-destructive" : "border-border"
            )}>
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
            <Label htmlFor="notes">Nuty zapachowe (oddzielone przecinkami)</Label>
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
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
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
