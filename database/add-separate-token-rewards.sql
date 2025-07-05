-- Add separate USDC and WLD reward tracking to user_profiles table
-- Migration script to add individual token reward tracking

-- Add new columns for separate token rewards
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS total_rewards_usdc DECIMAL(18, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_rewards_wld DECIMAL(18, 8) DEFAULT 0;

-- Update existing data: if there are existing total_rewards_earned, we'll assume they are mixed
-- In a real migration, you would need to analyze the payment_references table to split correctly
-- For now, we'll keep the existing total_rewards_earned as is and start fresh with the new columns

-- Add comments
COMMENT ON COLUMN user_profiles.total_rewards_usdc IS 'Total USDC rewards earned across all forms';
COMMENT ON COLUMN user_profiles.total_rewards_wld IS 'Total WLD rewards earned across all forms';
COMMENT ON COLUMN user_profiles.total_rewards_earned IS 'Legacy total rewards (kept for backward compatibility)';

-- Add index for performance (optional, but good practice)
CREATE INDEX IF NOT EXISTS idx_user_profiles_rewards_usdc ON user_profiles(total_rewards_usdc);
CREATE INDEX IF NOT EXISTS idx_user_profiles_rewards_wld ON user_profiles(total_rewards_wld);
