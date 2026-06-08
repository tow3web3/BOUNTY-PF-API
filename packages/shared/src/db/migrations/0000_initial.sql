-- Agent GO — initial schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_usd DECIMAL(10, 2) NOT NULL,
  deadline TIMESTAMPTZ,
  link TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  raw_data JSONB,
  description_hash TEXT,
  creator_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bounty_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bounty_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('digital_automatable', 'digital_human', 'physical')),
  confidence DECIMAL(3, 2) NOT NULL,
  effort_estimate TEXT NOT NULL CHECK (effort_estimate IN ('low', 'medium', 'high')),
  reasoning TEXT NOT NULL,
  classified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description_hash_at_classification TEXT
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_address TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  hmac_secret TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  bounty_id UUID NOT NULL REFERENCES bounties(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  payer_address TEXT NOT NULL,
  amount_usd DECIMAL(10, 6) NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_external_id ON bounties(external_id);
CREATE INDEX IF NOT EXISTS idx_bounties_updated_at ON bounties(updated_at);
CREATE INDEX IF NOT EXISTS idx_bsh_bounty_id ON bounty_status_history(bounty_id);
CREATE INDEX IF NOT EXISTS idx_bc_category ON bounty_classifications(category);
CREATE INDEX IF NOT EXISTS idx_bc_bounty_id ON bounty_classifications(bounty_id);
CREATE INDEX IF NOT EXISTS idx_subs_active ON subscriptions(active, expires_at);
CREATE INDEX IF NOT EXISTS idx_subs_payer ON subscriptions(payer_address);
CREATE INDEX IF NOT EXISTS idx_wd_status_retry ON webhook_deliveries(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_wd_subscription_id ON webhook_deliveries(subscription_id);
CREATE INDEX IF NOT EXISTS idx_rev_endpoint_date ON revenue_events(endpoint, created_at);
