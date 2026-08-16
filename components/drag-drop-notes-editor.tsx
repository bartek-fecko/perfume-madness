"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDndContext,
  closestCorners,
  pointerWithin,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveNoteImage } from "@/lib/notes-dictionary";
import type { FragranceNote, PerfumeNotes } from "@/lib/types";

type SectionKey = "top" | "heart" | "base";

const SECTION_CONFIG: { key: SectionKey; label: string; color: string }[] = [
  { key: "top", label: "Nuty głowy", color: "#fef08a" },
  { key: "heart", label: "Nuty serca", color: "#fda4af" },
  { key: "base", label: "Nuty bazy", color: "#c4b5fd" },
];

const SECTIONS: SectionKey[] = ["top", "heart", "base"];

function signatureOf(notes: PerfumeNotes): string {
  return JSON.stringify([notes.top, notes.heart, notes.base]);
}

function noteImageUrl(note: FragranceNote): string | undefined {
  const raw = note.image_url;
  if (!raw) return resolveNoteImage(note.name);
  if (raw.startsWith("data:image/")) return raw;
  if (/^[A-Za-z0-9+/=]+$/.test(raw)) return `data:image/png;base64,${raw}`;
  return raw;
}

function NoteImage({
  note,
  className,
}: {
  note: FragranceNote;
  className: string;
}) {
  const src = noteImageUrl(note);
  if (!src) return null;
  return (
    <div className="relative w-9 h-9 flex-shrink-0 overflow-hidden rounded">
      <img
        src={src}
        alt={note.name}
        className={cn("w-full h-full object-cover", className)}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

interface SortableNoteChipProps {
  id: string;
  note: FragranceNote;
  onRemove: () => void;
}

function SortableNoteChip({ id, note, onRemove }: SortableNoteChipProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      title={`Przeciągnij, aby przenieść nutę "${note.name}" do innej kategorii`}
      className={cn(
        "group relative flex items-center gap-1.5 px-2 py-1 w-40 max-w-full flex-shrink-0 bg-card border border-border rounded-lg cursor-grab active:cursor-grabbing transition-colors",
        isDragging && "opacity-40 shadow-lg ring-2 ring-primary/40",
      )}
    >
      <GripVertical className="w-3 h-3 flex-shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
      <NoteImage note={note} className="rounded" />
      <span className="flex-1 min-w-0 truncate text-xs text-foreground">
        {note.name}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Usuń ${note.name}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

interface NoteSectionProps {
  section: SectionKey;
  ids: string[];
  noteById: Map<string, FragranceNote>;
  onRemove: (section: SectionKey, id: string) => void;
}

function NoteSection({ section, ids, noteById, onRemove }: NoteSectionProps) {
  const config = SECTION_CONFIG.find((s) => s.key === section)!;
  const { setNodeRef, isOver } = useDroppable({ id: section });
  const { over } = useDndContext();
  const overId = over ? String(over.id) : null;

  const isActive = isOver || overId === section || ids.includes(overId ?? "");

  return (
    <div className="space-y-2 border-l-2 pl-3" style={{ borderColor: config.color }}>
      <div className="flex items-center gap-2">
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        <label className="text-xs font-medium text-foreground capitalize">
          {config.label}
        </label>
        <span className="text-xs text-muted-foreground">({ids.length})</span>
      </div>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            "flex flex-wrap content-start items-start gap-1.5 p-2 min-h-[52px] w-full rounded-lg border border-dashed transition-colors",
            isActive
              ? "border-primary/70 bg-primary/10"
              : "border-border/60 bg-muted/20",
          )}
        >
          {ids.length === 0 && (
            <span className="text-xs text-muted-foreground px-1 py-1">
              Przeciągnij nuty tutaj
            </span>
          )}
          {ids.map((id) => (
            <SortableNoteChip
              key={id}
              id={id}
              note={noteById.get(id)!}
              onRemove={() => onRemove(section, id)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// When the pointer is inside a droppable, use exactly what is under it
// (so empty space in a category resolves to that category -> append).
// Otherwise fall back to the closest corners. Same strategy as the official
// dnd-kit multi-container example.
const noteCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  return closestCorners(args);
};

interface DragDropNotesEditorProps {
  notes: PerfumeNotes;
  onChange: (next: PerfumeNotes) => void;
}

export function DragDropNotesEditor({
  notes,
  onChange,
}: DragDropNotesEditorProps) {
  const idMapRef = useRef(new Map<string, string>());
  const counterRef = useRef({ n: 0 });
  const noteByIdRef = useRef(new Map<string, FragranceNote>());
  const lastSigRef = useRef(signatureOf(notes));

  const buildItems = (source: PerfumeNotes): Record<SectionKey, string[]> => {
    const containers: Record<SectionKey, string[]> = {
      top: [],
      heart: [],
      base: [],
    };
    const seen = new Map<string, number>();

    for (const section of SECTIONS) {
      for (const note of source[section]) {
        const key = `${note.name}\u0000${note.image_url ?? ""}`;
        const occ = seen.get(key) ?? 0;
        seen.set(key, occ + 1);
        const itemKey = `${key}\u0000${occ}`;
        let id = idMapRef.current.get(itemKey);
        if (!id) {
          id = `note-${counterRef.current.n++}`;
          idMapRef.current.set(itemKey, id);
        }
        noteByIdRef.current.set(id, note);
        containers[section].push(id);
      }
    }

    return containers;
  };

  const [items, setItems] = useState<Record<SectionKey, string[]>>(() =>
    buildItems(notes),
  );
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const notesSig = useMemo(() => signatureOf(notes), [notes]);

  // Rebuild local drag state only when `notes` changed from the outside
  // (autofill, add-note form, reset). Changes committed by this component are
  // recognised via lastSigRef and skipped. Never calls onChange.
  useEffect(() => {
    if (notesSig === lastSigRef.current) return;
    lastSigRef.current = notesSig;
    const rebuilt = buildItems(notes);
    itemsRef.current = rebuilt;
    setItems(rebuilt);
  }, [notesSig]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const findContainer = (id: string): SectionKey | null => {
    if (SECTIONS.includes(id as SectionKey)) return id as SectionKey;
    const current = itemsRef.current;
    for (const section of SECTIONS) {
      if (current[section].includes(id)) return section;
    }
    return null;
  };

  const commitToParent = (next: Record<SectionKey, string[]>) => {
    const out: PerfumeNotes = { top: [], heart: [], base: [] };
    for (const section of SECTIONS) {
      for (const id of next[section]) {
        const note = noteByIdRef.current.get(id);
        if (note) out[section].push(note);
      }
    }
    lastSigRef.current = signatureOf(out);
    onChange(out);
  };

  const removeNote = (section: SectionKey, id: string) => {
    const next = {
      ...itemsRef.current,
      [section]: itemsRef.current[section].filter((x) => x !== id),
    };
    itemsRef.current = next;
    setItems(next);
    commitToParent(next);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over, delta, activatorEvent } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);
    if (
      !activeContainer ||
      !overContainer ||
      activeContainer === overContainer
    ) {
      return;
    }

    const prev = itemsRef.current;
    const activeItems = prev[activeContainer];
    const overItems = prev[overContainer];
    const activeIndex = activeItems.indexOf(activeId);
    if (activeIndex < 0) return;

    // Over the container itself (empty space) -> append at the end.
    let newIndex = overItems.length;
    const overIndex = overItems.indexOf(overId);

    // Over a note -> insert before it, or after it when the real pointer is
    // below / to the right of the note's center (so the right half of the
    // last note appends too). Using the actual pointer position, not the
    // dragged note's rect, keeps this accurate across wrapped rows.
    if (overIndex >= 0) {
      const overRect = over.rect;
      if (overRect !== null) {
        const pointerX = activatorEvent.clientX + delta.x;
        const pointerY = activatorEvent.clientY + delta.y;
        const isBelow =
          pointerY > overRect.top + overRect.height / 2;
        const isRight =
          pointerX > overRect.left + overRect.width / 2;
        newIndex = Math.min(overIndex + (isBelow || isRight ? 1 : 0), overItems.length);
      }
    }

    const next = {
      ...prev,
      [activeContainer]: prev[activeContainer].filter((item) => item !== activeId),
      [overContainer]: [
        ...prev[overContainer].slice(0, newIndex),
        prev[activeContainer][activeIndex],
        ...prev[overContainer].slice(newIndex),
      ],
    };
    itemsRef.current = next;
    setItems(next);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);
    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
      const from = itemsRef.current[activeContainer];
      const oldIndex = from.indexOf(activeId);
      let newIndex = from.indexOf(overId);
      // Dropped on the category's empty space -> move to the end.
      if (overId === activeContainer) {
        newIndex = from.length - 1;
      }
      if (oldIndex < 0 || newIndex < 0) return;
      const next = {
        ...itemsRef.current,
        [activeContainer]: arrayMove(from, oldIndex, newIndex),
      };
      itemsRef.current = next;
      setItems(next);
      commitToParent(next);
    } else {
      // Cross-container moves were already applied live in onDragOver.
      commitToParent(itemsRef.current);
    }
  };

  const handleDragCancel = () => {
    const rebuilt = buildItems(notes);
    itemsRef.current = rebuilt;
    setItems(rebuilt);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={noteCollisionDetection}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-3">
        {SECTION_CONFIG.map((section) => (
          <NoteSection
            key={section.key}
            section={section.key}
            ids={items[section.key]}
            noteById={noteByIdRef.current}
            onRemove={removeNote}
          />
        ))}
      </div>
    </DndContext>
  );
}
