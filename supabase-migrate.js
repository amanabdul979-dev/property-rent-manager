/**
 * Supabase Migration & Health Verification CLI
 * Run: agy-node database/supabase-migrate.js
 */

const fs = require('node:fs');
const path = require('node:path');

// Load environment variables if available
const envLocal = path.join(__dirname, '..', '.env.local');
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envLocal)) {
  try { process.loadEnvFile(envLocal); } catch (_) {}
} else if (fs.existsSync(envFile)) {
  try { process.loadEnvFile(envFile); } catch (_) {}
}

const supabase = require('../lib/supabase.js');

async function main() {
  console.log('\n======================================================');
  console.log('🔍 EstateEase: Supabase Cloud Database Verification');
  console.log('======================================================\n');

  const config = supabase.getSupabaseConfig();
  console.log('Project URL:', config.url || '(not set)');
  console.log('API Key:    ', config.key ? `${config.key.slice(0, 10)}...${config.key.slice(-5)}` : '(not set)');
  console.log('Configured: ', config.isConfigured ? 'YES ✅' : 'NO ❌');

  if (!config.isConfigured) {
    console.log('\n⚠️  Supabase is not configured yet.');
    console.log('Please add your project credentials to .env.local:');
    console.log('  NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co');
    console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>\n');
    process.exit(1);
  }

  console.log('\nTesting connection to Supabase cloud...');
  const test = await supabase.testConnection();

  if (!test.success) {
    console.error('❌ Connection Failed:', test.error);
    process.exit(1);
  }

  console.log('✅ Connection Successful! Verified Supabase Cloud Database.');

  try {
    const props = await supabase.getProperties();
    console.log(`\n📊 Live Cloud Statistics:`);
    console.log(`   - Properties in cloud: ${props.length}`);

    const tenants = await supabase.getTenants();
    console.log(`   - Tenants in cloud:    ${tenants.length}`);

    const payments = await supabase.getPayments();
    console.log(`   - Payments in cloud:   ${payments.length}`);

    const issues = await supabase.getIssues();
    console.log(`   - Issues in cloud:     ${issues.length}`);

    console.log('\n🎉 Supabase Cloud Database is fully connected and active!');
  } catch (err) {
    console.error('Error fetching data from Supabase:', err.message);
  }
}

main().catch(console.error);
