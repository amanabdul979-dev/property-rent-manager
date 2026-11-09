/**
 * Production-Ready Property & Rent Management Server
 * Hybrid Supabase Cloud & Local Persistence Engine
 * Supports seamless switching to Supabase Cloud PostgreSQL with SQLite fallback
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');

// Load .env.local or .env if present
const envLocalPath = path.join(__dirname, '.env.local');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envLocalPath)) {
  try { process.loadEnvFile(envLocalPath); } catch (_) {}
} else if (fs.existsSync(envPath)) {
  try { process.loadEnvFile(envPath); } catch (_) {}
}

const supabase = require('./lib/supabase.js');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.sqlite');

// Initialize Local SQLite fallback database
const db = new DatabaseSync(DB_FILE);

// Set up database schema in SQLite for local persistence
db.exec(`
  CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    unit_code TEXT NOT NULL UNIQUE,
    unit_type TEXT NOT NULL CHECK(unit_type IN ('Flat', 'Shop')),
    rent_amount REAL NOT NULL,
    due_day INTEGER NOT NULL,
    security_deposit REAL DEFAULT 0,
    building_name TEXT DEFAULT 'Shanti Niwas Complex',
    floor_number TEXT,
    is_occupied INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    property_id TEXT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    month TEXT NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('UPI', 'Cash')),
    status TEXT NOT NULL CHECK(status IN ('Pending', 'Verified')),
    reference_id TEXT,
    notes TEXT,
    confirmed_by TEXT,
    confirmed_at TEXT,
    receipt_number TEXT UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('Plumbing', 'Electrical', 'Structural', 'Shutter', 'Leaks', 'Other')),
    priority TEXT NOT NULL CHECK(priority IN ('Low', 'High', 'Urgent')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'In Progress', 'Resolved')),
    resolution_notes TEXT,
    resolved_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
  );
`);

// Seed SQLite if empty
const propCount = db.prepare('SELECT COUNT(*) as count FROM properties').get().count;
if (propCount === 0) {
  const insertProp = db.prepare(`
    INSERT INTO properties (id, unit_code, unit_type, rent_amount, due_day, security_deposit, building_name, is_occupied)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProp.run('b1111111-1111-1111-1111-111111111111', 'Flat 101', 'Flat', 18000, 5, 36000, 'Shanti Niwas Complex', 1);
  insertProp.run('b2222222-2222-2222-2222-222222222222', 'Flat 102', 'Flat', 16500, 10, 33000, 'Shanti Niwas Complex', 1);
  insertProp.run('b3333333-3333-3333-3333-333333333333', 'Flat 201', 'Flat', 22000, 12, 44000, 'Shanti Niwas Complex', 1);
  insertProp.run('b4444444-4444-4444-4444-444444444444', 'Shop 01', 'Shop', 28000, 1, 60000, 'Commercial Plaza Market', 1);
  insertProp.run('b5555555-5555-5555-5555-555555555555', 'Shop 02', 'Shop', 32000, 12, 70000, 'Commercial Plaza Market', 1);
  insertProp.run('b6666666-6666-6666-6666-666666666666', 'Shop 03', 'Shop', 25000, 15, 50000, 'Commercial Plaza Market', 0);

  const insertTenant = db.prepare(`
    INSERT INTO tenants (id, property_id, name, phone, email, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertTenant.run('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Rahul Sharma', '+919876543210', 'rahul.sharma@example.com', 1);
  insertTenant.run('c2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Priya Kulkarni', '+919822012345', 'priya.k@example.com', 1);
  insertTenant.run('c3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'Amit Verma', '+919911223344', 'amit.verma@example.com', 1);
  insertTenant.run('c4444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'Gupta General Store (Manoj Gupta)', '+919845098765', 'gupta.store@example.com', 1);
  insertTenant.run('c5555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 'Apollo Pharmacy Franchise (S. Nair)', '+919765432109', 'apollo.plaza@example.com', 1);

  const insertPayment = db.prepare(`
    INSERT INTO payments (id, property_id, tenant_id, amount, date, month, payment_method, status, reference_id, confirmed_by, receipt_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPayment.run('d1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 18000, '2026-11-04', 'November 2026', 'UPI', 'Verified', 'UPI-983719283741', 'Landlord', 'RCP-202611-1001');
  insertPayment.run('d2222222-2222-2222-2222-222222222222', 'b4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 28000, '2026-11-01', 'November 2026', 'Cash', 'Verified', 'CASH-REC-NOV', 'Father', 'RCP-202611-1002');
  insertPayment.run('d3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 16500, '2026-11-08', 'November 2026', 'UPI', 'Pending', 'UPI-481928392104', null, null);
  insertPayment.run('d4444444-4444-4444-4444-444444444444', 'b5555555-5555-5555-5555-555555555555', 'c5555555-5555-5555-5555-555555555555', 32000, '2026-11-09', 'November 2026', 'Cash', 'Pending', 'CASH-ALERT-HANDOVER', null, null);

  const insertIssue = db.prepare(`
    INSERT INTO issues (id, property_id, tenant_id, category, priority, title, description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertIssue.run('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Plumbing', 'High', 'Kitchen sink pipe dripping', 'The PVC drain pipe under the kitchen sink is leaking when tap is opened.', 'Pending');
  insertIssue.run('e2222222-2222-2222-2222-222222222222', 'b4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 'Shutter', 'Urgent', 'Shop front rolling shutter jammed', 'Right side rolling shutter spring is tight and getting stuck halfway.', 'In Progress');
  insertIssue.run('e3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Electrical', 'Low', 'Balcony ceiling light fixture replacement', 'Bulb holder in the balcony is loose and needs replacement.', 'Resolved');
}

// Helper: Format INR
function formatInr(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper: Number to Indian Words
function numberToIndianWords(num) {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n === 0) return '';
    let str = '';
    if (Math.floor(n / 10000000) > 0) {
      str += inWords(Math.floor(n / 10000000)) + 'Crore ';
      n %= 10000000;
    }
    if (Math.floor(n / 100000) > 0) {
      str += inWords(Math.floor(n / 100000)) + 'Lakh ';
      n %= 100000;
    }
    if (Math.floor(n / 1000) > 0) {
      str += inWords(Math.floor(n / 1000)) + 'Thousand ';
      n %= 1000;
    }
    if (Math.floor(n / 100) > 0) {
      str += inWords(Math.floor(n / 100)) + 'Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) {
        str += a[n];
      } else {
        str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
      }
    }
    return str;
  }

  const rounded = Math.floor(num);
  const words = inWords(rounded).trim();
  return words ? `Rupees ${words} Only` : 'Rupees Zero Only';
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const config = supabase.getSupabaseConfig();
  const useSupabase = config.isConfigured;

  // -------------------------------------------------------------
  // SUPABASE CONFIG & HEALTH CHECK API
  // -------------------------------------------------------------
  if (pathname === '/api/supabase/status' && req.method === 'GET') {
    let cloudConnected = false;
    let cloudError = null;

    if (config.isConfigured) {
      const test = await supabase.testConnection();
      cloudConnected = test.success;
      cloudError = test.error || null;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      isConfigured: config.isConfigured,
      url: config.url || null,
      cloudConnected,
      cloudError,
      activeDatabase: cloudConnected ? 'Supabase Cloud (PostgreSQL)' : 'Local Persistent Database (SQLite)',
      mode: cloudConnected ? 'cloud' : 'local'
    }));
    return;
  }

  if (pathname === '/api/supabase/config' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { url, key } = body;

      if (!url || !key) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'URL and Key are required.' }));
        return;
      }

      // Test connection first
      const test = await supabase.testConnection(url, key);
      if (!test.success) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: test.error }));
        return;
      }

      // Save to .env.local
      const envContent = `# SUPABASE CLOUD DATABASE CONFIGURATION\nNEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${key}\nPORT=${PORT}\n`;
      fs.writeFileSync(envLocalPath, envContent, 'utf8');

      // Update in-memory environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = url;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = key;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Successfully connected and saved to Supabase Cloud!'
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Schema download / view route
  if ((pathname === '/database/schema.sql' || pathname === '/database/fix_schema.sql') && req.method === 'GET') {
    const filename = pathname.endsWith('fix_schema.sql') ? 'fix_schema.sql' : 'schema.sql';
    const schemaPath = path.join(__dirname, 'database', filename);
    if (fs.existsSync(schemaPath)) {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(fs.readFileSync(schemaPath, 'utf8'));
      return;
    }
  }

  // -------------------------------------------------------------
  // SUPABASE SEED CLOUD DATA API
  // -------------------------------------------------------------
  if (pathname === '/api/supabase/seed' && req.method === 'POST') {
    try {
      if (!config.isConfigured) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Supabase credentials not configured in .env.local' }));
        return;
      }

      // Check current count
      const existing = await supabase.getProperties();
      if (existing.length > 0) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: `Supabase Cloud already has ${existing.length} properties.`,
          count: existing.length
        }));
        return;
      }

      // Insert seed properties
      const propRows = [
        { id: 'b1111111-1111-1111-1111-111111111111', unit_code: 'Flat 101', unit_type: 'Flat', rent_amount: 18000, due_day: 5, security_deposit: 36000 },
        { id: 'b2222222-2222-2222-2222-222222222222', unit_code: 'Flat 102', unit_type: 'Flat', rent_amount: 16500, due_day: 10, security_deposit: 33000 },
        { id: 'b3333333-3333-3333-3333-333333333333', unit_code: 'Flat 201', unit_type: 'Flat', rent_amount: 22000, due_day: 12, security_deposit: 44000 },
        { id: 'b4444444-4444-4444-4444-444444444444', unit_code: 'Shop 01',  unit_type: 'Shop', rent_amount: 28000, due_day: 1,  security_deposit: 60000 },
        { id: 'b5555555-5555-5555-5555-555555555555', unit_code: 'Shop 02',  unit_type: 'Shop', rent_amount: 32000, due_day: 12, security_deposit: 70000 },
        { id: 'b6666666-6666-6666-6666-666666666666', unit_code: 'Shop 03',  unit_type: 'Shop', rent_amount: 25000, due_day: 15, security_deposit: 50000 }
      ];

      await supabase.supabaseFetch('properties', { method: 'POST', body: propRows });

      // Insert tenants
      const tenantRows = [
        { id: 'c1111111-1111-1111-1111-111111111111', property_id: 'b1111111-1111-1111-1111-111111111111', name: 'Rahul Sharma', phone: '+919876543210', email: 'rahul.sharma@example.com' },
        { id: 'c2222222-2222-2222-2222-222222222222', property_id: 'b2222222-2222-2222-2222-222222222222', name: 'Priya Kulkarni', phone: '+919822012345', email: 'priya.k@example.com' },
        { id: 'c3333333-3333-3333-3333-333333333333', property_id: 'b3333333-3333-3333-3333-333333333333', name: 'Amit Verma', phone: '+919911223344', email: 'amit.verma@example.com' },
        { id: 'c4444444-4444-4444-4444-444444444444', property_id: 'b4444444-4444-4444-4444-444444444444', name: 'Gupta General Store (Manoj Gupta)', phone: '+919845098765', email: 'gupta.store@example.com' },
        { id: 'c5555555-5555-5555-5555-555555555555', property_id: 'b5555555-5555-5555-5555-555555555555', name: 'Apollo Pharmacy Franchise (S. Nair)', phone: '+919765432109', email: 'apollo.plaza@example.com' }
      ];

      await supabase.supabaseFetch('tenants', { method: 'POST', body: tenantRows });

      // Insert payments
      const paymentRows = [
        { id: 'd1111111-1111-1111-1111-111111111111', property_id: 'b1111111-1111-1111-1111-111111111111', tenant_id: 'c1111111-1111-1111-1111-111111111111', amount: 18000, date: '2026-11-04', month: 'November 2026', payment_method: 'UPI', status: 'Verified', reference_id: 'UPI-983719283741' },
        { id: 'd2222222-2222-2222-2222-222222222222', property_id: 'b4444444-4444-4444-4444-444444444444', tenant_id: 'c4444444-4444-4444-4444-444444444444', amount: 28000, date: '2026-11-01', month: 'November 2026', payment_method: 'Cash', status: 'Verified', reference_id: 'CASH-REC-NOV' },
        { id: 'd3333333-3333-3333-3333-333333333333', property_id: 'b2222222-2222-2222-2222-222222222222', tenant_id: 'c2222222-2222-2222-2222-222222222222', amount: 16500, date: '2026-11-08', month: 'November 2026', payment_method: 'UPI', status: 'Pending', reference_id: 'UPI-481928392104' },
        { id: 'd4444444-4444-4444-4444-444444444444', property_id: 'b5555555-5555-5555-5555-555555555555', tenant_id: 'c5555555-5555-5555-5555-555555555555', amount: 32000, date: '2026-11-09', month: 'November 2026', payment_method: 'Cash', status: 'Pending', reference_id: 'CASH-ALERT-HANDOVER' }
      ];

      await supabase.supabaseFetch('payments', { method: 'POST', body: paymentRows });

      // Insert issues
      const issueRows = [
        { id: 'e1111111-1111-1111-1111-111111111111', property_id: 'b1111111-1111-1111-1111-111111111111', tenant_id: 'c1111111-1111-1111-1111-111111111111', category: 'Plumbing', priority: 'High', title: 'Kitchen sink pipe dripping', description: 'The PVC drain pipe under the kitchen sink is leaking when tap is opened.', status: 'Pending' },
        { id: 'e2222222-2222-2222-2222-222222222222', property_id: 'b4444444-4444-4444-4444-444444444444', tenant_id: 'c4444444-4444-4444-4444-444444444444', category: 'Shutter', priority: 'Urgent', title: 'Shop front rolling shutter jammed', description: 'Right side rolling shutter spring is tight and getting stuck halfway.', status: 'In Progress' },
        { id: 'e3333333-3333-3333-3333-333333333333', property_id: 'b3333333-3333-3333-3333-333333333333', tenant_id: 'c3333333-3333-3333-3333-333333333333', category: 'Electrical', priority: 'Low', title: 'Balcony ceiling light fixture replacement', description: 'Bulb holder in the balcony is loose and needs replacement.', status: 'Resolved' }
      ];

      await supabase.supabaseFetch('issues', { method: 'POST', body: issueRows });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Successfully seeded 6 flats/shops, 5 tenants, 4 payments, and 3 tickets directly into Supabase Cloud!'
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // -------------------------------------------------------------
  // REST API: OVERVIEW METRICS
  // -------------------------------------------------------------
  if (req.method === 'GET' && pathname === '/api/overview') {
    try {
      if (useSupabase) {
        const stats = await supabase.getOverview();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats));
        return;
      }
    } catch (err) {
      console.warn('Falling back to SQLite overview:', err.message);
    }

    // Local fallback
    const verifiedTotal = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'Verified'").get().total;
    const pendingTotal = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'Pending'").get().total;
    const activeUnits = db.prepare("SELECT COUNT(*) as count FROM properties WHERE is_occupied = 1").get().count;
    const flats = db.prepare("SELECT COUNT(*) as count FROM properties WHERE unit_type = 'Flat'").get().count;
    const shops = db.prepare("SELECT COUNT(*) as count FROM properties WHERE unit_type = 'Shop'").get().count;
    const unresolvedIssues = db.prepare("SELECT COUNT(*) as count FROM issues WHERE status != 'Resolved'").get().count;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      monthlyRevenue: verifiedTotal,
      pendingDues: pendingTotal,
      totalActiveUnits: activeUnits,
      flatsCount: flats,
      shopsCount: shops,
      unresolvedTickets: unresolvedIssues,
      currentMonthName: 'November 2026'
    }));
    return;
  }

  // -------------------------------------------------------------
  // REST API: PROPERTIES
  // -------------------------------------------------------------
  if (pathname === '/api/properties') {
    if (req.method === 'GET') {
      try {
        if (useSupabase) {
          const props = await supabase.getProperties();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(props));
          return;
        }
      } catch (err) {
        console.warn('Falling back to SQLite properties:', err.message);
      }

      const rows = db.prepare(`
        SELECT p.*, t.name as tenant_name, t.phone as tenant_phone, t.id as tenant_id
        FROM properties p
        LEFT JOIN tenants t ON t.property_id = p.id AND t.is_active = 1
        ORDER BY p.unit_code ASC
      `).all();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows));
      return;
    }

    if (req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        
        if (useSupabase) {
          try {
            const created = await supabase.addProperty(body);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, id: created.id, source: 'supabase' }));
            return;
          } catch (cloudErr) {
            console.error('Supabase addProperty error, falling back to local:', cloudErr.message);
          }
        }

        // Local SQLite insert
        const id = 'b' + crypto.randomUUID().slice(1);
        const { unit_code, unit_type, rent_amount, due_day, security_deposit, building_name, tenant_name, tenant_phone } = body;

        db.prepare(`
          INSERT INTO properties (id, unit_code, unit_type, rent_amount, due_day, security_deposit, building_name, is_occupied)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, unit_code, unit_type, Number(rent_amount), Number(due_day), Number(security_deposit || 0), building_name || 'Shanti Niwas Complex', tenant_name ? 1 : 0);

        if (tenant_name && tenant_phone) {
          const tId = 'c' + crypto.randomUUID().slice(1);
          db.prepare(`
            INSERT INTO tenants (id, property_id, name, phone, is_active)
            VALUES (?, ?, ?, ?, 1)
          `).run(tId, id, tenant_name, tenant_phone);
        }

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, id, source: 'sqlite' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }
  }

  // -------------------------------------------------------------
  // REST API: TENANTS
  // -------------------------------------------------------------
  if (req.method === 'GET' && pathname === '/api/tenants') {
    try {
      if (useSupabase) {
        const tenants = await supabase.getTenants();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(tenants));
        return;
      }
    } catch (err) {
      console.warn('Falling back to SQLite tenants:', err.message);
    }

    const rows = db.prepare(`
      SELECT t.*, p.unit_code, p.unit_type, p.rent_amount, p.due_day
      FROM tenants t
      JOIN properties p ON t.property_id = p.id
      WHERE t.is_active = 1
    `).all();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(rows));
    return;
  }

  // -------------------------------------------------------------
  // REST API: PAYMENTS
  // -------------------------------------------------------------
  if (pathname === '/api/payments') {
    if (req.method === 'GET') {
      try {
        if (useSupabase) {
          const payments = await supabase.getPayments();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(payments));
          return;
        }
      } catch (err) {
        console.warn('Falling back to SQLite payments:', err.message);
      }

      const rows = db.prepare(`
        SELECT py.*, p.unit_code, p.unit_type, t.name as tenant_name, t.phone as tenant_phone
        FROM payments py
        JOIN properties p ON py.property_id = p.id
        JOIN tenants t ON py.tenant_id = t.id
        ORDER BY py.date DESC, py.created_at DESC
      `).all();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows));
      return;
    }

    if (req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        
        if (useSupabase) {
          try {
            const created = await supabase.addPayment(body);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, id: created.id, source: 'supabase' }));
            return;
          } catch (cloudErr) {
            console.error('Supabase addPayment error, falling back to local:', cloudErr.message);
          }
        }

        const { property_id, tenant_id, amount, payment_method, reference_id, notes, month } = body;
        const id = 'd' + crypto.randomUUID().slice(1);
        const date = new Date().toISOString().split('T')[0];
        const m = month || 'November 2026';

        db.prepare(`
          INSERT INTO payments (id, property_id, tenant_id, amount, date, month, payment_method, status, reference_id, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
        `).run(id, property_id, tenant_id, Number(amount), date, m, payment_method, reference_id || 'PENDING-VERIFY', notes || '');

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, id, source: 'sqlite' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }
  }

  // -------------------------------------------------------------
  // REST API: CONFIRM CASH RECEIVED / VERIFY UPI
  // -------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/payments/verify') {
    try {
      const body = await parseJsonBody(req);
      const { payment_id, confirmed_by = 'Landlord' } = body;

      if (useSupabase) {
        try {
          const verified = await supabase.verifyPayment(payment_id, confirmed_by);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, receipt_number: verified.receipt_number, source: 'supabase' }));
          return;
        } catch (cloudErr) {
          console.error('Supabase verifyPayment error, falling back to local:', cloudErr.message);
        }
      }

      const receiptNo = `RCP-202611-${Math.floor(1000 + Math.random() * 9000)}`;
      db.prepare(`
        UPDATE payments
        SET status = 'Verified', confirmed_by = ?, confirmed_at = CURRENT_TIMESTAMP, receipt_number = ?
        WHERE id = ?
      `).run(confirmed_by, receiptNo, payment_id);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, receipt_number: receiptNo, source: 'sqlite' }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // -------------------------------------------------------------
  // REST API: ISSUES / MAINTENANCE TICKETS
  // -------------------------------------------------------------
  if (pathname.startsWith('/api/issues')) {
    if (req.method === 'GET') {
      try {
        if (useSupabase) {
          const issues = await supabase.getIssues();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(issues));
          return;
        }
      } catch (err) {
        console.warn('Falling back to SQLite issues:', err.message);
      }

      const rows = db.prepare(`
        SELECT i.*, p.unit_code, p.unit_type, t.name as tenant_name, t.phone as tenant_phone
        FROM issues i
        JOIN properties p ON i.property_id = p.id
        JOIN tenants t ON i.tenant_id = t.id
        ORDER BY i.created_at DESC
      `).all();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows));
      return;
    }

    if (req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        
        if (useSupabase) {
          try {
            const created = await supabase.addIssue(body);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, id: created.id, source: 'supabase' }));
            return;
          } catch (cloudErr) {
            console.error('Supabase addIssue error, falling back to local:', cloudErr.message);
          }
        }

        const { property_id, tenant_id, category, priority, title, description } = body;
        const id = 'e' + crypto.randomUUID().slice(1);

        db.prepare(`
          INSERT INTO issues (id, property_id, tenant_id, category, priority, title, description, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
        `).run(id, property_id, tenant_id, category || 'Other', priority || 'Low', title, description);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, id, source: 'sqlite' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (req.method === 'PATCH') {
      try {
        const body = await parseJsonBody(req);
        const id = pathname.split('/')[3] || body.issue_id;
        const { status, resolution_notes } = body;

        if (useSupabase) {
          try {
            await supabase.updateIssue(id, status, resolution_notes);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, source: 'supabase' }));
            return;
          } catch (cloudErr) {
            console.error('Supabase updateIssue error, falling back to local:', cloudErr.message);
          }
        }

        db.prepare(`
          UPDATE issues
          SET status = ?, resolution_notes = ?, resolved_at = CASE WHEN ? = 'Resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END
          WHERE id = ?
        `).run(status, resolution_notes || null, status, id);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, source: 'sqlite' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }
  }

  // -------------------------------------------------------------
  // REST API: 3-DAY REMINDERS
  // -------------------------------------------------------------
  if (req.method === 'GET' && pathname === '/api/reminders') {
    let tenants = [];

    try {
      if (useSupabase) {
        tenants = await supabase.getTenants();
      }
    } catch (_) {}

    if (tenants.length === 0) {
      tenants = db.prepare(`
        SELECT t.*, p.unit_code, p.unit_type, p.rent_amount, p.due_day
        FROM tenants t
        JOIN properties p ON t.property_id = p.id
        WHERE t.is_active = 1
      `).all();
    }

    const currentDay = new Date().getDate();
    const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    const reminders = tenants.map(t => {
      const dueDay = t.due_day || 5;
      const daysRemaining = dueDay - currentDay;

      let urgency = 'upcoming';
      if (daysRemaining === 0) urgency = 'due_today';
      else if (daysRemaining > 0 && daysRemaining <= 3) urgency = 'due_in_3_days';
      else if (daysRemaining < 0) urgency = 'overdue';

      let timingText = '';
      if (daysRemaining === 0) timingText = `is *DUE TODAY* (${dueDay}th ${currentMonthName})`;
      else if (daysRemaining > 0 && daysRemaining <= 3) timingText = `is due in *${daysRemaining} day${daysRemaining > 1 ? 's' : ''}* (on ${dueDay}th ${currentMonthName})`;
      else if (daysRemaining < 0) timingText = `was due on ${dueDay}th ${currentMonthName} and is *${Math.abs(daysRemaining)} days OVERDUE*`;
      else timingText = `is due on ${dueDay}th ${currentMonthName}`;

      const text = `Namaste ${t.name} ji,\n\nThis is a friendly reminder that the rent of *${formatInr(t.rent_amount)}* for *${t.unit_code}* (${currentMonthName}) ${timingText}.\n\n💳 Quick UPI: landlord.father@upi\n💵 If paying cash in hand, kindly notify us via portal so we can bring your receipt.\n\nWarm regards,\nLandlord & Father`;

      const cleanPhone = (t.phone || '').replace(/\D/g, '');
      const waPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
      const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`;
      const smsUrl = `sms:+${waPhone}?body=${encodeURIComponent(text)}`;

      return {
        tenant_id: t.id,
        tenant_name: t.name,
        tenant_phone: t.phone,
        property_id: t.property_id,
        unit_code: t.unit_code,
        unit_type: t.unit_type,
        rent_amount: t.rent_amount,
        due_day: dueDay,
        daysRemaining,
        urgency,
        whatsappUrl: waUrl,
        smsUrl: smsUrl,
        messageText: text,
      };
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(reminders));
    return;
  }

  // -------------------------------------------------------------
  // REST API: PRINTABLE HTML RECEIPT
  // -------------------------------------------------------------
  if (req.method === 'GET' && pathname.startsWith('/api/receipts/')) {
    const paymentId = pathname.split('/')[3];
    let payment = null;

    if (useSupabase) {
      try {
        const payments = await supabase.getPayments();
        payment = payments.find(p => p.id === paymentId);
      } catch (_) {}
    }

    if (!payment) {
      payment = db.prepare(`
        SELECT py.*, p.unit_code, p.unit_type, t.name as tenant_name, t.phone as tenant_phone
        FROM payments py
        JOIN properties p ON py.property_id = p.id
        JOIN tenants t ON py.tenant_id = t.id
        WHERE py.id = ?
      `).get(paymentId);
    }

    if (!payment) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Payment record not found.');
      return;
    }

    const receiptNo = payment.receipt_number || `RCP-202611-${payment.id.slice(0, 6).toUpperCase()}`;
    const amountWords = numberToIndianWords(payment.amount);
    const formattedAmount = formatInr(payment.amount);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Rent Receipt - ${receiptNo}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 30px; }
    .card { max-width: 680px; margin: 0 auto; background: #fff; border: 2px solid #0f172a; border-radius: 16px; padding: 36px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
    .header { display: flex; justify-content: space-between; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; }
    .title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
    .sub { font-size: 13px; color: #64748b; margin: 2px 0 0 0; }
    .badge { text-align: right; }
    .badge h2 { font-size: 16px; color: #2563eb; margin: 0; font-weight: 700; }
    .badge p { font-size: 12px; color: #64748b; margin: 2px 0 0 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; }
    .label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .val { font-size: 15px; font-weight: 700; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
    th { background: #0f172a; color: #fff; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    .words { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #166534; font-weight: 600; margin-bottom: 24px; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    .stamp { border: 2px solid #16a34a; border-radius: 8px; padding: 6px 14px; color: #16a34a; font-weight: 800; font-size: 13px; text-transform: uppercase; display: inline-block; transform: rotate(-3deg); }
    .sig { text-align: right; }
    .sig-line { width: 160px; border-top: 1px solid #0f172a; margin-bottom: 6px; }
    .btn { padding: 8px 16px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    @media print { .no-print { display: none; } body { padding: 0; background: #fff; } .card { border: none; box-shadow: none; } }
  </style>
</head>
<body>
  <div style="max-width: 680px; margin: 0 auto 16px auto; text-align: right;" class="no-print">
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="card">
    <div class="header">
      <div>
        <h1 class="title">Shanti Niwas & Plaza Estate</h1>
        <p class="sub">Residential & Commercial Properties Management</p>
      </div>
      <div class="badge">
        <h2>RENT PAYMENT RECEIPT</h2>
        <p>No: <strong>${receiptNo}</strong></p>
        <p>Date: ${payment.date}</p>
      </div>
    </div>
    <div class="grid">
      <div class="box">
        <div class="label">Received From</div>
        <div class="val">${payment.tenant_name}</div>
        <div style="font-size: 12px; color: #64748b;">Phone: ${payment.tenant_phone}</div>
      </div>
      <div class="box">
        <div class="label">Premises & Period</div>
        <div class="val">${payment.unit_code} (${payment.unit_type})</div>
        <div style="font-size: 12px; color: #64748b;">Rent for: <strong>${payment.month}</strong></div>
      </div>
    </div>
    <table>
      <thead>
        <tr><th>Description</th><th>Payment Mode</th><th>Reference / UTR</th><th style="text-align: right;">Amount</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Monthly Rent</strong><br><span style="font-size: 12px; color: #64748b;">Period: ${payment.month}</span></td>
          <td><strong>${payment.payment_method}</strong></td>
          <td><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${payment.reference_id || 'CASH-REC'}</code></td>
          <td style="text-align: right; font-size: 18px; font-weight: 800; color: #16a34a;">${formattedAmount}</td>
        </tr>
      </tbody>
    </table>
    <div class="words"><strong>Amount in Words:</strong> ${amountWords}</div>
    <div class="footer">
      <div>
        <div class="stamp">✓ PAYMENT ${payment.status.toUpperCase()}<br><span style="font-size: 10px; font-weight: normal;">Confirmed by ${payment.confirmed_by || 'Landlord'}</span></div>
        <p style="font-size: 11px; color: #94a3b8; margin: 6px 0 0 0;">This is a computer generated digital receipt.</p>
      </div>
      <div class="sig">
        <div class="sig-line"></div>
        <span style="font-size: 12px; color: #64748b; font-weight: 600;">Authorized Signatory</span><br>
        <span style="font-size: 11px; color: #94a3b8;">Landlord / Father</span>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // -------------------------------------------------------------
  // STATIC CLIENT APP (public/app.html)
  // -------------------------------------------------------------
  const appHtmlPath = path.join(__dirname, 'public', 'app.html');
  if (fs.existsSync(appHtmlPath)) {
    const htmlContent = fs.readFileSync(appHtmlPath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlContent);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  const conf = supabase.getSupabaseConfig();
  console.log(`\n======================================================`);
  console.log(`🚀 EstateEase Property & Rent Management Server Active`);
  console.log(`   Running at: http://localhost:${PORT}`);
  console.log(`   Database Mode: ${conf.isConfigured ? '☁️ Supabase Cloud (PostgreSQL)' : '💾 Local Persistent SQLite'}`);
  console.log(`   Landlord & Father Dashboard: http://localhost:${PORT}`);
  console.log(`   Tenant Self-Service Portal:  http://localhost:${PORT}#tenant`);
  console.log(`======================================================\n`);
});
