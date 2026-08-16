-- Lista "Chcę spróbować" - perfumy z zewnętrznego API (Fragrance API),
-- które użytkownik chce kiedyś przetestować. Nie są częścią kolekcji.
CREATE TABLE IF NOT EXISTS to_try_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  year INTEGER,
  rating NUMERIC(4, 2),
  image_url TEXT,
  notes JSONB NOT NULL DEFAULT '[]',
  categories JSONB NOT NULL DEFAULT '[]',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, source_id)
);

CREATE INDEX IF NOT EXISTS idx_to_try_user ON to_try_list(user_id, created_at DESC);

ALTER TABLE to_try_list ENABLE ROW LEVEL SECURITY;

-- RLS Policies dla to_try_list
CREATE POLICY "Users can view own to-try list" ON to_try_list
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own to-try list" ON to_try_list
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own to-try list" ON to_try_list
  FOR DELETE
  USING (auth.uid() = user_id);
