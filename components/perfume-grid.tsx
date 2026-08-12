"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PerfumeCard } from "./perfume-card";
import { toggleFavorite, deletePerfume } from "@/lib/actions/perfumes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Perfume } from "@/lib/types";

interface PerfumeGridProps {
  perfumes: Perfume[];
  isOwner: boolean;
}

export function PerfumeGrid({ perfumes, isOwner }: PerfumeGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticPerfumes, setOptimisticPerfumes] = useState(perfumes);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteTarget =
    optimisticPerfumes.find((p) => p.id === deleteId) ?? null;

  useEffect(() => {
    setOptimisticPerfumes(perfumes);
  }, [perfumes]);

  const handleToggleFavorite = useCallback((id: string) => {
    setOptimisticPerfumes((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, is_favorite: !p.is_favorite } : p,
      ),
    );

    startTransition(async () => {
      const result = await toggleFavorite(id);
      if (!result.success) {
        setOptimisticPerfumes((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, is_favorite: !p.is_favorite } : p,
          ),
        );
      }
    });
  }, []);

  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteId) return;

    const id = deleteId;
    setDeleteId(null);
    setOptimisticPerfumes((prev) => prev.filter((p) => p.id !== id));

    startTransition(async () => {
      const result = await deletePerfume(id);
      if (!result.success) {
        setOptimisticPerfumes(perfumes);
      } else {
        router.refresh();
      }
    });
  }, [deleteId, perfumes, router]);

  if (optimisticPerfumes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4 text-muted-foreground/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 7h18l-2 13H4L2 7Z" />
            <path d="M15 7V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2" />
            <path d="M12 12v4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Nie znaleziono perfum
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {isOwner
            ? "Zacznij budować swoją kolekcję, dodając pierwsze perfumy."
            : "Żadne perfumy nie pasują do aktualnych filtrów."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${isPending ? "opacity-70" : ""}`}
      >
        {optimisticPerfumes.map((perfume) => (
          <PerfumeCard
            key={perfume.id}
            perfume={perfume}
            isOwner={isOwner}
            onToggleFavorite={isOwner ? handleToggleFavorite : undefined}
            onDelete={isOwner ? handleDeleteRequest : undefined}
          />
        ))}
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć perfumy?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja nie może zostać cofnięta. To trwale usunie &quot;
              {deleteTarget?.name}&quot; z Twojej kolekcji.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
