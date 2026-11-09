/**
 * Supabase Cloud Database Client & PostgREST Data Access Layer
 * Connects directly to Supabase PostgreSQL via PostgREST HTTP APIs
 * Zero third-party dependencies required (uses Node 18+ native fetch)
 */

const fs = require('node:fs');
const path = require('node:path');

// Auto-load .env.local or .env
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envLocalPath)) {
  try { process.loadEnvFile(envLocalPath); } catch (_) {}
} else if (fs.existsSync(envPath)) {
  try { process.loadEnvFile(envPath); } catch (_) {}
}

// Helper to get active config
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
              process.env.SUPABASE_ANON_KEY || '';

  const isConfigured = Boolean(
    url && 
    key && 
    !url.includes('your-project.supabase.co') && 
    !key.includes('your-anon-key')
  );

  return {
    url: url.replace(/\/+$/, ''),
    key,
    isConfigured
  };
}

/**
 * Perform a typed request to Supabase PostgREST
 */
async function supabaseFetch(endpoint, options = {}) {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    throw new Error('Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.');
  }

  const fullUrl = `${url}/rest/v1/${endpoint.replace(/^\/+/, '')}`;
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': options.prefer || 'return=representation',
    ...(options.headers || {})
  };

  const response = await fetch(fullUrl, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsed;
    try { parsed = JSON.parse(errorText); } catch (_) {}
    const msg = parsed?.message || parsed?.hint || parsed?.details || errorText || `HTTP ${response.status}`;
    throw new Error(`Supabase Error (${response.status}): ${msg}`);
  }

  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_) {
    return text;
  }
}

/**
 * Health check / Connection test
 */
async function testConnection(testUrl, testKey) {
  const url = (testUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
  const key = testKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !key) {
    return { success: false, error: 'URL or API Key is missing.' };
  }

  try {
    const checkUrl = `${url}/rest/v1/properties?limit=1`;
    const resp = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    if (resp.status === 200 || resp.status === 206) {
      return { success: true, message: 'Successfully connected to Supabase PostgreSQL database!' };
    }

    if (resp.status === 401 || resp.status === 403) {
      return { success: false, error: 'Invalid Supabase API Key or insufficient permissions.' };
    }

    if (resp.status === 404) {
      return { 
        success: false, 
        error: 'Connected to Supabase, but the "properties" table does not exist. Please run database/fix_schema.sql in the Supabase SQL Editor.' 
      };
    }

    const err = await resp.text();
    return { success: false, error: `Supabase returned HTTP ${resp.status}: ${err}` };
  } catch (err) {
    return { success: false, error: `Connection failed: ${err.message}` };
  }
}

// ----------------------------------------------------------------------------
// Supabase Cloud Data Operations (Direct PostgreSQL Tables)
// ----------------------------------------------------------------------------

/**
 * Get all properties with joined active tenants directly from Supabase
 */
async function getProperties() {
  const data = await supabaseFetch('properties?select=*,tenants(*)&order=unit_code.asc');
  if (!Array.isArray(data)) return [];

  return data.map(p => {
    const tenantsList = p.tenants || [];
    const tenant = tenantsList.length > 0 ? (tenantsList.find(t => t.is_active) || tenantsList[0]) : null;
    return {
      id: p.id,
      unit_code: p.unit_code,
      unit_type: p.unit_type,
      rent_amount: Number(p.rent_amount || 0),
      due_day: Number(p.due_day || 5),
      security_deposit: Number(p.security_deposit || 0),
      building_name: p.building_name || (p.unit_type === 'Shop' ? 'Commercial Plaza Market' : 'Shanti Niwas Complex'),
      floor_number: p.floor_number || null,
      is_occupied: Boolean(p.is_occupied || tenant),
      tenant_name: tenant?.name || null,
      tenant_phone: tenant?.phone || null,
      tenant_id: tenant?.id || null,
      created_at: p.created_at
    };
  });
}

/**
 * Add a new property and optional tenant into Supabase
 */
