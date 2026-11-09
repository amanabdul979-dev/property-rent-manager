-- ============================================================================
-- ESTATEEASE: SUPABASE CLOUD DATABASE SCHEMA & MIGRATION SCRIPT
-- Completely idempotent & safe to run repeatedly in Supabase SQL Editor
-- ============================================================================

-- Ensure public schema is active
SET search_path TO public;

-- Enable uuid-ossp in extensions schema if needed (for backwards compatibility)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- ----------------------------------------------------------------------------
-- 1. DROP EXISTING CONSTRAINTS & TABLES (CLEAN RE-INIT IF NEEDED)
-- ----------------------------------------------------------------------------
-- Drop triggers if they exist
DROP TRIGGER IF EXISTS trg_payment_receipt_generator ON payments;
DROP TRIGGER IF EXISTS trg_properties_updated_at ON properties;
DROP TRIGGER IF EXISTS trg_tenants_updated_at ON tenants;
DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS trg_issues_updated_at ON issues;

-- ----------------------------------------------------------------------------
-- 2. CREATE TABLES
-- Uses PostgreSQL native gen_random_uuid() (standard in all Supabase instances)
-- ----------------------------------------------------------------------------

-- Table 1: PROPERTIES (Flats and Shops)
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_code VARCHAR(50) NOT NULL UNIQUE,
    unit_type VARCHAR(20) NOT NULL CHECK (unit_type IN ('Flat', 'Shop')),
    rent_amount NUMERIC(10, 2) NOT NULL CHECK (rent_amount > 0),
    due_day SMALLINT NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    security_deposit NUMERIC(10, 2) DEFAULT 0 CHECK (security_deposit >= 0),
    building_name VARCHAR(100) DEFAULT 'Shanti Niwas Complex',
    floor_number VARCHAR(20),
    electricity_meter_no VARCHAR(50),
    is_occupied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: TENANTS (Active tenant roster)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    id_proof_type VARCHAR(50),
    id_proof_number VARCHAR(50),
    lease_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    lease_end_date DATE,
    emergency_contact VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: PAYMENTS (UPI UTRs and Cash Approvals)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    month VARCHAR(20) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('UPI', 'Cash')),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Verified')),
    reference_id VARCHAR(100),
    notes TEXT,
    confirmed_by VARCHAR(50),
    confirmed_at TIMESTAMPTZ,
    receipt_number VARCHAR(50) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 4: ISSUES / MAINTENANCE TICKETS
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Plumbing', 'Electrical', 'Structural', 'Shutter', 'Leaks', 'Other')),
    priority VARCHAR(20) NOT NULL DEFAULT 'Low' CHECK (priority IN ('Low', 'High', 'Urgent')),
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Resolved')),
    assigned_contractor VARCHAR(100),
    estimated_cost NUMERIC(10, 2) DEFAULT 0,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. INDEXES FOR HIGH-SPEED LOOKUPS
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_properties_due_day ON properties(due_day);
CREATE INDEX IF NOT EXISTS idx_properties_unit_type ON properties(unit_type);
CREATE INDEX IF NOT EXISTS idx_tenants_phone ON tenants(phone);
CREATE INDEX IF NOT EXISTS idx_tenants_property ON tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_month ON payments(month);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_property ON issues(property_id);

-- ----------------------------------------------------------------------------
-- 4. TRIGGERS & FUNCTIONS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_issues_updated_at BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Verified' AND (NEW.receipt_number IS NULL OR NEW.receipt_number = '') THEN
        NEW.receipt_number := 'RCP-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(SUBSTRING(NEW.id::TEXT FROM 1 FOR 6), 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_receipt_generator BEFORE INSERT OR UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION generate_receipt_number();

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Safe re-creation with DROP POLICY IF EXISTS
-- ----------------------------------------------------------------------------
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Landlord authenticated policies
DROP POLICY IF EXISTS "Landlord full access to properties" ON properties;
CREATE POLICY "Landlord full access to properties" ON properties FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Landlord full access to tenants" ON tenants;
CREATE POLICY "Landlord full access to tenants" ON tenants FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Landlord full access to payments" ON payments;
CREATE POLICY "Landlord full access to payments" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Landlord full access to issues" ON issues;
CREATE POLICY "Landlord full access to issues" ON issues FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Public / Anonymous policies (Tenant portal self-service)
DROP POLICY IF EXISTS "Public read properties for tenant portal" ON properties;
CREATE POLICY "Public read properties for tenant portal" ON properties FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public insert properties" ON properties;
CREATE POLICY "Public insert properties" ON properties FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public update properties" ON properties;
CREATE POLICY "Public update properties" ON properties FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "Public read tenants for portal authentication" ON tenants;
CREATE POLICY "Public read tenants for portal authentication" ON tenants FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public insert tenants" ON tenants;
CREATE POLICY "Public insert tenants" ON tenants FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public update tenants" ON tenants;
CREATE POLICY "Public update tenants" ON tenants FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "Public submit payments from tenant portal" ON payments;
CREATE POLICY "Public submit payments from tenant portal" ON payments FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public read payments for tenant" ON payments;
CREATE POLICY "Public read payments for tenant" ON payments FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public update payments for verification" ON payments;
CREATE POLICY "Public update payments for verification" ON payments FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "Public submit issues from tenant portal" ON issues;
CREATE POLICY "Public submit issues from tenant portal" ON issues FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Public read issues for tenant" ON issues;
CREATE POLICY "Public read issues for tenant" ON issues FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public update issues for status" ON issues;
CREATE POLICY "Public update issues for status" ON issues FOR UPDATE TO anon USING (true);

