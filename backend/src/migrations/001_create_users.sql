-- ============================================================
-- Migration 001: Users, Roles, Refresh Tokens, Email Verification
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role is a fixed enum: customer, delivery_agent, admin
CREATE TYPE user_role AS ENUM ('customer', 'delivery_agent', 'admin');

CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name           VARCHAR(150) NOT NULL,
    email               VARCHAR(150) NOT NULL UNIQUE,
    phone               VARCHAR(20) NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    role                user_role NOT NULL DEFAULT 'customer',
    is_email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,

    -- delivery_agent-specific fields (nullable for other roles)
    current_zone_id     UUID,   -- FK to zones(id) added in migration 002 via ALTER TABLE, once zones exists
    current_latitude    DOUBLE PRECISION,
    current_longitude   DOUBLE PRECISION,
    is_available        BOOLEAN DEFAULT TRUE,        -- agent toggles this off when off-duty
    max_concurrent_orders SMALLINT DEFAULT 5,         -- caps how many active orders an agent can hold

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_agent_availability ON users(role, is_available) WHERE role = 'delivery_agent';

-- Refresh tokens are stored (hashed) so they can be revoked individually / on logout-all
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- Email verification / password reset tokens (single table, purpose flag)
CREATE TYPE token_purpose AS ENUM ('email_verify', 'password_reset');

CREATE TABLE IF NOT EXISTS action_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose         token_purpose NOT NULL,
    token_hash      VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    used            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_action_tokens_user ON action_tokens(user_id, purpose);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- NOTE: current_zone_id is a plain UUID here. Migration 002 (which creates the zones table)
-- runs: ALTER TABLE users ADD CONSTRAINT fk_users_zone FOREIGN KEY (current_zone_id)
-- REFERENCES zones(id) ON DELETE SET NULL;  -- keeps migrations strictly sequential and each one runnable on its own.