async function addProperty(propertyData) {
  const {
    unit_code,
    unit_type,
    rent_amount,
    due_day,
    security_deposit = 0,
    building_name = 'Shanti Niwas Complex',
    tenant_name,
    tenant_phone
  } = propertyData;

  const propPayload = {
    unit_code,
    unit_type,
    rent_amount: Number(rent_amount),
    due_day: Number(due_day),
    security_deposit: Number(security_deposit)
  };

  // Only include optional columns if they exist in schema
  if (building_name) propPayload.building_name = building_name;
  propPayload.is_occupied = Boolean(tenant_name);

  let insertedProps;
  try {
    insertedProps = await supabaseFetch('properties', {
      method: 'POST',
      body: propPayload
    });
  } catch (err) {
    // If optional columns fail, retry with core columns only
    if (err.message.includes('column') || err.message.includes('schema cache')) {
      delete propPayload.building_name;
      delete propPayload.is_occupied;
      insertedProps = await supabaseFetch('properties', {
        method: 'POST',
        body: propPayload
      });
    } else {
      throw err;
    }
  }

  const prop = Array.isArray(insertedProps) ? insertedProps[0] : insertedProps;

  // If tenant details provided, insert into tenants table
  if (tenant_name && tenant_phone && prop?.id) {
    await supabaseFetch('tenants', {
      method: 'POST',
      body: {
        property_id: prop.id,
        name: tenant_name,
        phone: tenant_phone,
        is_active: true
      }
    });
  }

  return prop;
}

/**
 * Get all active tenants with joined property details directly from Supabase
 */
async function getTenants() {
  const data = await supabaseFetch('tenants?select=*,properties(*)&order=name.asc');
  if (!Array.isArray(data)) return [];

  return data.map(t => ({
    id: t.id,
    property_id: t.property_id,
    name: t.name,
    phone: t.phone,
    email: t.email,
    unit_code: t.properties?.unit_code || 'Unit',
    unit_type: t.properties?.unit_type || 'Flat',
    rent_amount: Number(t.properties?.rent_amount || 0),
    due_day: Number(t.properties?.due_day || 5),
    is_active: t.is_active !== false,
    created_at: t.created_at
  }));
}

/**
 * Get all payments with joined property and tenant details directly from Supabase
 */
async function getPayments() {
  const data = await supabaseFetch('payments?select=*,properties(unit_code,unit_type),tenants(name,phone)&order=date.desc,created_at.desc');
  if (!Array.isArray(data)) return [];

  return data.map(p => ({
    id: p.id,
    property_id: p.property_id,
    tenant_id: p.tenant_id,
    amount: Number(p.amount),
    date: p.date,
    month: p.month,
    payment_method: p.payment_method,
    status: p.status,
    reference_id: p.reference_id,
    notes: p.notes,
    confirmed_by: p.confirmed_by,
    confirmed_at: p.confirmed_at,
    receipt_number: p.receipt_number,
    created_at: p.created_at,
    unit_code: p.properties?.unit_code || 'Unit',
    unit_type: p.properties?.unit_type || 'Flat',
    tenant_name: p.tenants?.name || 'Tenant',
    tenant_phone: p.tenants?.phone || 'N/A'
  }));
}

/**
 * Record a payment directly in Supabase
 */
async function addPayment(paymentData) {
  const {
    property_id,
    tenant_id,
    amount,
    payment_method,
    reference_id,
    notes = '',
    month = 'November 2026'
  } = paymentData;

  const date = new Date().toISOString().split('T')[0];

  const inserted = await supabaseFetch('payments', {
    method: 'POST',
    body: {
      property_id,
      tenant_id,
      amount: Number(amount),
      date,
      month,
      payment_method,
      status: 'Pending',
      reference_id: reference_id || (payment_method === 'Cash' ? 'CASH-ALERT-HANDOVER' : 'UPI-UNVERIFIED')
    }
  });

  return Array.isArray(inserted) ? inserted[0] : inserted;
}

/**
 * Verify a payment (Confirm Cash Received or Verify UPI) directly in Supabase
 */
