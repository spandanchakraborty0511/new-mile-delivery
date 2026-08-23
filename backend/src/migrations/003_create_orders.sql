-- ============================================================
-- Migration 003: Orders and Order Status History
-- ============================================================

CREATE TYPE order_status AS ENUM (
    'Pending',
    'Assigned',
    'Picked Up',
    'In Transit',
    'Out for Delivery',
    'Delivered',
    'Failed'
);

CREATE TYPE payment_type_enum AS ENUM ('Prepaid', 'COD');

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    pickup_address TEXT NOT NULL,
    pickup_pincode VARCHAR(20) NOT NULL,
    pickup_zone_id UUID REFERENCES zones(id),
    
    drop_address TEXT NOT NULL,
    drop_pincode VARCHAR(20) NOT NULL,
    drop_zone_id UUID REFERENCES zones(id),
    
    package_length_cm NUMERIC(10, 2) NOT NULL,
    package_width_cm NUMERIC(10, 2) NOT NULL,
    package_height_cm NUMERIC(10, 2) NOT NULL,
    actual_weight_kg NUMERIC(10, 2) NOT NULL,
    volumetric_weight_kg NUMERIC(10, 2) NOT NULL,
    chargeable_weight_kg NUMERIC(10, 2) NOT NULL,
    
    order_type order_type_enum NOT NULL,
    payment_type payment_type_enum NOT NULL,
    
    base_fee NUMERIC(10, 2) NOT NULL,
    per_kg_rate NUMERIC(10, 2) NOT NULL,
    weight_charge NUMERIC(10, 2) NOT NULL,
    cod_surcharge NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_charge NUMERIC(10, 2) NOT NULL,
    
    status order_status NOT NULL DEFAULT 'Pending',
    assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- AI Novelty fields
    risk_score NUMERIC(5, 2),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_agent ON orders(assigned_agent_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_pickup_zone ON orders(pickup_zone_id);

CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status order_status NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
