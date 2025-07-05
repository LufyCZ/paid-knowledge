-- Migration to fix creator_id field type for wallet addresses
-- Run this in your Supabase SQL Editor

-- Change creator_id from UUID to VARCHAR to store wallet addresses
ALTER TABLE bounty_forms ALTER COLUMN creator_id TYPE VARCHAR(100);

-- Add a comment to clarify what this field stores
COMMENT ON COLUMN bounty_forms.creator_id IS 'Wallet address of the quest creator (Ethereum address)';

-- Update any existing records that might have been stored incorrectly
-- (This is safe to run even if there are no records)
UPDATE bounty_forms SET creator_id = LOWER(creator_id) WHERE creator_id IS NOT NULL;

-- Recreate the index if it exists
DROP INDEX IF EXISTS idx_bounty_forms_creator;
CREATE INDEX idx_bounty_forms_creator ON bounty_forms(creator_id);
