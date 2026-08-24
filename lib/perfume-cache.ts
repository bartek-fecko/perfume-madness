"use client";

import type { Perfume } from "@/lib/types";

const memCache = new Map<string, Perfume>();

export function setCachedPerfume(p: Perfume) {
  memCache.set(p.id, p);
  try {
    sessionStorage.setItem(`perfume:${p.id}`, JSON.stringify(p));
  } catch {}
}

export function getCachedPerfume(id: string): Perfume | null {
  if (memCache.has(id)) return memCache.get(id)!;
  try {
    const raw = sessionStorage.getItem(`perfume:${id}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Perfume;
      memCache.set(id, parsed);
      return parsed;
    }
  } catch {}
  return null;
}
