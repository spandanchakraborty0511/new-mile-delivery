-- ============================================================
-- Migration 002: Zones, Pincodes, Rate Cards, COD Surcharges
-- ============================================================

CREATE TYPE order_type_enum AS ENUM ('B2B', 'B2C');

CREATE TABLE IF NOT EXISTS zones (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fulfill the deferred foreign key constraint from migration 001
ALTER TABLE users ADD CONSTRAINT fk_users_zone 
    FOREIGN KEY (current_zone_id) REFERENCES zones(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS pincodes (
    pincode     VARCHAR(20) PRIMARY KEY,
    zone_id     UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rate_cards (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_zone_id      UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    destination_zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    order_type          order_type_enum NOT NULL,
    base_fee            NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    per_kg_rate         NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_rate_card UNIQUE (source_zone_id, destination_zone_id, order_type)
);

CREATE TABLE IF NOT EXISTS cod_surcharges (
    order_type       order_type_enum PRIMARY KEY,
    surcharge_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO cod_surcharges (order_type, surcharge_amount) 
VALUES ('B2B', 0.00), ('B2C', 0.00) 
ON CONFLICT DO NOTHING;

CREATE TRIGGER trg_zones_updated_at
BEFORE UPDATE ON zones
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_rate_cards_updated_at
BEFORE UPDATE ON rate_cards
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cod_surcharges_updated_at
BEFORE UPDATE ON cod_surcharges
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
