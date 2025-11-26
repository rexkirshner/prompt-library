-- Add compound prompt support

-- Step 1: Add columns to prompts table
ALTER TABLE prompts
  ADD COLUMN is_compound BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN max_depth INTEGER;

-- Step 2: Create compound_prompt_components table
CREATE TABLE compound_prompt_components (
  id TEXT PRIMARY KEY,
  compound_prompt_id TEXT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  component_prompt_id TEXT REFERENCES prompts(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL,
  custom_text_before TEXT,
  custom_text_after TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure unique positions within a compound prompt
  UNIQUE(compound_prompt_id, position),

  -- Prevent self-reference at database level
  CHECK (compound_prompt_id != component_prompt_id)
);

-- Step 3: Create indexes for efficient lookups
-- Index for finding all compounds using a specific base prompt
CREATE INDEX idx_compound_components_base
  ON compound_prompt_components(component_prompt_id);

-- Index for ordered retrieval of components
CREATE INDEX idx_compound_components_order
  ON compound_prompt_components(compound_prompt_id, position);

-- Index for finding compound prompts
CREATE INDEX idx_prompts_compound
  ON prompts(is_compound)
  WHERE is_compound = TRUE;

-- Index for approved compound prompts (public listing)
CREATE INDEX idx_prompts_compound_approved
  ON prompts(is_compound, status, deleted_at)
  WHERE is_compound = TRUE AND status = 'APPROVED' AND deleted_at IS NULL;

-- Step 4: Add check constraint to ensure compound prompts don't have prompt_text
-- Note: This will allow NULL prompt_text for compound prompts
ALTER TABLE prompts
  ADD CONSTRAINT compound_prompt_no_text CHECK (
    (is_compound = FALSE AND prompt_text IS NOT NULL) OR
    (is_compound = TRUE AND prompt_text IS NULL)
  );
