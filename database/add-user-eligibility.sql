-- Add user_eligibility column to bounty_forms table
-- This migration adds support for specifying who can participate in forms

-- Add the user_eligibility column with a default value
ALTER TABLE bounty_forms 
ADD COLUMN user_eligibility VARCHAR(20) DEFAULT 'All' 
CHECK (user_eligibility IN ('Orb', 'Device', 'All'));

-- Update existing records to have the default value
UPDATE bounty_forms 
SET user_eligibility = 'All' 
WHERE user_eligibility IS NULL;

-- Make the column NOT NULL now that all records have values
ALTER TABLE bounty_forms 
ALTER COLUMN user_eligibility SET NOT NULL;

-- Add a comment to explain the column
COMMENT ON COLUMN bounty_forms.user_eligibility IS 'Specifies which World ID verification levels can participate: Orb (highest security), Device (standard), or All (both)';
