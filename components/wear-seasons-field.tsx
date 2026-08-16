"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { WEAR_OPTIONS, wearIcon } from "@/lib/wear-options";

export function WearSeasonsField({
  value,
  onChange,
  error,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  error?: boolean;
}) {
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <div className="space-y-2">
      <Label>Kiedy nosić?</Label>
      <div className="flex flex-wrap gap-2">
        {WEAR_OPTIONS.map((opt) => {
          const Icon = wearIcon(opt.value);
          const active = value.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition-colors",
                active
                  ? opt.colorClass
                  : "border-border hover:border-primary/50",
              )}
            >
              <Checkbox
                checked={active}
                onCheckedChange={() => toggle(opt.value)}
                className="hidden"
              />
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-sm">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
