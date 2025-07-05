-- Add featured column to bounty_forms table
-- Migration: Add featured flag for forms to be displayed in the featured section

-- Add the featured column with default value false
ALTER TABLE bounty_forms 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Add a comment for documentation
COMMENT ON COLUMN bounty_forms.featured IS 'Whether this form should be displayed in the featured section on the landing page';

-- Create an index for better performance when querying featured forms
CREATE INDEX IF NOT EXISTS idx_bounty_forms_featured ON bounty_forms(featured) WHERE featured = true;

-- Update a few existing forms to be featured (for testing)
-- You can run this manually or adjust as needed
UPDATE bounty_forms 
SET featured = true 
WHERE id IN (
  SELECT id 
  FROM bounty_forms 
  WHERE status = 'active' 
  AND visibility = 'Public'
  AND end_date > NOW()
  ORDER BY created_at DESC 
  LIMIT 3
);
