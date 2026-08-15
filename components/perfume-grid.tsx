"use client";

import { useState, useTransition, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { PerfumeCard } from "./perfume-card";
import {
  toggleFavorite,
  deletePerfume,
  reorderPerfumes,
  reorderBrands,
} from "@/lib/actions/perfumes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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
import { brandGroupKey, prettifyBrandName } from "@/lib/utils";
import type { Perfume, SortOption } from "@/lib/types";

interface BrandGroup {
  key: string;
  label: string;
  perfumes: Perfume[];
}

interface PerfumeGridProps {
  perfumes: Perfume[];
  isOwner: boolean;
  sortBy?: SortOption;
  initialBrandOrder?: Record<string, number>;
}

export function PerfumeGrid({
  perfumes,
  isOwner,
  sortBy = "created_at",
  initialBrandOrder = {},
}: PerfumeGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticPerfumes, setOptimisticPerfumes] = useState(perfumes);
  const [brandOrder, setBrandOrder] =
    useState<Record<string, number>>(initialBrandOrder);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteTarget =
    optimisticPerfumes.find((p) => p.id === deleteId) ?? null;

  useEffect(() => {
    setOptimisticPerfumes(perfumes);
  }, [perfumes]);

  useEffect(() => {
    setBrandOrder(initialBrandOrder);
  }, [initialBrandOrder]);

  const canReorder = isOwner && sortBy === "created_at";

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const brandGroups = useMemo<BrandGroup[]>(() => {
    const map = new Map<string, BrandGroup>();

    for (const perfume of optimisticPerfumes) {
      const key = brandGroupKey(perfume.brand || "");
      const existing = map.get(key);
      if (existing) {
        existing.perfumes.push(perfume);
      } else {
        map.set(key, {
          key,
          label: prettifyBrandName(perfume.brand || ""),
          perfumes: [perfume],
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const pa = brandOrder[a.key] ?? Infinity;
      const pb = brandOrder[b.key] ?? Infinity;
      if (pa !== pb) return pa - pb;
      return a.label.localeCompare(b.label, "pl");
    });
  }, [optimisticPerfumes, brandOrder]);

  const [openBrandKey, setOpenBrandKey] = useState<string | null>(null);
  const selectedGroup =
    brandGroups.find((g) => g.key === openBrandKey) ?? null;

  // Jeśli marka zniknie (np. usunięto ostatnie perfumy), zamknij dialog.
  useEffect(() => {
    if (openBrandKey && !brandGroups.some((g) => g.key === openBrandKey)) {
      setOpenBrandKey(null);
    }
  }, [brandGroups, openBrandKey]);

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

  const handleBrandDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = brandGroups.findIndex((g) => g.key === active.id);
      const newIndex = brandGroups.findIndex((g) => g.key === over.id);
      if (oldIndex < 0 || newIndex < 0) return;

      const reordered = arrayMove(brandGroups, oldIndex, newIndex);
      const nextOrder: Record<string, number> = {};
      reordered.forEach((group, index) => {
        nextOrder[group.key] = index;
      });

      setBrandOrder(nextOrder);

      startTransition(async () => {
        const result = await reorderBrands(reordered.map((g) => g.key));
        if (result.success) {
          router.refresh();
        }
      });
    },
    [brandGroups, router],
  );

  const handlePerfumeDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !openBrandKey) return;

      const groupPerfumes = selectedGroup?.perfumes;
      if (!groupPerfumes) return;

      const ids = groupPerfumes.map((p) => p.id);
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return;

      const reorderedIds = arrayMove(ids, oldIndex, newIndex);

      // Zaktualizuj kolejność perfum tylko w obrębie tej marki
      setOptimisticPerfumes((prev) => {
        const reorderedBrandPerfumes = reorderedIds.map((id) =>
          groupPerfumes.find((p) => p.id === id)!,
        );
        const reorderedSet = new Set(reorderedIds);

        let brandIndex = 0;
        return prev.map((p) => {
          if (reorderedSet.has(p.id)) {
            return reorderedBrandPerfumes[brandIndex++];
          }
          return p;
        });
      });

      startTransition(async () => {
        const result = await reorderPerfumes(reorderedIds);
        if (result.success) {
          router.refresh();
        }
      });
    },
    [openBrandKey, selectedGroup, router],
  );

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleBrandDragEnd}
      >
        <SortableContext
          items={brandGroups.map((g) => g.key)}
          strategy={rectSortingStrategy}
        >
          <div
            className={
              "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5" +
              (isPending ? " opacity-70" : "")
            }
          >
            {brandGroups.map((group) => (
              <SortableBrandTile
                key={group.key}
                group={group}
                isOwner={isOwner}
                canReorder={canReorder}
                onOpen={() => setOpenBrandKey(group.key)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog
        open={!!openBrandKey}
        onOpenChange={(open) => !open && setOpenBrandKey(null)}
      >
        <DialogContent className="sm:max-w-[85rem] max-h-[90vh] overflow-y-auto p-6 sm:p-10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span>{selectedGroup?.label}</span>
              {selectedGroup && (
                <Badge variant="secondary" className="font-normal">
                  {selectedGroup.perfumes.length}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handlePerfumeDragEnd}
          >
            <SortableContext
              items={selectedGroup?.perfumes.map((p) => p.id) ?? []}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
                {selectedGroup?.perfumes.map((perfume) => (
                  <SortablePerfume
                    key={perfume.id}
                    perfume={perfume}
                    isOwner={isOwner}
                    canReorder={canReorder}
                    onToggleFavorite={
                      isOwner ? handleToggleFavorite : undefined
                    }
                    onDelete={isOwner ? handleDeleteRequest : undefined}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </DialogContent>
      </Dialog>

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

interface SortableBrandTileProps {
  group: BrandGroup;
  isOwner: boolean;
  canReorder: boolean;
  onOpen: () => void;
}

function SortableBrandTile({
  group,
  isOwner,
  canReorder,
  onOpen,
}: SortableBrandTileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        "group text-left rounded-xl border border-border/50 bg-card p-4 transition-[box-shadow,border-color,opacity] hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" +
        (isDragging
          ? " opacity-60 shadow-lg ring-2 ring-primary/40 will-change-transform"
          : "") +
        (canReorder ? " cursor-default" : "")
      }
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Otwórz markę ${group.label}`}
    >
      <div className="relative grid grid-cols-2 grid-rows-2 gap-1 mb-4 aspect-square rounded-lg overflow-hidden bg-secondary/30">
        {Array.from({ length: 4 }).map((_, i) => {
          const preview = group.perfumes[i];
          return (
            <div
              key={preview?.id ?? `empty-${i}`}
              className="relative overflow-hidden bg-secondary/40"
            >
              {preview && (
                <img
                  src={preview.image_url || "/placeholder.svg"}
                  alt={preview.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </div>
          );
        })}

        {canReorder && (
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-1 left-1 z-10 p-1 rounded-md bg-background/90 border border-border/50 text-muted-foreground cursor-grab active:cursor-grabbing touch-none hover:text-foreground"
            aria-label={`Przeciągnij, aby zmienić kolejność marki ${group.label}`}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-sm text-foreground truncate">
          {group.label}
        </span>
        <Badge variant="secondary" className="shrink-0 font-normal">
          {group.perfumes.length}
        </Badge>
      </div>
    </div>
  );
}

interface SortablePerfumeProps {
  perfume: Perfume;
  isOwner: boolean;
  canReorder: boolean;
  onToggleFavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function SortablePerfume({
  perfume,
  isOwner,
  canReorder,
  onToggleFavorite,
  onDelete,
}: SortablePerfumeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: perfume.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        "relative rounded-xl" +
        (isDragging
          ? " opacity-60 shadow-lg ring-2 ring-primary/40 z-10 will-change-transform"
          : "")
      }
    >
      {canReorder && (
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-1 left-1 z-20 p-1 rounded-md bg-background/90 border border-border/50 text-muted-foreground cursor-grab active:cursor-grabbing touch-none hover:text-foreground"
          aria-label={`Przeciągnij, aby zmienić kolejność perfum ${perfume.name}`}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      <PerfumeCard
        perfume={perfume}
        isOwner={isOwner}
        onToggleFavorite={onToggleFavorite}
        onDelete={onDelete}
      />
    </div>
  );
}
