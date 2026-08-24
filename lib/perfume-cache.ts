"use client";

import type { Perfume } from "@/lib/types";

const mem = new Map<string, Perfume>();

export function setCachedPerfume(p: Perfume) {
  mem.set(p.id, p);
  try { sessionStorage.setItem(`perfume:${p.id}`, JSON.stringify(p)); } catch {}
}
export function getCachedPerfume(id: string): Perfume | null {
  if (mem.has(id)) return mem.get(id)!;
  try {
    const raw = sessionStorage.getItem(`perfume:${id}`);
    if (raw) { const v = JSON.parse(raw) as Perfume; mem.set(id, v); return v; }
  } catch {}
  return null;
}
