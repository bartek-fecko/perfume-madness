-- ============================================================================
-- MIGRACJA: Strukturalne nuty (nuty głowy / serca / bazy) + backup bezpieczeństwa
-- ----------------------------------------------------------------------------
-- UWAGA: ten skrypt przenosi wszystkie istniejące nuty do "nuty głowy"
-- (fallback - stare dane nie mają informacji o podziale piramidy).
-- Aby rozłożyć je poprawnie na głowę / serce / bazę, uruchom NASTĘPNIE
-- skrypt 004-redistribute-notes-groups.sql.
-- ZAŁOŻENIA:
--   * Uruchom po skryptach 001 i 002 (musi istnieć tabela "perfumes" z kolumną
--     "notes TEXT[]").
--   * Skrypt jest IDEMPOTENTNY - można go uruchomić wielokrotnie bez ryzyka.
--   * NIE usuwa ani nie nadpisuje żadnych istniejących danych.
--   * Wszystkie operacje są w transakcji - jeśli cokolwiek się nie powiedzie,
--     całość jest wycofywana (ROLLBACK) i baza zostaje w stanie sprzed migracji.
--   * Zanim skrypt cokolwiek zrobi, tworzy kopię zapasową starej kolumny
--     "notes" w tabeli "perfumes_notes_backup" (jednorazowo, bez nadpisywania).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Backup starych nut (bezpieczeństwo) - jednorazowy, nie nadpisuje kopii
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfumes_notes_backup (
  perfume_id   UUID PRIMARY KEY,
  notes_flat   TEXT[],
  backed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO perfumes_notes_backup (perfume_id, notes_flat)
SELECT id, notes
FROM perfumes
WHERE notes IS NOT NULL
  AND cardinality(notes) > 0
ON CONFLICT (perfume_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2) Dodanie kolumn strukturalnych (jeśli jeszcze nie istnieją - no-op)
-- ----------------------------------------------------------------------------
ALTER TABLE perfumes
  ADD COLUMN IF NOT EXISTS notes_top   JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes_heart JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes_base  JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ----------------------------------------------------------------------------
-- 3) Migracja istniejących nut (jednopoziomowych) do struktury.
--    Warunki - migrujemy TYLKO wiersze, które:
--       * mają niepuste stare nuty ("notes"),
--       * NIE mają jeszcze żadnych nut strukturalnych (wszystkie 3 kolumny puste).
--    Wiersze już zmigrowane lub uzupełnione ręcznie są pomijane (nic nie nadpisujemy).
--    Istniejące nuty trafiają do "nuty głowy" jako fallback (nie znamy
--    pierwotnego podziału na głowę/serce/bazę dla starych rekordów).
-- ----------------------------------------------------------------------------
UPDATE perfumes p
SET notes_top   = sub.notes_top,
    notes_heart = '[]'::jsonb,
    notes_base  = '[]'::jsonb
FROM (
  SELECT
    src.id,
    COALESCE(
      jsonb_agg(jsonb_build_object('name', src.n, 'image_url', NULL)),
      '[]'::jsonb
    ) AS notes_top
  FROM (
    SELECT id, unnest(notes) AS n
    FROM perfumes
    WHERE notes IS NOT NULL
      AND cardinality(notes) > 0
      AND notes_top   = '[]'::jsonb
      AND notes_heart = '[]'::jsonb
      AND notes_base  = '[]'::jsonb
  ) src
  GROUP BY src.id
) sub
WHERE p.id = sub.id;

-- ----------------------------------------------------------------------------
-- 4) Indeksy GIN dla szybkiego wyszukiwania po nutach
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_perfumes_notes_top   ON perfumes USING GIN (notes_top);
CREATE INDEX IF NOT EXISTS idx_perfumes_notes_heart ON perfumes USING GIN (notes_heart);
CREATE INDEX IF NOT EXISTS idx_perfumes_notes_base  ON perfumes USING GIN (notes_base);

COMMIT;

-- ----------------------------------------------------------------------------
-- 5) WERYFIKACJA (tylko odczyt - niczego nie zmienia)
--    Powinno wyjść:
--      * rows_with_flat_notes     = liczba wierszy z starymi nutami
--      * rows_with_structured     = liczba wierszy z nutami strukturalnymi
--      * rows_not_migrated        = 0 (wszystkie stare nuty przeniesione)
--      * backup_count             = liczba wierszy w kopii zapasowej
-- ----------------------------------------------------------------------------
SELECT
  COUNT(*) FILTER (WHERE notes IS NOT NULL AND cardinality(notes) > 0)
    AS rows_with_flat_notes,
  COUNT(*) FILTER (
    WHERE notes_top <> '[]'::jsonb
       OR notes_heart <> '[]'::jsonb
       OR notes_base <> '[]'::jsonb
  ) AS rows_with_structured_notes,
  COUNT(*) FILTER (
    WHERE notes IS NOT NULL
      AND cardinality(notes) > 0
      AND notes_top = '[]'::jsonb
      AND notes_heart = '[]'::jsonb
      AND notes_base = '[]'::jsonb
  ) AS rows_not_migrated,
  (SELECT COUNT(*) FROM perfumes_notes_backup) AS backup_count
FROM perfumes;

-- Podgląd 10 migrowanych rekordów (tylko odczyt):
-- SELECT id, name, notes, notes_top, notes_heart, notes_base
-- FROM perfumes
-- WHERE notes IS NOT NULL AND cardinality(notes) > 0
-- LIMIT 10;
