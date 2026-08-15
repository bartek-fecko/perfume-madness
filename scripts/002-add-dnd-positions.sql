-- Kolejność perfum w obrębie marki (drag & drop wewnątrz dialogu marki)
ALTER TABLE perfumes
  ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_perfumes_position ON perfumes(user_id, position);

-- Kolejność marek na głównej siatce (drag & drop kafelków)
CREATE TABLE IF NOT EXISTS brand_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_key TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, brand_key)
);

CREATE INDEX IF NOT EXISTS idx_brand_positions_user ON brand_positions(user_id, position);

ALTER TABLE brand_positions ENABLE ROW LEVEL SECURITY;

-- Właściciel widzi i modyfikuje swoje pozycje marek
CREATE POLICY "Users can view own brand positions" ON brand_positions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand positions" ON brand_positions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand positions" ON brand_positions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand positions" ON brand_positions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Obserwujący mogą zobaczyć pozycje marek, tak jak perfumy
CREATE POLICY "Users can view followed users brand positions" ON brand_positions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_follows
      WHERE follower_id = auth.uid()
      AND following_id = brand_positions.user_id
    )
  );
