#!/usr/bin/env tsx
/**
 * Migration Diagnostic Tool for Supabase
 * 
 * Purpose: Identify unapplied, missing, or inconsistent database migrations
 * 
 * Features:
 * - Compares filesystem migrations with database records
 * - Detects pending migrations (not yet applied)
 * - Detects missing/skipped migrations (gaps in sequence)
 * - Detects order inconsistencies (timestamp issues)
 * - Provides impact analysis for pending migrations
 * - Read-only (no destructive actions)
 * 
 * Usage: npm run check:migrations
 *    or: npx tsx scripts/check-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

interface Migration {
  name: string;
  version: string;
  fullPath: string;
  content?: string;
}

interface AppliedMigration {
  version: string;
  name?: string;
  statements?: string[];
}

interface DiagnosticResult {
  filesystemMigrations: Migration[];
  appliedMigrations: AppliedMigration[];
  pending: Migration[];
  missing: string[];
  orderIssues: string[];
}

/**
 * Print header
 */
function printHeader() {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.cyan}🔍 Supabase Migration Diagnostic Tool${colors.reset}`);
  console.log('='.repeat(80) + '\n');
}

/**
 * Print section header
 */
function printSection(title: string, icon: string = '📋') {
  console.log(`\n${colors.bright}${icon} ${title}${colors.reset}`);
  console.log('-'.repeat(80));
}

/**
 * Print success message
 */
function printSuccess(message: string) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

/**
 * Print warning message
 */
function printWarning(message: string) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

/**
 * Print error message
 */
function printError(message: string) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

/**
 * Print info message
 */
function printInfo(message: string) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

/**
 * Get all migration files from the filesystem
 */
function getFilesystemMigrations(): Migration[] {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    printError(`Migrations directory not found: ${migrationsDir}`);
    return [];
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  return files.map(file => {
    const fullPath = path.join(migrationsDir, file);
    const version = file.split('_')[0];
    
    return {
      name: file,
      version,
      fullPath,
      content: fs.readFileSync(fullPath, 'utf-8'),
    };
  });
}

/**
 * Get applied migrations from the database
 */
async function getAppliedMigrations(client: any): Promise<AppliedMigration[]> {
  try {
    // Try to query the supabase_migrations schema
    const { data, error } = await client
      .from('schema_migrations')
      .select('version')
      .order('version', { ascending: true });

    if (error) {
      // If the table doesn't exist in the public schema, try supabase_migrations schema
      printWarning('schema_migrations table not found in public schema, checking supabase_migrations schema...');
      
      const { data: supabaseData, error: supabaseError } = await client.rpc('get_schema_migrations');
      
      if (supabaseError) {
        printWarning('Could not query schema_migrations. Trying alternative approach...');
        return [];
      }
      
      return supabaseData.map((row: any) => ({
        version: row.version,
        statements: row.statements,
      }));
    }

    return data.map((row: any) => ({
      version: row.version,
    }));
  } catch (err) {
    printError(`Error querying migrations: ${err}`);
    return [];
  }
}

/**
 * Analyze migration content to determine impact
 */
function analyzeMigrationImpact(migration: Migration): string[] {
  const content = migration.content || '';
  const impacts: string[] = [];

  // Check for table creation
  if (content.match(/CREATE TABLE/gi)) {
    const tables = content.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+\.\w+|\w+)/gi);
    if (tables) {
      impacts.push(`Creates ${tables.length} table(s)`);
    }
  }

  // Check for table alteration
  if (content.match(/ALTER TABLE/gi)) {
    const alters = content.match(/ALTER TABLE/gi);
    impacts.push(`Modifies ${alters?.length || 0} table(s)`);
  }

  // Check for table drops
  if (content.match(/DROP TABLE/gi)) {
    const drops = content.match(/DROP TABLE/gi);
    impacts.push(`${colors.red}⚠ Drops ${drops?.length || 0} table(s)${colors.reset}`);
  }

  // Check for column additions
  if (content.match(/ADD COLUMN/gi)) {
    const adds = content.match(/ADD COLUMN/gi);
    impacts.push(`Adds ${adds?.length || 0} column(s)`);
  }

  // Check for column drops
  if (content.match(/DROP COLUMN/gi)) {
    const drops = content.match(/DROP COLUMN/gi);
    impacts.push(`${colors.yellow}Drops ${drops?.length || 0} column(s)${colors.reset}`);
  }

  // Check for index creation
  if (content.match(/CREATE (?:UNIQUE )?INDEX/gi)) {
    const indexes = content.match(/CREATE (?:UNIQUE )?INDEX/gi);
    impacts.push(`Creates ${indexes?.length || 0} index(es)`);
  }

  // Check for RLS policies
  if (content.match(/CREATE POLICY/gi)) {
    const policies = content.match(/CREATE POLICY/gi);
    impacts.push(`Creates ${policies?.length || 0} RLS polic(y|ies)`);
  }

  // Check for triggers
  if (content.match(/CREATE (?:OR REPLACE )?TRIGGER/gi)) {
    const triggers = content.match(/CREATE (?:OR REPLACE )?TRIGGER/gi);
    impacts.push(`Creates ${triggers?.length || 0} trigger(s)`);
  }

  // Check for functions
  if (content.match(/CREATE (?:OR REPLACE )?FUNCTION/gi)) {
    const functions = content.match(/CREATE (?:OR REPLACE )?FUNCTION/gi);
    impacts.push(`Creates ${functions?.length || 0} function(s)`);
  }

  // Check for storage buckets
  if (content.match(/insert into storage\.buckets/gi)) {
    impacts.push('Creates storage bucket(s)');
  }

  // Check for data modifications
  if (content.match(/INSERT INTO/gi)) {
    const inserts = content.match(/INSERT INTO/gi);
    impacts.push(`Inserts data (${inserts?.length || 0} statement(s))`);
  }

  if (content.match(/UPDATE\s+/gi)) {
    const updates = content.match(/UPDATE\s+/gi);
    impacts.push(`${colors.yellow}Updates existing data (${updates?.length || 0} statement(s))${colors.reset}`);
  }

  if (content.match(/DELETE FROM/gi)) {
    const deletes = content.match(/DELETE FROM/gi);
    impacts.push(`${colors.red}⚠ Deletes data (${deletes?.length || 0} statement(s))${colors.reset}`);
  }

  // Check for constraints
  if (content.match(/ADD CONSTRAINT/gi)) {
    const constraints = content.match(/ADD CONSTRAINT/gi);
    impacts.push(`Adds ${constraints?.length || 0} constraint(s)`);
  }

  if (impacts.length === 0) {
    // Check if file is empty
    if (content.trim().length === 0) {
      impacts.push(`${colors.gray}Empty migration (no changes)${colors.reset}`);
    } else {
      impacts.push('Contains SQL statements (impact analysis limited)');
    }
  }

  return impacts;
}

/**
 * Perform diagnostic analysis
 */
function performDiagnostics(
  filesystemMigrations: Migration[],
  appliedMigrations: AppliedMigration[]
): DiagnosticResult {
  const appliedVersions = new Set(appliedMigrations.map(m => m.version));
  const filesystemVersions = filesystemMigrations.map(m => m.version);

  // Find pending migrations (in filesystem but not applied)
  const pending = filesystemMigrations.filter(m => !appliedVersions.has(m.version));

  // Find missing migrations (applied but not in filesystem)
  const missing = appliedMigrations
    .filter(m => !filesystemVersions.includes(m.version))
    .map(m => m.version);

  // Check for order issues (timestamps should be sequential)
  const orderIssues: string[] = [];
  for (let i = 1; i < filesystemMigrations.length; i++) {
    const prev = filesystemMigrations[i - 1];
    const curr = filesystemMigrations[i];
    
    if (prev.version > curr.version) {
      orderIssues.push(
        `Migration ${curr.name} (${curr.version}) comes after ${prev.name} (${prev.version}) but has an earlier timestamp`
      );
    }
  }

  return {
    filesystemMigrations,
    appliedMigrations,
    pending,
    missing,
    orderIssues,
  };
}

/**
 * Print diagnostic results
 */
function printResults(result: DiagnosticResult) {
  // Summary
  printSection('Summary', '📊');
  console.log(`Total migrations in filesystem: ${colors.bright}${result.filesystemMigrations.length}${colors.reset}`);
  console.log(`Total migrations applied: ${colors.bright}${result.appliedMigrations.length}${colors.reset}`);
  console.log(`Pending migrations: ${colors.bright}${colors.yellow}${result.pending.length}${colors.reset}`);
  console.log(`Missing migrations: ${colors.bright}${result.missing.length > 0 ? colors.red : colors.green}${result.missing.length}${colors.reset}`);
  console.log(`Order issues: ${colors.bright}${result.orderIssues.length > 0 ? colors.red : colors.green}${result.orderIssues.length}${colors.reset}`);

  // Pending migrations
  if (result.pending.length > 0) {
    printSection('Pending Migrations (Not Yet Applied)', '⏳');
    result.pending.forEach((migration, index) => {
      console.log(`\n${colors.bright}${index + 1}. ${migration.name}${colors.reset}`);
      console.log(`   Version: ${migration.version}`);
      
      const impacts = analyzeMigrationImpact(migration);
      if (impacts.length > 0) {
        console.log(`   Impact:`);
        impacts.forEach(impact => {
          console.log(`     - ${impact}`);
        });
      }
    });

    // Recommendations
    printSection('Recommendations for Pending Migrations', '💡');
    printInfo('To apply pending migrations, use Supabase CLI:');
    console.log(`   ${colors.gray}supabase db push${colors.reset}`);
    console.log(`\n   Or apply them manually via the Supabase dashboard SQL editor.`);
    
    if (result.pending.some(m => m.content?.match(/DROP TABLE|DELETE FROM/gi))) {
      printWarning('Some pending migrations contain destructive operations (DROP, DELETE).');
      printWarning('Review these migrations carefully before applying!');
    }
  } else {
    printSection('Pending Migrations', '⏳');
    printSuccess('All migrations have been applied! Database is up to date.');
  }

  // Missing migrations
  if (result.missing.length > 0) {
    printSection('Missing Migrations (Applied but not in filesystem)', '❌');
    printError('The following migrations are recorded in the database but not found in filesystem:');
    result.missing.forEach((version, index) => {
      console.log(`   ${index + 1}. Version: ${version}`);
    });
    
    printSection('Recommendations for Missing Migrations', '💡');
    printWarning('Missing migration files can indicate:');
    console.log('   - Files were deleted from the repository');
    console.log('   - Working with a different branch');
    console.log('   - Database was migrated from another source');
    printInfo('Actions:');
    console.log('   - Restore missing migration files from git history');
    console.log('   - Or verify this is expected (e.g., working on a feature branch)');
  }

  // Order issues
  if (result.orderIssues.length > 0) {
    printSection('Order Issues (Timestamp Inconsistencies)', '⚠️');
    printWarning('The following migrations have timestamp ordering issues:');
    result.orderIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
    
    printSection('Recommendations for Order Issues', '💡');
    printWarning('Timestamp order issues can cause problems when:');
    console.log('   - Migrations are applied in the wrong order');
    console.log('   - Different team members have different migration states');
    printInfo('Actions:');
    console.log('   - Rename migration files to fix timestamp order');
    console.log('   - Ensure migrations are applied in the correct sequence');
  }

  // All clear
  if (result.pending.length === 0 && result.missing.length === 0 && result.orderIssues.length === 0) {
    printSection('Status', '✅');
    printSuccess('Database migrations are healthy!');
    console.log(`   - All ${result.filesystemMigrations.length} migrations are applied`);
    console.log(`   - No missing or skipped migrations`);
    console.log(`   - No timestamp ordering issues`);
  }
}

/**
 * Main function
 */
async function main() {
  printHeader();

  // Validate configuration
  printSection('Configuration', '⚙️');
  
  if (!supabaseUrl) {
    printError('Missing VITE_SUPABASE_URL or SUPABASE_URL environment variable');
    console.log('\nPlease set one of the following in your .env file:');
    console.log('   VITE_SUPABASE_URL=https://your-project.supabase.co');
    console.log('   SUPABASE_URL=https://your-project.supabase.co');
    process.exit(1);
  }

  if (!supabaseServiceKey && !supabaseAnonKey) {
    printError('Missing both SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_ANON_KEY');
    console.log('\nPlease set at least one of the following in your .env file:');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    console.log('   VITE_SUPABASE_ANON_KEY=your-anon-key');
    process.exit(1);
  }

  printSuccess(`Supabase URL: ${supabaseUrl.substring(0, 40)}...`);
  printSuccess(`Service Key: ${supabaseServiceKey ? '✓ Available' : '✗ Not available'}`);
  printSuccess(`Anon Key: ${supabaseAnonKey ? '✓ Available' : '✗ Not available'}`);

  // Create Supabase client
  const client = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : createClient(supabaseUrl, supabaseAnonKey!);

  // Get filesystem migrations
  printSection('Reading Filesystem Migrations', '📁');
  const filesystemMigrations = getFilesystemMigrations();
  printSuccess(`Found ${filesystemMigrations.length} migration files`);

  // Get applied migrations
  printSection('Querying Applied Migrations', '🗄️');
  const appliedMigrations = await getAppliedMigrations(client);
  
  if (appliedMigrations.length === 0) {
    printWarning('Could not retrieve applied migrations from database');
    printInfo('This might mean:');
    console.log('   - The schema_migrations table does not exist');
    console.log('   - Insufficient permissions to query the table');
    console.log('   - This is a fresh database with no migrations applied');
    console.log('\n   Continuing with filesystem-only analysis...\n');
  } else {
    printSuccess(`Found ${appliedMigrations.length} applied migrations`);
  }

  // Perform diagnostics
  printSection('Analyzing Migrations', '🔬');
  const result = performDiagnostics(filesystemMigrations, appliedMigrations);
  printSuccess('Analysis complete');

  // Print results
  printResults(result);

  // Footer
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.gray}Diagnostic completed at ${new Date().toISOString()}${colors.reset}`);
  console.log('='.repeat(80) + '\n');

  // Exit with appropriate code
  if (result.pending.length > 0 || result.missing.length > 0 || result.orderIssues.length > 0) {
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  printError(`Unhandled error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
