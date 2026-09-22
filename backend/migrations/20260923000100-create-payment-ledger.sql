-- Quatava payment ledger migration
-- PostgreSQL / Supabase compatible
-- Apply with psql, Supabase SQL editor, or your deployment migration runner.
-- This migration is intentionally idempotent and does not create foreign keys to
-- the existing user table because deployed installations may use different table
-- naming conventions. Enforce user ownership in the application service layer.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE payment_intent_status AS ENUM (
    'CREATED',
    'PENDING',
    'REQUIRES_ACTION',
    'SUCCEEDED',
    'FAILED',
    'EXPIRED',
    'CANCELLED',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_attempt_status AS ENUM (
    'CREATED',
    'PENDING',
    'SUCCEEDED',
    'FAILED',
    'EXPIRED',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE provider_event_status AS ENUM (
    'RECEIVED',
    'PROCESSING',
    'PROCESSED',
    'IGNORED',
    'FAILED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ledger_entry_direction AS ENUM ('CREDIT', 'DEBIT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ledger_entry_status AS ENUM ('PENDING', 'POSTED', 'REVERSED', 'VOIDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  country CHAR(2) NOT NULL,
  currency VARCHAR(12) NOT NULL,
  amount NUMERIC(38, 18) NOT NULL CHECK (amount > 0),
  purpose VARCHAR(48) NOT NULL DEFAULT 'WALLET_FUNDING',
  provider VARCHAR(48) NOT NULL,
  provider_reference VARCHAR(255),
  idempotency_key VARCHAR(255) NOT NULL,
  status payment_intent_status NOT NULL DEFAULT 'CREATED',
  expires_at TIMESTAMPTZ,
  succeeded_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payment_intents_country_code CHECK (country = UPPER(country)),
  CONSTRAINT payment_intents_currency_code CHECK (currency = UPPER(currency)),
  CONSTRAINT payment_intents_user_id_key UNIQUE (user_id, idempotency_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_intents_provider_reference_uidx
  ON payment_intents(provider, provider_reference)
  WHERE provider_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS payment_intents_user_status_idx
  ON payment_intents(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS payment_intents_expiry_idx
  ON payment_intents(status, expires_at)
  WHERE status IN ('CREATED', 'PENDING', 'REQUIRES_ACTION');

CREATE TABLE IF NOT EXISTS payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id UUID NOT NULL REFERENCES payment_intents(id) ON DELETE CASCADE,
  provider VARCHAR(48) NOT NULL,
  request_id VARCHAR(255),
  provider_reference VARCHAR(255),
  status payment_attempt_status NOT NULL DEFAULT 'CREATED',
  error_code VARCHAR(128),
  error_message TEXT,
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_provider_request_uidx
  ON payment_attempts(provider, request_id)
  WHERE request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS payment_attempts_intent_idx
  ON payment_attempts(payment_intent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS provider_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(48) NOT NULL,
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(128) NOT NULL,
  signature VARCHAR(512),
  payload_hash VARCHAR(128) NOT NULL,
  payload JSONB NOT NULL,
  status provider_event_status NOT NULL DEFAULT 'RECEIVED',
  processing_attempts INTEGER NOT NULL DEFAULT 0 CHECK (processing_attempts >= 0),
  last_error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT provider_events_provider_event_uidx UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS provider_events_processing_idx
  ON provider_events(status, received_at)
  WHERE status IN ('RECEIVED', 'PROCESSING', 'FAILED');

CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  asset VARCHAR(32) NOT NULL,
  amount NUMERIC(38, 18) NOT NULL CHECK (amount > 0),
  direction ledger_entry_direction NOT NULL,
  source_type VARCHAR(64) NOT NULL,
  source_id UUID,
  status ledger_entry_status NOT NULL DEFAULT 'POSTED',
  description VARCHAR(255),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ledger_entries_source_uidx
  ON ledger_entries(user_id, asset, direction, source_type, source_id)
  WHERE source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ledger_entries_user_asset_idx
  ON ledger_entries(user_id, asset, status, created_at DESC);

CREATE INDEX IF NOT EXISTS ledger_entries_source_idx
  ON ledger_entries(source_type, source_id)
  WHERE source_id IS NOT NULL;

CREATE OR REPLACE FUNCTION set_payment_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payment_intents_set_updated_at ON payment_intents;
CREATE TRIGGER payment_intents_set_updated_at
  BEFORE UPDATE ON payment_intents
  FOR EACH ROW EXECUTE FUNCTION set_payment_updated_at();

DROP TRIGGER IF EXISTS payment_attempts_set_updated_at ON payment_attempts;
CREATE TRIGGER payment_attempts_set_updated_at
  BEFORE UPDATE ON payment_attempts
  FOR EACH ROW EXECUTE FUNCTION set_payment_updated_at();

DROP TRIGGER IF EXISTS provider_events_set_updated_at ON provider_events;
CREATE TRIGGER provider_events_set_updated_at
  BEFORE UPDATE ON provider_events
  FOR EACH ROW EXECUTE FUNCTION set_payment_updated_at();

DROP TRIGGER IF EXISTS ledger_entries_set_updated_at ON ledger_entries;
CREATE TRIGGER ledger_entries_set_updated_at
  BEFORE UPDATE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION set_payment_updated_at();

COMMIT;

-- Rollback (run manually only when intentionally removing the payment ledger):
-- BEGIN;
-- DROP TABLE IF EXISTS ledger_entries;
-- DROP TABLE IF EXISTS provider_events;
-- DROP TABLE IF EXISTS payment_attempts;
-- DROP TABLE IF EXISTS payment_intents;
-- DROP FUNCTION IF EXISTS set_payment_updated_at();
-- DROP TYPE IF EXISTS ledger_entry_status;
-- DROP TYPE IF EXISTS ledger_entry_direction;
-- DROP TYPE IF EXISTS provider_event_status;
-- DROP TYPE IF EXISTS payment_attempt_status;
-- DROP TYPE IF EXISTS payment_intent_status;
-- COMMIT;
