-- Create advertising_inquiries table for storing advertising contact form submissions
CREATE TABLE IF NOT EXISTS advertising_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  company_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_advertising_inquiries_created_at ON advertising_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_advertising_inquiries_status ON advertising_inquiries(status);

-- Enable RLS
ALTER TABLE advertising_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for the contact form)
CREATE POLICY "Anyone can submit advertising inquiries"
  ON advertising_inquiries
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only admins can view inquiries
CREATE POLICY "Admins can view advertising inquiries"
  ON advertising_inquiries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Only admins can update inquiries
CREATE POLICY "Admins can update advertising inquiries"
  ON advertising_inquiries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
