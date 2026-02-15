#!/usr/bin/env node
/**
 * Supabase Diagnostic Script
 * 
 * This script analyzes local migrations and generates SQL queries to check remote state.
 * It helps diagnose migration conflicts, schema drift, and configuration issues.
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(title: string) {
  console.log('\n' + '='.repeat(80));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(80) + '\n');
}

function section(title: string) {
  console.log('\n' + '-'.repeat(80));
  log(title, colors.bright + colors.blue);
  console.log('-'.repeat(80));
}

interface Migration {
  filename: string;
  version: string;
  name: string;
  size: number;
  isEmpty: boolean;
}

function getMigrations(): Migration[] {
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql') && !f.startsWith('REMEDIATION'));
  
  return files.map(filename => {
    const fullPath = join(migrationsDir, filename);
    const stats = statSync(fullPath);
    const content = readFileSync(fullPath, 'utf-8').trim();
    
    // Extract version from filename (e.g., "020" from "020_full_rebuild.sql")
    const versionMatch = filename.match(/^(\d+)/);
    const version = versionMatch ? versionMatch[1] : '000';
    
    // Extract name from filename
    const name = filename.replace(/^\d+_/, '').replace(/\.sql$/, '');
    
    return {
      filename,
      version,
      name,
      size: stats.size,
      isEmpty: content.length === 0 || content.match(/^--.*$/gm)?.join('').length === content.length,
    };
  }).sort((a, b) => a.version.localeCompare(b.version));
}

function checkForDuplicates(migrations: Migration[]): void {
  const versionCounts = new Map<string, number>();
  migrations.forEach(m => {
    versionCounts.set(m.version, (versionCounts.get(m.version) || 0) + 1);
  });
  
  const duplicates = Array.from(versionCounts.entries()).filter(([_, count]) => count > 1);
  
  if (duplicates.length > 0) {
    log('⚠️  WARNING: Duplicate migration versions found!', colors.yellow);
    duplicates.forEach(([version, count]) => {
      const dupes = migrations.filter(m => m.version === version);
      log(`  Version ${version}: ${count} files`, colors.yellow);
      dupes.forEach(d => log(`    - ${d.filename}`, colors.yellow));
    });
  } else {
    log('✓ No duplicate versions found', colors.green);
  }
}

function checkForGaps(migrations: Migration[]): void {
  const versions = migrations.map(m => parseInt(m.version, 10)).filter(v => !isNaN(v));
  const gaps: number[] = [];
  
  for (let i = 0; i < versions.length - 1; i++) {
    const current = versions[i];
    const next = versions[i + 1];
    const gap = next - current;
    
    if (gap > 1) {
      for (let missing = current + 1; missing < next; missing++) {
        gaps.push(missing);
      }
    }
  }
  
  if (gaps.length > 0) {
    log(`ℹ️  Version gaps detected (${gaps.length} missing numbers):`, colors.cyan);
    log(`  Missing: ${gaps.join(', ')}`, colors.cyan);
    log('  This is normal if migrations were consolidated or skipped.', colors.cyan);
  } else {
    log('✓ No gaps in version sequence', colors.green);
  }
}

function searchMigrationContent(keyword: string): void {
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  
  const matches: Array<{ file: string; lines: Array<{ num: number; text: string }> }> = [];
  
  files.forEach(filename => {
    const fullPath = join(migrationsDir, filename);
    const content = readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    
    const matchingLines: Array<{ num: number; text: string }> = [];
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        matchingLines.push({ num: idx + 1, text: line.trim() });
      }
    });
    
    if (matchingLines.length > 0) {
      matches.push({ file: filename, lines: matchingLines });
    }
  });
  
  if (matches.length > 0) {
    log(`Found "${keyword}" in ${matches.length} migration(s):`, colors.green);
    matches.forEach(m => {
      log(`\n  ${m.file}:`, colors.bright);
      m.lines.slice(0, 5).forEach(l => {
        log(`    Line ${l.num}: ${l.text.substring(0, 80)}`, colors.reset);
      });
      if (m.lines.length > 5) {
        log(`    ... and ${m.lines.length - 5} more lines`, colors.cyan);
      }
    });
  } else {
    log(`No matches found for "${keyword}"`, colors.yellow);
  }
}

function generateRemoteCheckSQL(): string {
  return `
-- =====================================================
-- REMOTE MIGRATION HISTORY CHECK
-- =====================================================
-- Run this in Supabase SQL Editor to see applied migrations

SELECT version, name, executed_at
FROM supabase_migrations.schema_migrations
ORDER BY version;

-- =====================================================
-- COUNT APPLIED MIGRATIONS
-- =====================================================

SELECT COUNT(*) as applied_count
FROM supabase_migrations.schema_migrations;

-- =====================================================
-- LATEST APPLIED MIGRATION
-- =====================================================

SELECT version, name, executed_at
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 1;
`;
}

function generateSchemaCheckSQL(): string {
  return `
-- =====================================================
-- SCHEMA DRIFT CHECKS
-- =====================================================

-- Check if site_settings table exists and its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'site_settings'
ORDER BY ordinal_position;

-- Check if profiles table exists and key columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if properties table exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'properties'
ORDER BY ordinal_position;

-- Check if admins table exists
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'admins'
ORDER BY ordinal_position;

-- List all public tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
`;
}

function generateStorageCheckSQL(): string {
  return `
-- =====================================================
-- STORAGE BUCKETS CHECK
-- =====================================================

-- List all storage buckets
SELECT id, name, public, created_at
FROM storage.buckets
ORDER BY name;

-- Check storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;

-- Expected buckets:
-- - property-images (public)
-- - avatars (public)
-- - banner-images (public)
-- - payment-receipts (private)
-- - agency-logos (public)
`;
}

function generateRLSCheckSQL(): string {
  return `
-- =====================================================
-- RLS AND PERMISSIONS CHECK
-- =====================================================

-- Check which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- List all RLS policies on public schema
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check auth schema permissions (should NOT be modified by migrations)
SELECT 
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'auth'
  AND grantee = current_user
ORDER BY table_name;

-- Check for functions with SECURITY DEFINER
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  CASE 
    WHEN p.prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY function_name;
`;
}

function analyzeKnownIssues(migrations: Migration[]): void {
  section('Known Issues Analysis');
  
  // Issue 1: site_settings description column
  log('\n1. site_settings "description" column issue:', colors.bright);
  log('   Problem: Migration 074 references "description" column, but table has "description_fr" and "description_ar"', colors.yellow);
  
  const migration020 = migrations.find(m => m.filename.startsWith('020_'));
  const migration074 = migrations.find(m => m.filename.startsWith('074_'));
  
  if (migration020) {
    log(`   ✓ Migration 020 (creates site_settings): ${migration020.filename}`, colors.green);
  }
  if (migration074) {
    log(`   ⚠️  Migration 074 (uses description): ${migration074.filename}`, colors.yellow);
  }
  
  searchMigrationContent('site_settings');
  
  // Issue 2: auth.users modifications
  log('\n2. auth.users permissions:', colors.bright);
  log('   WARNING: Never try to ALTER or directly modify auth.users table', colors.yellow);
  log('   Use triggers on auth.users (AFTER INSERT) to sync with public.profiles', colors.cyan);
  
  // Search for potential auth.users modifications
  const authUsersMentions = migrations.filter(m => {
    const content = readFileSync(join(process.cwd(), 'supabase', 'migrations', m.filename), 'utf-8');
    return content.includes('auth.users') && (
      content.match(/ALTER\s+TABLE\s+auth\.users/i) ||
      content.match(/UPDATE\s+auth\.users/i) ||
      content.match(/INSERT\s+INTO\s+auth\.users/i)
    );
  });
  
  if (authUsersMentions.length > 0) {
    log('   ⚠️  Found migrations that might modify auth.users:', colors.red);
    authUsersMentions.forEach(m => {
      log(`     - ${m.filename}`, colors.red);
    });
  } else {
    log('   ✓ No direct auth.users modifications detected', colors.green);
  }
}

function generateActionPlan(): void {
  header('ACTION PLAN');
  
  log('For a FRESH Supabase project (recommended approach):', colors.bright);
  log('');
  log('1. Link to your Supabase project:', colors.cyan);
  log('   npx supabase login');
  log('   npx supabase link --project-ref YOUR_PROJECT_ID');
  log('');
  log('2. Check remote migration status:', colors.cyan);
  log('   Run the SQL queries above in Supabase SQL Editor');
  log('   Compare remote versions with local versions');
  log('');
  log('3. Apply all local migrations to remote:', colors.cyan);
  log('   npx supabase db push');
  log('');
  log('4. Fix known issues:', colors.cyan);
  log('   a) site_settings description column:');
  log('      - Migration 074 should use "description_fr" instead of "description"');
  log('      - OR add migration to add "description" column');
  log('   b) Verify storage buckets exist (run storage check SQL)');
  log('   c) Verify RLS policies are active');
  log('');
  log('5. Verify environment variables:', colors.cyan);
  log('   - VITE_SUPABASE_URL');
  log('   - VITE_SUPABASE_ANON_KEY');
  log('   - Check .env.example for all required variables');
  log('');
  log('6. Test the application:', colors.cyan);
  log('   npm run dev');
  log('   - Test authentication (signup/login)');
  log('   - Test property creation');
  log('   - Test image uploads');
  log('');
  
  log('\nFor PRODUCTION with existing data:', colors.bright + colors.yellow);
  log('');
  log('⚠️  DO NOT use `npx supabase db reset` - it will delete all data!', colors.red);
  log('');
  log('Instead:', colors.yellow);
  log('1. Backup your database first');
  log('2. Use migration repair for already-applied migrations:');
  log('   npx supabase migration repair <version> --status applied');
  log('3. Then push remaining migrations:');
  log('   npx supabase db push');
  log('');
}

function checkEnvironment(): void {
  section('Environment Variables Check');
  
  try {
    const envExample = readFileSync(join(process.cwd(), '.env.example'), 'utf-8');
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_SITE_URL',
      'VITE_PRODUCTION_DOMAIN',
    ];
    
    log('\nRequired environment variables:', colors.bright);
    requiredVars.forEach(v => {
      if (envExample.includes(v)) {
        log(`  ✓ ${v} (defined in .env.example)`, colors.green);
      } else {
        log(`  ⚠️  ${v} (not found in .env.example)`, colors.yellow);
      }
    });
    
    log('\n.env file status:', colors.bright);
    try {
      readFileSync(join(process.cwd(), '.env'), 'utf-8');
      log('  ✓ .env file exists', colors.green);
      log('  Note: Make sure all required variables are set', colors.cyan);
    } catch {
      log('  ⚠️  .env file not found - copy from .env.example', colors.yellow);
    }
  } catch (err) {
    log('  ⚠️  .env.example not found', colors.red);
  }
}

// Main execution
function main() {
  header('SUPABASE DIAGNOSTIC TOOL');
  
  log('This tool analyzes your local Supabase setup and helps diagnose issues.', colors.cyan);
  log('It will check migrations, schema, and configuration.', colors.cyan);
  
  section('Local Migrations Inventory');
  
  const migrations = getMigrations();
  log(`\nTotal migrations: ${migrations.length}`, colors.bright);
  log(`First migration: ${migrations[0]?.filename || 'N/A'}`, colors.cyan);
  log(`Last migration: ${migrations[migrations.length - 1]?.filename || 'N/A'}`, colors.cyan);
  
  const emptyMigrations = migrations.filter(m => m.isEmpty);
  if (emptyMigrations.length > 0) {
    log(`\nEmpty/Comment-only migrations: ${emptyMigrations.length}`, colors.yellow);
    emptyMigrations.forEach(m => {
      log(`  - ${m.filename}`, colors.yellow);
    });
  }
  
  log('\nVersion sequence check:', colors.bright);
  checkForDuplicates(migrations);
  checkForGaps(migrations);
  
  analyzeKnownIssues(migrations);
  
  checkEnvironment();
  
  section('SQL Queries to Run in Supabase');
  
  log('\n📋 Copy and run these queries in Supabase SQL Editor:\n', colors.bright);
  
  log('--- 1. REMOTE MIGRATION HISTORY ---', colors.cyan);
  console.log(generateRemoteCheckSQL());
  
  log('\n--- 2. SCHEMA DRIFT CHECKS ---', colors.cyan);
  console.log(generateSchemaCheckSQL());
  
  log('\n--- 3. STORAGE BUCKETS ---', colors.cyan);
  console.log(generateStorageCheckSQL());
  
  log('\n--- 4. RLS AND PERMISSIONS ---', colors.cyan);
  console.log(generateRLSCheckSQL());
  
  generateActionPlan();
  
  log('\n📝 For detailed findings, see DIAGNOSTIC_REPORT.md', colors.bright + colors.green);
}

main();
