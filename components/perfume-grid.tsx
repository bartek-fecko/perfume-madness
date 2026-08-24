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
  MeasuringStrategy,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Star } from "lucide-react";
import { PerfumeCard } from "./perfume-card";
import {
  toggleFavorite,
  deletePerfume,
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
import Link from "next/link";
import { brandGroupKey, prettifyBrandName } from "@/lib/utils";
import type { Perfume } from "@/lib/types";
import Image from "next/image";

function isDataUrl(url?: string | null) {
  return !!url && url.startsWith("data:");
}

function TileImage({
  src,
  alt,
  className,
  sizes,
}: {
  src: string;
  alt: string;
  className: string;
  sizes: string;
}) {
  if (isDataUrl(src)) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={className}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      loading="lazy"
      decoding="async"
      sizes={sizes}
      quality={50}
      className={className}
    />
  );
}

interface BrandGroup {
  key: string;
  label: string;
  perfumes: Perfume[];
}

interface PerfumeGridProps {
  perfumes: Perfume[];
  isOwner: boolean;
  initialBrandOrder?: Record<string, number>;
}

export function PerfumeGrid({
  perfumes,
  isOwner,
  initialBrandOrder = {},
}: PerfumeGridProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
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

  const canReorder = isOwner;

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
  const displayGroup =
    brandGroups.find((g) => g.key === openBrandKey) ?? null;

  const handleOpenBrand = (key: string) => {
    const group = brandGroups.find((g) => g.key === key);
    if (group && group.perfumes.length === 1) {
      router.push(`/perfume/${group.perfumes[0].id}`);
      return;
    }
    setOpenBrandKey(key);
  };

  const handleCloseBrand = () => {
    setOpenBrandKey(null);
  };

  const modalCount = displayGroup?.perfumes.length ?? 0;
  const modalMaxW =
    modalCount <= 1
      ? "sm:max-w-md"
      : modalCount <= 2
        ? "sm:max-w-2xl"
        : modalCount <= 5
          ? "sm:max-w-4xl"
          : modalCount <= 8
            ? "sm:max-w-5xl"
            : "sm:max-w-7xl";
  const modalCols =
    modalCount <= 2
      ? "grid-cols-1 sm:grid-cols-2"
      : modalCount <= 5
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : modalCount <= 8
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

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
        <h3 className="text-lg font-semibold text-foreground mb-2">
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
        measuring={{ droppable: { strategy: MeasuringStrategy.BeforeDragging } }}
      >
        <SortableContext
          items={brandGroups.map((g) => g.key)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {brandGroups.map((group) => (
              <SortableBrandTile
                key={group.key}
                group={group}
                isOwner={isOwner}
                canReorder={canReorder}
                onOpen={() => handleOpenBrand(group.key)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog
        open={!!openBrandKey}
        onOpenChange={(open) => !open && handleCloseBrand()}
      >
        <DialogContent
          className={`${modalMaxW} p-0 gap-0`}
        >
          <DialogHeader className="px-4 sm:px-6 pt-4 pb-3">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <span>{displayGroup?.label}</span>
              {displayGroup && (
                <Badge variant="secondary" className="font-normal">
                  {displayGroup.perfumes.length}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto overscroll-contain will-change-transform px-4 sm:px-6 pb-4 sm:pb-6">
            <div className={`grid ${modalCols} gap-3 sm:gap-4`}>
              {displayGroup?.perfumes.map((perfume) => (
                <PerfumeCard
                  key={perfume.id}
                  perfume={perfume}
                  isOwner={isOwner}
                  onToggleFavorite={
                    isOwner ? handleToggleFavorite : undefined
                  }
                  onDelete={isOwner ? handleDeleteRequest : undefined}
                />
              ))}
            </div>
          </div>
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
  const router = useRouter();
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
    transition: isDragging ? "none" : transition,
  };

  const ratedPerfumes = group.perfumes.filter((p) => p.rating);
  const avgRating =
    ratedPerfumes.length > 0
      ? ratedPerfumes.reduce((sum, p) => sum + Number(p.rating), 0) /
        ratedPerfumes.length
      : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        "group text-left rounded-lg border border-border/70 bg-secondary/40 overflow-hidden cursor-pointer" +
        " hover:border-primary/30 hover:bg-secondary/60 transition-all duration-200" +
        " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" +
        (isDragging
          ? " shadow-lg ring-2 ring-primary/40 will-change-transform transition-none"
          : "")
      }
      onMouseEnter={() => {
        if (group.perfumes.length === 1) router.prefetch(`/perfume/${group.perfumes[0].id}`);
      }}
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
      <div
        className="relative aspect-square bg-white dark:bg-card overflow-hidden"
        onMouseEnter={() => {
          if (group.perfumes.length === 1) router.prefetch(`/perfume/${group.perfumes[0].id}`);
        }}
      >
        {group.perfumes.length === 1 && (
          <Link
            href={`/perfume/${group.perfumes[0].id}`}
            prefetch
            aria-hidden
            tabIndex={-1}
            className="hidden"
          />
        )}
        {group.perfumes.length === 1 ? (
          <TileImage
            src={group.perfumes[0].image_url || "/placeholder.svg"}
            alt={group.perfumes[0].name}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="absolute inset-0 w-full h-full object-contain p-1"
          />
        ) : (
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px">
            {group.perfumes.slice(0, 4).map((p) => (
              <div key={p.id} className="relative overflow-hidden bg-white dark:bg-card">
                <TileImage
                  src={p.image_url || "/placeholder.svg"}
                  alt={p.name}
                  sizes="(max-width: 640px) 25vw, (max-width: 1024px) 12vw, 10vw"
                  className="absolute inset-0 w-full h-full object-contain p-0.5"
                />
              </div>
            ))}
          </div>
        )}

        {group.perfumes.length > 4 && (
          <span className="absolute bottom-1 right-1 z-10 bg-black/70 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
            +{group.perfumes.length - 4}
          </span>
        )}

        {canReorder && (
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-1 left-1 z-10 p-1 rounded-md bg-white/90 backdrop-blur-sm border border-border/70 text-muted-foreground cursor-grab active:cursor-grabbing touch-none hover:text-foreground shadow-sm"
            aria-label={`Przeciągnij, aby zmienić kolejność marki ${group.label}`}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="p-2 min-w-0">
        <div className="flex items-center justify-between gap-1.5">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide truncate">
            {group.label}
          </p>
          <Badge
            variant="secondary"
            className="shrink-0 font-normal rounded-full px-2 py-0 text-[10px]"
          >
            {group.perfumes.length}
          </Badge>
        </div>
        {group.perfumes[0] && (
          <p className="text-xs font-medium text-foreground truncate">
            {group.perfumes[0].name}
          </p>
        )}
        {avgRating !== null ? (
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
            <span className="text-[11px] font-medium text-muted-foreground">
              {avgRating.toFixed(1)}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