async function verifyPayment(paymentId, confirmedBy = 'Landlord') {
  const receiptNumber = `RCP-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${paymentId.slice(0, 6).toUpperCase()}`;

  const patchBody = {
    status: 'Verified',
    confirmed_by: confirmedBy,
    confirmed_at: new Date().toISOString(),
    receipt_number: receiptNumber
  };

  let updated;
  try {
    updated = await supabaseFetch(`payments?id=eq.${paymentId}`, {
      method: 'PATCH',
      body: patchBody
    });
  } catch (err) {
    // If confirmed_by column isn't present yet, fallback to status only
    if (err.message.includes('column') || err.message.includes('schema cache')) {
      updated = await supabaseFetch(`payments?id=eq.${paymentId}`, {
        method: 'PATCH',
        body: { status: 'Verified' }
      });
    } else {
      throw err;
    }
  }

  return (Array.isArray(updated) ? updated[0] : updated) || { id: paymentId, status: 'Verified', receipt_number: receiptNumber };
}

/**
 * Get all maintenance issues directly from Supabase
 */
async function getIssues() {
  const data = await supabaseFetch('issues?select=*,properties(unit_code,unit_type),tenants(name,phone)&order=created_at.desc');
  if (!Array.isArray(data)) return [];

  return data.map(i => ({
    id: i.id,
    property_id: i.property_id,
    tenant_id: i.tenant_id,
    category: i.category,
    priority: i.priority,
    title: i.title,
    description: i.description,
    status: i.status,
    resolution_notes: i.resolution_notes,
    resolved_at: i.resolved_at,
    created_at: i.created_at,
    unit_code: i.properties?.unit_code || 'Unit',
    unit_type: i.properties?.unit_type || 'Flat',
    tenant_name: i.tenants?.name || 'Tenant',
    tenant_phone: i.tenants?.phone || 'N/A'
  }));
}

/**
 * Add a maintenance ticket directly in Supabase
 */
async function addIssue(issueData) {
  const {
    property_id,
    tenant_id,
    category = 'Other',
    priority = 'Low',
    title,
    description
  } = issueData;

  const inserted = await supabaseFetch('issues', {
    method: 'POST',
    body: {
      property_id,
      tenant_id,
      category,
      priority,
      title,
      description,
      status: 'Pending'
    }
  });

  return Array.isArray(inserted) ? inserted[0] : inserted;
}

/**
 * Update issue status directly in Supabase
 */
async function updateIssue(issueId, status, resolutionNotes = null) {
  const body = { status };
  if (resolutionNotes) body.resolution_notes = resolutionNotes;
  if (status === 'Resolved') body.resolved_at = new Date().toISOString();

  let updated;
  try {
    updated = await supabaseFetch(`issues?id=eq.${issueId}`, {
      method: 'PATCH',
      body
    });
  } catch (err) {
    if (err.message.includes('column') || err.message.includes('schema cache')) {
      updated = await supabaseFetch(`issues?id=eq.${issueId}`, {
        method: 'PATCH',
        body: { status }
      });
    } else {
      throw err;
    }
  }

  return (Array.isArray(updated) ? updated[0] : updated) || { id: issueId, status };
}

/**
 * Calculate Overview aggregated statistics directly from Supabase tables
 */
async function getOverview() {
  const [payments, properties, issues] = await Promise.all([
    supabaseFetch('payments?select=amount,status'),
    supabaseFetch('properties?select=unit_type'),
    supabaseFetch('issues?select=status')
  ]);

  const pList = Array.isArray(payments) ? payments : [];
  const propList = Array.isArray(properties) ? properties : [];
  const issueList = Array.isArray(issues) ? issues : [];

  const verifiedTotal = pList
    .filter(p => p.status === 'Verified')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const pendingTotal = pList
    .filter(p => p.status === 'Pending')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const activeUnits = propList.length;
  const flats = propList.filter(p => p.unit_type === 'Flat').length;
  const shops = propList.filter(p => p.unit_type === 'Shop').length;
  const unresolvedIssues = issueList.filter(i => i.status !== 'Resolved').length;

  return {
    monthlyRevenue: verifiedTotal,
    pendingDues: pendingTotal,
    totalActiveUnits: activeUnits,
    flatsCount: flats,
    shopsCount: shops,
    unresolvedTickets: unresolvedIssues,
    currentMonthName: 'November 2026'
  };
}

module.exports = {
  getSupabaseConfig,
  supabaseFetch,
  testConnection,
  getProperties,
  addProperty,
  getTenants,
  getPayments,
  addPayment,
  verifyPayment,
  getIssues,
  addIssue,
  updateIssue,
  getOverview
};
