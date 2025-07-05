-- Migration: Add updated_at column to form_responses table
-- This fixes the missing updated_at column that causes errors when updating response status

-- Add the updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'form_responses' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE form_responses 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Update existing rows to have a timestamp
        UPDATE form_responses 
        SET updated_at = submitted_at 
        WHERE updated_at IS NULL;
        
        RAISE NOTICE 'Added updated_at column to form_responses table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in form_responses table';
    END IF;
END $$;

-- Optional: Create a trigger to automatically update the updated_at column
-- when any row in form_responses is modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it already exists, then create it
DROP TRIGGER IF EXISTS update_form_responses_updated_at ON form_responses;
CREATE TRIGGER update_form_responses_updated_at
    BEFORE UPDATE ON form_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add index for better performance on updated_at queries
CREATE INDEX IF NOT EXISTS idx_form_responses_updated_at ON form_responses(updated_at);
