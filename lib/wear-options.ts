import {
  Snowflake,
  Flower2,
  Sun,
  Leaf,
  Sunrise,
  Moon,
  type LucideIcon,
} from "lucide-react";

export const WEAR_OPTIONS = [
  {
    value: "zima",
    label: "Zima",
    icon: Snowflake,
    colorClass:
      "border-sky-400 bg-sky-100 text-sky-700 dark:border-sky-500/60 dark:bg-sky-500/15 dark:text-sky-300",
  },
  {
    value: "wiosna",
    label: "Wiosna",
    icon: Flower2,
    colorClass:
      "border-green-400 bg-green-100 text-green-700 dark:border-green-500/60 dark:bg-green-500/15 dark:text-green-300",
  },
  {
    value: "lato",
    label: "Lato",
    icon: Sun,
    colorClass:
      "border-orange-400 bg-orange-100 text-orange-700 dark:border-orange-500/60 dark:bg-orange-500/15 dark:text-orange-300",
  },
  {
    value: "jesien",
    label: "Jesień",
    icon: Leaf,
    colorClass:
      "border-amber-500 bg-amber-100 text-amber-800 dark:border-amber-500/60 dark:bg-amber-500/15 dark:text-amber-300",
  },
  {
    value: "dzien",
    label: "Dzień",
    icon: Sunrise,
    colorClass:
      "border-yellow-400 bg-yellow-100 text-yellow-700 dark:border-yellow-500/60 dark:bg-yellow-500/15 dark:text-yellow-300",
  },
  {
    value: "noc",
    label: "Noc",
    icon: Moon,
    colorClass:
      "border-indigo-400 bg-indigo-100 text-indigo-700 dark:border-indigo-500/60 dark:bg-indigo-500/15 dark:text-indigo-300",
  },
] as const;

export type WearOptionValue = (typeof WEAR_OPTIONS)[number]["value"];

export function wearLabel(value: string): string {
  return WEAR_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function wearIcon(value: string): LucideIcon {
  return WEAR_OPTIONS.find((o) => o.value === value)?.icon ?? Flower2;
}

export function wearColorClass(value: string): string {
  return WEAR_OPTIONS.find((o) => o.value === value)?.colorClass ?? "";
}
