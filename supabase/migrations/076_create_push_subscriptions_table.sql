-- Migration: Create push_subscriptions table for web push notifications
-- Description: Stores push notification subscriptions from service workers
-- Security: RLS enabled with user-based access control

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT push_subscriptions_endpoint_check CHECK (length(endpoint) > 0),
    CONSTRAINT push_subscriptions_p256dh_check CHECK (length(p256dh) > 0),
    CONSTRAINT push_subscriptions_auth_check CHECK (length(auth) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_is_active ON push_subscriptions(is_active);

-- Enable Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own subscriptions (or anonymous subscriptions)
CREATE POLICY "Users can view own subscriptions"
    ON push_subscriptions
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR user_id IS NULL
    );

-- Users can insert their own subscriptions (or anonymous)
CREATE POLICY "Users can create own subscriptions"
    ON push_subscriptions
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR user_id IS NULL
    );

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
    ON push_subscriptions
    FOR UPDATE
    USING (
        auth.uid() = user_id
        OR user_id IS NULL
    )
    WITH CHECK (
        auth.uid() = user_id
        OR user_id IS NULL
    );

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
    ON push_subscriptions
    FOR DELETE
    USING (
        auth.uid() = user_id
        OR user_id IS NULL
    );

-- Admins can view all subscriptions (for sending notifications)
CREATE POLICY "Admins can view all subscriptions"
    ON push_subscriptions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE admins.user_id = auth.uid()
            AND admins.is_active = true
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_subscriptions_updated_at
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- Add comment to table
COMMENT ON TABLE push_subscriptions IS 'Stores web push notification subscriptions from service workers';
COMMENT ON COLUMN push_subscriptions.user_id IS 'User who subscribed (nullable for anonymous users)';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push service endpoint URL (unique)';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Public key for encryption';
COMMENT ON COLUMN push_subscriptions.auth IS 'Authentication secret for encryption';
COMMENT ON COLUMN push_subscriptions.is_active IS 'Whether subscription is active';