-- ----------------------------------------------------------------------------
-- 6. SEED DATA (Flats, Shops, Tenants, Payments, Issues)
-- ----------------------------------------------------------------------------
INSERT INTO properties (id, unit_code, unit_type, rent_amount, due_day, security_deposit, building_name, floor_number, is_occupied) VALUES
('b1111111-1111-1111-1111-111111111111', 'Flat 101', 'Flat', 18000.00, 5, 36000.00, 'Shanti Niwas Complex', '1st Floor', true),
('b2222222-2222-2222-2222-222222222222', 'Flat 102', 'Flat', 16500.00, 10, 33000.00, 'Shanti Niwas Complex', '1st Floor', true),
('b3333333-3333-3333-3333-333333333333', 'Flat 201', 'Flat', 22000.00, 12, 44000.00, 'Shanti Niwas Complex', '2nd Floor', true),
('b4444444-4444-4444-4444-444444444444', 'Shop 01',  'Shop', 28000.00, 1, 60000.00, 'Commercial Plaza Market', 'Ground Floor', true),
('b5555555-5555-5555-5555-555555555555', 'Shop 02',  'Shop', 32000.00, 12, 70000.00, 'Commercial Plaza Market', 'Ground Floor', true),
('b6666666-6666-6666-6666-666666666666', 'Shop 03',  'Shop', 25000.00, 15, 50000.00, 'Commercial Plaza Market', 'Ground Floor', false)
ON CONFLICT (unit_code) DO NOTHING;

INSERT INTO tenants (id, property_id, name, phone, email, lease_start_date, is_active) VALUES
('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Rahul Sharma', '+919876543210', 'rahul.sharma@example.com', '2025-04-01', true),
('c2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Priya Kulkarni', '+919822012345', 'priya.k@example.com', '2025-06-15', true),
('c3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'Amit Verma', '+919911223344', 'amit.verma@example.com', '2026-01-10', true),
('c4444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'Gupta General Store (Manoj Gupta)', '+919845098765', 'gupta.store@example.com', '2024-11-01', true),
('c5555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 'Apollo Pharmacy Franchise (S. Nair)', '+919765432109', 'apollo.plaza@example.com', '2024-03-01', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO payments (id, property_id, tenant_id, amount, date, month, payment_method, status, reference_id, confirmed_by, notes, receipt_number) VALUES
('d1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 18000.00, '2026-11-04', 'November 2026', 'UPI', 'Verified', 'UPI-983719283741', 'Landlord', 'Paid via GooglePay UPI', 'RCP-202611-1001'),
('d2222222-2222-2222-2222-222222222222', 'b4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 28000.00, '2026-11-01', 'November 2026', 'Cash', 'Verified', 'CASH-REC-NOV', 'Father', 'Cash collected in person at shop', 'RCP-202611-1002'),
('d3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 16500.00, '2026-11-08', 'November 2026', 'UPI', 'Pending', 'UPI-481928392104', NULL, 'Tenant submitted UPI UTR via portal', NULL),
('d4444444-4444-4444-4444-444444444444', 'b5555555-5555-5555-5555-555555555555', 'c5555555-5555-5555-5555-555555555555', 32000.00, '2026-11-09', 'November 2026', 'Cash', 'Pending', 'CASH-ALERT', NULL, 'Tenant notified: Cash ready at counter', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO issues (id, property_id, tenant_id, category, priority, title, description, status) VALUES
('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Plumbing', 'High', 'Kitchen sink pipe dripping', 'The PVC drain pipe under the kitchen sink is leaking when tap is opened.', 'Pending'),
('e2222222-2222-2222-2222-222222222222', 'b4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 'Shutter', 'Urgent', 'Shop front rolling shutter jammed', 'Right side rolling shutter spring is tight and getting stuck halfway.', 'In Progress'),
('e3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Electrical', 'Low', 'Balcony ceiling light fixture replacement', 'Bulb holder in the balcony is loose and needs replacement.', 'Resolved')
ON CONFLICT (id) DO NOTHING;
