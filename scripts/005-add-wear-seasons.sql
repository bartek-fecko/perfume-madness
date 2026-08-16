-- Kiedy nosić: zima / wiosna / lato / jesień / dzień / noc (wiele wartości)
ALTER TABLE perfumes
  ADD COLUMN IF NOT EXISTS wear_seasons TEXT[] NOT NULL DEFAULT '{}';
