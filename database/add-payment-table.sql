-- Add payment_references table only (for existing databases)
-- Run this if you already have the other tables and just need the payment table

CREATE TABLE IF NOT EXISTS payment_references (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_id VARCHAR(255) NOT NULL UNIQUE,
  transaction_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'initiated',
  form_id UUID REFERENCES bounty_forms(id) ON DELETE SET NULL,
  response_id UUID REFERENCES form_;responses(id) ON DELETE SET NULL,
  metadata JSONB,
  verification_result JSONB,
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payment_references_ref ON payment_references(reference_id);
CREATE INDEX IF NOT EXISTS idx_payment_references_status ON payment_references(status);
CREATE INDEX IF NOT EXISTS idx_payment_references_transaction ON payment_references(transaction_id);

-- Add trigger
DROP TRIGGER IF EXISTS update_payment_references_updated_at ON payment_references;
CREATE TRIGGER update_payment_references_updated_at 
  BEFORE UPDATE ON payment_references 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE payment_references ENABLE ROW LEVEL SECURITY;

-- Add policy
DROP POLICY IF EXISTS "Enable all operations for payment references" ON payment_references;
CREATE POLICY "Enable all operations for payment references" ON payment_references
  FOR ALL USING (TRUE);
