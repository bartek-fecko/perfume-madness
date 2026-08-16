"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { Loader2, Search, Plus, Trash2, Sparkles, Star, Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addToTryList, removeToTryItem } from "@/lib/actions/to-try";
import { cn } from "@/lib/utils";
import type { ToTryPerfume } from "@/lib/types";
import type { PerfumeSearchResult } from "@/lib/fragrance-api";

interface TryListSectionProps {
  initialItems: ToTryPerfume[];
}

const SEARCH_DEBOUNCE_MS = 700;
const SEARCH_MIN_INTERVAL_MS = 2500;
const VISIBLE_COUNT = 2;

export function TryListSection({ initialItems }: TryListSectionProps) {
  const [items, setItems] = useState<ToTryPerfume[]>(initialItems);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PerfumeSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestCounter = useRef(0);
  const lastSearchAt = useRef(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setShowResults(false);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    setSearchError(null);
    setSearchLoading(true);

    const requestId = ++requestCounter.current;

    const waitUntil = Math.max(
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
        setResults(data.results || []);
        setShowResults(true);
      } catch {
        if (requestId !== requestCounter.current) return;
        setSearchError("Nie udało się wyszukać perfum");
      } finally {
        if (requestId === requestCounter.current) setSearchLoading(false);
      }
    }, waitUntil);
  }, [query]);

  const handleAdd = (result: PerfumeSearchResult) => {
    if (addingId) return;
    setAddingId(result.id);
    setActionError(null);
    startTransition(async () => {
      const res = await addToTryList(result);
      setAddingId(null);
      if (res.success && res.item) {
        setItems((prev) => [res.item as ToTryPerfume, ...prev]);
        setQuery("");
        setShowResults(false);
      } else {
        setActionError(res.error || "Nie udało się dodać do listy");
      }
    });
  };

  const handleRemove = (id: string) => {
    startTransition(async () => {
      const res = await removeToTryItem(id);
      if (res.success) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        setActionError(res.error || "Nie udało się usunąć");
      }
    });
  };

  const handleCopyName = async (name: string, id: string) => {
    try {
      await navigator.clipboard.writeText(name);
      setCopiedId(id);
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // clipboard niedostępny - ignoruj
    }
  };

  const renderItemCard = (item: ToTryPerfume) => (
    <div
      key={item.id}
      className="group flex items-center gap-2 rounded-lg bg-secondary/40 border border-border/70 p-1.5 hover:border-primary/30 transition-all duration-200"
    >
      <div className="relative w-10 h-10 shrink-0 rounded-md overflow-hidden bg-white">
        <Image
          src={item.image_url || "/placeholder.svg"}
          alt={item.name}
          fill
          className="object-contain p-0.5"
          loading="lazy"
          sizes="40px"
          quality={75}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-foreground truncate">
          <span className="uppercase text-muted-foreground">{item.brand}</span>{" "}
          {item.name}
        </p>
        {item.rating ? (
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />
            <span className="text-[10px] font-medium text-muted-foreground">
              {Number(item.rating).toFixed(1)}
            </span>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => handleCopyName(`${item.brand} ${item.name}`, item.id)}
        aria-label={`Kopiuj nazwę ${item.name}`}
        title="Kopiuj pełną nazwę"
        className="h-6 w-6 shrink-0 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        {copiedId === item.id ? (
          <Check className="w-3 h-3 text-emerald-500" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => handleRemove(item.id)}
        disabled={isPending}
        aria-label={`Usuń ${item.name}`}
        className="h-6 w-6 shrink-0 rounded-md text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );

  const visibleItems = items.slice(0, VISIBLE_COUNT);
  const hiddenCount = items.length - visibleItems.length;

  return (
    <>
      <Card className="h-full border-border/70 bg-card p-0 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
      <CardContent className="p-3 sm:p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary fill-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">
              Chcę spróbować
            </h3>
            <span className="text-sm text-muted-foreground">({items.length})</span>
          </div>
          {hiddenCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
            >
              {hiddenCount} więcej
            </Button>
          )}
        </div>

        {/* Search */}
        <div
          className="relative mb-3"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setShowResults(false);
            }
          }}
        >
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowResults(false);
            }}
            placeholder="Wyszukaj perfumy z Fragrance API..."
            className="pr-9"
          />
          {searchLoading ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          )}

          {showResults && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden">
              <div className="overflow-hidden overscroll-contain max-h-[340px] overflow-y-auto">
                {results.length === 0 && !searchLoading ? (
                  <p className="p-4 text-base text-muted-foreground">
                    Brak wyników
                  </p>
                ) : (
                  results.map((result) => {
                    const alreadyAdded = items.some(
                      (item) => item.source_id === result.id,
                    );
                    return (
                      <button
                        key={result.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => !alreadyAdded && handleAdd(result)}
                        disabled={alreadyAdded}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-default",
                        )}
                      >
                        <div className="w-12 h-12 shrink-0 rounded-md overflow-hidden bg-muted">
                          {result.image ? (
                            <Image
                              src={result.image}
                              alt=""
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-sm font-medium truncate"
                            title={`${result.name}${result.year ? ` (${result.year})` : ""}`}
                          >
                            {result.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {result.brand}
                            {result.year ? ` · ${result.year}` : ""}
                          </p>
                        </div>
                        {result.rating ? (
                          <span className="text-xs font-semibold text-amber-500 shrink-0">
                            ★ {result.rating.toFixed(1)}
                          </span>
                        ) : null}
                        <span className="shrink-0">
                          {addingId === result.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : alreadyAdded ? (
                            <span className="text-xs text-muted-foreground">
                              Dodano
                            </span>
                          ) : (
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary">
                              <Plus className="w-4 h-4" />
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {searchError && (
          <p className="text-xs text-destructive mb-3">{searchError}</p>
        )}
        {actionError && (
          <p className="text-xs text-destructive mb-3">{actionError}</p>
        )}
        {query.trim().length > 0 && query.trim().length < 3 && (
          <p className="text-xs text-muted-foreground mb-3">
            Wpisz przynajmniej 3 znaki, aby wyszukać perfumy.
          </p>
        )}

        {/* List of added perfumes */}
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border/70 rounded-lg">
            Brak perfum na liście. Wyszukaj i dodaj zapachy, które chcesz
            przetestować.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visibleItems.map(renderItemCard)}
            </div>
          </>
        )}
      </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chcę spróbować ({items.length})</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto -mx-6 px-6 pb-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map(renderItemCard)}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
