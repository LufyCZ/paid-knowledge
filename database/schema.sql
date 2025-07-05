-- Supabase SQL Schema for Questy Bounty Quests
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (drop and recreate to avoid conflicts)
DROP TYPE IF EXISTS visibility_type CASCADE;
DROP TYPE IF EXISTS reward_token_type CASCADE;
DROP TYPE IF EXISTS form_status_type CASCADE;
DROP TYPE IF EXISTS response_status_type CASCADE;

CREATE TYPE visibility_type AS ENUM ('Public', 'Private');
CREATE TYPE reward_token_type AS ENUM ('USDC', 'WLD');
CREATE TYPE form_status_type AS ENUM ('draft', 'active', 'completed', 'cancelled');
CREATE TYPE response_status_type AS ENUM ('pending', 'approved', 'rejected', 'paid');

-- 1. Bounty Forms Table
CREATE TABLE bounty_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  visibility visibility_type NOT NULL DEFAULT 'Public',
  reward_per_question DECIMAL(10,2) NOT NULL CHECK (reward_per_question >= 0),
  reward_token reward_token_type NOT NULL DEFAULT 'USDC',
  creator_id VARCHAR(100), -- Wallet address of the quest creator
  status form_status_type NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- 2. Form Questions Table
CREATE TABLE form_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES bounty_forms(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  options TEXT[], -- Array of strings for choice-based questions
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique order within each form
  UNIQUE(form_id, order_index)
);

-- 3. Form Responses Table (for users who submit the form)
CREATE TABLE form_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES bounty_forms(id) ON DELETE CASCADE,
  user_id UUID, -- For future user authentication
  wallet_address VARCHAR(100), -- For wallet-based identification
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_reward DECIMAL(10,2) NOT NULL,
  reward_token reward_token_type NOT NULL,
  status response_status_type NOT NULL DEFAULT 'pending'
);

-- 4. Question Answers Table (individual answers within a response)
CREATE TABLE question_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES form_questions(id) ON DELETE CASCADE,
  answer_text TEXT, -- For text-based answers
  answer_options TEXT[], -- For multiple choice answers
  file_url TEXT, -- For file uploads (images, videos)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one answer per question per response
  UNIQUE(response_id, question_id)
);

-- 5. Payment References Table (for tracking Worldcoin payments)
CREATE TABLE payment_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_id VARCHAR(255) NOT NULL UNIQUE, -- The reference ID used in Worldcoin payment
  transaction_id VARCHAR(255), -- The transaction ID from Worldcoin
  status VARCHAR(50) NOT NULL DEFAULT 'initiated', -- initiated, confirmed, failed
  form_id UUID REFERENCES bounty_forms(id) ON DELETE SET NULL, -- Optional: link to a form
  response_id UUID REFERENCES form_responses(id) ON DELETE SET NULL, -- Optional: link to a response
  metadata JSONB, -- Additional payment details
  verification_result JSONB, -- Response from Worldcoin verification
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_bounty_forms_creator ON bounty_forms(creator_id);
CREATE INDEX idx_bounty_forms_status ON bounty_forms(status);
CREATE INDEX idx_bounty_forms_dates ON bounty_forms(start_date, end_date);
CREATE INDEX idx_form_questions_form ON form_questions(form_id, order_index);
CREATE INDEX idx_form_responses_form ON form_responses(form_id);
CREATE INDEX idx_form_responses_wallet ON form_responses(wallet_address);
CREATE INDEX idx_question_answers_response ON question_answers(response_id);
CREATE INDEX idx_payment_references_ref ON payment_references(reference_id);
CREATE INDEX idx_payment_references_status ON payment_references(status);
CREATE INDEX idx_payment_references_transaction ON payment_references(transaction_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_bounty_forms_updated_at 
  BEFORE UPDATE ON bounty_forms 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_questions_updated_at 
  BEFORE UPDATE ON form_questions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_references_updated_at 
  BEFORE UPDATE ON payment_references 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for security
ALTER TABLE bounty_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_references ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for now - adjust based on your auth needs)
-- For public read access to active forms
CREATE POLICY "Public forms are viewable by everyone" ON bounty_forms
  FOR SELECT USING (visibility = 'Public' AND status = 'active');

-- For form creators to manage their forms (adjust when you add authentication)
CREATE POLICY "Enable all operations for authenticated users" ON bounty_forms
  FOR ALL USING (TRUE);

CREATE POLICY "Enable all operations for form questions" ON form_questions
  FOR ALL USING (TRUE);

CREATE POLICY "Enable all operations for form responses" ON form_responses
  FOR ALL USING (TRUE);

CREATE POLICY "Enable all operations for question answers" ON question_answers
  FOR ALL USING (TRUE);

CREATE POLICY "Enable all operations for payment references" ON payment_references
  FOR ALL USING (TRUE);

-- Insert some sample data (optional)
-- INSERT INTO bounty_forms (name, description, start_date, end_date, visibility, reward_per_question, reward_token) 
-- VALUES 
-- ('Sample Survey', 'A sample bounty form for testing', '2025-01-01', '2025-12-31', 'Public', 1.00, 'USDC');
