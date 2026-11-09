-- ============================================================================
-- ESTATEEASE: SAFE UPGRADE & SEED SCRIPT FOR SUPABASE
-- Run this in your Supabase SQL Editor to enable RLS permissions and add seed data
-- ============================================================================

-- 1. Safely add helper columns if they don't already exist
ALTER TABLE properties ADD COLUMN IF NOT EXISTS building_name VARCHAR(100) DEFAULT 'Shanti Niwas Complex';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_number VARCHAR(20);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_occupied BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10, 2) DEFAULT 0;

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS lease_start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmed_by VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE issues ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- 2. Configure Row Level Security (RLS) so the app can read, insert, and update
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for properties" ON properties;
CREATE POLICY "Allow all for properties" ON properties FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for tenants" ON tenants;
CREATE POLICY "Allow all for tenants" ON tenants FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for payments" ON payments;
CREATE POLICY "Allow all for payments" ON payments FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for issues" ON issues;
CREATE POLICY "Allow all for issues" ON issues FOR ALL TO public USING (true) WITH CHECK (true);

-- 3. Insert realistic Indian flats, shops, tenants, payments and maintenance tickets
INSERT INTO properties (id, unit_code, unit_type, rent_amount, due_day, security_deposit, building_name, is_occupied) VALUES
('b1111111-1111-1111-1111-111111111111', 'Flat 101', 'Flat', 18000.00, 5, 36000.00, 'Shanti Niwas Complex', true),
('b2222222-2222-2222-2222-222222222222', 'Flat 102', 'Flat', 16500.00, 10, 33000.00, 'Shanti Niwas Complex', true),
('b3333333-3333-3333-3333-333333333333', 'Flat 201', 'Flat', 22000.00, 12, 44000.00, 'Shanti Niwas Complex', true),
('b4444444-4444-4444-4444-444444444444', 'Shop 01',  'Shop', 28000.00, 1, 60000.00, 'Commercial Plaza Market', true),
('b5555555-5555-5555-5555-555555555555', 'Shop 02',  'Shop', 32000.00, 12, 70000.00, 'Commercial Plaza Market', true),
('b6666666-6666-6666-6666-666666666666', 'Shop 03',  'Shop', 25000.00, 15, 50000.00, 'Commercial Plaza Market', false)
ON CONFLICT (unit_code) DO NOTHING;

INSERT INTO tenants (id, property_id, name, phone, email, is_active) VALUES
('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Rahul Sharma', '+919876543210', 'rahul.sharma@example.com', true),
('c2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Priya Kulkarni', '+919822012345', 'priya.k@example.com', true),
('c3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'Amit Verma', '+919911223344', 'amit.verma@example.com', true),
('c4444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'Gupta General Store (Manoj Gupta)', '+919845098765', 'gupta.store@example.com', true),
('c5555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 'Apollo Pharmacy Franchise (S. Nair)', '+919765432109', 'apollo.plaza@example.com', true)
ON CONFLICT DO NOTHING;

INSERT INTO payments (id, property_id, tenant_id, amount, date, month, payment_method, status, reference_id, confirmed_by, receipt_number) VALUES
('d1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 18000.00, '2026-11-04', 'November 2026', 'UPI', 'Verified', 'UPI-983719283741', 'Landlord', 'RCP-202611-1001'),
('d2222222-2222-2222-2222-222222222222', 'b4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 28000.00, '2026-11-01', 'November 2026', 'Cash', 'Verified', 'CASH-REC-NOV', 'Father', 'RCP-202611-1002'),
('d3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 16500.00, '2026-11-08', 'November 2026', 'UPI', 'Pending', 'UPI-481928392104', NULL, NULL),
('d4444444-4444-4444-4444-444444444444', 'b5555555-5555-5555-5555-555555555555', 'c5555555-5555-5555-5555-555555555555', 32000.00, '2026-11-09', 'November 2026', 'Cash', 'Pending', 'CASH-ALERT-HANDOVER', NULL, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO issues (id, property_id, tenant_id, category, priority, title, description, status) VALUES
('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Plumbing', 'High', 'Kitchen sink pipe dripping', 'The PVC drain pipe under the kitchen sink is leaking when tap is opened.', 'Pending'),
('e2222222-2222-2222-2222-222222222222', 'b4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 'Shutter', 'Urgent', 'Shop front rolling shutter jammed', 'Right side rolling shutter spring is tight and getting stuck halfway.', 'In Progress'),
('e3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Electrical', 'Low', 'Balcony ceiling light fixture replacement', 'Bulb holder in the balcony is loose and needs replacement.', 'Resolved')
ON CONFLICT DO NOTHING;
