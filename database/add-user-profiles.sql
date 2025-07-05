-- Add user_profiles table for storing user information
-- This table will store user profile data including verification status

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  username VARCHAR(50),
  verification_level VARCHAR(20) DEFAULT 'None' CHECK (verification_level IN ('None', 'Device', 'Orb')),
  device_verified_at TIMESTAMP,
  orb_verified_at TIMESTAMP,
  notifications_enabled BOOLEAN DEFAULT true,
  total_rewards_earned DECIMAL(18, 8) DEFAULT 0,
  forms_created_count INTEGER DEFAULT 0,
  forms_submitted_count INTEGER DEFAULT 0,
  forms_accepted_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON user_profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_profiles_verification_level ON user_profiles(verification_level);

-- Add verification_logs table to track verification history
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  verification_type VARCHAR(20) NOT NULL CHECK (verification_type IN ('Device', 'Orb')),
  world_id_payload JSONB,
  verified_at TIMESTAMP DEFAULT NOW(),
  action_id VARCHAR(100),
  signal VARCHAR(100)
);

-- Add index for verification logs
CREATE INDEX IF NOT EXISTS idx_verification_logs_wallet_address ON verification_logs(wallet_address);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE user_profiles IS 'User profile information including verification status and stats';
COMMENT ON TABLE verification_logs IS 'Log of all World ID verifications performed by users';
COMMENT ON COLUMN user_profiles.verification_level IS 'Highest verification level achieved by the user';
COMMENT ON COLUMN user_profiles.total_rewards_earned IS 'Total rewards earned across all forms';
