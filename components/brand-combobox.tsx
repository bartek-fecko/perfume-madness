"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface BrandComboboxProps {
  value: string;
  onChange: (brand: string) => void;
  brands: string[];
  hasError?: boolean;
  placeholder?: string;
}

export function BrandCombobox({
  value,
  onChange,
  brands,
  hasError,
  placeholder = "Wybierz lub dodaj markę",
}: BrandComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const normalizedSearch = search.trim().toLowerCase();

  const exactMatch = useMemo(
    () => brands.some((b) => b.toLowerCase() === normalizedSearch),
    [brands, normalizedSearch],
  );

  const handleSelect = (brand: string) => {
    onChange(brand);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            hasError && "border-destructive",
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] max-h-[26rem] overflow-y-auto overscroll-contain p-0"
        align="start"
        onWheel={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false} className="h-auto overflow-visible">
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Szukaj marki..."
          />
          <CommandList className="max-h-none overflow-y-visible">
            <CommandGroup>
              {brands
                .filter((b) => b.toLowerCase().includes(normalizedSearch))
                .map((brandOption) => (
                  <CommandItem
                    key={brandOption}
                    value={brandOption}
                    onSelect={() => handleSelect(brandOption)}
                    className="py-3"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === brandOption ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="text-base">{brandOption}</span>
                  </CommandItem>
                ))}
            </CommandGroup>

            {search.trim() && !exactMatch && (
              <CommandGroup>
                <CommandItem
                  value={`__create__${search}`}
                  onSelect={() => handleSelect(search.trim())}
                  className="text-primary py-3"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-base">
                    Dodaj nową markę &quot;{search.trim()}&quot;
                  </span>
                </CommandItem>
              </CommandGroup>
            )}

            {!search.trim() && brands.length === 0 && (
              <CommandEmpty>
                Wpisz nazwę, aby dodać pierwszą markę.
              </CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
