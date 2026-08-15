import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Zamienia dowolnie wpisaną nazwę marki ("creed", "CREED", "  Creed ")
 * na spójną, "ładną" wersję ("Creed") używaną do wyświetlania.
 * Krótkie skróty pisane wielkimi literami (YSL, CK, DKNY, D&G) są zachowywane bez zmian.
 */
export function prettifyBrandName(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ')
  if (!trimmed) return 'Inna marka'

  return trimmed
    .split(' ')
    .map((word) => {
      const isLikelyAcronym =
        word.length <= 4 && word === word.toUpperCase() && /[A-Z]/.test(word)
      if (isLikelyAcronym) return word

      return word
        .split('-')
        .map((part) =>
          part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part,
        )
        .join('-')
    })
    .join(' ')
}

/**
 * Klucz używany do grupowania perfum po marce - niezależny od wielkości liter
 * i nadmiarowych spacji, żeby "creed" i "Creed" trafiły do tej samej grupy.
 */
export function brandGroupKey(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').toLowerCase() || 'inna marka'
}
